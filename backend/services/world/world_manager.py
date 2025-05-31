"""
World State Management Service
Handles dynamic world state, locations, NPCs, and world events
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from models.game_models import Character, WorldState
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class WorldChanges:
    """Represents changes to the world state"""
    def __init__(self, location_change: Optional[str] = None,
                 time_change: Optional[str] = None,
                 weather_change: Optional[str] = None,
                 npc_changes: Optional[Dict[str, Any]] = None,
                 environment_changes: Optional[List[str]] = None):
        self.location_change = location_change
        self.time_change = time_change
        self.weather_change = weather_change
        self.npc_changes = npc_changes or {}
        self.environment_changes = environment_changes or []
        self.timestamp = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "location_change": self.location_change,
            "time_change": self.time_change,
            "weather_change": self.weather_change,
            "npc_changes": self.npc_changes,
            "environment_changes": self.environment_changes,
            "timestamp": self.timestamp.isoformat()
        }


class LocationInfo:
    """Detailed information about a location"""
    def __init__(self, location_id: str, name: str, description: str,
                 location_type: str = "generic", available_actions: Optional[List[str]] = None,
                 npcs: Optional[List[str]] = None, special_features: Optional[List[str]] = None,
                 connections: Optional[List[str]] = None):
        self.id = location_id
        self.name = name
        self.description = description
        self.type = location_type
        self.available_actions = available_actions or []
        self.npcs = npcs or []
        self.special_features = special_features or []
        self.connections = connections or []
        self.visited_count = 0
        self.last_visited: Optional[datetime] = None # Allow None and datetime
        self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "available_actions": self.available_actions,
            "npcs": self.npcs,
            "special_features": self.special_features,
            "connections": self.connections,
            "visited_count": self.visited_count,
            "last_visited": self.last_visited.isoformat() if self.last_visited else None,
            "metadata": self.metadata
        }


class WorldEvent:
    """Represents a world event that affects the game state"""
    def __init__(self, event_id: str, event_type: str, title: str, description: str,
                 effects: Dict[str, Any], duration: Optional[int] = None,
                 triggers: Optional[List[str]] = None):
        self.id = event_id
        self.type = event_type  # weather, npc_action, environmental, quest_related
        self.title = title
        self.description = description
        self.effects = effects
        self.duration = duration  # minutes, None for permanent
        self.triggers = triggers or []
        self.created_at = datetime.now()
        self.active = True
        self.affected_locations = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "effects": self.effects,
            "duration": self.duration,
            "triggers": self.triggers,
            "created_at": self.created_at.isoformat(),
            "active": self.active,
            "affected_locations": self.affected_locations
        }


class NPCState:
    """State and behavior information for NPCs"""
    def __init__(self, npc_id: str, name: str, current_location: str,
                 mood: str = "neutral", disposition: str = "neutral",
                 current_activity: str = "idle"):
        self.id = npc_id
        self.name = name
        self.current_location = current_location
        self.mood = mood  # happy, sad, angry, fearful, excited, neutral
        self.disposition = disposition  # friendly, hostile, neutral, suspicious
        self.current_activity = current_activity
        self.dialogue_state = {}
        self.quest_flags = {}
        self.last_interaction = None
        self.movement_schedule = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "current_location": self.current_location,
            "mood": self.mood,
            "disposition": self.disposition,
            "current_activity": self.current_activity,
            "dialogue_state": self.dialogue_state,
            "quest_flags": self.quest_flags,
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "movement_schedule": self.movement_schedule
        }


class WorldManager:
    """Manages dynamic world state, events, and environmental changes"""
    
    def __init__(self):
        self.locations: Dict[str, LocationInfo] = {}
        self.active_events: Dict[str, WorldEvent] = {}
        self.npc_states: Dict[str, NPCState] = {}
        # AI-driven weather and time progression
        self._initialize_default_locations()
        logger.info("WorldManager initialized with AI-driven world state management")
    
    def _initialize_default_locations(self):
        """Initialize default generic locations"""
        default_locations = [
            LocationInfo(
                "town_square", "Town Square", 
                "A bustling central square with merchants and travelers.",
                "town", 
                ["talk_to_merchants", "gather_information", "rest", "trade"],
                ["merchant", "guard", "traveler"],
                ["fountain", "notice_board", "market_stalls"]
            ),
            LocationInfo(
                "tavern", "The Prancing Pony Tavern",
                "A warm, inviting tavern filled with the smell of ale and roasted meat.",
                "indoor",
                ["order_drink", "listen_to_rumors", "rent_room", "talk_to_patrons"],
                ["bartender", "bard", "patrons"],
                ["fireplace", "rooms_upstairs", "kitchen"]
            ),
            LocationInfo(
                "forest_edge", "Forest Edge",
                "The boundary between civilization and the wild forest.",
                "wilderness",
                ["enter_forest", "gather_herbs", "hunt", "set_camp"],
                ["hermit", "ranger"],
                ["ancient_trees", "hidden_paths", "wildlife"]
            ),
            LocationInfo(
                "abandoned_ruins", "Ancient Ruins",
                "Crumbling stone structures overgrown with vines and moss.",
                "dungeon",
                ["explore_ruins", "search_for_treasure", "investigate_magic"],
                [],
                ["collapsed_walls", "mysterious_symbols", "hidden_chambers"]
            )
        ]
        
        for location in default_locations:
            self.locations[location.id] = location
        
        logger.info(f"Initialized {len(default_locations)} default locations")
    
    async def update_world_state(self, session_id: str, changes: WorldChanges) -> WorldState:
        """Update world state based on changes"""
        try:
            # This would typically load the current world state from the session
            # For now, we'll create a basic state and apply changes
            
            current_state = WorldState(
                current_location="town_square",
                time_of_day="morning",
                weather="clear",
                environment_description="A typical day in the world"
            )
            
            # Apply location change
            if changes.location_change:
                current_state.current_location = changes.location_change
                # Update location info if it exists
                if changes.location_change in self.locations:
                    location = self.locations[changes.location_change]
                    location.visited_count += 1
                    location.last_visited = datetime.now()
                    current_state.environment_description = location.description
                    current_state.available_actions = location.available_actions
                    current_state.npcs_present = location.npcs
            
            # Apply time change
            if changes.time_change:
                current_state.time_of_day = changes.time_change
            
            # Apply weather change
            if changes.weather_change:
                current_state.weather = changes.weather_change
            
            # Apply NPC changes
            for npc_id, npc_data in changes.npc_changes.items():
                if npc_id in self.npc_states:
                    npc_state = self.npc_states[npc_id]
                    for key, value in npc_data.items():
                        if hasattr(npc_state, key):
                            setattr(npc_state, key, value)
            
            # Apply environment changes
            for change in changes.environment_changes:
                if change not in current_state.special_conditions:
                    current_state.special_conditions.append(change)
            
            # Generate dynamic description
            current_state.environment_description = await self._generate_dynamic_description(current_state)
            
            logger.info(f"Updated world state for session {session_id}")
            return current_state
            
        except Exception as e:
            logger.error(f"Error updating world state: {str(e)}")
            # Return a safe default state
            return WorldState()
    
    async def _generate_dynamic_description(self, world_state: WorldState) -> str:
        """Generate dynamic environment description based on current state"""
        try:
            location_info = self.locations.get(world_state.current_location)
            base_description = location_info.description if location_info else "You find yourself in an unfamiliar place."
            
            # Add time and weather context
            time_context = self._get_time_context(world_state.time_of_day)
            weather_context = self._get_weather_context(world_state.weather)
            
            # Add NPC context
            npc_context = ""
            if world_state.npcs_present:
                npc_context = f" {', '.join(world_state.npcs_present)} can be seen here."
            
            # Combine contexts
            full_description = f"{base_description} {time_context} {weather_context}{npc_context}"
            
            return full_description.strip()
            
        except Exception as e:
            logger.warning(f"Error generating dynamic description: {str(e)}")
            return world_state.environment_description
    
    def _get_time_context(self, time_of_day: str) -> str:
        """Get contextual description for time of day"""
        time_contexts = {
            "dawn": "The first light of dawn breaks over the horizon.",
            "morning": "Morning sunlight bathes the area in a warm glow.",
            "midday": "The sun is high overhead, casting sharp shadows.",
            "afternoon": "The afternoon sun creates long, lazy shadows.",
            "evening": "Evening light paints everything in golden hues.",
            "night": "Darkness has fallen, with only moonlight for illumination.",
            "midnight": "The deep of night surrounds everything in mystery."
        }
        return time_contexts.get(time_of_day, "")
    
    def _get_weather_context(self, weather: str) -> str:
        """Get contextual description for weather"""
        weather_contexts = {
            "clear": "The sky is clear and blue.",
            "cloudy": "Clouds drift lazily across the sky.",
            "rainy": "A gentle rain falls, creating puddles on the ground.",
            "stormy": "Dark storm clouds gather ominously overhead.",
            "foggy": "A thick fog reduces visibility significantly.",
            "snowy": "Snowflakes drift down, covering everything in white."
        }
        return weather_contexts.get(weather, "")
    
    async def get_location_info(self, location_id: str) -> Optional[LocationInfo]:
        """Get detailed information about a location"""
        try:
            location = self.locations.get(location_id)
            if location:
                # Update with any dynamic changes
                await self._update_dynamic_location_info(location)
                return location
            else:
                # Try to generate location info dynamically
                return await self._generate_location_info(location_id)
                
        except Exception as e:
            logger.error(f"Error getting location info: {str(e)}")
            return None
    
    async def _update_dynamic_location_info(self, location: LocationInfo):
        """Update location with dynamic information"""
        try:
            # Update NPCs based on time and events
            current_npcs = []
            for npc_id, npc_state in self.npc_states.items():
                if npc_state.current_location == location.id:
                    current_npcs.append(npc_state.name)
            
            location.npcs = current_npcs
            
            # Update available actions based on active events
            for event in self.active_events.values():
                if location.id in event.affected_locations:
                    # Modify available actions based on event
                    if "restricted_actions" in event.effects:
                        for action in event.effects["restricted_actions"]:
                            if action in location.available_actions:
                                location.available_actions.remove(action)
                    
                    if "new_actions" in event.effects:
                        for action in event.effects["new_actions"]:
                            if action not in location.available_actions:
                                location.available_actions.append(action)
            
        except Exception as e:
            logger.warning(f"Error updating dynamic location info: {str(e)}")
    
    async def _generate_location_info(self, location_id: str) -> Optional[LocationInfo]:
        """Generate location information dynamically"""
        try:
            # This would use AI to generate location details
            # For now, create a basic location
            location = LocationInfo(
                location_id,
                location_id.replace("_", " ").title(),
                f"A mysterious place known as {location_id.replace('_', ' ')}.",
                "unknown",
                ["explore", "look_around"],
                [],
                []
            )
            
            # Store for future use
            self.locations[location_id] = location
            
            logger.info(f"Generated new location: {location_id}")
            return location
            
        except Exception as e:
            logger.error(f"Error generating location info: {str(e)}")
            return None
    
    async def trigger_world_event(self, event_type: str, context: Dict[str, Any]) -> Optional[WorldEvent]: # Allow None return
        """Trigger a world event"""
        try:
            event = await self._generate_world_event(event_type, context)
            
            if event:
                self.active_events[event.id] = event
                logger.info(f"Triggered world event: {event.title}")
                
                await self._apply_event_effects(event)
                
                if event.duration:
                    logger.info(f"Event {event.title} will expire in {event.duration} minutes")
            
            return event # Return event or None
            
        except Exception as e:
            logger.error(f"Error triggering world event: {str(e)}")
            # Return a fallback or None if generation fails completely
            fallback_event = self._create_fallback_event(event_type, context)
            if fallback_event:
                 self.active_events[fallback_event.id] = fallback_event
                 logger.info(f"Triggered fallback world event: {fallback_event.title}")
                 await self._apply_event_effects(fallback_event)
            return fallback_event # Return fallback or None
    
    async def _generate_world_event(self, event_type: str, context: Dict[str, Any]) -> Optional[WorldEvent]:
        """Generate a world event using AI"""
        try:
            prompt = f"""Generate a world event of type '{event_type}' with the following context:
{context}

