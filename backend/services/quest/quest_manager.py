"""
Dynamic Quest Management System
Handles quest generation, progress tracking, and completion
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from models.game_models import Character, Quest, WorldState, QuestProgress, QuestDependency
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client
from utils.exceptions import (
    QuestError, QuestNotFoundError, QuestDependencyNotMetError,
    QuestAlreadyCompletedError, QuestTimeExpiredError, ValidationError
)

logger = logging.getLogger(__name__)





class QuestRequirements:
    """Quest requirements definition"""
    def __init__(self, min_level: int = 1, max_level: int = 20,
                 required_items: Optional[List[str]] = None,
                 required_location: Optional[str] = None,
                 required_npc: Optional[str] = None,
                 prerequisite_quests: Optional[List[str]] = None):
        self.min_level = min_level
        self.max_level = max_level
        self.required_items = required_items or []
        self.required_location = required_location
        self.required_npc = required_npc
        self.prerequisite_quests = prerequisite_quests or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "min_level": self.min_level,
            "max_level": self.max_level,
            "required_items": self.required_items,
            "required_location": self.required_location,
            "required_npc": self.required_npc,
            "prerequisite_quests": self.prerequisite_quests
        }


class QuestRewards:
    """Quest rewards definition"""
    def __init__(self, experience: int = 0, gold: int = 0,
                 items: Optional[List[Dict[str, Any]]] = None,
                 reputation: Optional[Dict[str, int]] = None,
                 special_rewards: Optional[List[str]] = None):
        self.experience = experience
        self.gold = gold
        self.items = items or []
        self.reputation = reputation or {}
        self.special_rewards = special_rewards or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "experience": self.experience,
            "gold": self.gold,
            "items": self.items,
            "reputation": self.reputation,
            "special_rewards": self.special_rewards
        }


class QuestCompletion:
    """Quest completion result"""
    def __init__(self, quest_id: str, session_id: str, completion_time: datetime,
                 rewards_granted: Dict[str, Any], narrative_text: str):
        self.quest_id = quest_id
        self.session_id = session_id
        self.completion_time = completion_time
        self.rewards_granted = rewards_granted
        self.narrative_text = narrative_text

    def to_dict(self) -> Dict[str, Any]:
        return {
            "quest_id": self.quest_id,
            "session_id": self.session_id,
            "completion_time": self.completion_time.isoformat(),
            "rewards_granted": self.rewards_granted,
            "narrative_text": self.narrative_text
        }


class GameContext:
    """Context information for quest generation"""
    def __init__(self, character: Character, world_state: WorldState,
                 lorebook: Optional[Lorebook] = None, active_quests: Optional[List[Quest]] = None):
        self.character = character
        self.world_state = world_state
        self.lorebook = lorebook
        self.active_quests = active_quests or []
        self.location = world_state.current_location
        self.time_of_day = world_state.time_of_day
        self.weather = world_state.weather

    def to_dict(self) -> Dict[str, Any]:
        return {
            "character": self.character.model_dump(),
            "world_state": self.world_state.model_dump(),
            "lorebook_id": self.lorebook.id if self.lorebook else None,
            "active_quests_count": len(self.active_quests),
            "location": self.location,
            "time_of_day": self.time_of_day,
            "weather": self.weather
        }


class QuestManager:
    """Manages dynamic quest generation, progress tracking, and completion"""

    def __init__(self):
        self.active_quests: Dict[str, Quest] = {}  # Stores Quest objects
        self.completed_quests: Dict[str, QuestCompletion] = {} # Stores QuestCompletion objects
        logger.info("QuestManager initialized with AI-driven quest generation")

    async def generate_quest(self, context: GameContext) -> Quest:
        """Generate a new quest based on game context using AI"""
        try:
            # Try AI-driven quest generation first
            quest = await self._generate_ai_quest(context)

            if not quest:
                # Fallback to basic exploration quest
                quest = self._create_fallback_quest(context)

            # Store quest
            self.active_quests[quest.id] = quest

            logger.info(f"Generated quest '{quest.title}' for character level {context.character.level}")
            return quest

        except Exception as e:
            logger.error(f"Error generating quest: {str(e)}")
            return self._create_fallback_quest(context)

    async def _generate_ai_quest(self, context: GameContext) -> Optional[Quest]:
        """Generate a quest using AI based on game context"""
        try:
            # Build comprehensive prompt for AI quest generation
            quest_prompt = self._build_ai_quest_prompt(context)

            # Generate quest details using AI
            response = await gemini_client.generate_text(
                quest_prompt,
                system_instruction="You are a master quest designer creating engaging, contextual quests for an AI-driven RPG.",
                temperature=0.7,
                max_output_tokens=600,
                response_format="json"
            )

            # Parse AI response and create quest
            quest_data = self._parse_ai_quest_response(response, context)

            if not quest_data:
                return None

            quest = Quest(
                id=str(uuid.uuid4()),
                title=quest_data["title"],
                description=quest_data["description"],
                status="active",
                progress=QuestProgress(
                    current=0,
                    total=len(quest_data["objectives"]),
                    completed_objectives=[False] * len(quest_data["objectives"])
                ),
                objectives=quest_data["objectives"],
                rewards=quest_data["rewards"],
                metadata={
                    "ai_generated": True,
                    "difficulty": quest_data["difficulty"],
                    "estimated_time": quest_data["estimated_time"],
                    "location": context.location,
                    "generated_at": datetime.now().isoformat()
                }
            )

            return quest

        except Exception as e:
            logger.error(f"Error generating AI quest: {str(e)}")
            return None

    def _build_ai_quest_prompt(self, context: GameContext) -> str:
        """Build prompt for AI quest generation"""
        lorebook_context = ""
        if context.lorebook:
            lorebook_context = f"""
