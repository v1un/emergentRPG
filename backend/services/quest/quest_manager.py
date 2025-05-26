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

from models.game_models import Character, Quest, WorldState
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class QuestTemplate:
    """Template for generating dynamic quests"""
    def __init__(self, template_id: str, name_pattern: str, description_pattern: str,
                 requirements: Dict[str, Any], rewards: Dict[str, Any],
                 difficulty_range: Tuple[int, int], scenario_types: List[str]):
        self.template_id = template_id
        self.name_pattern = name_pattern
        self.description_pattern = description_pattern
        self.requirements = requirements
        self.rewards = rewards
        self.difficulty_range = difficulty_range
        self.scenario_types = scenario_types
        self.created_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "template_id": self.template_id,
            "name_pattern": self.name_pattern,
            "description_pattern": self.description_pattern,
            "requirements": self.requirements,
            "rewards": self.rewards,
            "difficulty_range": self.difficulty_range,
            "scenario_types": self.scenario_types,
            "created_at": self.created_at.isoformat()
        }


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
        self.quest_templates: Dict[str, QuestTemplate] = {}
        self.active_quests: Dict[str, Quest] = {}  # Stores Quest objects
        self.completed_quests: Dict[str, QuestCompletion] = {} # Stores QuestCompletion objects
        self._initialize_default_templates()
    
    def _initialize_default_templates(self):
        """Initialize default quest templates"""
        templates = [
            QuestTemplate(
                "exploration_basic",
                "Explore the {location}",
                "Venture into the mysterious {location} and discover what lies within.",
                {"min_level": 1, "max_level": 5},
                {"experience": 100, "gold": 50},
                (1, 3),
                ["fantasy", "adventure", "exploration"]
            ),
            QuestTemplate(
                "fetch_item",
                "Retrieve the {item}",
                "A local {npc} has asked you to retrieve their lost {item} from {location}.",
                {"min_level": 1, "max_level": 10},
                {"experience": 150, "gold": 75},
                (2, 4),
                ["fantasy", "adventure", "fetch"]
            ),
            QuestTemplate(
                "defeat_monster",
                "Slay the {monster}",
                "A dangerous {monster} has been terrorizing {location}. Eliminate the threat.",
                {"min_level": 3, "max_level": 15},
                {"experience": 200, "gold": 100},
                (3, 6),
                ["fantasy", "combat", "adventure"]
            ),
            QuestTemplate(
                "rescue_npc",
                "Rescue {npc}",
                "{npc} has gone missing near {location}. Find them and bring them to safety.",
                {"min_level": 2, "max_level": 12},
                {"experience": 175, "gold": 85},
                (3, 5),
                ["fantasy", "adventure", "rescue"]
            ),
            QuestTemplate(
                "deliver_message",
                "Deliver Message to {npc}",
                "Take this important message to {npc} in {location}.",
                {"min_level": 1, "max_level": 8},
                {"experience": 75, "gold": 40},
                (1, 2),
                ["fantasy", "adventure", "delivery"]
            ),
            QuestTemplate(
                "investigate_mystery",
                "Investigate the Mystery of {location}",
                "Strange events have been occurring in {location}. Investigate and report back.",
                {"min_level": 5, "max_level": 20},
                {"experience": 250, "gold": 125},
                (4, 7),
                ["fantasy", "mystery", "investigation"]
            )
        ]
        
        for template in templates:
            self.quest_templates[template.template_id] = template
        
        logger.info(f"Initialized {len(templates)} default quest templates")
    
    async def generate_quest(self, context: GameContext) -> Quest:
        """Generate a new quest based on game context"""
        try:
            # Select appropriate template based on character level and context
            suitable_templates = self._get_suitable_templates(context)
            
            if not suitable_templates:
                # Fallback to basic exploration quest
                return self._create_fallback_quest(context)
            
            # Choose random template
            template = random.choice(suitable_templates)
            
            # Generate quest using AI
            quest = await self._generate_quest_from_template(template, context)
            
            # Store quest
            self.active_quests[quest.id] = quest
            
            logger.info(f"Generated quest '{quest.title}' for character level {context.character.level}")
            return quest
            
        except Exception as e:
            logger.error(f"Error generating quest: {str(e)}")
            return self._create_fallback_quest(context)
    
    def _get_suitable_templates(self, context: GameContext) -> List[QuestTemplate]:
        """Get quest templates suitable for the current context"""
        suitable = []
        character_level = context.character.level
        
        for template in self.quest_templates.values():
            # Check level requirements
            # Ensure requirements is a dict and has min_level/max_level
            req_min_level = template.requirements.get("min_level", 1) if isinstance(template.requirements, dict) else 1
            req_max_level = template.requirements.get("max_level", 20) if isinstance(template.requirements, dict) else 20

            if req_min_level <= character_level <= req_max_level:
                suitable.append(template)
        
        return suitable
    
    async def _generate_quest_from_template(self, template: QuestTemplate, context: GameContext) -> Quest:
        """Generate a specific quest from a template using AI"""
        try:
            # Prepare context for AI generation
            quest_prompt = self._build_quest_prompt(template, context)
            
            # Generate quest details using AI
            response = await gemini_client.generate_text(quest_prompt)
            
            # Parse AI response and create quest
            quest_data = self._parse_quest_response(response, template, context)
            
            quest = Quest(
                id=str(uuid.uuid4()),
                title=quest_data["title"],
                description=quest_data["description"],
                status="active",
                progress="0/1",
                objectives=quest_data["objectives"],
                rewards=quest_data["rewards"],
                metadata={
                    "template_id": template.template_id,
                    "difficulty": quest_data["difficulty"],
                    "estimated_time": quest_data["estimated_time"],
                    "location": context.location,
                    "generated_at": datetime.now().isoformat()
                }
            )
            
            return quest
            
        except Exception as e:
            logger.error(f"Error generating quest from template: {str(e)}")
            return self._create_quest_from_template_fallback(template, context)
    
    def _build_quest_prompt(self, template: QuestTemplate, context: GameContext) -> str:
        """Build prompt for AI quest generation"""
        prompt = f"""Generate a quest based on the following template and context:

Template: {template.name_pattern}
Description Pattern: {template.description_pattern}
Difficulty Range: {template.difficulty_range[0]}-{template.difficulty_range[1]}

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

Generate a quest with:
1. A compelling title
2. An engaging description (2-3 sentences)
3. 2-4 specific objectives
4. Appropriate rewards for level {context.character.level}
5. Estimated completion time
6. Difficulty rating (1-10)

Format as JSON with keys: title, description, objectives, rewards, difficulty, estimated_time"""

        return prompt
    
    def _parse_quest_response(self, response: str, template: QuestTemplate, context: GameContext) -> Dict[str, Any]:
        """Parse AI response and extract quest data"""
        try:
            # Try to parse JSON response
            import json
            quest_data = json.loads(response)
            
            # Validate and set defaults
            return {
                "title": quest_data.get("title", template.name_pattern.format(location=context.location)),
                "description": quest_data.get("description", template.description_pattern.format(location=context.location)),
                "objectives": quest_data.get("objectives", ["Complete the quest"]),
                "rewards": quest_data.get("rewards", {"experience": 100, "gold": 50}),
                "difficulty": quest_data.get("difficulty", template.difficulty_range[0]),
                "estimated_time": quest_data.get("estimated_time", "30 minutes")
            }
            
        except Exception as e:
            logger.warning(f"Failed to parse AI quest response, using fallback: {str(e)}")
            return self._create_fallback_quest_data(template, context)
    
    def _create_fallback_quest_data(self, template: QuestTemplate, context: GameContext) -> Dict[str, Any]:
        """Create fallback quest data when AI generation fails"""
        return {
            "title": template.name_pattern.replace("{location}", context.location),
            "description": template.description_pattern.replace("{location}", context.location),
            "objectives": ["Explore the area", "Report back with findings"],
            "rewards": {"experience": 100, "gold": 50},
            "difficulty": template.difficulty_range[0],
            "estimated_time": "30 minutes"
        }
    
    def _create_quest_from_template_fallback(self, template: QuestTemplate, context: GameContext) -> Quest:
        """Create a quest from template when AI generation fails"""
        quest_data = self._create_fallback_quest_data(template, context)
        
        return Quest(
            id=str(uuid.uuid4()),
            title=quest_data["title"],
            description=quest_data["description"],
            status="active",
            progress="0/1",
            objectives=quest_data["objectives"],
            rewards=quest_data["rewards"],
            metadata={
                "template_id": template.template_id,
                "difficulty": quest_data["difficulty"],
                "fallback": True,
                "generated_at": datetime.now().isoformat()
            }
        )
    
    def _create_fallback_quest(self, context: GameContext) -> Quest:
        """Create a basic fallback quest"""
        return Quest(
            id=str(uuid.uuid4()),
            title=f"Explore {context.location}",
            description=f"Take some time to explore {context.location} and see what you can discover.",
            status="active",
            progress="0/1",
            objectives=["Look around the area", "Find something interesting"],
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
            
            # Update progress string
            if "current" in progress and "total" in progress:
                quest.progress = f"{progress['current']}/{progress['total']}"
            
            # Update objectives completion
            if "completed_objectives" in progress:
                completed = progress["completed_objectives"]
                for i, objective in enumerate(quest.objectives):
                    if i < len(completed) and completed[i]:
                        quest.objectives[i] = f"✓ {objective}"
            
            # Check if quest is completed
            if progress.get("completed", False):
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
            "available_templates": len(self.quest_templates),
            "templates": list(self.quest_templates.keys())
        }


# Global quest manager instance
quest_manager = QuestManager()