Create an event with:
1. A compelling title
2. A brief description (1-2 sentences)
3. Effects on the game world
4. Duration (in minutes, or null for permanent)
5. Affected locations

Format as JSON with keys: title, description, effects, duration, affected_locations"""

            response = await gemini_client.generate_text(prompt)
            
            # Parse response
            import json
            event_data = json.loads(response)
            
            event = WorldEvent(
                str(uuid.uuid4()),
                event_type,
                event_data.get("title", f"Event: {event_type}"),
                event_data.get("description", "Something happens in the world."),
                event_data.get("effects", {}),
                event_data.get("duration"),
                event_data.get("triggers", [])
            )
            
            event.affected_locations = event_data.get("affected_locations", [])
            
            return event
            
        except Exception as e:
            logger.warning(f"Error generating world event with AI: {str(e)}")
            return self._create_fallback_event(event_type, context)
    
    def _create_fallback_event(self, event_type: str, context: Dict[str, Any]) -> WorldEvent:
        """Create a fallback world event"""
        # Basic weather options for fallback
        weather_options = ["clear", "cloudy", "rainy", "stormy", "foggy"]

        fallback_events = {
            "weather": {
                "title": "Weather Change",
                "description": "The weather begins to change.",
                "effects": {"weather_change": random.choice(weather_options)}
            },
            "npc_action": {
                "title": "NPC Activity",
                "description": "An NPC takes some action in the world.",
                "effects": {"npc_mood_change": "active"}
            },
            "environmental": {
                "title": "Environmental Change",
                "description": "Something in the environment shifts.",
                "effects": {"new_feature": "mysterious_occurrence"}
            }
        }
        
        event_template = fallback_events.get(event_type, fallback_events["environmental"])
        
        return WorldEvent(
            str(uuid.uuid4()),
            event_type,
            event_template["title"],
            event_template["description"],
            event_template["effects"],
            30,  # 30 minute duration
            []
        )
    
    async def _apply_event_effects(self, event: WorldEvent):
        """Apply the effects of a world event"""
        try:
            effects = event.effects
            
            # Weather effects
            if "weather_change" in effects:
                # This would update weather in affected locations
                logger.info(f"Weather changed to {effects['weather_change']}")
            
            # NPC effects
            if "npc_mood_change" in effects:
                mood = effects["npc_mood_change"]
                for npc_state in self.npc_states.values():
                    if npc_state.current_location in event.affected_locations:
                        npc_state.mood = mood
            
            # Location effects
            if "new_feature" in effects:
                feature = effects["new_feature"]
                for location_id in event.affected_locations:
                    if location_id in self.locations:
                        location = self.locations[location_id]
                        if feature not in location.special_features:
                            location.special_features.append(feature)
            
        except Exception as e:
            logger.error(f"Error applying event effects: {str(e)}")
    
    def get_active_events(self) -> List[WorldEvent]:
        """Get all currently active world events"""
        return list(self.active_events.values())
    
    def get_events_for_location(self, location_id: str) -> List[WorldEvent]:
        """Get active events affecting a specific location"""
        return [event for event in self.active_events.values() 
                if location_id in event.affected_locations]
    
    def cleanup_expired_events(self):
        """Remove expired events"""
        current_time = datetime.now()
        expired_events = []
        
        for event_id, event in self.active_events.items():
            if event.duration:
                expiry_time = event.created_at + timedelta(minutes=event.duration)
                if current_time > expiry_time:
                    expired_events.append(event_id)
        
        for event_id in expired_events:
            del self.active_events[event_id]
            logger.info(f"Expired event: {event_id}")
    
    def get_world_summary(self) -> Dict[str, Any]:
        """Get summary of current world state"""
        return {
            "total_locations": len(self.locations),
            "active_events": len(self.active_events),
            "tracked_npcs": len(self.npc_states),
            "event_types": list(set(event.type for event in self.active_events.values())),
            "location_types": list(set(loc.type for loc in self.locations.values()))
        }
    
    async def advance_time(self, session_id: str, current_time: str) -> str:
        """Advance world time using AI-driven progression"""
        try:
            # AI-driven time progression
            new_time = await self._generate_next_time_period(current_time)

            # Trigger time-based events
            if random.random() < 0.3:  # 30% chance of time-based event
                await self.trigger_world_event("time_based", {
                    "old_time": current_time,
                    "new_time": new_time,
                    "session_id": session_id
                })

            # Update NPC schedules
            await self._update_npc_schedules(new_time)

            logger.info(f"Advanced time from {current_time} to {new_time}")
            return new_time

        except Exception as e:
            logger.error(f"Error advancing time: {str(e)}")
            return self._get_fallback_next_time(current_time)

    async def _generate_next_time_period(self, current_time: str) -> str:
        """Generate the next time period using AI"""
        try:
            prompt = f"""Given the current time period '{current_time}', what would be the next logical time period in a day cycle?

