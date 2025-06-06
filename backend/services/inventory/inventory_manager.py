"""
Inventory Management Service
Handles item management, equipment, and loot generation
"""

import logging
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from models.game_models import Character, InventoryItem, GameSession
from models.scenario_models import Lorebook
from utils.exceptions import (
    ItemNotFoundError, InvalidEquipmentSlotError,
    InsufficientCarryCapacityError, InvalidItemQuantityError, ValidationError
)

# Import AI-driven systems
from services.ai.dynamic_item_manager import dynamic_item_manager, ItemGenerationContext

logger = logging.getLogger(__name__)


class InventoryUpdate:
    """Result of inventory modification"""
    def __init__(self, success: bool, item: Optional[InventoryItem] = None,
                 message: str = "", inventory: Optional[List[InventoryItem]] = None):
        self.success = success
        self.item = item
        self.message = message
        self.inventory = inventory or []
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "item": self.item.model_dump() if self.item else None,
            "message": self.message,
            "inventory": [item.model_dump() for item in self.inventory],
            "timestamp": self.timestamp.isoformat()
        }


class EquipmentUpdate:
    """Result of equipment change"""
    def __init__(self, success: bool, equipped_item: Optional[InventoryItem] = None,
                 unequipped_item: Optional[InventoryItem] = None, message: str = ""):
        self.success = success
        self.equipped_item = equipped_item
        self.unequipped_item = unequipped_item
        self.message = message
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "equipped_item": self.equipped_item.model_dump() if self.equipped_item else None,
            "unequipped_item": self.unequipped_item.model_dump() if self.unequipped_item else None,
            "message": self.message,
            "timestamp": self.timestamp.isoformat()
        }


class ItemUseResult:
    """Result of using an item"""
    def __init__(self, success: bool, item: Optional[InventoryItem] = None,
                 effects: Optional[Dict[str, Any]] = None, message: str = "",
                 item_consumed: bool = False):
        self.success = success
        self.item = item
        self.effects = effects or {}
        self.message = message
        self.item_consumed = item_consumed
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "item": self.item.model_dump() if self.item else None,
            "effects": self.effects,
            "message": self.message,
            "item_consumed": self.item_consumed,
            "timestamp": self.timestamp.isoformat()
        }


class LootContext:
    """Context for loot generation"""
    def __init__(self, character_level: int, location: str, encounter_type: str,
                 difficulty: int = 1, special_conditions: Optional[List[str]] = None):
        self.character_level = character_level
        self.location = location
        self.encounter_type = encounter_type  # combat, exploration, quest, treasure
        self.difficulty = difficulty
        self.special_conditions = special_conditions or []
        self.rarity_bonus = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "character_level": self.character_level,
            "location": self.location,
            "encounter_type": self.encounter_type,
            "difficulty": self.difficulty,
            "special_conditions": self.special_conditions,
            "rarity_bonus": self.rarity_bonus
        }





