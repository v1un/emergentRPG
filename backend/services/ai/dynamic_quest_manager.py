"""
AI-Driven Dynamic Quest Management Service
Replaces hardcoded quest templates with AI-generated contextual quests
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from models.game_models import GameSession, Quest, QuestProgress
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class QuestGenerationContext:
    """Context for AI-driven quest generation"""
    def __init__(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        self.session = session
        self.lorebook = lorebook
        self.character = session.character
        self.world_state = session.world_state
        self.current_quests = session.quests
        self.story_context = self._build_story_context()
        self.character_progression = self._analyze_character_progression()

    def _build_story_context(self) -> str:
        """Build narrative context from recent story"""
        recent_entries = self.session.story[-8:] if len(self.session.story) > 8 else self.session.story
        return "\n".join([f"{entry.type}: {entry.text}" for entry in recent_entries])

    def _analyze_character_progression(self) -> Dict[str, Any]:
        """Analyze character's progression and interests"""
        progression = {
            "level": self.character.level,
            "experience": self.character.experience,
            "dominant_stats": self._get_dominant_stats(),
            "quest_history": len([q for q in self.current_quests if q.status == "completed"]),
            "active_quest_count": len([q for q in self.current_quests if q.status == "active"])
        }
        return progression

    def _get_dominant_stats(self) -> List[str]:
        """Get character's strongest stats"""
        stats = {
            "strength": self.character.stats.strength,
            "dexterity": self.character.stats.dexterity,
            "intelligence": self.character.stats.intelligence,
            "constitution": self.character.stats.constitution,
            "wisdom": self.character.stats.wisdom,
            "charisma": self.character.stats.charisma
        }
        sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
        return [stat[0] for stat in sorted_stats[:2]]  # Top 2 stats

    def to_dict(self) -> Dict[str, Any]:
        return {
            "character_name": self.character.name,
            "character_level": self.character.level,
            "character_class": self.character.class_name,
            "current_location": self.world_state.current_location,
            "active_quests": len([q for q in self.current_quests if q.status == "active"]),
            "completed_quests": len([q for q in self.current_quests if q.status == "completed"]),
            "dominant_stats": self.character_progression["dominant_stats"],
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }


