"""
AI-Driven Dynamic Item and Equipment Management Service
Replaces hardcoded item effects with AI-generated contextual equipment
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from models.game_models import Character, GameSession, Item, EquipmentSlot
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class ItemGenerationContext:
    """Context for AI-driven item generation"""
    def __init__(self, session: GameSession, item_type: str = "random",
                 lorebook: Optional[Lorebook] = None, trigger_context: str = ""):
        self.session = session
        self.item_type = item_type
        self.lorebook = lorebook
        self.trigger_context = trigger_context
        self.character = session.character
        self.world_state = session.world_state
        self.character_needs = self._analyze_character_needs()

    def _analyze_character_needs(self) -> Dict[str, Any]:
        """Analyze what kind of items would benefit the character"""
        needs = {
            "stat_deficiencies": [],
            "equipment_gaps": [],
            "story_relevance": [],
            "level_appropriate": True
        }

        # Check stat deficiencies
        stats = self.character.stats
        stat_values = {
            "strength": stats.strength,
            "dexterity": stats.dexterity,
            "intelligence": stats.intelligence,
            "constitution": stats.constitution,
            "wisdom": stats.wisdom,
            "charisma": stats.charisma
        }

        # Find lowest stats
        sorted_stats = sorted(stat_values.items(), key=lambda x: x[1])
        needs["stat_deficiencies"] = [stat[0] for stat in sorted_stats[:2]]

        # Check equipment gaps
        equipped = self.character.equipped_items
        all_slots = [slot.value for slot in EquipmentSlot]
        needs["equipment_gaps"] = [slot for slot in all_slots if slot not in equipped]

        # Story relevance based on recent actions
        recent_actions = [entry.text for entry in self.session.story[-3:]
                         if entry.type.value == "action"]
        if any("magic" in action.lower() for action in recent_actions):
            needs["story_relevance"].append("magical")
        if any("combat" in action.lower() or "fight" in action.lower() for action in recent_actions):
            needs["story_relevance"].append("combat")
        if any("explore" in action.lower() for action in recent_actions):
            needs["story_relevance"].append("exploration")

        return needs

    def to_dict(self) -> Dict[str, Any]:
        return {
            "character_name": self.character.name,
            "character_level": self.character.level,
            "character_class": self.character.class_name,
            "current_location": self.world_state.current_location,
            "item_type": self.item_type,
            "trigger_context": self.trigger_context,
            "character_needs": self.character_needs,
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }


class DynamicItemManager:
    """AI-driven item generation and effect calculation"""

    def __init__(self):
        self.generated_items: Dict[str, Item] = {}

    async def generate_contextual_item(self, context: ItemGenerationContext) -> Item:
        """Generate AI-driven item based on context"""
        try:
            logger.info(f"Generating contextual item for {context.character.name}")

            # Build comprehensive prompt for item generation
            prompt = await self._build_item_generation_prompt(context)

            # Generate AI response
            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction=self._get_item_master_instruction(context),
                temperature=0.7,
                max_output_tokens=500,
                response_format="json"
            )

            # Parse and structure the response
            item = await self._parse_item_response(ai_response, context)

            # Store generated item
            self.generated_items[item.id] = item

            logger.info(f"Generated item: {item.name}")
            return item

        except Exception as e:
            logger.error(f"Error generating contextual item: {str(e)}")
            return await self._create_fallback_item(context)

    async def _build_item_generation_prompt(self, context: ItemGenerationContext) -> str:
        """Build comprehensive prompt for item generation"""

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
        Stat Deficiencies: {context.character_needs["stat_deficiencies"]}
        Equipment Gaps: {context.character_needs["equipment_gaps"]}
        Story Relevance: {context.character_needs["story_relevance"]}
        """

        # Context for item generation
        generation_context = f"""
        Item Type Requested: {context.item_type}
        Trigger Context: {context.trigger_context}
        Recent Story: {[entry.text for entry in context.session.story[-2:]] if context.session.story else ['Beginning of adventure']}
        """

        prompt = f"""
        {world_context}

        {character_context}

        {generation_context}

        As the Item Master, generate a contextual item that:
        1. Fits naturally into the current world and story context
        2. Is appropriate for the character's level and needs
        3. Has meaningful effects that serve the narrative
        4. Feels earned and logical given the circumstances
        5. Enhances the storytelling experience

        Consider:
        - What kind of item would naturally be found in this situation?
        - How can this item address the character's needs or story development?
        - What effects would be balanced and meaningful for this character level?
        - How does this item connect to the world's lore and power system?
        - What narrative significance could this item have?

        Generate an item that serves both mechanical and narrative purposes.

        Respond in JSON format:
        {{
            "name": "engaging item name",
            "description": "detailed item description that explains its appearance and significance",
            "item_type": "weapon/armor/accessory/consumable/tool/magical",
            "rarity": "common/uncommon/rare/epic/legendary",
            "equipment_slot": "weapon/armor/accessory/none",
            "effects": {{
                "stat_bonuses": {{"strength": 0, "dexterity": 0, "intelligence": 0, "constitution": 0, "wisdom": 0, "charisma": 0}},
                "special_abilities": ["list of special abilities"],
                "passive_effects": ["ongoing effects"],
                "active_abilities": ["abilities that can be activated"]
            }},
            "lore_significance": "how this item connects to the world and story",
            "usage_requirements": ["requirements to use this item"],
            "narrative_impact": "how this item might affect future story development",
            "confidence_score": 0.85
        }}
        """

        return prompt

    def _get_item_master_instruction(self, context: ItemGenerationContext) -> str:
        """Get system instruction for item generation AI"""
        world_title = context.lorebook.series_metadata.title if context.lorebook else "a fantasy world"

        return f"""You are the Item Master for {world_title}, responsible for creating
        meaningful, contextual items that enhance both gameplay and storytelling. Your role is to:

        1. Generate items that feel natural and earned within the story context
        2. Create balanced effects that serve character development
        3. Ensure items connect meaningfully to the world's lore and power system
        4. Balance mechanical benefits with narrative significance
        5. Maintain consistency with the established world and character progression

        Focus on items that enhance the storytelling experience and feel authentic to the world.
        Always respond with valid JSON format."""

    async def _parse_item_response(self, ai_response: str, context: ItemGenerationContext) -> Item:
        """Parse AI response into structured Item object"""
        try:
            import json
            response_data = json.loads(ai_response)

            # Create item with AI-generated data
            item_id = str(uuid.uuid4())

            # Determine equipment slot
            equipment_slot = None
            slot_mapping = {
                "weapon": EquipmentSlot.WEAPON,
                "helmet": EquipmentSlot.HELMET,
                "chest": EquipmentSlot.CHEST,
                "legs": EquipmentSlot.LEGS,
                "boots": EquipmentSlot.BOOTS,
                "gloves": EquipmentSlot.GLOVES,
                "ring": EquipmentSlot.RING,
                "necklace": EquipmentSlot.NECKLACE,
                "shield": EquipmentSlot.SHIELD
            }

            slot_str = response_data.get("equipment_slot", "none")
            if slot_str in slot_mapping:
                equipment_slot = slot_mapping[slot_str]

            item = Item(
                id=item_id,
                name=response_data.get("name", "Mysterious Item"),
                description=response_data.get("description", "An item of unknown origin."),
                item_type=response_data.get("item_type", "tool"),
                rarity=response_data.get("rarity", "common"),
                equipment_slot=equipment_slot,
                effects=response_data.get("effects", {}),
                metadata={
                    "lore_significance": response_data.get("lore_significance", ""),
                    "usage_requirements": response_data.get("usage_requirements", []),
                    "narrative_impact": response_data.get("narrative_impact", ""),
                    "generation_method": "ai_contextual",
                    "generated_at": datetime.now().isoformat(),
                    "character_level": context.character.level,
                    "location": context.world_state.current_location,
                    "confidence_score": response_data.get("confidence_score", 0.7),
                    "trigger_context": context.trigger_context
                }
            )

            return item

        except Exception as e:
            logger.error(f"Error parsing item response: {str(e)}")
            return await self._create_fallback_item(context)

    async def _create_fallback_item(self, context: ItemGenerationContext) -> Item:
        """Create fallback item when AI generation fails"""
        character = context.character

        # Create contextual fallback based on character needs
        needs = context.character_needs

        # Determine item type based on needs
        if "weapon" in needs["equipment_gaps"]:
            item_type = "weapon"
            name = f"Sturdy {character.class_name} Weapon"
            description = f"A reliable weapon suited for a {character.class_name}."
            equipment_slot = EquipmentSlot.WEAPON
            effects = {
                "stat_bonuses": {"strength": 1, "dexterity": 1},
                "special_abilities": ["Basic Attack Enhancement"],
                "passive_effects": [],
                "active_abilities": []
            }
        elif "chest" in needs["equipment_gaps"]:
            item_type = "armor"
            name = f"Protective {character.class_name} Chest Armor"
            description = f"Chest armor designed for a {character.class_name}'s protection."
            equipment_slot = EquipmentSlot.CHEST
            effects = {
                "stat_bonuses": {"constitution": 1, "dexterity": 1},
                "special_abilities": ["Basic Protection"],
                "passive_effects": ["Damage Reduction"],
                "active_abilities": []
            }
        elif "ring" in needs["equipment_gaps"]:
            item_type = "accessory"
            name = f"Traveler's {needs['stat_deficiencies'][0].title()} Ring"
            description = f"A ring that enhances {needs['stat_deficiencies'][0]}."
            equipment_slot = EquipmentSlot.RING
            effects = {
                "stat_bonuses": {needs['stat_deficiencies'][0]: 2},
                "special_abilities": [f"Enhanced {needs['stat_deficiencies'][0].title()}"],
                "passive_effects": [],
                "active_abilities": []
            }
        else:
            item_type = "accessory"
            name = f"Traveler's {needs['stat_deficiencies'][0].title()} Necklace"
            description = f"A necklace that enhances {needs['stat_deficiencies'][0]}."
            equipment_slot = EquipmentSlot.NECKLACE
            effects = {
                "stat_bonuses": {needs['stat_deficiencies'][0]: 2},
                "special_abilities": [f"Enhanced {needs['stat_deficiencies'][0].title()}"],
                "passive_effects": [],
                "active_abilities": []
            }

        item_id = str(uuid.uuid4())

        item = Item(
            id=item_id,
            name=name,
            description=description,
            item_type=item_type,
            rarity="common",
            equipment_slot=equipment_slot,
            effects=effects,
            metadata={
                "generation_method": "fallback_contextual",
                "generated_at": datetime.now().isoformat(),
                "character_level": character.level,
                "location": context.world_state.current_location
            }
        )

        return item

    async def calculate_item_effects(self, item: Item, character: Character,
                                   action_context: str = "") -> Dict[str, Any]:
        """Calculate AI-driven item effects based on context"""
        try:
            # Get base effects from item
            base_effects = item.effects or {}

            # Use AI to determine contextual effectiveness
            prompt = f"""
            Character {character.name} (Level {character.level}, {character.class_name}) is using:
            Item: {item.name}
            Description: {item.description}
            Base Effects: {base_effects}

            Action Context: {action_context}

            Calculate the actual effectiveness of this item in the current context.
            Consider:
            1. Character's level and class compatibility
            2. Current action being performed
            3. Item's intended purpose vs actual use
            4. Narrative appropriateness

            Respond in JSON format:
            {{
                "effectiveness_multiplier": 1.0,
                "contextual_bonuses": {{"stat": "bonus_value"}},
                "special_activations": ["abilities that activate in this context"],
                "narrative_effects": ["story-relevant effects"],
                "usage_notes": "how the item performs in this situation"
            }}
            """

            ai_response = await gemini_client.generate_text(
                prompt,
                system_instruction="You are an Item Effects Calculator. Determine contextual item effectiveness based on usage situation.",
                temperature=0.5,
                max_output_tokens=300,
                response_format="json"
            )

            import json
            effect_data = json.loads(ai_response)

            # Apply effectiveness multiplier to base effects
            final_effects = {}
            multiplier = effect_data.get("effectiveness_multiplier", 1.0)

            if "stat_bonuses" in base_effects:
                final_effects["stat_bonuses"] = {
                    stat: int(bonus * multiplier)
                    for stat, bonus in base_effects["stat_bonuses"].items()
                }

            # Add contextual bonuses
            contextual_bonuses = effect_data.get("contextual_bonuses", {})
            if contextual_bonuses:
                if "stat_bonuses" not in final_effects:
                    final_effects["stat_bonuses"] = {}
                for stat, bonus in contextual_bonuses.items():
                    final_effects["stat_bonuses"][stat] = final_effects["stat_bonuses"].get(stat, 0) + bonus

            # Add special activations and narrative effects
            final_effects["special_activations"] = effect_data.get("special_activations", [])
            final_effects["narrative_effects"] = effect_data.get("narrative_effects", [])
            final_effects["usage_notes"] = effect_data.get("usage_notes", "")

            return final_effects

        except Exception as e:
            logger.error(f"Error calculating item effects: {str(e)}")
            # Return base effects as fallback
            return item.effects or {}

    async def generate_loot_for_context(self, context: ItemGenerationContext,
                                      loot_count: int = 1) -> List[Item]:
        """Generate multiple contextual items for loot drops"""
        items = []

        for i in range(loot_count):
            # Vary item types for diverse loot
            item_types = ["weapon", "armor", "accessory", "consumable", "tool"]
            context.item_type = item_types[i % len(item_types)]
            context.trigger_context = f"Loot discovery {i+1}/{loot_count}"

            item = await self.generate_contextual_item(context)
            items.append(item)

        return items


# Global instance
dynamic_item_manager = DynamicItemManager()