World Lore:
- Setting: {context.lorebook.series_metadata.setting}
- Genre: {context.lorebook.series_metadata.genre}
- Available Characters: {[char.name for char in context.lorebook.characters[:5]]}
- Key Locations: {[loc.name for loc in context.lorebook.locations[:5]]}
"""

        prompt = f"""Generate a contextual quest for an AI-driven RPG based on the current game state:

Character Context:
- Name: {context.character.name}
- Level: {context.character.level}
- Class: {context.character.class_name}
- Current Location: {context.location}
- Time: {context.time_of_day}
- Weather: {context.weather}

World Context:
- Available NPCs: {context.world_state.npcs_present}
- Environment: {context.world_state.environment_description}
- Special Conditions: {context.world_state.special_conditions}
{lorebook_context}

Active Quests: {len(context.active_quests)} currently active

Generate a quest that:
1. Fits naturally into the current context and location
2. Is appropriate for character level {context.character.level}
3. Creates engaging narrative opportunities
4. Has clear, achievable objectives
5. Offers meaningful rewards

Respond in JSON format:
{{
    "title": "Quest title",
    "description": "2-3 sentence engaging description",
    "objectives": ["objective 1", "objective 2", "objective 3"],
    "rewards": {{"experience": 100, "gold": 50}},
    "difficulty": 5,
    "estimated_time": "30 minutes"
}}"""

        return prompt

    def _parse_ai_quest_response(self, response: str, context: GameContext) -> Optional[Dict[str, Any]]:
        """Parse AI response and extract quest data"""
        try:
            import json
            quest_data = json.loads(response)

            # Validate required fields
            if not all(key in quest_data for key in ["title", "description", "objectives"]):
                logger.warning("AI quest response missing required fields")
                return None

            # Calculate level-appropriate rewards
            base_exp = 50 + (context.character.level * 25)
            base_gold = 25 + (context.character.level * 15)

            return {
                "title": quest_data["title"],
                "description": quest_data["description"],
                "objectives": quest_data.get("objectives", ["Complete the quest"]),
                "rewards": quest_data.get("rewards", {"experience": base_exp, "gold": base_gold}),
                "difficulty": quest_data.get("difficulty", 5),
                "estimated_time": quest_data.get("estimated_time", "30 minutes")
            }

        except Exception as e:
            logger.warning(f"Failed to parse AI quest response: {str(e)}")
            return None

    def _create_fallback_quest(self, context: GameContext) -> Quest:
        """Create a basic fallback quest"""
        objectives = ["Look around the area", "Find something interesting"]
        return Quest(
            id=str(uuid.uuid4()),
            title=f"Explore {context.location}",
            description=f"Take some time to explore {context.location} and see what you can discover.",
            status="active",
            progress=QuestProgress(
                current=0,
                total=len(objectives),
                completed_objectives=[False] * len(objectives)
            ),
            objectives=objectives,
            rewards={"experience": 50, "gold": 25},
            metadata={
                "fallback": True,
                "generated_at": datetime.now().isoformat()
            }
        )

    async def update_quest_progress(self, quest_id: str, progress: Dict[str, Any]) -> Quest:
        """Update quest progress"""
        try:
            if quest_id not in self.active_quests:
                raise ValueError(f"Quest {quest_id} not found in active quests")

            quest = self.active_quests[quest_id]

            # Update progress using structured format
            if "current" in progress and "total" in progress:
                quest.progress.current = progress["current"]
                quest.progress.total = progress["total"]

            # Update objectives completion
            if "completed_objectives" in progress:
                completed = progress["completed_objectives"]
                quest.progress.completed_objectives = completed[:len(quest.objectives)]

                # Update objective text to show completion
                for i, objective in enumerate(quest.objectives):
                    if i < len(completed) and completed[i]:
                        if not objective.startswith("✓"):
                            quest.objectives[i] = f"✓ {objective}"
                    else:
                        # Remove checkmark if objective is no longer completed
                        if objective.startswith("✓"):
                            quest.objectives[i] = objective[2:]  # Remove "✓ "

            # Check if quest is completed
            if progress.get("completed", False) or quest.progress.is_complete:
                quest.status = "completed"
            elif progress.get("failed", False):
                quest.status = "failed"

            logger.info(f"Updated progress for quest '{quest.title}': {quest.progress}")
            return quest

        except Exception as e:
            logger.error(f"Error updating quest progress: {str(e)}")
            raise

    async def complete_quest(self, quest_id: str, session_id: str) -> QuestCompletion:
        """Complete a quest and generate rewards"""
        try:
            if quest_id not in self.active_quests:
                raise ValueError(f"Quest {quest_id} not found in active quests")

            quest = self.active_quests[quest_id]
            quest.status = "completed"

            # Generate completion narrative
            narrative_text = await self._generate_completion_narrative(quest)

            # Create completion record
            completion = QuestCompletion(
                quest_id=quest_id,
                session_id=session_id,
                completion_time=datetime.now(),
                rewards_granted=quest.rewards or {},
                narrative_text=narrative_text
            )

            # Move from active to completed
            del self.active_quests[quest_id]
            self.completed_quests[quest_id] = completion

            logger.info(f"Completed quest '{quest.title}' for session {session_id}")
            return completion

        except Exception as e:
            logger.error(f"Error completing quest: {str(e)}")
            raise

    async def _generate_completion_narrative(self, quest: Quest) -> str:
        """Generate narrative text for quest completion"""
        try:
            prompt = f"""Generate a brief, satisfying completion narrative for the following quest:

