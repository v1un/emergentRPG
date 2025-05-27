"""
AI-Driven Dynamic World Management Service
Replaces hardcoded world state changes with AI-generated contextual responses
"""

import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from models.game_models import Character, GameSession, WorldState, StoryEntry, ActionType
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class WorldStateChange:
    """Represents an AI-generated world state change"""
    def __init__(self, change_type: str, description: str,
                 immediate_effects: Dict[str, Any],
                 long_term_consequences: List[str],
                 narrative_impact: str,
                 confidence_score: float = 0.8):
        self.change_type = change_type
        self.description = description
        self.immediate_effects = immediate_effects
        self.long_term_consequences = long_term_consequences
        self.narrative_impact = narrative_impact
        self.confidence_score = confidence_score
        self.generated_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "change_type": self.change_type,
            "description": self.description,
            "immediate_effects": self.immediate_effects,
            "long_term_consequences": self.long_term_consequences,
            "narrative_impact": self.narrative_impact,
            "confidence_score": self.confidence_score,
            "generated_at": self.generated_at.isoformat()
        }


class EnvironmentalContext:
    """Context for AI-driven environmental changes"""
    def __init__(self, session: GameSession, lorebook: Optional[Lorebook] = None,
                 recent_actions: Optional[List[str]] = None):
        self.session = session
        self.lorebook = lorebook
        self.recent_actions = recent_actions or []
        self.current_location = session.world_state.current_location
        self.time_of_day = session.world_state.time_of_day
        self.weather = session.world_state.weather
        self.story_context = self._build_story_context()

    def _build_story_context(self) -> str:
        """Build narrative context from recent story entries"""
        recent_entries = self.session.story[-5:] if len(self.session.story) > 5 else self.session.story
        return "\n".join([f"{entry.type}: {entry.text}" for entry in recent_entries])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_location": self.current_location,
            "time_of_day": self.time_of_day,
            "weather": self.weather,
            "story_length": len(self.session.story),
            "recent_actions": self.recent_actions,
            "character_level": self.session.character.level,
            "character_class": self.session.character.class_name,
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }


