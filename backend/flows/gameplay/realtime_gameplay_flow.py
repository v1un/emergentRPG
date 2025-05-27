import json
import logging
from typing import Any, Dict, Optional

from models.game_models import (
    ActionType,
    GameSession,
    StoryEntry,
)
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

# Import new AI-driven systems
from services.ai.dynamic_world_manager import (
    dynamic_world_manager,
    EnvironmentalContext,
    WorldStateChange
)
from services.ai.character_development_manager import (
    character_development_manager,
    CharacterAnalysisContext,
)
from services.ai.consequence_manager import (
    consequence_manager,
    ConsequenceContext,
)
from services.ai.dynamic_quest_manager import (
    dynamic_quest_manager,
    QuestGenerationContext
)

logger = logging.getLogger(__name__)


class RealtimeGameplayFlow:
    """Genkit-style flow for real-time AI Game Master functionality"""

    async def action_interpretation_flow(
        self,
        player_action: str,
        game_session: GameSession,
        lorebook: Optional[Lorebook] = None,
    ) -> Dict[str, Any]:
        """Flow: Interpret and analyze player actions using Gemini Flash"""

        # Build context from recent story
        recent_story = (
            game_session.story[-5:]
            if len(game_session.story) > 5
            else game_session.story
        )
        story_context = "\n".join(
            [f"{entry.type}: {entry.text}" for entry in recent_story]
        )

        # Build world context from lorebook
        world_context = ""
        if lorebook:
            world_context = f"""
            Setting: {lorebook.series_metadata.setting}
            Power System: {lorebook.series_metadata.power_system}
            Key Characters: {[c.name for c in lorebook.characters[:5]]}
            Current Location: {game_session.world_state.current_location}
            """

        prompt = f"""
        Analyze this player action in the context of the ongoing adventure:

        Player Action: "{player_action}"

        Current Context:
        {world_context}

        Recent Story:
        {story_context}

        Character: {game_session.character.name} (Level {game_session.character.level})
        Current Location: {game_session.world_state.current_location}
        Health: {game_session.character.health}/{game_session.character.max_health}

        Analyze the action and provide interpretation in JSON format:
        {{
            "action_type": "combat/exploration/social/magic/stealth/investigation/other",
            "intent": "what the player is trying to accomplish",
            "feasibility": "possible/difficult/impossible/requires_roll",
            "skill_requirements": ["skills needed for this action"],
            "potential_consequences": ["positive outcomes", "negative outcomes"],
            "environmental_factors": ["how location affects this action"],
            "character_factors": ["how character traits affect this"],
            "difficulty_level": "trivial/easy/medium/hard/extreme",
            "required_resources": ["items, mana, etc. needed"],
            "time_required": "instant/short/medium/long",
            "stealth_level": "overt/subtle/hidden",
            "risk_level": "safe/low/medium/high/dangerous",
            "narrative_weight": "minor/moderate/major/climactic",
            "suggested_outcomes": [
                {{
                    "outcome_type": "success/partial_success/failure/critical_failure",
                    "probability": 0.7,
                    "description": "what happens with this outcome",
                    "consequences": ["immediate effects"],
                    "follow_up_opportunities": ["what this enables"]
                }}
            ]
        }}
        """

        system_instruction = """You are an expert Game Master with deep understanding of game mechanics and narrative flow.
        Analyze player actions fairly, considering both character capabilities and story context.
        Provide multiple possible outcomes with realistic probabilities.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.4,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse action interpretation JSON: {response}")
            return {
                "action_type": "other",
                "intent": "unclear",
                "feasibility": "possible",
                "difficulty_level": "medium",
                "suggested_outcomes": [
                    {
                        "outcome_type": "success",
                        "probability": 0.6,
                        "description": "The action succeeds with some effort",
                        "consequences": ["minor positive result"],
                        "follow_up_opportunities": ["continue adventure"],
                    }
                ],
            }

    async def state_update_flow(
        self, action_analysis: Dict[str, Any], game_session: GameSession,
        player_action: str, lorebook: Optional[Lorebook] = None
    ) -> GameSession:
        """Flow: Update game world using AI-driven dynamic systems"""

        try:
            # Create contexts for AI-driven systems
            env_context = EnvironmentalContext(game_session, lorebook, [player_action])
            char_context = CharacterAnalysisContext(game_session, lorebook)
            consequence_context = ConsequenceContext(game_session, player_action, lorebook)

            # 1. Generate AI-driven world state changes
            world_change = await dynamic_world_manager.generate_world_response(player_action, env_context)

            # Apply world changes to game state
            game_session.world_state = await dynamic_world_manager.apply_world_change(
                world_change, game_session.world_state
            )

            # 2. Check for pending consequences and activate them
            activated_consequences = await consequence_manager.activate_pending_consequences(
                game_session.session_id, consequence_context
            )

            # Apply activated consequences
            for consequence in activated_consequences:
                game_session = await consequence_manager.apply_consequence_effects(consequence, game_session)

            # 3. Generate new consequences for current action
            new_consequences = await consequence_manager.generate_consequences(consequence_context)

            # Apply immediate consequences
            for consequence in new_consequences:
                if consequence.delay_type == "immediate":
                    game_session = await consequence_manager.apply_consequence_effects(consequence, game_session)

            # 4. AI-driven experience and character development
            difficulty = action_analysis.get("difficulty_level", "medium")

            # Use AI to determine experience gain based on context
            exp_gain = await self._calculate_ai_experience_gain(
                player_action, difficulty, char_context, world_change
            )
            game_session.character.experience += exp_gain

            # 5. Check for character development opportunities
            if len(game_session.story) % 5 == 0:  # Every 5 actions, check for development
                development_suggestion = await character_development_manager.analyze_character_development(char_context)

                # Apply character development if significant
                if development_suggestion.confidence_score > 0.7:
                    game_session.character = await character_development_manager.apply_character_development(
                        development_suggestion, game_session.character
                    )

            # 6. Check for dynamic quest opportunities
            quest_context = QuestGenerationContext(game_session, lorebook)

            # Generate new quest if conditions are right
            if (len([q for q in game_session.quests if q.status == "active"]) < 2 and
                len(game_session.story) > 10 and
                len(game_session.story) % 15 == 0):  # Every 15 actions, consider new quest

                new_quest = await dynamic_quest_manager.generate_contextual_quest(quest_context)
                game_session.quests.append(new_quest)

            logger.info(f"AI-driven state update completed for action: {player_action[:30]}...")
            return game_session

        except Exception as e:
            logger.error(f"Error in AI-driven state update: {str(e)}")
            # Fallback to basic state update
            return await self._fallback_state_update(action_analysis, game_session)

    async def _calculate_ai_experience_gain(self, action: str, difficulty: str,
                                          char_context: CharacterAnalysisContext,
                                          world_change: WorldStateChange) -> int:
        """Calculate experience gain using AI analysis"""
        try:
            # Base experience from difficulty
            base_exp = {
                "trivial": 1,
                "easy": 3,
                "medium": 8,
                "hard": 15,
                "extreme": 25,
            }.get(difficulty, 8)

            # AI-driven modifiers based on context
            modifiers = 1.0

            # Bonus for narrative significance
            if world_change.confidence_score > 0.8:
                modifiers += 0.3

            # Bonus for character growth actions
            if any(trait in action.lower() for trait in ["help", "learn", "discover", "create"]):
                modifiers += 0.2

            # Level-appropriate scaling
            level_modifier = max(0.5, 1.0 + (char_context.character.level - 1) * 0.1)

            final_exp = int(base_exp * modifiers * level_modifier)
            return max(1, final_exp)

        except Exception as e:
            logger.error(f"Error calculating AI experience gain: {str(e)}")
            return 5  # Safe fallback

    async def _fallback_state_update(self, action_analysis: Dict[str, Any],
                                   game_session: GameSession) -> GameSession:
        """Fallback state update when AI systems fail"""
        # Simple fallback logic
        difficulty = action_analysis.get("difficulty_level", "medium")
        exp_gain = {"trivial": 1, "easy": 2, "medium": 5, "hard": 10, "extreme": 20}.get(difficulty, 5)
        game_session.character.experience += exp_gain

        return game_session

    async def response_generation_flow(
        self,
        player_action: str,
        action_analysis: Dict[str, Any],
        game_session: GameSession,
        lorebook: Optional[Lorebook] = None,
    ) -> str:
        """Flow: Generate GM response using context and consistency"""

        # Get selected outcome
        outcomes = action_analysis.get("suggested_outcomes", [])
        selected_outcome = (
            max(outcomes, key=lambda x: x.get("probability", 0)) if outcomes else {}
        )

        # Build rich context
        recent_story = (
            game_session.story[-3:]
            if len(game_session.story) > 3
            else game_session.story
        )
        story_context = "\n".join(
            [f"{entry.type}: {entry.text}" for entry in recent_story]
        )

        world_context = ""
        if lorebook:
            # Get relevant characters and locations
            relevant_chars = [c.name for c in lorebook.characters[:3]]
            world_context = f"""
            Series: {lorebook.series_metadata.title}
            Setting: {lorebook.series_metadata.setting}
            Tone: {lorebook.series_metadata.tone}
            Key Characters: {relevant_chars}
            Power System: {lorebook.series_metadata.power_system}
            """

        prompt = f"""
        As the AI Game Master, respond to the player's action with a compelling narrative.

        World Context:
        {world_context}

        Recent Story:
        {story_context}

        Player Action: "{player_action}"
        Action Analysis: {action_analysis.get('intent', 'unclear intent')}
        Outcome: {selected_outcome.get('description', 'uncertain result')}

        Current Situation:
        - Location: {game_session.world_state.current_location}
        - Time: {game_session.world_state.time_of_day}
        - Weather: {game_session.world_state.weather}
        - NPCs Present: {game_session.world_state.npcs_present}
        - Character Health: {game_session.character.health}/{game_session.character.max_health}

        Generate a response that:
        1. Acknowledges the player's action
        2. Describes what happens as a result
        3. Sets up the next moment in the adventure
        4. Maintains the series' tone and style
        5. Includes sensory details (sight, sound, smell, etc.)
        6. Advances the narrative meaningfully

        Write a compelling 2-3 paragraph response that immerses the player in the world.
        Focus on showing rather than telling, and maintain appropriate pacing.
        """

        system_instruction = f"""You are an expert AI Game Master running an adventure based on {lorebook.series_metadata.title if lorebook else 'a fantasy world'}.
        Create immersive, engaging responses that make players feel like they're truly in the world.
        Match the tone and style of the source material while keeping the story moving forward.
        Be descriptive but concise, dramatic but not overwrought."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.8,
            max_output_tokens=1000,
        )

        return response

    async def consistency_check_flow(
        self,
        generated_response: str,
        game_session: GameSession,
        lorebook: Optional[Lorebook] = None,
    ) -> Dict[str, Any]:
        """Flow: Validate response against lorebook and game state"""

        world_facts = ""
        if lorebook:
            world_facts = f"""
            Setting Rules: {lorebook.series_metadata.setting}
            Power System: {lorebook.series_metadata.power_system}
            Character Names: {[c.name for c in lorebook.characters[:5]]}
            Tone: {lorebook.series_metadata.tone}
            """

        prompt = f"""
        Check this AI GM response for consistency with the established world and story.

        World Facts:
        {world_facts}

        Current Game State:
        - Location: {game_session.world_state.current_location}
        - Character: {game_session.character.name} (Level {game_session.character.level})
        - Recent Events: {[entry.text for entry in game_session.story[-2:]] if game_session.story else []}

        Generated Response: "{generated_response}"

        Analyze consistency in JSON format:
        {{
            "consistency_score": 0.95,
            "issues_found": ["list any inconsistencies"],
            "factual_errors": ["incorrect information"],
            "tone_match": "matches/partially_matches/doesn't_match",
            "character_behavior": "accurate/questionable/wrong",
            "world_logic": "consistent/minor_issues/major_problems",
            "narrative_flow": "smooth/adequate/jarring",
            "recommendations": ["suggested improvements"],
            "approval_status": "approved/needs_revision/rejected"
        }}
        """

        system_instruction = """You are a quality assurance expert for interactive storytelling.
        Identify inconsistencies, errors, and areas for improvement in AI-generated content.
        Be thorough but fair in your analysis.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse consistency check JSON: {response}")
            return {
                "consistency_score": 0.7,
                "issues_found": [],
                "approval_status": "approved",
            }

    async def execute_full_turn(
        self,
        player_action: str,
        game_session: GameSession,
        lorebook: Optional[Lorebook] = None,
    ) -> Dict[str, Any]:
        """Execute complete turn: interpret action -> update state -> generate response -> check consistency"""

        try:
            # Step 1: Interpret player action
            action_analysis = await self.action_interpretation_flow(
                player_action, game_session, lorebook
            )

            # Step 2: Update game state
            updated_session = await self.state_update_flow(
                action_analysis, game_session, player_action, lorebook
            )

            # Step 3: Generate GM response
            gm_response = await self.response_generation_flow(
                player_action, action_analysis, updated_session, lorebook
            )

            # Step 4: Check consistency
            consistency_check = await self.consistency_check_flow(
                gm_response, updated_session, lorebook
            )

            # Step 5: Create story entry
            action_entry = StoryEntry(type=ActionType.ACTION, text=player_action)
            response_entry = StoryEntry(type=ActionType.NARRATION, text=gm_response)

            updated_session.story.extend([action_entry, response_entry])

            return {
                "success": True,
                "updated_session": updated_session,
                "gm_response": gm_response,
                "action_analysis": action_analysis,
                "consistency_check": consistency_check,
            }

        except Exception as e:
            logger.error(f"Error executing turn: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fallback_response": "Something unexpected happened. Please try a different action.",
            }


# Global flow instance
realtime_gameplay_flow = RealtimeGameplayFlow()
