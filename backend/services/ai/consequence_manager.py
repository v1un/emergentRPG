"""
AI-Driven Consequence Management Service
Generates meaningful, story-appropriate consequences for player choices
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from models.game_models import Character, GameSession, StoryEntry, ActionType
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class ConsequenceEvent:
    """Represents an AI-generated consequence of player actions"""
    def __init__(self, consequence_type: str, description: str,
                 trigger_action: str, narrative_text: str,
                 effects: Dict[str, Any], severity: str,
                 delay_type: str = "immediate",
                 confidence_score: float = 0.8):
        self.id = str(uuid.uuid4())
        self.consequence_type = consequence_type
        self.description = description
        self.trigger_action = trigger_action
        self.narrative_text = narrative_text
        self.effects = effects
        self.severity = severity  # minor, moderate, major, critical
        self.delay_type = delay_type  # immediate, short_term, long_term
        self.confidence_score = confidence_score
        self.created_at = datetime.now()
        self.activated = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "consequence_type": self.consequence_type,
            "description": self.description,
            "trigger_action": self.trigger_action,
            "narrative_text": self.narrative_text,
            "effects": self.effects,
            "severity": self.severity,
            "delay_type": self.delay_type,
            "confidence_score": self.confidence_score,
            "created_at": self.created_at.isoformat(),
            "activated": self.activated
        }


class ConsequenceContext:
    """Context for AI consequence generation"""
    def __init__(self, session: GameSession, current_action: str,
                 lorebook: Optional[Lorebook] = None):
        self.session = session
        self.current_action = current_action
        self.lorebook = lorebook
        self.character = session.character
        self.world_state = session.world_state
        self.action_history = self._build_action_history()
        self.relationship_context = self._analyze_relationships()

    def _build_action_history(self) -> List[str]:
        """Build history of significant player actions"""
        actions = []
        for entry in self.session.story:
            if entry.type.value == "action":
                actions.append(entry.text)
        return actions[-10:]  # Last 10 actions

    def _analyze_relationships(self) -> Dict[str, str]:
        """Analyze character relationships from story context"""
        relationships = {}
        # Simple relationship extraction from story
        for entry in self.session.story:
            if "NPC" in entry.text or any(name in entry.text for name in ["guard", "merchant", "villager"]):
                # Extract relationship context
                if "help" in entry.text.lower():
                    relationships["general_reputation"] = "helpful"
                elif "attack" in entry.text.lower() or "fight" in entry.text.lower():
                    relationships["general_reputation"] = "aggressive"
                elif "talk" in entry.text.lower() or "speak" in entry.text.lower():
                    relationships["general_reputation"] = "diplomatic"

        return relationships

    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_action": self.current_action,
            "character_level": self.character.level,
            "character_class": self.character.class_name,
            "current_location": self.world_state.current_location,
            "action_count": len(self.action_history),
            "relationships": self.relationship_context,
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }


class ConsequenceManager:
    """AI-driven consequence generation replacing predetermined outcomes"""

    def __init__(self):
        self.pending_consequences: Dict[str, List[ConsequenceEvent]] = {}
        self.activated_consequences: Dict[str, List[ConsequenceEvent]] = {}

    async def generate_consequences(self, context: ConsequenceContext) -> List[ConsequenceEvent]:
        """Generate AI-driven consequences for player actions"""
        try:
            logger.info(f"Generating consequences for action: {context.current_action[:50]}...")

            # Build comprehensive prompt for consequence generation
            prompt = await self._build_consequence_prompt(context)

            # Generate AI response
            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction=self._get_consequence_master_instruction(context),
                temperature=0.6,
                max_output_tokens=800,
                response_format="json"
            )

            # Parse and structure the response
            consequences = await self._parse_consequence_response(ai_response, context)

            # Store consequences
            session_id = context.session.session_id
            if session_id not in self.pending_consequences:
                self.pending_consequences[session_id] = []

            self.pending_consequences[session_id].extend(consequences)

            logger.info(f"Generated {len(consequences)} consequences")
            return consequences

        except Exception as e:
            logger.error(f"Error generating consequences: {str(e)}")
            return await self._create_fallback_consequences(context)

    async def _build_consequence_prompt(self, context: ConsequenceContext) -> str:
        """Build comprehensive prompt for consequence generation"""

        # World context
        world_context = ""
        if context.lorebook:
            world_context = f"""
            World: {context.lorebook.series_metadata.title}
            Setting: {context.lorebook.series_metadata.setting}
            Power System: {context.lorebook.series_metadata.power_system}
            Genre: {context.lorebook.series_metadata.genre}
            Tone: {context.lorebook.series_metadata.tone}
            """

        # Character context
        character = context.character
        character_context = f"""
        Character: {character.name} (Level {character.level}, {character.class_name})
        Current Location: {context.world_state.current_location}
        Health: {character.health}/{character.max_health}
        Reputation/Relationships: {context.relationship_context}
        """

        # Action context
        action_context = f"""
        Current Action: "{context.current_action}"
        Recent Action History: {context.action_history[-5:] if context.action_history else ['No previous actions']}
        """

        prompt = f"""
        {world_context}

        {character_context}

        {action_context}

        As the Consequence Master, analyze this action and generate meaningful consequences that:
        1. Feel natural and logical based on the action
        2. Enhance the ongoing narrative
        3. Create interesting story developments
        4. Reflect the world's internal logic and consistency
        5. Vary in timing (immediate, short-term, long-term effects)

        Consider:
        - How does this action affect the character's reputation?
        - What are the immediate environmental/social responses?
        - What long-term story implications might emerge?
        - How do NPCs and the world react to this choice?
        - What opportunities or challenges does this create?

        Generate 1-3 consequences with varying timing and severity.

        Respond in JSON format:
        {{
            "consequences": [
                {{
                    "consequence_type": "social/environmental/personal/political/magical/economic",
                    "description": "brief description of the consequence",
                    "narrative_text": "detailed narrative description for the player",
                    "effects": {{
                        "reputation_changes": {{}},
                        "world_state_changes": {{}},
                        "character_effects": {{}},
                        "relationship_impacts": {{}}
                    }},
                    "severity": "minor/moderate/major/critical",
                    "delay_type": "immediate/short_term/long_term",
                    "confidence_score": 0.85
                }}
            ]
        }}
        """

        return prompt

    def _get_consequence_master_instruction(self, context: ConsequenceContext) -> str:
        """Get system instruction for consequence generation AI"""
        world_title = context.lorebook.series_metadata.title if context.lorebook else "a fantasy world"

        return f"""You are the Consequence Master for {world_title}, responsible for creating
        meaningful, story-driven consequences that emerge naturally from player actions. Your role is to:

        1. Generate consequences that feel earned and logical
        2. Create story opportunities rather than just punishments
        3. Maintain world consistency and narrative coherence
        4. Balance immediate and long-term effects
        5. Enhance the storytelling experience through meaningful choice impact

        Focus on consequences that serve the narrative and create interesting story developments.
        Always respond with valid JSON format."""

    async def _parse_consequence_response(self, ai_response: str,
                                        context: ConsequenceContext) -> List[ConsequenceEvent]:
        """Parse AI response into structured ConsequenceEvent objects"""
        try:
            import json
            response_data = json.loads(ai_response)
            consequences = []

            for consequence_data in response_data.get("consequences", []):
                consequence = ConsequenceEvent(
                    consequence_type=consequence_data.get("consequence_type", "social"),
                    description=consequence_data.get("description", "Your action has consequences."),
                    trigger_action=context.current_action,
                    narrative_text=consequence_data.get("narrative_text", "The world responds to your choice."),
                    effects=consequence_data.get("effects", {}),
                    severity=consequence_data.get("severity", "minor"),
                    delay_type=consequence_data.get("delay_type", "immediate"),
                    confidence_score=consequence_data.get("confidence_score", 0.7)
                )
                consequences.append(consequence)

            return consequences

        except Exception as e:
            logger.error(f"Error parsing consequence response: {str(e)}")
            return await self._create_fallback_consequences(context)

    async def _create_fallback_consequences(self, context: ConsequenceContext) -> List[ConsequenceEvent]:
        """Create fallback consequences when AI generation fails"""
        # Analyze action to create basic consequences
        action_lower = context.current_action.lower()

        consequences = []

        # Combat consequences
        if any(word in action_lower for word in ["attack", "fight", "battle"]):
            consequence = ConsequenceEvent(
                consequence_type="social",
                description="Your aggressive action affects how others perceive you.",
                trigger_action=context.current_action,
                narrative_text="Word of your combat prowess spreads among the locals.",
                effects={"reputation_changes": {"combat_reputation": 1}},
                severity="minor",
                delay_type="short_term"
            )
            consequences.append(consequence)

        # Diplomatic consequences
        elif any(word in action_lower for word in ["talk", "negotiate", "persuade"]):
            consequence = ConsequenceEvent(
                consequence_type="social",
                description="Your diplomatic approach builds relationships.",
                trigger_action=context.current_action,
                narrative_text="Your words have made a positive impression on those around you.",
                effects={"reputation_changes": {"diplomatic_reputation": 1}},
                severity="minor",
                delay_type="immediate"
            )
            consequences.append(consequence)

        # Exploration consequences
        elif any(word in action_lower for word in ["explore", "search", "investigate"]):
            consequence = ConsequenceEvent(
                consequence_type="environmental",
                description="Your exploration reveals new information.",
                trigger_action=context.current_action,
                narrative_text="Your careful investigation uncovers details that may prove useful later.",
                effects={"character_effects": {"knowledge_gained": True}},
                severity="minor",
                delay_type="long_term"
            )
            consequences.append(consequence)

        # Default consequence
        else:
            consequence = ConsequenceEvent(
                consequence_type="personal",
                description="Your action contributes to your character's development.",
                trigger_action=context.current_action,
                narrative_text="Your choice shapes who you are becoming in this world.",
                effects={"character_effects": {"experience_gained": True}},
                severity="minor",
                delay_type="immediate"
            )
            consequences.append(consequence)

        return consequences

    async def activate_pending_consequences(self, session_id: str,
                                          current_context: ConsequenceContext) -> List[ConsequenceEvent]:
        """Check and activate pending consequences based on current context"""
        if session_id not in self.pending_consequences:
            return []

        activated = []
        current_time = datetime.now()

        for consequence in self.pending_consequences[session_id]:
            if consequence.activated:
                continue

            should_activate = False

            # Check activation conditions based on delay type
            if consequence.delay_type == "immediate":
                should_activate = True
            elif consequence.delay_type == "short_term":
                # Activate after 5 minutes or 3 actions
                time_diff = current_time - consequence.created_at
                action_count = len(current_context.action_history)
                if time_diff > timedelta(minutes=5) or action_count >= 3:
                    should_activate = True
            elif consequence.delay_type == "long_term":
                # Activate after 15 minutes or 10 actions
                time_diff = current_time - consequence.created_at
                action_count = len(current_context.action_history)
                if time_diff > timedelta(minutes=15) or action_count >= 10:
                    should_activate = True

            if should_activate:
                consequence.activated = True
                activated.append(consequence)

                # Move to activated consequences
                if session_id not in self.activated_consequences:
                    self.activated_consequences[session_id] = []
                self.activated_consequences[session_id].append(consequence)

                logger.info(f"Activated consequence: {consequence.description}")

        # Remove activated consequences from pending
        self.pending_consequences[session_id] = [
            c for c in self.pending_consequences[session_id] if not c.activated
        ]

        return activated

    async def apply_consequence_effects(self, consequence: ConsequenceEvent,
                                      session: GameSession) -> GameSession:
        """Apply consequence effects to the game session"""
        try:
            effects = consequence.effects

            # Apply reputation changes
            if "reputation_changes" in effects:
                # Store reputation in character metadata
                if not hasattr(session.character, 'metadata') or session.character.metadata is None:
                    session.character.metadata = {}

                if "reputation" not in session.character.metadata:
                    session.character.metadata["reputation"] = {}

                for rep_type, change in effects["reputation_changes"].items():
                    current_rep = session.character.metadata["reputation"].get(rep_type, 0)
                    session.character.metadata["reputation"][rep_type] = current_rep + change

            # Apply world state changes
            if "world_state_changes" in effects:
                for change_type, change_value in effects["world_state_changes"].items():
                    if change_type == "special_conditions":
                        if change_value not in session.world_state.special_conditions:
                            session.world_state.special_conditions.append(change_value)

            # Apply character effects
            if "character_effects" in effects:
                for effect_type, effect_value in effects["character_effects"].items():
                    if effect_type == "health_change":
                        session.character.health = max(0, min(session.character.max_health,
                                                             session.character.health + effect_value))
                    elif effect_type == "mana_change":
                        session.character.mana = max(0, min(session.character.max_mana,
                                                           session.character.mana + effect_value))

            # Add consequence to story
            consequence_entry = StoryEntry(
                type=ActionType.SYSTEM,
                text=consequence.narrative_text,
                metadata={
                    "consequence_id": consequence.id,
                    "consequence_type": consequence.consequence_type,
                    "severity": consequence.severity
                }
            )
            session.story.append(consequence_entry)

            logger.info(f"Applied consequence effects: {consequence.consequence_type}")
            return session

        except Exception as e:
            logger.error(f"Error applying consequence effects: {str(e)}")
            return session

    async def get_consequence_history(self, session_id: str) -> Dict[str, List[ConsequenceEvent]]:
        """Get consequence history for a session"""
        return {
            "pending": self.pending_consequences.get(session_id, []),
            "activated": self.activated_consequences.get(session_id, [])
        }


# Global instance
consequence_manager = ConsequenceManager()