class DynamicWorldManager:
    """AI-driven world state management replacing hardcoded mechanics"""

    def __init__(self):
        self.change_history: List[WorldStateChange] = []
        self.pending_consequences: Dict[str, List[Dict[str, Any]]] = {}

    async def generate_world_response(self, player_action: str, context: EnvironmentalContext) -> WorldStateChange:
        """Generate AI-driven world state changes based on player actions"""
        try:
            logger.info(f"Generating world response for action: {player_action[:50]}...")

            # Build comprehensive prompt for world state changes
            prompt = await self._build_world_change_prompt(player_action, context)

            # Generate AI response
            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction=self._get_world_master_instruction(context),
                temperature=0.7,
                max_output_tokens=800,
                response_format="json"
            )

            # Parse and structure the response
            world_change = await self._parse_world_change_response(ai_response, player_action, context)

            # Store change in history
            self.change_history.append(world_change)

            # Schedule long-term consequences
            await self._schedule_consequences(world_change, context)

            logger.info(f"Generated world change: {world_change.change_type}")
            return world_change

        except Exception as e:
            logger.error(f"Error generating world response: {str(e)}")
            return await self._create_fallback_world_change(player_action, context)

    async def _build_world_change_prompt(self, player_action: str, context: EnvironmentalContext) -> str:
        """Build comprehensive prompt for world state changes"""

        # Get world context
        world_context = ""
        if context.lorebook:
            world_context = f"""
            World: {context.lorebook.series_metadata.title}
            Setting: {context.lorebook.series_metadata.setting}
            Power System: {context.lorebook.series_metadata.power_system}
            Genre: {context.lorebook.series_metadata.genre}
            Tone: {context.lorebook.series_metadata.tone}
            """

        # Get location context
        location_context = f"""
        Current Location: {context.current_location}
        Time of Day: {context.time_of_day}
        Weather: {context.weather}
        Environment: {context.session.world_state.environment_description}
        """

        # Get character context
        character = context.session.character
        character_context = f"""
        Character: {character.name} (Level {character.level}, {character.class_name})
        Health: {character.health}/{character.max_health}
        Mana: {character.mana}/{character.max_mana}
        """

        # Get story context
        story_context = f"""
        Recent Story Context:
        {context.story_context}

        Recent Actions: {', '.join(context.recent_actions[-3:]) if context.recent_actions else 'None'}
        """

        prompt = f"""
        {world_context}

        {location_context}

        {character_context}

        {story_context}

        PLAYER ACTION: "{player_action}"

        As the World Master, analyze how this action affects the world and generate appropriate environmental responses.
        Consider:
        1. How does this action change the immediate environment?
        2. What atmospheric changes occur (weather, lighting, sounds, smells)?
        3. How do NPCs or creatures in the area react?
        4. What long-term consequences might this action have?
        5. How does this fit the narrative tone and world consistency?

        Respond in JSON format:
        {{
            "change_type": "environmental/atmospheric/social/magical/temporal/structural",
            "description": "detailed description of what changes in the world",
            "immediate_effects": {{
                "location_description": "new environmental description",
                "atmosphere_changes": ["list of atmospheric changes"],
                "npc_reactions": ["how NPCs react"],
                "time_progression": "how much time passes",
                "weather_changes": "any weather changes",
                "special_conditions": ["new conditions affecting the area"]
            }},
            "long_term_consequences": [
                "potential future effects of this action",
                "how this might affect future encounters",
                "reputation or relationship changes"
            ],
            "narrative_impact": "how this enhances or changes the ongoing story",
            "confidence_score": 0.85
        }}
        """

        return prompt

    def _get_world_master_instruction(self, context: EnvironmentalContext) -> str:
        """Get system instruction for world master AI"""
        world_title = context.lorebook.series_metadata.title if context.lorebook else "a fantasy world"

        return f"""You are the World Master for {world_title}, responsible for creating dynamic,
        responsive environments that react intelligently to player actions. Your role is to:

        1. Generate realistic environmental responses that enhance immersion
        2. Maintain consistency with the established world and narrative tone
        3. Create meaningful consequences that serve the story
        4. Balance immediate effects with long-term narrative implications
        5. Ensure all changes feel natural and enhance the storytelling experience

        Always respond with valid JSON format and focus on narrative enhancement over mechanical effects."""

    async def _parse_world_change_response(self, ai_response: str, player_action: str,
                                         context: EnvironmentalContext) -> WorldStateChange:
        """Parse AI response into structured WorldStateChange"""
        try:
            import json
            response_data = json.loads(ai_response)

            return WorldStateChange(
                change_type=response_data.get("change_type", "environmental"),
                description=response_data.get("description", "The world responds to your action."),
                immediate_effects=response_data.get("immediate_effects", {}),
                long_term_consequences=response_data.get("long_term_consequences", []),
                narrative_impact=response_data.get("narrative_impact", "Your action has an impact on the story."),
                confidence_score=response_data.get("confidence_score", 0.7)
            )

        except Exception as e:
            logger.error(f"Error parsing world change response: {str(e)}")
            return await self._create_fallback_world_change(player_action, context)

    async def _create_fallback_world_change(self, player_action: str,
                                          context: EnvironmentalContext) -> WorldStateChange:
        """Create fallback world change when AI generation fails"""
        return WorldStateChange(
            change_type="environmental",
            description=f"The world responds subtly to your action: {player_action}",
            immediate_effects={
                "location_description": context.session.world_state.environment_description,
                "atmosphere_changes": ["The atmosphere shifts slightly"],
                "npc_reactions": [],
                "time_progression": "A few moments pass",
                "weather_changes": "No change",
                "special_conditions": []
            },
            long_term_consequences=["Your action may have unforeseen consequences"],
            narrative_impact="Your action contributes to the unfolding story.",
            confidence_score=0.5
        )

    async def _schedule_consequences(self, world_change: WorldStateChange,
                                   context: EnvironmentalContext):
        """Schedule long-term consequences for future activation"""
        session_id = context.session.session_id

        if session_id not in self.pending_consequences:
            self.pending_consequences[session_id] = []

        # Schedule consequences to trigger after certain conditions
        for consequence in world_change.long_term_consequences:
            consequence_data = {
                "consequence": consequence,
                "trigger_conditions": ["time_passed", "location_revisit", "story_milestone"],
                "scheduled_at": datetime.now(),
                "original_action": world_change.description,
                "activated": False
            }
            self.pending_consequences[session_id].append(consequence_data)

    async def check_pending_consequences(self, context: EnvironmentalContext) -> List[str]:
        """Check and activate pending consequences based on current context"""
        session_id = context.session.session_id
        activated_consequences = []

        if session_id not in self.pending_consequences:
            return activated_consequences

        current_time = datetime.now()

        for consequence_data in self.pending_consequences[session_id]:
            if consequence_data["activated"]:
                continue

            # Check if consequence should be activated
            should_activate = False

            # Time-based activation (after 10 minutes of game time)
            if "time_passed" in consequence_data["trigger_conditions"]:
                time_diff = current_time - consequence_data["scheduled_at"]
                if time_diff > timedelta(minutes=10):
                    should_activate = True

            # Location-based activation
            if "location_revisit" in consequence_data["trigger_conditions"]:
                # Activate if player returns to a previously visited location
                if len(context.session.story) > 10:  # Some story progression
                    should_activate = True

            # Story milestone activation
            if "story_milestone" in consequence_data["trigger_conditions"]:
                # Activate after significant story progression
                if len(context.session.story) > 20:
                    should_activate = True

            if should_activate:
                activated_consequences.append(consequence_data["consequence"])
                consequence_data["activated"] = True
                logger.info(f"Activated consequence: {consequence_data['consequence'][:50]}...")

        return activated_consequences

    async def apply_world_change(self, world_change: WorldStateChange,
                               world_state: WorldState) -> WorldState:
        """Apply world change to the actual world state"""
        try:
            effects = world_change.immediate_effects

            # Update location description
            if "location_description" in effects:
                world_state.environment_description = effects["location_description"]

            # Update weather
            if "weather_changes" in effects and effects["weather_changes"] != "No change":
                world_state.weather = effects["weather_changes"]

            # Update special conditions
            if "special_conditions" in effects:
                for condition in effects["special_conditions"]:
                    if condition not in world_state.special_conditions:
                        world_state.special_conditions.append(condition)

            # Update NPCs present
            if "npc_reactions" in effects:
                # Extract NPC names from reactions and add to npcs_present
                for reaction in effects["npc_reactions"]:
                    # Simple extraction - in practice, this would be more sophisticated
                    if "NPC" in reaction or "character" in reaction.lower():
                        npc_name = f"Local Character {len(world_state.npcs_present) + 1}"
                        if npc_name not in world_state.npcs_present:
                            world_state.npcs_present.append(npc_name)

            logger.info(f"Applied world change: {world_change.change_type}")
            return world_state

        except Exception as e:
            logger.error(f"Error applying world change: {str(e)}")
            return world_state


# Global instance
dynamic_world_manager = DynamicWorldManager()
