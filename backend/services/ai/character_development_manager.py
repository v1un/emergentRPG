"""
AI-Driven Character Development Service
Replaces hardcoded character progression with AI-generated personality and skill evolution
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from models.game_models import Character, GameSession, StoryEntry
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class CharacterDevelopmentSuggestion:
    """Represents an AI-generated character development suggestion"""
    def __init__(self, development_type: str, suggestion: str,
                 reasoning: str, narrative_impact: str,
                 stat_adjustments: Optional[Dict[str, int]] = None,
                 personality_traits: Optional[List[str]] = None,
                 skill_recommendations: Optional[List[str]] = None,
                 confidence_score: float = 0.8):
        self.development_type = development_type
        self.suggestion = suggestion
        self.reasoning = reasoning
        self.narrative_impact = narrative_impact
        self.stat_adjustments = stat_adjustments or {}
        self.personality_traits = personality_traits or []
        self.skill_recommendations = skill_recommendations or []
        self.confidence_score = confidence_score
        self.generated_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "development_type": self.development_type,
            "suggestion": self.suggestion,
            "reasoning": self.reasoning,
            "narrative_impact": self.narrative_impact,
            "stat_adjustments": self.stat_adjustments,
            "personality_traits": self.personality_traits,
            "skill_recommendations": self.skill_recommendations,
            "confidence_score": self.confidence_score,
            "generated_at": self.generated_at.isoformat()
        }


class CharacterAnalysisContext:
    """Context for AI character development analysis"""
    def __init__(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        self.session = session
        self.lorebook = lorebook
        self.character = session.character
        self.recent_actions = self._extract_recent_actions()
        self.character_choices = self._analyze_character_choices()
        self.story_progression = len(session.story)

    def _extract_recent_actions(self) -> List[str]:
        """Extract recent player actions from story"""
        actions = []
        for entry in self.session.story[-10:]:  # Last 10 entries
            if entry.type.value == "action":  # Player actions
                actions.append(entry.text)
        return actions

    def _analyze_character_choices(self) -> Dict[str, int]:
        """Analyze patterns in character choices"""
        choice_patterns = {
            "combat_oriented": 0,
            "diplomatic": 0,
            "investigative": 0,
            "magical": 0,
            "stealthy": 0,
            "helpful": 0,
            "selfish": 0,
            "cautious": 0,
            "reckless": 0
        }

        for action in self.recent_actions:
            action_lower = action.lower()

            # Combat patterns
            if any(word in action_lower for word in ["attack", "fight", "battle", "strike"]):
                choice_patterns["combat_oriented"] += 1

            # Diplomatic patterns
            if any(word in action_lower for word in ["talk", "negotiate", "persuade", "convince"]):
                choice_patterns["diplomatic"] += 1

            # Investigation patterns
            if any(word in action_lower for word in ["investigate", "examine", "search", "look"]):
                choice_patterns["investigative"] += 1

            # Magic patterns
            if any(word in action_lower for word in ["cast", "magic", "spell", "enchant"]):
                choice_patterns["magical"] += 1

            # Stealth patterns
            if any(word in action_lower for word in ["sneak", "hide", "stealth", "quietly"]):
                choice_patterns["stealthy"] += 1

            # Helpful patterns
            if any(word in action_lower for word in ["help", "assist", "aid", "save"]):
                choice_patterns["helpful"] += 1

            # Selfish patterns
            if any(word in action_lower for word in ["take", "steal", "keep", "hoard"]):
                choice_patterns["selfish"] += 1

            # Cautious patterns
            if any(word in action_lower for word in ["carefully", "cautiously", "slowly", "check"]):
                choice_patterns["cautious"] += 1

            # Reckless patterns
            if any(word in action_lower for word in ["quickly", "rush", "immediately", "charge"]):
                choice_patterns["reckless"] += 1

        return choice_patterns

    def to_dict(self) -> Dict[str, Any]:
        return {
            "character_name": self.character.name,
            "character_level": self.character.level,
            "character_class": self.character.class_name,
            "story_progression": self.story_progression,
            "recent_actions_count": len(self.recent_actions),
            "choice_patterns": self.character_choices,
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }


class CharacterDevelopmentManager:
    """AI-driven character development replacing hardcoded progression"""

    def __init__(self):
        self.development_history: Dict[str, List[CharacterDevelopmentSuggestion]] = {}

    async def analyze_character_development(self, context: CharacterAnalysisContext) -> CharacterDevelopmentSuggestion:
        """Analyze character actions and suggest development based on AI analysis"""
        try:
            logger.info(f"Analyzing character development for {context.character.name}")

            # Build comprehensive prompt for character analysis
            prompt = await self._build_character_analysis_prompt(context)

            # Generate AI response
            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction=self._get_character_analyst_instruction(context),
                temperature=0.6,
                max_output_tokens=600,
                response_format="json"
            )

            # Parse and structure the response
            development_suggestion = await self._parse_development_response(ai_response, context)

            # Store in history
            session_id = context.session.session_id
            if session_id not in self.development_history:
                self.development_history[session_id] = []
            self.development_history[session_id].append(development_suggestion)

            logger.info(f"Generated development suggestion: {development_suggestion.development_type}")
            return development_suggestion

        except Exception as e:
            logger.error(f"Error analyzing character development: {str(e)}")
            return await self._create_fallback_development(context)

    async def _build_character_analysis_prompt(self, context: CharacterAnalysisContext) -> str:
        """Build comprehensive prompt for character development analysis"""

        # Character current state
        character = context.character
        character_info = f"""
        Character: {character.name} (Level {character.level}, {character.class_name})
        Current Stats:
        - Strength: {character.stats.strength}
        - Dexterity: {character.stats.dexterity}
        - Intelligence: {character.stats.intelligence}
        - Constitution: {character.stats.constitution}
        - Wisdom: {character.stats.wisdom}
        - Charisma: {character.stats.charisma}

        Health: {character.health}/{character.max_health}
        Mana: {character.mana}/{character.max_mana}
        Experience: {character.experience}
        Background: {character.background or 'Unknown'}
        """

        # World context
        world_context = ""
        if context.lorebook:
            world_context = f"""
            World: {context.lorebook.series_metadata.title}
            Setting: {context.lorebook.series_metadata.setting}
            Power System: {context.lorebook.series_metadata.power_system}
            Genre: {context.lorebook.series_metadata.genre}
            """

        # Recent actions analysis
        actions_analysis = f"""
        Recent Actions: {context.recent_actions[-5:] if context.recent_actions else ['No recent actions']}

        Character Choice Patterns:
        {context.character_choices}

        Story Progression: {context.story_progression} entries
        """

        prompt = f"""
        {character_info}

        {world_context}

        {actions_analysis}

        As a Character Development Analyst, analyze this character's recent actions and choices to suggest
        meaningful character development that reflects their journey and decisions.

        Consider:
        1. How have the character's actions revealed their personality?
        2. What skills or traits should naturally develop based on their choices?
        3. How should their stats evolve to reflect their experiences?
        4. What personality traits are emerging from their behavior?
        5. How does this development serve the ongoing narrative?

        Respond in JSON format:
        {{
            "development_type": "personality/skills/stats/relationships/background",
            "suggestion": "specific development recommendation",
            "reasoning": "why this development makes sense based on actions",
            "narrative_impact": "how this enhances the character's story",
            "stat_adjustments": {{
                "strength": 0,
                "dexterity": 0,
                "intelligence": 0,
                "constitution": 0,
                "wisdom": 0,
                "charisma": 0
            }},
            "personality_traits": ["emerging personality traits"],
            "skill_recommendations": ["skills that should develop"],
            "confidence_score": 0.85
        }}
        """

        return prompt

    def _get_character_analyst_instruction(self, context: CharacterAnalysisContext) -> str:
        """Get system instruction for character development AI"""
        world_title = context.lorebook.series_metadata.title if context.lorebook else "a fantasy world"

        return f"""You are a Character Development Analyst for {world_title}, specializing in
        organic character growth that emerges from player choices and actions. Your role is to:

        1. Identify meaningful patterns in character behavior and choices
        2. Suggest development that feels natural and earned through gameplay
        3. Balance mechanical progression with narrative character growth
        4. Ensure development enhances the storytelling experience
        5. Maintain consistency with the established world and character background

        Focus on character growth that serves the story and feels authentic to the player's choices.
        Always respond with valid JSON format."""

    async def _parse_development_response(self, ai_response: str,
                                        context: CharacterAnalysisContext) -> CharacterDevelopmentSuggestion:
        """Parse AI response into structured CharacterDevelopmentSuggestion"""
        try:
            import json
            response_data = json.loads(ai_response)

            return CharacterDevelopmentSuggestion(
                development_type=response_data.get("development_type", "personality"),
                suggestion=response_data.get("suggestion", "Continue developing your character through your choices."),
                reasoning=response_data.get("reasoning", "Based on your recent actions and decisions."),
                narrative_impact=response_data.get("narrative_impact", "This development enhances your character's story."),
                stat_adjustments=response_data.get("stat_adjustments", {}),
                personality_traits=response_data.get("personality_traits", []),
                skill_recommendations=response_data.get("skill_recommendations", []),
                confidence_score=response_data.get("confidence_score", 0.7)
            )

        except Exception as e:
            logger.error(f"Error parsing development response: {str(e)}")
            return await self._create_fallback_development(context)

    async def _create_fallback_development(self, context: CharacterAnalysisContext) -> CharacterDevelopmentSuggestion:
        """Create fallback development suggestion when AI generation fails"""
        # Analyze choice patterns to provide basic development
        patterns = context.character_choices
        dominant_pattern = max(patterns.items(), key=lambda x: x[1])

        development_map = {
            "combat_oriented": {
                "type": "skills",
                "suggestion": "Your combat experience is making you more skilled in battle.",
                "stats": {"strength": 1, "constitution": 1}
            },
            "diplomatic": {
                "type": "personality",
                "suggestion": "Your diplomatic approach is developing your social skills.",
                "stats": {"charisma": 1, "wisdom": 1}
            },
            "investigative": {
                "type": "skills",
                "suggestion": "Your investigative nature is sharpening your analytical abilities.",
                "stats": {"intelligence": 1, "wisdom": 1}
            },
            "magical": {
                "type": "skills",
                "suggestion": "Your magical practice is expanding your mystical understanding.",
                "stats": {"intelligence": 1, "wisdom": 1}
            }
        }

        development_info = development_map.get(dominant_pattern[0], {
            "type": "personality",
            "suggestion": "Your experiences are shaping your character in meaningful ways.",
            "stats": {}
        })

        return CharacterDevelopmentSuggestion(
            development_type=development_info["type"],
            suggestion=development_info["suggestion"],
            reasoning=f"Based on your tendency toward {dominant_pattern[0]} actions.",
            narrative_impact="Your character continues to grow through their experiences.",
            stat_adjustments=development_info.get("stats", {}),
            personality_traits=[dominant_pattern[0].replace("_", " ").title()],
            skill_recommendations=[f"{dominant_pattern[0].replace('_', ' ').title()} Skills"],
            confidence_score=0.6
        )

    async def apply_character_development(self, suggestion: CharacterDevelopmentSuggestion,
                                        character: Character) -> Character:
        """Apply development suggestion to character"""
        try:
            # Apply stat adjustments
            for stat_name, adjustment in suggestion.stat_adjustments.items():
                if hasattr(character.stats, stat_name) and adjustment != 0:
                    current_value = getattr(character.stats, stat_name)
                    new_value = min(20, max(1, current_value + adjustment))  # Clamp between 1-20
                    setattr(character.stats, stat_name, new_value)
                    logger.info(f"Adjusted {stat_name} by {adjustment} to {new_value}")

            # Update character background with development notes
            if character.background:
                character.background += f"\n\nRecent Development: {suggestion.suggestion}"
            else:
                character.background = f"Character Development: {suggestion.suggestion}"

            logger.info(f"Applied character development: {suggestion.development_type}")
            return character

        except Exception as e:
            logger.error(f"Error applying character development: {str(e)}")
            return character

    async def get_development_history(self, session_id: str) -> List[CharacterDevelopmentSuggestion]:
        """Get character development history for a session"""
        return self.development_history.get(session_id, [])

    async def suggest_level_up_development(self, context: CharacterAnalysisContext) -> CharacterDevelopmentSuggestion:
        """Generate AI-driven level up development instead of hardcoded progression"""
        try:
            # Build prompt specifically for level up
            prompt = f"""
            Character {context.character.name} is ready to level up from level {context.character.level} to {context.character.level + 1}.

            Recent Actions: {context.recent_actions[-3:] if context.recent_actions else ['No recent actions']}
            Choice Patterns: {context.character_choices}

            Based on their journey and choices, suggest how they should develop upon leveling up.
            Consider what abilities, stats, or traits they've earned through their actions.

            Respond in JSON format:
            {{
                "development_type": "level_up",
                "suggestion": "how the character has grown and what they've learned",
                "reasoning": "why this development reflects their journey",
                "narrative_impact": "how this level up enhances their story",
                "stat_adjustments": {{
                    "strength": 0,
                    "dexterity": 0,
                    "intelligence": 0,
                    "constitution": 0,
                    "wisdom": 0,
                    "charisma": 0
                }},
                "personality_traits": ["traits developed through experience"],
                "skill_recommendations": ["abilities gained through practice"],
                "confidence_score": 0.9
            }}
            """

            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction="You are a Character Progression Specialist. Create meaningful level-up development that reflects the character's journey and choices.",
                temperature=0.5,
                max_output_tokens=400,
                response_format="json"
            )

            return await self._parse_development_response(ai_response, context)

        except Exception as e:
            logger.error(f"Error generating level up development: {str(e)}")
            return await self._create_fallback_development(context)


# Global instance
character_development_manager = CharacterDevelopmentManager()