class InventoryManager:
    """Manages character inventory, equipment, and item interactions"""

    def __init__(self):
        # AI-driven rarity weights for dynamic item generation
        self.rarity_weights = {
            "common": 50,
            "uncommon": 30,
            "rare": 15,
            "epic": 4,
            "legendary": 1
        }
        logger.info("InventoryManager initialized with AI-driven item generation")

    async def add_item(self, session_id: str, item: InventoryItem,
                      inventory: List[InventoryItem], character: Character) -> InventoryUpdate:
        """Add item to inventory with weight validation"""
        try:
            # Validate item quantity
            if item.quantity <= 0:
                raise InvalidItemQuantityError("Item quantity must be positive")

            # Check carry capacity
            current_weight = self._calculate_total_weight(inventory)
            if current_weight + (item.weight * item.quantity) > character.max_carry_weight:
                raise InsufficientCarryCapacityError(
                    f"Cannot carry {item.name} - would exceed carry capacity"
                )

            # Check if item already exists and is stackable
            existing_item = self._find_stackable_item(inventory, item)

            if existing_item:
                # Stack the item
                existing_item.quantity += item.quantity
                message = f"Added {item.quantity} {item.name}(s) to inventory (total: {existing_item.quantity})"
                logger.info(f"Stacked item {item.name} in session {session_id}")
                return InventoryUpdate(True, existing_item, message, inventory)
            else:
                # Add new item
                inventory.append(item)
                message = f"Added {item.name} to inventory"
                logger.info(f"Added new item {item.name} to session {session_id}")
                return InventoryUpdate(True, item, message, inventory)

        except (InvalidItemQuantityError, InsufficientCarryCapacityError) as e:
            logger.warning(f"Item validation failed: {str(e)}")
            return InventoryUpdate(False, None, str(e), inventory)
        except Exception as e:
            logger.error(f"Error adding item to inventory: {str(e)}")
            return InventoryUpdate(False, None, f"Failed to add item: {str(e)}", inventory)

    def _calculate_total_weight(self, inventory: List[InventoryItem]) -> float:
        """Calculate total weight of inventory"""
        return sum(item.weight * item.quantity for item in inventory)

    def _find_stackable_item(self, inventory: List[InventoryItem], new_item: InventoryItem) -> Optional[InventoryItem]:
        """Find existing stackable item in inventory"""
        for item in inventory:
            if (item.name == new_item.name and
                item.type == new_item.type and
                item.rarity == new_item.rarity and
                not item.equipped):
                return item
        return None

    async def remove_item(self, session_id: str, item_id: str,
                         inventory: List[InventoryItem], quantity: int = 1) -> InventoryUpdate:
        """Remove item from inventory"""
        try:
            item_to_remove = None
            for item in inventory:
                if item.id == item_id:
                    item_to_remove = item
                    break

            if not item_to_remove:
                return InventoryUpdate(False, None, "Item not found in inventory", inventory)

            # Check if item is equipped
            if item_to_remove.equipped:
                return InventoryUpdate(False, None, "Cannot remove equipped item", inventory)

            # Handle quantity
            if item_to_remove.quantity > quantity:
                item_to_remove.quantity -= quantity
                message = f"Removed {quantity} {item_to_remove.name}(s) from inventory"
                return InventoryUpdate(True, item_to_remove, message, inventory)
            else:
                # Remove entire item
                inventory.remove(item_to_remove)
                message = f"Removed {item_to_remove.name} from inventory"
                logger.info(f"Removed item {item_to_remove.name} from session {session_id}")
                return InventoryUpdate(True, item_to_remove, message, inventory)

        except Exception as e:
            logger.error(f"Error removing item from inventory: {str(e)}")
            return InventoryUpdate(False, None, f"Failed to remove item: {str(e)}", inventory)

    async def equip_item(self, session_id: str, item_id: str,
                        inventory: List[InventoryItem], character: Character) -> EquipmentUpdate:
        """Equip an item with proper slot validation"""
        try:
            item_to_equip = None
            for item in inventory:
                if item.id == item_id:
                    item_to_equip = item
                    break

            if not item_to_equip:
                raise ItemNotFoundError("Item not found in inventory")

            # Check if item has an equipment slot
            if not item_to_equip.equipment_slot:
                raise InvalidEquipmentSlotError("Item cannot be equipped")

            # Check if slot is already occupied
            if item_to_equip.equipment_slot in character.equipped_items:
                currently_equipped_id = character.equipped_items[item_to_equip.equipment_slot]
                currently_equipped = None
                for item in inventory:
                    if item.id == currently_equipped_id:
                        currently_equipped = item
                        break

                if currently_equipped:
                    # Unequip current item
                    currently_equipped.equipped = False
                    del character.equipped_items[item_to_equip.equipment_slot]
            else:
                currently_equipped = None

            # Equip new item
            item_to_equip.equipped = True
            character.equipped_items[item_to_equip.equipment_slot] = item_to_equip.id

            message = f"Equipped {item_to_equip.name} in {item_to_equip.equipment_slot.value} slot"
            if currently_equipped:
                message += f" (unequipped {currently_equipped.name})"

            logger.info(f"Equipped {item_to_equip.name} in session {session_id}")
            return EquipmentUpdate(True, item_to_equip, currently_equipped, message)

        except (ItemNotFoundError, InvalidEquipmentSlotError) as e:
            logger.warning(f"Equipment validation failed: {str(e)}")
            return EquipmentUpdate(False, None, None, str(e))
        except Exception as e:
            logger.error(f"Error equipping item: {str(e)}")
            return EquipmentUpdate(False, None, None, f"Failed to equip item: {str(e)}")

    async def use_item(self, session_id: str, item_id: str,
                      inventory: List[InventoryItem], character: Character) -> ItemUseResult:
        """Use a consumable item"""
        try:
            item_to_use = None
            for item in inventory:
                if item.id == item_id:
                    item_to_use = item
                    break

            if not item_to_use:
                return ItemUseResult(False, None, {}, "Item not found in inventory")

            # Check if item is usable
            if item_to_use.type != "consumable":
                return ItemUseResult(False, None, {}, "Item is not consumable")

            # Apply item effects
            effects = await self._apply_item_effects(item_to_use, character)

            # Handle item consumption
            item_consumed = False
            if item_to_use.quantity > 1:
                item_to_use.quantity -= 1
            else:
                inventory.remove(item_to_use)
                item_consumed = True

            message = f"Used {item_to_use.name}. {effects.get('message', '')}"
            logger.info(f"Used item {item_to_use.name} in session {session_id}")

            return ItemUseResult(True, item_to_use, effects, message, item_consumed)

        except Exception as e:
            logger.error(f"Error using item: {str(e)}")
            return ItemUseResult(False, None, {}, f"Failed to use item: {str(e)}")

    async def _apply_item_effects(self, item: InventoryItem, character: Character) -> Dict[str, Any]:
        """Apply effects of using an item with validation"""
        effects = {}
        metadata = item.metadata or {}

        try:
            # Health potion
            if "heal_amount" in metadata:
                heal_amount = metadata["heal_amount"]
                if not isinstance(heal_amount, (int, float)) or heal_amount <= 0:
                    raise ValidationError("Invalid heal amount")

                old_health = character.health
                character.health = min(character.max_health, character.health + int(heal_amount))
                actual_heal = character.health - old_health
                effects["health_restored"] = actual_heal
                effects["message"] = f"Restored {actual_heal} health"

            # Mana potion
            if "mana_amount" in metadata:
                mana_amount = metadata["mana_amount"]
                if not isinstance(mana_amount, (int, float)) or mana_amount <= 0:
                    raise ValidationError("Invalid mana amount")

                old_mana = character.mana
                character.mana = min(character.max_mana, character.mana + int(mana_amount))
                actual_mana = character.mana - old_mana
                effects["mana_restored"] = actual_mana
                effects["message"] = f"Restored {actual_mana} mana"

            # Stat buffs
            if "stat_buffs" in metadata:
                buffs = metadata["stat_buffs"]
                if not isinstance(buffs, dict):
                    raise ValidationError("Invalid stat buffs format")

                effects["stat_buffs"] = buffs
                effects["message"] = "Applied temporary stat bonuses"

            # Special effects
            if "special_effect" in metadata:
                effect = metadata["special_effect"]
                if not isinstance(effect, str):
                    raise ValidationError("Invalid special effect format")

                effects["special_effect"] = effect
                effects["message"] = f"Activated {effect}"

            return effects

        except ValidationError as e:
            logger.warning(f"Item effect validation failed: {str(e)}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error applying item effects: {str(e)}")
            return {"error": str(e)}

    async def generate_loot(self, context: LootContext, session: Optional[GameSession] = None,
                           lorebook: Optional[Lorebook] = None) -> List[InventoryItem]:
        """Generate AI-driven loot based on context"""
        try:
            # Try AI-driven loot generation first
            if session:
                ai_items = await self._generate_ai_loot(context, session, lorebook)
                if ai_items:
                    return ai_items

            # Fallback to template-based generation
            return await self._generate_template_loot(context)

        except Exception as e:
            logger.error(f"Error generating loot: {str(e)}")
            return []

    async def _generate_ai_loot(self, context: LootContext, session: GameSession,
                               lorebook: Optional[Lorebook] = None) -> List[InventoryItem]:
        """Generate loot using AI-driven item manager"""
        try:
            # Create AI item generation context
            item_context = ItemGenerationContext(
                session,
                context.encounter_type,
                lorebook,
                f"Loot from {context.encounter_type} encounter at {context.location}"
            )

            # Determine number of items
            num_items = self._calculate_loot_quantity(context)

            # Generate AI items
            ai_items = await dynamic_item_manager.generate_loot_for_context(item_context, num_items)

            # Convert AI items to InventoryItems
            inventory_items = []
            for ai_item in ai_items:
                inventory_item = self._convert_ai_item_to_inventory(ai_item)
                inventory_items.append(inventory_item)

            logger.info(f"Generated {len(inventory_items)} AI-driven loot items for level {context.character_level}")
            return inventory_items

        except Exception as e:
            logger.error(f"Error generating AI loot: {str(e)}")
            return []

    def _convert_ai_item_to_inventory(self, ai_item) -> InventoryItem:
        """Convert AI-generated Item to InventoryItem"""
        # Extract stats from AI item effects
        stats = {}
        if ai_item.effects:
            if "stat_bonuses" in ai_item.effects:
                stats.update(ai_item.effects["stat_bonuses"])
            if "special_abilities" in ai_item.effects:
                stats["special_abilities"] = ai_item.effects["special_abilities"]
            if "passive_effects" in ai_item.effects:
                stats["passive_effects"] = ai_item.effects["passive_effects"]

        return InventoryItem(
            id=ai_item.id,
            name=ai_item.name,
            type=ai_item.item_type,
            rarity=ai_item.rarity,
            description=ai_item.description,
            quantity=1,
            equipped=False,
            equipment_slot=ai_item.equipment_slot,
            weight=1.0,  # Default weight
            metadata={
                "ai_generated": True,
                "effects": ai_item.effects,
                "stats": stats,
                "generated_at": datetime.now().isoformat()
            }
        )

    async def _generate_template_loot(self, context: LootContext) -> List[InventoryItem]:
        """Fallback AI-driven loot generation when full AI generation fails"""
        try:
            loot_items = []
            num_items = self._calculate_loot_quantity(context)

            for _ in range(num_items):
                rarity = self._select_rarity(context)
                item = await self._generate_basic_item_by_rarity(rarity, context)
                if item:
                    loot_items.append(item)

            logger.info(f"Generated {len(loot_items)} fallback loot items for level {context.character_level}")
            return loot_items

        except Exception as e:
            logger.error(f"Error generating fallback loot: {str(e)}")
            return []

    def _calculate_loot_quantity(self, context: LootContext) -> int:
        """Calculate number of loot items to generate"""
        base_quantity = 1

        # Bonus items based on difficulty
        difficulty_bonus = context.difficulty - 1

        # Encounter type modifiers
        encounter_modifiers = {
            "combat": 1,
            "exploration": 0,
            "quest": 1,
            "treasure": 2
        }

        encounter_bonus = encounter_modifiers.get(context.encounter_type, 0)

        # Random factor
        random_bonus = random.randint(0, 1) if random.random() < 0.3 else 0

        total = base_quantity + difficulty_bonus + encounter_bonus + random_bonus
        return max(1, min(5, total))  # Clamp between 1 and 5

    def _select_rarity(self, context: LootContext) -> str:
        """Select item rarity based on context"""
        # Adjust weights based on character level
        level_modifier = context.character_level / 20.0  # Scale to 0-1

        adjusted_weights = {}
        for rarity, weight in self.rarity_weights.items():
            if rarity == "common":
                adjusted_weights[rarity] = max(10, weight - (level_modifier * 30))
            elif rarity == "uncommon":
                adjusted_weights[rarity] = weight + (level_modifier * 10)
            elif rarity == "rare":
                adjusted_weights[rarity] = weight + (level_modifier * 10)
            elif rarity == "epic":
                adjusted_weights[rarity] = weight + (level_modifier * 5)
            elif rarity == "legendary":
                adjusted_weights[rarity] = weight + (level_modifier * 2)

        # Apply difficulty bonus
        if context.difficulty > 3:
            adjusted_weights["rare"] *= 1.5
            adjusted_weights["epic"] *= 2
            adjusted_weights["legendary"] *= 2

        # Select rarity
        total_weight = sum(adjusted_weights.values())
        rand_value = random.uniform(0, total_weight)

        current_weight = 0
        for rarity, weight in adjusted_weights.items():
            current_weight += weight
            if rand_value <= current_weight:
                return rarity

        return "common"  # Fallback

    async def _generate_basic_item_by_rarity(self, rarity: str, context: LootContext) -> Optional[InventoryItem]:
        """Generate a basic item of specific rarity as fallback"""
        try:
            # Define basic item types by rarity
            item_types_by_rarity = {
                "common": ["consumable", "misc"],
                "uncommon": ["weapon", "armor", "consumable"],
                "rare": ["weapon", "armor", "misc"],
                "epic": ["weapon", "armor"],
                "legendary": ["weapon", "armor", "misc"]
            }

            item_types = item_types_by_rarity.get(rarity, ["misc"])
            item_type = random.choice(item_types)

            # Generate basic item
            item = await self._create_basic_item(item_type, rarity, context)
            return item

        except Exception as e:
            logger.error(f"Error generating basic item by rarity: {str(e)}")
            return None

    async def _create_basic_item(self, item_type: str, rarity: str, context: LootContext) -> InventoryItem:
        """Create a basic item as fallback when AI generation fails"""
        try:
            # Basic item names by type and rarity
            item_names = {
                "weapon": {
                    "common": ["Iron Sword", "Wooden Staff", "Simple Bow"],
                    "uncommon": ["Steel Blade", "Magic Wand", "Composite Bow"],
                    "rare": ["Enchanted Sword", "Crystal Staff", "Elven Bow"],
                    "epic": ["Legendary Blade", "Arcane Staff", "Dragon Bow"],
                    "legendary": ["Mythic Weapon", "Divine Staff", "Celestial Bow"]
                },
                "armor": {
                    "common": ["Leather Armor", "Cloth Robes", "Simple Shield"],
                    "uncommon": ["Chain Mail", "Reinforced Robes", "Iron Shield"],
                    "rare": ["Plate Armor", "Enchanted Robes", "Magic Shield"],
                    "epic": ["Dragon Scale Armor", "Arcane Vestments", "Tower Shield"],
                    "legendary": ["Divine Armor", "Celestial Robes", "Aegis Shield"]
                },
                "consumable": {
                    "common": ["Health Potion", "Mana Potion", "Bread"],
                    "uncommon": ["Greater Health Potion", "Greater Mana Potion", "Magic Food"],
                    "rare": ["Superior Healing", "Elixir of Power", "Ambrosia"],
                    "epic": ["Legendary Potion", "Divine Elixir", "Nectar"],
                    "legendary": ["Potion of Immortality", "Divine Essence", "Amrita"]
                },
                "misc": {
                    "common": ["Copper Coin", "Simple Gem", "Basic Tool"],
                    "uncommon": ["Silver Coin", "Precious Gem", "Quality Tool"],
                    "rare": ["Gold Coin", "Rare Crystal", "Masterwork Tool"],
                    "epic": ["Platinum Coin", "Magic Crystal", "Legendary Tool"],
                    "legendary": ["Ancient Artifact", "Divine Crystal", "Relic"]
                }
            }

            names = item_names.get(item_type, {}).get(rarity, ["Unknown Item"])
            item_name = random.choice(names)

            # Create basic item
            item = InventoryItem(
                id=str(uuid.uuid4()),
                name=item_name,
                type=item_type,
                rarity=rarity,
                description=f"A {rarity} {item_type} found during your adventure.",
                quantity=1,
                equipped=False,
                metadata={
                    "fallback_generated": True,
                    "level": context.character_level,
                    "generated_at": datetime.now().isoformat(),
                    "location_found": context.location
                }
            )

            return item

        except Exception as e:
            logger.error(f"Error creating basic item: {str(e)}")
            # Return absolute fallback
            return InventoryItem(
                id=str(uuid.uuid4()),
                name="Mysterious Item",
                type="misc",
                rarity="common",
                description="A mysterious item of unknown origin.",
                quantity=1
            )



    def get_equipped_items(self, inventory: List[InventoryItem]) -> List[InventoryItem]:
        """Get all equipped items from inventory"""
        return [item for item in inventory if item.equipped]

    def get_items_by_type(self, inventory: List[InventoryItem], item_type: str) -> List[InventoryItem]:
        """Get all items of specific type from inventory"""
        return [item for item in inventory if item.type == item_type]

    def calculate_inventory_value(self, inventory: List[InventoryItem]) -> int:
        """Calculate total value of inventory"""
        total_value = 0
        for item in inventory:
            item_value = item.metadata.get("value", 0) if item.metadata else 0
            if not item_value:
                # Estimate value based on rarity and stats
                rarity_values = {"common": 10, "uncommon": 25, "rare": 50, "epic": 100, "legendary": 200}
                item_value = rarity_values.get(item.rarity, 10)

            total_value += item_value * item.quantity

        return total_value

    def get_inventory_summary(self, inventory: List[InventoryItem]) -> Dict[str, Any]:
        """Get summary statistics of inventory"""
        summary = {
            "total_items": len(inventory),
            "total_quantity": sum(item.quantity for item in inventory),
            "equipped_items": len([item for item in inventory if item.equipped]),
            "by_type": {},
            "by_rarity": {},
            "total_value": self.calculate_inventory_value(inventory)
        }

        # Count by type
        for item in inventory:
            summary["by_type"][item.type] = summary["by_type"].get(item.type, 0) + item.quantity

        # Count by rarity
        for item in inventory:
            summary["by_rarity"][item.rarity] = summary["by_rarity"].get(item.rarity, 0) + item.quantity

        return summary


# Global inventory manager instance
inventory_manager = InventoryManager()