Title: {quest.title}
Description: {quest.description}
Objectives: {', '.join(quest.objectives)}

Write a 1-2 sentence narrative describing the successful completion of this quest.
Make it engaging and rewarding for the player."""

            response = await gemini_client.generate_text(prompt)
            return response.strip()

        except Exception as e:
            logger.warning(f"Failed to generate completion narrative: {str(e)}")
            return f"You have successfully completed '{quest.title}'! Well done, adventurer."

    async def get_available_quests(self, character_level: int, location: str) -> List[Quest]:
        """Get available quests for character at specific location"""
        try:
            available = []

            for quest in self.active_quests.values():
                # Check if quest metadata exists before accessing it
                if quest.metadata is None:
                    logger.warning(f"Quest {quest.id} has no metadata. Skipping availability check.")
                    continue

                # Check if quest is appropriate for character level
                quest_min_level = quest.metadata.get("min_level", 1)
                quest_max_level = quest.metadata.get("max_level", 20)

                if quest_min_level <= character_level <= quest_max_level:
                    # Check if quest is location-appropriate
                    quest_location = quest.metadata.get("location", "")
                    if not quest_location or quest_location == location:
                        available.append(quest)

            logger.debug(f"Found {len(available)} available quests for level {character_level} at {location}")
            return available

        except Exception as e:
            logger.error(f"Error getting available quests: {str(e)}")
            return []

    def get_quest_by_id(self, quest_id: str) -> Optional[Quest]:
        """Get quest by ID from active quests"""
        return self.active_quests.get(quest_id)

    def get_completed_quest(self, quest_id: str) -> Optional[QuestCompletion]:
        """Get completed quest by ID"""
        return self.completed_quests.get(quest_id)

    def get_active_quests_for_session(self, session_id: str) -> List[Quest]:
        """Get all active quests for a specific session"""
        # This would need session tracking in quests
        # For now, return all active quests
        return list(self.active_quests.values())

    def get_quest_statistics(self) -> Dict[str, Any]:
        """Get quest system statistics"""
        return {
            "active_quests": len(self.active_quests),
            "completed_quests": len(self.completed_quests),
            "ai_driven": True,
            "generation_method": "dynamic_ai"
        }


# Global quest manager instance
quest_manager = QuestManager()