class DynamicQuestManager:
    """AI-driven quest generation replacing hardcoded templates"""

    def __init__(self):
        self.generated_quests: Dict[str, Quest] = {}

    async def generate_contextual_quest(self, context: QuestGenerationContext) -> Quest:
        """Generate AI-driven quest based on current context"""
        try:
            logger.info(f"Generating contextual quest for {context.character.name}")

            # Build comprehensive prompt for quest generation
            prompt = await self._build_quest_generation_prompt(context)

            # Generate AI response
            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction=self._get_quest_master_instruction(context),
                temperature=0.7,
                max_output_tokens=600,
                response_format="json"
            )

            # Parse and structure the response
            quest = await self._parse_quest_response(ai_response, context)

            # Store generated quest
            self.generated_quests[quest.id] = quest

            logger.info(f"Generated quest: {quest.title}")
            return quest

        except Exception as e:
            logger.error(f"Error generating contextual quest: {str(e)}")
            return await self._create_fallback_quest(context)

    async def _build_quest_generation_prompt(self, context: QuestGenerationContext) -> str:
        """Build comprehensive prompt for quest generation"""

        # World context
        world_context = ""
        if context.lorebook:
            world_context = f"""
            World: {context.lorebook.series_metadata.title}
            Setting: {context.lorebook.series_metadata.setting}
            Power System: {context.lorebook.series_metadata.power_system}
            Genre: {context.lorebook.series_metadata.genre}
            Tone: {context.lorebook.series_metadata.tone}

            Available Locations: {[loc.name for loc in context.lorebook.locations[:5]]}
            Key Characters: {[char.name for char in context.lorebook.characters[:5]]}
            """

        # Character context
        character = context.character
        character_context = f"""
        Character: {character.name} (Level {character.level}, {character.class_name})
        Dominant Stats: {context.character_progression["dominant_stats"]}
        Current Location: {context.world_state.current_location}
        Active Quests: {context.character_progression["active_quest_count"]}
        Completed Quests: {context.character_progression["quest_history"]}
        """

        # Story context
        story_context = f"""
        Recent Story Context:
        {context.story_context}

        Current World State:
        - Time: {context.world_state.time_of_day}
        - Weather: {context.world_state.weather}
        - Special Conditions: {context.world_state.special_conditions}
        - NPCs Present: {context.world_state.npcs_present}
        """

        prompt = f"""
        {world_context}

        {character_context}

        {story_context}

        As the Quest Master, generate a contextual quest that:
        1. Fits naturally into the current narrative and world state
        2. Matches the character's level and abilities
        3. Builds upon recent story events and character actions
        4. Provides meaningful progression and story development
        5. Feels organic to the world and setting

        Consider:
        - What challenges would naturally arise from the current situation?
        - How can this quest advance the character's story?
        - What would be appropriate for the character's level and abilities?
        - How does this connect to the world's lore and ongoing events?
        - What kind of quest would feel engaging and meaningful?

        Generate a quest that serves the story and feels earned by the narrative context.

        Respond in JSON format:
        {{
            "title": "engaging quest title",
            "description": "detailed quest description that explains the situation and stakes",
            "objectives": [
                "specific, clear objective 1",
                "specific, clear objective 2",
                "specific, clear objective 3"
            ],
            "quest_type": "main_story/side_quest/character_development/exploration/social",
            "difficulty": "easy/medium/hard/extreme",
            "estimated_duration": "short/medium/long",
            "rewards": {{
                "experience": 150,
                "narrative_rewards": ["story progression", "character development"],
                "potential_items": ["item suggestions"],
                "relationship_changes": {{"npc_name": "relationship_change"}}
            }},
            "failure_conditions": ["what would cause quest failure"],
            "narrative_significance": "how this quest serves the overall story",
            "confidence_score": 0.85
        }}
        """

        return prompt

    def _get_quest_master_instruction(self, context: QuestGenerationContext) -> str:
        """Get system instruction for quest generation AI"""
        world_title = context.lorebook.series_metadata.title if context.lorebook else "a fantasy world"

        return f"""You are the Quest Master for {world_title}, responsible for creating
        meaningful, contextual quests that emerge naturally from the story and world state. Your role is to:

        1. Generate quests that feel organic to the current narrative
        2. Create objectives that match character abilities and story context
        3. Ensure quests serve character and story development
        4. Balance challenge with character progression
        5. Maintain consistency with world lore and established narrative

        Focus on quests that enhance the storytelling experience and feel earned by the narrative context.
        Always respond with valid JSON format."""

    async def _parse_quest_response(self, ai_response: str, context: QuestGenerationContext) -> Quest:
        """Parse AI response into structured Quest object"""
        try:
            import json
            response_data = json.loads(ai_response)

            # Create quest with AI-generated data
            quest_id = str(uuid.uuid4())
            objectives = response_data.get("objectives", ["Complete the quest"])

            quest = Quest(
                id=quest_id,
                title=response_data.get("title", "A New Adventure"),
                description=response_data.get("description", "An adventure awaits you."),
                status="active",
                progress=QuestProgress(
                    current=0,
                    total=len(objectives),
                    completed_objectives=[False] * len(objectives)
                ),
                objectives=objectives,
                rewards=response_data.get("rewards", {"experience": 100}),
                failure_conditions=response_data.get("failure_conditions", []),
                metadata={
                    "quest_type": response_data.get("quest_type", "side_quest"),
                    "difficulty": response_data.get("difficulty", "medium"),
                    "estimated_duration": response_data.get("estimated_duration", "medium"),
                    "narrative_significance": response_data.get("narrative_significance", ""),
                    "generation_method": "ai_contextual",
                    "generated_at": datetime.now().isoformat(),
                    "character_level": context.character.level,
                    "location": context.world_state.current_location,
                    "confidence_score": response_data.get("confidence_score", 0.7)
                }
            )

            return quest

        except Exception as e:
            logger.error(f"Error parsing quest response: {str(e)}")
            return await self._create_fallback_quest(context)

    async def _create_fallback_quest(self, context: QuestGenerationContext) -> Quest:
        """Create fallback quest when AI generation fails"""
        # Create contextual fallback based on character and location
        character = context.character
        location = context.world_state.current_location

        # Determine quest type based on character's dominant stats
        dominant_stats = context.character_progression["dominant_stats"]

        if "strength" in dominant_stats or "constitution" in dominant_stats:
            quest_type = "combat"
            title = f"Defend {location}"
            description = f"Threats have been spotted near {location}. Use your combat skills to protect the area."
            objectives = ["Investigate the threats", "Eliminate any dangers", "Report back to local authorities"]
        elif "intelligence" in dominant_stats or "wisdom" in dominant_stats:
            quest_type = "investigation"
            title = f"Mysteries of {location}"
            description = f"Strange occurrences in {location} require investigation. Use your knowledge to uncover the truth."
            objectives = ["Gather information about the mysteries", "Analyze the evidence", "Solve the mystery"]
        elif "charisma" in dominant_stats:
            quest_type = "social"
            title = f"Diplomatic Mission in {location}"
            description = f"Tensions in {location} require a diplomatic solution. Use your social skills to resolve conflicts."
            objectives = ["Speak with conflicting parties", "Find common ground", "Negotiate a peaceful resolution"]
        else:
            quest_type = "exploration"
            title = f"Explore {location}"
            description = f"There's more to discover in {location}. Explore and see what you can find."
            objectives = ["Thoroughly explore the area", "Document interesting findings", "Report your discoveries"]

        quest_id = str(uuid.uuid4())

        quest = Quest(
            id=quest_id,
            title=title,
            description=description,
            status="active",
            progress=QuestProgress(
                current=0,
                total=len(objectives),
                completed_objectives=[False] * len(objectives)
            ),
            objectives=objectives,
            rewards={
                "experience": max(50, character.level * 25),
                "narrative_rewards": ["Character development", "Story progression"]
            },
            failure_conditions=["Abandon the quest", "Fail to complete objectives"],
            metadata={
                "quest_type": quest_type,
                "difficulty": "medium",
                "estimated_duration": "medium",
                "generation_method": "fallback_contextual",
                "generated_at": datetime.now().isoformat(),
                "character_level": character.level,
                "location": location
            }
        )

        return quest

    async def update_quest_progress(self, quest: Quest, objective_index: int,
                                  context: QuestGenerationContext) -> Quest:
        """Update quest progress with AI-driven validation"""
        try:
            if 0 <= objective_index < len(quest.objectives):
                # Mark objective as completed
                quest.progress.completed_objectives[objective_index] = True
                quest.progress.current = sum(quest.progress.completed_objectives)

                # Generate AI response for quest progress
                progress_narrative = await self._generate_progress_narrative(quest, objective_index, context)

                # Update quest metadata with progress narrative
                if quest.metadata is None:
                    quest.metadata = {}

                if "progress_narratives" not in quest.metadata:
                    quest.metadata["progress_narratives"] = []

                quest.metadata["progress_narratives"].append({
                    "objective_index": objective_index,
                    "narrative": progress_narrative,
                    "completed_at": datetime.now().isoformat()
                })

                # Check if quest is complete
                if quest.progress.is_complete:
                    quest.status = "completed"
                    completion_narrative = await self._generate_completion_narrative(quest, context)
                    quest.metadata["completion_narrative"] = completion_narrative

                logger.info(f"Updated quest progress: {quest.title} ({quest.progress.current}/{quest.progress.total})")

            return quest

        except Exception as e:
            logger.error(f"Error updating quest progress: {str(e)}")
            return quest

    async def _generate_progress_narrative(self, quest: Quest, objective_index: int,
                                         context: QuestGenerationContext) -> str:
        """Generate narrative for quest objective completion"""
        try:
            objective = quest.objectives[objective_index]

            prompt = f"""
            Character {context.character.name} has just completed the objective: "{objective}"

            Quest: {quest.title}
            Quest Description: {quest.description}
            Character Level: {context.character.level}
            Location: {context.world_state.current_location}

            Generate a brief, engaging narrative (2-3 sentences) describing how the character
            accomplished this objective and what they experienced. Make it feel meaningful and
            connected to their journey.
            """

            narrative = await gemini_client.generate_text(
                prompt,
                system_instruction="You are a narrative specialist. Create engaging, concise descriptions of character achievements.",
                temperature=0.7,
                max_output_tokens=150
            )

            return narrative.strip()

        except Exception as e:
            logger.error(f"Error generating progress narrative: {str(e)}")
            return f"You successfully completed: {quest.objectives[objective_index]}"

    async def _generate_completion_narrative(self, quest: Quest,
                                           context: QuestGenerationContext) -> str:
        """Generate narrative for quest completion"""
        try:
            prompt = f"""
            Character {context.character.name} has completed the quest: "{quest.title}"

            Quest Description: {quest.description}
            All Objectives Completed: {quest.objectives}
            Character Level: {context.character.level}

            Generate a satisfying completion narrative (3-4 sentences) that:
            1. Celebrates the character's achievement
            2. Reflects on what they learned or gained
            3. Hints at how this might affect their future journey
            4. Feels rewarding and meaningful
            """

            narrative = await gemini_client.generate_text(
                prompt,
                system_instruction="You are a quest completion specialist. Create satisfying, meaningful quest completion narratives.",
                temperature=0.6,
                max_output_tokens=200
            )

            return narrative.strip()

        except Exception as e:
            logger.error(f"Error generating completion narrative: {str(e)}")
            return f"Congratulations! You have successfully completed {quest.title}. Your efforts have been rewarded."


# Global instance
dynamic_quest_manager = DynamicQuestManager()