Consider natural progression through:
- dawn, morning, midday, afternoon, evening, night, midnight

Respond with just the next time period name (one word)."""

            response = await gemini_client.generate_text(prompt, max_output_tokens=10)
            next_time = response.strip().lower()

            # Validate response
            valid_times = ["dawn", "morning", "midday", "afternoon", "evening", "night", "midnight"]
            if next_time in valid_times:
                return next_time
            else:
                return self._get_fallback_next_time(current_time)

        except Exception as e:
            logger.warning(f"Error generating next time period: {str(e)}")
            return self._get_fallback_next_time(current_time)

    def _get_fallback_next_time(self, current_time: str) -> str:
        """Get fallback next time period"""
        time_progression = {
            "dawn": "morning",
            "morning": "midday",
            "midday": "afternoon",
            "afternoon": "evening",
            "evening": "night",
            "night": "midnight",
            "midnight": "dawn"
        }
        return time_progression.get(current_time, "morning")
    
    async def _update_npc_schedules(self, new_time: str):
        """Update NPC positions and activities based on time"""
        try:
            for npc_state in self.npc_states.values():
                # Simple schedule: NPCs move around based on time
                if new_time in ["morning", "midday"]:
                    npc_state.current_activity = "working"
                elif new_time in ["evening"]:
                    npc_state.current_activity = "socializing"
                elif new_time in ["night", "midnight"]:
                    npc_state.current_activity = "resting"
                else:
                    npc_state.current_activity = "idle"
                    
        except Exception as e:
            logger.warning(f"Error updating NPC schedules: {str(e)}")


# Global world manager instance
world_manager = WorldManager()
