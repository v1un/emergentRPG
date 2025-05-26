import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from flows.gameplay.realtime_gameplay_flow import realtime_gameplay_flow
from models.game_models import (
    ActionType,
    Character,
    GameSession,
    InventoryItem,
    Quest,
    StoryEntry,
)
from models.scenario_models import Lorebook
from services.database_service import db_service
from utils.exceptions import (
    SessionNotFoundError, SessionSaveError, CharacterLevelUpError,
    TransientError, PermanentError, create_error_response
)

logger = logging.getLogger(__name__)


class GameStateManager:
    """Manages game state, auto-saves, and session persistence"""

    def __init__(self):
        self.active_sessions: Dict[str, GameSession] = {}
        self.auto_save_interval = 30  # seconds
        self.session_timeout = 3600  # 1 hour
        self._auto_save_task = None

    async def start_auto_save(self):
        """Start automatic saving of game sessions"""
        if self._auto_save_task is None:
            self._auto_save_task = asyncio.create_task(self._auto_save_loop())
            logger.info("Auto-save system started")

    async def stop_auto_save(self):
        """Stop automatic saving"""
        if self._auto_save_task:
            self._auto_save_task.cancel()
            try:
                await self._auto_save_task
            except asyncio.CancelledError:
                pass
            self._auto_save_task = None
            logger.info("Auto-save system stopped")

    async def _auto_save_loop(self):
        """Background task for auto-saving sessions"""
        while True:
            try:
                await asyncio.sleep(self.auto_save_interval)
                await self._auto_save_sessions()
                await self._cleanup_inactive_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in auto-save loop: {str(e)}")

    async def _auto_save_sessions(self):
        """Save all active sessions to database"""
        for session_id, session in list(self.active_sessions.items()):
            try:
                session.updated_at = datetime.now()
                await db_service.save_game_session(session)
                logger.debug(f"Auto-saved session {session_id}")
            except Exception as e:
                logger.error(f"Error auto-saving session {session_id}: {str(e)}")

    async def _cleanup_inactive_sessions(self):
        """Remove inactive sessions from memory"""
        current_time = datetime.now()
        inactive_sessions = []

        for session_id, session in self.active_sessions.items():
            if (
                current_time - session.updated_at
            ).total_seconds() > self.session_timeout:
                inactive_sessions.append(session_id)

        for session_id in inactive_sessions:
            try:
                # Final save before removal
                await db_service.save_game_session(self.active_sessions[session_id])
                del self.active_sessions[session_id]
                logger.info(f"Cleaned up inactive session {session_id}")
            except Exception as e:
                logger.error(f"Error cleaning up session {session_id}: {str(e)}")

    async def get_session(self, session_id: str) -> Optional[GameSession]:
        """Get game session from memory or database"""
        # Check active sessions first
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.updated_at = datetime.now()
            return session

        # Load from database
        session = await db_service.get_game_session(session_id)
        if session:
            self.active_sessions[session_id] = session
            session.updated_at = datetime.now()
            return session

        return None

    async def save_session(self, session: GameSession) -> bool:
        """Save session to memory and schedule database save"""
        try:
            session.updated_at = datetime.now()
            self.active_sessions[session.session_id] = session

            # Immediate save for important changes
            await db_service.save_game_session(session)
            return True

        except Exception as e:
            logger.error(f"Error saving session {session.session_id}: {str(e)}")
            return False

    async def delete_session(self, session_id: str) -> bool:
        """Delete session from memory and database"""
        try:
            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

            # Remove from database
            return await db_service.delete_game_session(session_id)

        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {str(e)}")
            return False

    async def handle_player_action(
        self, session_id: str, action: str, lorebook: Optional[Lorebook] = None
    ) -> Dict[str, Any]:
        """Process player action and update game state"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return {"success": False, "error": "Session not found"}

            # Execute action through gameplay flow
            result = await realtime_gameplay_flow.execute_full_turn(
                action, session, lorebook
            )

            if result.get("success"):
                # Update session in memory
                updated_session = result["updated_session"]
                await self.save_session(updated_session)

                # Check for level up, quest completion, etc.
                await self._check_game_milestones(updated_session)

            return result

        except Exception as e:
            logger.error(f"Error handling player action: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _check_game_milestones(self, session: GameSession):
        """Check for character progression, quest completion, etc."""
        try:
            # Check for level up using new Character method
            while session.character.can_level_up():
                await self._handle_level_up(session)

            # Check for quest completion
            await self._check_quest_completion(session)

            # Check for story milestones
            await self._check_story_milestones(session)

        except Exception as e:
            logger.error(f"Error checking game milestones: {str(e)}")

    async def _handle_level_up(self, session: GameSession):
        """Handle character level up"""
        try:
            old_level = session.character.level
            session.character.level += 1
            session.character.max_health += 10
            session.character.health = session.character.max_health
            session.character.max_mana += 5
            session.character.mana = session.character.max_mana

            # Add level up message
            level_up_message = f"🎉 Congratulations! {session.character.name} has reached level {session.character.level}! Health and mana have been fully restored."
            level_up_entry = StoryEntry(type=ActionType.SYSTEM, text=level_up_message)
            session.story.append(level_up_entry)

            logger.info(
                f"Character {session.character.name} leveled up from {old_level} to {session.character.level}"
            )

        except Exception as e:
            logger.error(f"Error handling level up: {str(e)}")

    async def _check_quest_completion(self, session: GameSession):
        """Check if any quests have been completed"""
        try:
            for quest in session.quests:
                if quest.status == "active":
                    # Check if quest is complete using new progress model
                    if quest.progress.is_complete:
                        quest.status = "completed"

                        # Add quest completion message
                        completion_message = (
                            f"✅ Quest Completed: {quest.title}! {quest.description}"
                        )
                        completion_entry = StoryEntry(
                            type=ActionType.SYSTEM, text=completion_message
                        )
                        session.story.append(completion_entry)

                        # Award experience
                        session.character.experience += 50

                        logger.info(f"Quest completed: {quest.title}")

        except Exception as e:
            logger.error(f"Error checking quest completion: {str(e)}")

    async def _check_story_milestones(self, session: GameSession):
        """Check for story milestones and achievements"""
        try:
            story_length = len(session.story)

            # Milestone for long adventures
            if story_length == 50:
                milestone_message = "🏆 Milestone: Seasoned Adventurer! You've experienced 50 story moments."
                milestone_entry = StoryEntry(
                    type=ActionType.SYSTEM, text=milestone_message
                )
                session.story.append(milestone_entry)
                session.character.experience += 25
            elif story_length == 100:
                milestone_message = "🏆 Milestone: Veteran Explorer! You've experienced 100 story moments."
                milestone_entry = StoryEntry(
                    type=ActionType.SYSTEM, text=milestone_message
                )
                session.story.append(milestone_entry)
                session.character.experience += 50

        except Exception as e:
            logger.error(f"Error checking story milestones: {str(e)}")

    async def add_quest(self, session_id: str, quest: Quest) -> bool:
        """Add a new quest to the session"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False

            session.quests.append(quest)

            # Add quest notification
            quest_message = f"📜 New Quest: {quest.title} - {quest.description}"
            quest_entry = StoryEntry(type=ActionType.SYSTEM, text=quest_message)
            session.story.append(quest_entry)

            await self.save_session(session)
            logger.info(f"Added quest '{quest.title}' to session {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error adding quest: {str(e)}")
            return False

    async def add_inventory_item(self, session_id: str, item: InventoryItem) -> bool:
        """Add an item to character inventory"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False

            # Check if item already exists (for stackable items)
            existing_item = None
            for inv_item in session.inventory:
                if inv_item.name == item.name and inv_item.type == item.type:
                    existing_item = inv_item
                    break

            if existing_item and item.type == "consumable":
                existing_item.quantity += item.quantity
            else:
                session.inventory.append(item)

            # Add item notification
            item_message = f"🎒 Received: {item.name}"
            if item.quantity > 1:
                item_message += f" (x{item.quantity})"
            item_entry = StoryEntry(type=ActionType.SYSTEM, text=item_message)
            session.story.append(item_entry)

            await self.save_session(session)
            logger.info(f"Added item '{item.name}' to session {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error adding inventory item: {str(e)}")
            return False

    async def get_session_statistics(self) -> Dict[str, Any]:
        """Get statistics about active sessions"""
        try:
            active_count = len(self.active_sessions)
            total_sessions = len(await db_service.list_game_sessions(limit=1000))

            # Calculate average session length
            total_story_length = sum(
                len(session.story) for session in self.active_sessions.values()
            )
            avg_story_length = (
                total_story_length / active_count if active_count > 0 else 0
            )

            return {
                "active_sessions": active_count,
                "total_sessions": total_sessions,
                "average_story_length": round(avg_story_length, 1),
                "auto_save_interval": self.auto_save_interval,
                "session_timeout": self.session_timeout,
            }

        except Exception as e:
            logger.error(f"Error getting session statistics: {str(e)}")
            return {}


# Global game state manager instance
game_manager = GameStateManager()
