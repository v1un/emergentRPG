"""
WebSocket Game Management
Provides real-time updates for game sessions
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, ClassVar
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class GameUpdate(BaseModel):
    """Real-time game update message"""
    type: str  # "narrative", "state_change", "world_event", "quest_update", etc.
    session_id: str
    data: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None


class WorldEvent(BaseModel):
    """World-wide event that affects multiple sessions"""
    event_id: str
    event_type: str  # "weather_change", "global_quest", "server_event", etc.
    title: str
    description: str
    data: Dict[str, Any]
    affected_sessions: List[str] = []
    timestamp: datetime


class ConnectionInfo(BaseModel):
    """WebSocket connection information"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    websocket: Any  # Using Any type to avoid Pydantic validation issues with WebSocket
    session_id: str
    user_id: Optional[str] = None
    connected_at: datetime
    last_activity: datetime


class GameWebSocket:
    """
    WebSocket manager for real-time game updates
    """
    
    def __init__(self):
        # Active connections: session_id -> ConnectionInfo
        self.active_connections: Dict[str, ConnectionInfo] = {}
        
        # User connections: user_id -> Set[session_id]
        self.user_sessions: Dict[str, Set[str]] = {}
        
        # Session groups for broadcasting
        self.session_groups: Dict[str, Set[str]] = {}
        
        # Message queue for offline users
        self.message_queue: Dict[str, List[GameUpdate]] = {}
        
        logger.info("GameWebSocket manager initialized")
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: Optional[str] = None):
        """Accept WebSocket connection for a game session"""
        try:
            await websocket.accept()
            
            # Create connection info
            connection = ConnectionInfo(
                websocket=websocket,
                session_id=session_id,
                user_id=user_id,
                connected_at=datetime.now(),
                last_activity=datetime.now()
            )
            
            # Store connection
            self.active_connections[session_id] = connection
            
            # Track user sessions
            if user_id:
                if user_id not in self.user_sessions:
                    self.user_sessions[user_id] = set()
                self.user_sessions[user_id].add(session_id)
            
            # Send queued messages
            await self._send_queued_messages(session_id)
            
            # Send connection confirmation
            await self.send_game_update(session_id, GameUpdate(
                type="connection",
                session_id=session_id,
                data={
                    "status": "connected",
                    "message": "Real-time updates enabled",
                    "timestamp": datetime.now().isoformat()
                },
                timestamp=datetime.now(),
                user_id=user_id
            ))
            
            logger.info(f"WebSocket connected: session={session_id}, user={user_id}")
            
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            raise
    
    async def disconnect(self, session_id: str):
        """Handle WebSocket disconnection"""
        try:
            if session_id in self.active_connections:
                connection = self.active_connections[session_id]
                
                # Remove from user sessions
                if connection.user_id and connection.user_id in self.user_sessions:
                    self.user_sessions[connection.user_id].discard(session_id)
                    if not self.user_sessions[connection.user_id]:
                        del self.user_sessions[connection.user_id]
                
                # Remove from active connections
                del self.active_connections[session_id]
                
                logger.info(f"WebSocket disconnected: session={session_id}")
                
        except Exception as e:
            logger.error(f"WebSocket disconnect error: {e}")
    
    async def send_game_update(self, session_id: str, update: GameUpdate) -> bool:
        """Send update to specific game session"""
        try:
            if session_id in self.active_connections:
                connection = self.active_connections[session_id]
                
                # Update last activity
                connection.last_activity = datetime.now()
                
                # Send update
                message = {
                    "type": update.type,
                    "data": update.data,
                    "timestamp": update.timestamp.isoformat(),
                    "session_id": update.session_id
                }
                
                await connection.websocket.send_text(json.dumps(message))
                logger.debug(f"Sent update to session {session_id}: {update.type}")
                return True
            else:
                # Queue message for offline session
                if session_id not in self.message_queue:
                    self.message_queue[session_id] = []
                self.message_queue[session_id].append(update)
                
                # Limit queue size
                if len(self.message_queue[session_id]) > 50:
                    self.message_queue[session_id] = self.message_queue[session_id][-50:]
                
                logger.debug(f"Queued update for offline session {session_id}: {update.type}")
                return False
                
        except WebSocketDisconnect:
            await self.disconnect(session_id)
            return False
        except Exception as e:
            logger.error(f"Error sending update to {session_id}: {e}")
            return False
    
    async def send_to_user(self, user_id: str, update: GameUpdate) -> int:
        """Send update to all sessions for a user"""
        sent_count = 0
        
        if user_id in self.user_sessions:
            for session_id in self.user_sessions[user_id].copy():
                if await self.send_game_update(session_id, update):
                    sent_count += 1
        
        return sent_count
    
    async def broadcast_world_event(self, event: WorldEvent) -> int:
        """Broadcast world event to all or specified sessions"""
        sent_count = 0
        
        target_sessions = event.affected_sessions if event.affected_sessions else list(self.active_connections.keys())
        
        for session_id in target_sessions:
            update = GameUpdate(
                type="world_event",
                session_id=session_id,
                data={
                    "event_id": event.event_id,
                    "event_type": event.event_type,
                    "title": event.title,
                    "description": event.description,
                    "event_data": event.data
                },
                timestamp=event.timestamp
            )
            
            if await self.send_game_update(session_id, update):
                sent_count += 1
        
        logger.info(f"Broadcasted world event '{event.title}' to {sent_count} sessions")
        return sent_count
    
    async def handle_real_time_action(self, session_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """Handle real-time action from client"""
        try:
            if session_id not in self.active_connections:
                return {
                    "success": False,
                    "error": "Session not connected"
                }
            
            connection = self.active_connections[session_id]
            connection.last_activity = datetime.now()
            
            action_type = action.get("type", "unknown")
            
            # Handle different action types
            if action_type == "ping":
                await self.send_game_update(session_id, GameUpdate(
                    type="pong",
                    session_id=session_id,
                    data={"timestamp": datetime.now().isoformat()},
                    timestamp=datetime.now()
                ))
                return {"success": True, "action": "pong"}
            
            elif action_type == "typing":
                # Broadcast typing indicator to party members (if applicable)
                return {"success": True, "action": "typing_acknowledged"}
            
            elif action_type == "request_update":
                # Send current game state
                return {"success": True, "action": "state_requested"}
            
            else:
                logger.warning(f"Unknown real-time action: {action_type}")
                return {
                    "success": False,
                    "error": f"Unknown action type: {action_type}"
                }
                
        except Exception as e:
            logger.error(f"Error handling real-time action: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _send_queued_messages(self, session_id: str):
        """Send queued messages to newly connected session"""
        if session_id in self.message_queue:
            messages = self.message_queue[session_id]
            
            for update in messages:
                await self.send_game_update(session_id, update)
            
            # Clear queue
            del self.message_queue[session_id]
            logger.info(f"Sent {len(messages)} queued messages to session {session_id}")
    
    async def cleanup_inactive_connections(self, timeout_minutes: int = 30):
        """Clean up inactive WebSocket connections"""
        try:
            current_time = datetime.now()
            inactive_sessions = []
            
            for session_id, connection in self.active_connections.items():
                inactive_time = current_time - connection.last_activity
                if inactive_time.total_seconds() > (timeout_minutes * 60):
                    inactive_sessions.append(session_id)
            
            for session_id in inactive_sessions:
                await self.disconnect(session_id)
            
            if inactive_sessions:
                logger.info(f"Cleaned up {len(inactive_sessions)} inactive connections")
            
        except Exception as e:
            logger.error(f"Error cleaning up connections: {e}")
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get WebSocket connection statistics"""
        current_time = datetime.now()
        
        stats = {
            "total_connections": len(self.active_connections),
            "unique_users": len(self.user_sessions),
            "total_queued_messages": sum(len(queue) for queue in self.message_queue.values()),
            "connections": []
        }
        
        for session_id, connection in self.active_connections.items():
            conn_stats = {
                "session_id": session_id,
                "user_id": connection.user_id,
                "connected_duration": str(current_time - connection.connected_at),
                "last_activity": connection.last_activity.isoformat(),
                "inactive_duration": str(current_time - connection.last_activity)
            }
            stats["connections"].append(conn_stats)
        
        return stats
    
    async def notify_quest_update(self, session_id: str, quest_data: Dict[str, Any]):
        """Send quest update notification"""
        update = GameUpdate(
            type="quest_update",
            session_id=session_id,
            data=quest_data,
            timestamp=datetime.now()
        )
        await self.send_game_update(session_id, update)
    
    async def notify_inventory_change(self, session_id: str, inventory_data: Dict[str, Any]):
        """Send inventory change notification"""
        update = GameUpdate(
            type="inventory_change", 
            session_id=session_id,
            data=inventory_data,
            timestamp=datetime.now()
        )
        await self.send_game_update(session_id, update)
    
    async def notify_world_state_change(self, session_id: str, world_data: Dict[str, Any]):
        """Send world state change notification"""
        update = GameUpdate(
            type="world_state_change",
            session_id=session_id,
            data=world_data,
            timestamp=datetime.now()
        )
        await self.send_game_update(session_id, update)
    
    async def notify_character_update(self, session_id: str, character_data: Dict[str, Any]):
        """Send character update notification"""
        update = GameUpdate(
            type="character_update",
            session_id=session_id,
            data=character_data,
            timestamp=datetime.now()
        )
        await self.send_game_update(session_id, update)


# Global WebSocket manager instance
game_websocket = GameWebSocket()
