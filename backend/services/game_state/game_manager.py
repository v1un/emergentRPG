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

# Import AI-driven systems
from services.ai.context_manager import context_manager, GameContext
from services.ai.character_development_manager import (
    character_development_manager,
    CharacterAnalysisContext,
    CharacterDevelopmentSuggestion
)
from services.ai.dynamic_quest_manager import dynamic_quest_manager, QuestGenerationContext
from services.ai.dynamic_item_manager import dynamic_item_manager, ItemGenerationContext

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
                await self._check_game_milestones(updated_session, lorebook)

            return result

        except Exception as e:
            logger.error(f"Error handling player action: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _check_game_milestones(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        """Check for character progression, quest completion, etc."""
        try:
            # Check for level up using new Character method
            while session.character.can_level_up():
                await self._handle_level_up(session, lorebook)

            # Check for quest completion
            await self._check_quest_completion(session, lorebook)

            # Check for story milestones
            await self._check_story_milestones(session)

        except Exception as e:
            logger.error(f"Error checking game milestones: {str(e)}")

    async def _handle_level_up(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        """Handle AI-driven character level up and development"""
        try:
            old_level = session.character.level

            # Get comprehensive context for AI-driven development
            game_context = context_manager.get_context(session, lorebook)
            char_context = CharacterAnalysisContext(session, lorebook)

            # Generate AI-driven level up development
            development_suggestion = await character_development_manager.suggest_level_up_development(char_context)

            # Apply AI-generated character development
            session.character.level += 1
            session.character = await character_development_manager.apply_character_development(
                development_suggestion, session.character
            )

            # AI-driven health and mana increases based on character development
            health_increase = self._calculate_ai_health_increase(development_suggestion, session.character)
            mana_increase = self._calculate_ai_mana_increase(development_suggestion, session.character)

            session.character.max_health += health_increase
            session.character.health = session.character.max_health
            session.character.max_mana += mana_increase
            session.character.mana = session.character.max_mana

            # Generate AI-driven level up narrative
            level_up_narrative = await self._generate_level_up_narrative(
                development_suggestion, old_level, session.character, game_context
            )

            level_up_entry = StoryEntry(
                type=ActionType.SYSTEM,
                text=level_up_narrative,
                metadata={
                    "development_type": development_suggestion.development_type,
                    "stat_changes": development_suggestion.stat_adjustments,
                    "health_increase": health_increase,
                    "mana_increase": mana_increase,
                    "ai_generated": True
                }
            )
            session.story.append(level_up_entry)

            # Update context with character development
            game_context.character_development_history.append(development_suggestion)

            logger.info(
                f"AI-driven level up: {session.character.name} from {old_level} to {session.character.level} - {development_suggestion.development_type}"
            )

        except Exception as e:
            logger.error(f"Error handling AI-driven level up: {str(e)}")
            # Fallback to basic level up
            await self._fallback_level_up(session)

    def _calculate_ai_health_increase(self, development: CharacterDevelopmentSuggestion, character: Character) -> int:
        """Calculate AI-driven health increase based on character development"""
        base_increase = 8  # Base health increase

        # Bonus based on constitution development
        constitution_bonus = development.stat_adjustments.get("constitution", 0) * 3

        # Bonus based on development type
        type_bonus = 0
        if development.development_type in ["combat", "physical"]:
            type_bonus = 4
        elif development.development_type in ["survival", "endurance"]:
            type_bonus = 6

        # Level scaling
        level_bonus = max(1, character.level // 3)

        return base_increase + constitution_bonus + type_bonus + level_bonus

    def _calculate_ai_mana_increase(self, development: CharacterDevelopmentSuggestion, character: Character) -> int:
        """Calculate AI-driven mana increase based on character development"""
        base_increase = 4  # Base mana increase

        # Bonus based on intelligence/wisdom development
        int_bonus = development.stat_adjustments.get("intelligence", 0) * 2
        wis_bonus = development.stat_adjustments.get("wisdom", 0) * 2

        # Bonus based on development type
        type_bonus = 0
        if development.development_type in ["magical", "mystical"]:
            type_bonus = 3
        elif development.development_type in ["scholarly", "intellectual"]:
            type_bonus = 2

        # Level scaling
        level_bonus = max(1, character.level // 4)

        return base_increase + int_bonus + wis_bonus + type_bonus + level_bonus

    async def _generate_level_up_narrative(self, development: CharacterDevelopmentSuggestion,
                                         old_level: int, character: Character,
                                         game_context: GameContext) -> str:
        """Generate AI-driven level up narrative"""
        try:
            from utils.gemini_client import gemini_client

            prompt = f"""
            Character {character.name} has just leveled up from level {old_level} to {character.level}!

            Character Development: {development.suggestion}
            Development Type: {development.development_type}
            Stat Improvements: {development.stat_adjustments}
            Reasoning: {development.reasoning}

            Current Context:
            - Location: {game_context.world_state.current_location}
            - Recent Story: {game_context.session_summary['recent_actions'][-3:] if game_context.session_summary['recent_actions'] else ['Beginning of adventure']}
            - Character Arc: {game_context.character_arc['dominant_traits']}

            Generate a celebratory level-up message (2-3 sentences) that:
            1. Congratulates the character on reaching the new level
            2. Describes how their experiences have shaped their growth
            3. Mentions the specific development they've gained
            4. Feels personal and connected to their journey

            Make it inspiring and reflective of their character development.
            """

            narrative = await gemini_client.generate_text(
                prompt,
                system_instruction="You are a character development narrator. Create inspiring, personalized level-up messages that reflect the character's journey and growth.",
                temperature=0.7,
                max_output_tokens=200
            )

            return f"🎉 {narrative.strip()}"

        except Exception as e:
            logger.error(f"Error generating level up narrative: {str(e)}")
            return f"🎉 Congratulations! {character.name} has reached level {character.level}! Your experiences have made you stronger and wiser. Health and mana have been fully restored."

    async def _fallback_level_up(self, session: GameSession):
        """Fallback level up when AI systems fail"""
        session.character.max_health += 10
        session.character.health = session.character.max_health
        session.character.max_mana += 5
        session.character.mana = session.character.max_mana

        level_up_message = f"🎉 Congratulations! {session.character.name} has reached level {session.character.level}! Health and mana have been fully restored."
        level_up_entry = StoryEntry(type=ActionType.SYSTEM, text=level_up_message)
        session.story.append(level_up_entry)

    async def _check_quest_completion(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        """Check if any quests have been completed and handle AI-driven rewards"""
        try:
            for quest in session.quests:
                if quest.status == "active":
                    # Check if quest is complete using new progress model
                    if quest.progress.is_complete:
                        quest.status = "completed"

                        # Generate AI-driven quest completion narrative and rewards
                        await self._handle_ai_quest_completion(quest, session, lorebook)

                        logger.info(f"Quest completed with AI rewards: {quest.title}")

        except Exception as e:
            logger.error(f"Error checking quest completion: {str(e)}")

    async def _handle_ai_quest_completion(self, quest: Quest, session: GameSession, lorebook: Optional[Lorebook] = None):
        """Handle AI-driven quest completion with dynamic rewards"""
        try:
            # Get context for AI-driven completion
            game_context = context_manager.get_context(session, lorebook)
            quest_context = QuestGenerationContext(session, lorebook)

            # Generate completion narrative using dynamic quest manager
            completion_narrative = await dynamic_quest_manager._generate_completion_narrative(quest, quest_context)

            # Calculate AI-driven experience reward
            experience_reward = await self._calculate_ai_quest_experience(quest, session, game_context)

            # Generate contextual item rewards
            item_rewards = await self._generate_quest_item_rewards(quest, session, lorebook)

            # Add completion message with AI narrative
            completion_entry = StoryEntry(
                type=ActionType.SYSTEM,
                text=f"✅ {completion_narrative}",
                metadata={
                    "quest_id": quest.id,
                    "experience_reward": experience_reward,
                    "item_rewards": [item.name for item in item_rewards],
                    "ai_generated": True
                }
            )
            session.story.append(completion_entry)

            # Award AI-calculated experience
            session.character.experience += experience_reward

            # Add item rewards to inventory
            for item in item_rewards:
                # Convert AI Item to InventoryItem
                inventory_item = self._convert_ai_item_to_inventory(item)
                session.inventory.append(inventory_item)

                # Add item notification
                item_entry = StoryEntry(
                    type=ActionType.SYSTEM,
                    text=f"🎁 Quest Reward: {item.name} - {item.description}",
                    metadata={"quest_reward": True, "item_id": item.id}
                )
                session.story.append(item_entry)

            # Check if this completion should trigger a new quest
            await self._check_for_follow_up_quest(quest, session, lorebook)

        except Exception as e:
            logger.error(f"Error handling AI quest completion: {str(e)}")
            # Fallback to basic completion
            await self._fallback_quest_completion(quest, session)

    async def _calculate_ai_quest_experience(self, quest: Quest, session: GameSession, game_context: GameContext) -> int:
        """Calculate AI-driven experience reward for quest completion"""
        try:
            from utils.gemini_client import gemini_client

            prompt = f"""
            Calculate appropriate experience reward for completing this quest:

            Quest: {quest.title}
            Description: {quest.description}
            Objectives Completed: {quest.objectives}

            Character Context:
            - Level: {session.character.level}
            - Current Experience: {session.character.experience}
            - Character Arc: {game_context.character_arc['dominant_traits']}

            Quest Context:
            - Difficulty: {quest.metadata.get('difficulty', 'medium') if quest.metadata else 'medium'}
            - Quest Type: {quest.metadata.get('quest_type', 'adventure') if quest.metadata else 'adventure'}
            - Story Significance: {quest.metadata.get('narrative_significance', 'moderate') if quest.metadata else 'moderate'}

            Calculate experience that:
            1. Is appropriate for the character's level
            2. Reflects the quest's difficulty and significance
            3. Encourages continued progression
            4. Feels rewarding but balanced

            Respond with just the experience number (50-500 range).
            """

            response = await gemini_client.generate_text(
                prompt,
                system_instruction="You are an experience calculator. Provide balanced experience rewards that feel meaningful but not overpowered.",
                temperature=0.3,
                max_output_tokens=50
            )

            # Extract number from response
            import re
            numbers = re.findall(r'\d+', response)
            if numbers:
                experience = int(numbers[0])
                return max(50, min(500, experience))  # Clamp between 50-500

        except Exception as e:
            logger.error(f"Error calculating AI quest experience: {str(e)}")

        # Fallback calculation
        base_exp = 100
        level_multiplier = session.character.level * 10
        return base_exp + level_multiplier

    async def _generate_quest_item_rewards(self, quest: Quest, session: GameSession, lorebook: Optional[Lorebook] = None) -> List:
        """Generate contextual item rewards for quest completion"""
        try:
            # Create context for item generation
            item_context = ItemGenerationContext(
                session,
                "quest_reward",
                lorebook,
                f"Reward for completing quest: {quest.title}"
            )

            # Generate 1-2 contextual items based on quest
            num_items = 1 if session.character.level < 5 else 2
            items = await dynamic_item_manager.generate_loot_for_context(item_context, num_items)

            return items

        except Exception as e:
            logger.error(f"Error generating quest item rewards: {str(e)}")
            return []  # No items on error

    def _convert_ai_item_to_inventory(self, ai_item) -> InventoryItem:
        """Convert AI-generated Item to InventoryItem for inventory"""
        return InventoryItem(
            id=ai_item.id,
            name=ai_item.name,
            type=ai_item.item_type,
            rarity=ai_item.rarity,
            description=ai_item.description,
            quantity=1,
            equipped=False,
            equipment_slot=ai_item.equipment_slot,
            weight=1.0,
            metadata=ai_item.metadata
        )

    async def _check_for_follow_up_quest(self, completed_quest: Quest, session: GameSession, lorebook: Optional[Lorebook] = None):
        """Check if quest completion should trigger a new quest"""
        try:
            # Only generate follow-up quests occasionally and for significant quests
            if (len(session.quests) < 3 and  # Don't overwhelm with quests
                completed_quest.metadata and
                completed_quest.metadata.get('quest_type') in ['main_story', 'character_development']):

                quest_context = QuestGenerationContext(session, lorebook)
                new_quest = await dynamic_quest_manager.generate_contextual_quest(quest_context)

                session.quests.append(new_quest)

                # Add quest notification
                quest_entry = StoryEntry(
                    type=ActionType.SYSTEM,
                    text=f"📜 New Quest Available: {new_quest.title} - {new_quest.description}",
                    metadata={"follow_up_quest": True, "parent_quest": completed_quest.id}
                )
                session.story.append(quest_entry)

                logger.info(f"Generated follow-up quest: {new_quest.title}")

        except Exception as e:
            logger.error(f"Error checking for follow-up quest: {str(e)}")

    async def _fallback_quest_completion(self, quest: Quest, session: GameSession):
        """Fallback quest completion when AI systems fail"""
        completion_message = f"✅ Quest Completed: {quest.title}! {quest.description}"
        completion_entry = StoryEntry(type=ActionType.SYSTEM, text=completion_message)
        session.story.append(completion_entry)

        # Basic experience reward
        session.character.experience += 100

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
