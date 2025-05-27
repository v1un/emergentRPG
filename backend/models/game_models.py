import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ActionType(str, Enum):
    PLAYER = "player"
    NARRATION = "narration"
    ACTION = "action"
    SYSTEM = "system"


class StoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ActionType
    text: str
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Optional[Dict[str, Any]] = None


class CharacterStats(BaseModel):
    strength: int = Field(ge=1, le=20, default=10)
    dexterity: int = Field(ge=1, le=20, default=10)
    intelligence: int = Field(ge=1, le=20, default=10)
    constitution: int = Field(ge=1, le=20, default=10)
    wisdom: int = Field(ge=1, le=20, default=10)
    charisma: int = Field(ge=1, le=20, default=10)


class EquipmentSlot(str, Enum):
    """Equipment slot types"""
    WEAPON = "weapon"
    HELMET = "helmet"
    CHEST = "chest"
    LEGS = "legs"
    BOOTS = "boots"
    GLOVES = "gloves"
    RING = "ring"
    NECKLACE = "necklace"
    SHIELD = "shield"


class Character(BaseModel):
    name: str
    level: int = Field(ge=1, default=1)
    health: int = Field(ge=0, default=100)
    max_health: int = Field(ge=1, default=100)
    mana: int = Field(ge=0, default=50)
    max_mana: int = Field(ge=1, default=50)
    experience: int = Field(ge=0, default=0)
    stats: CharacterStats = Field(default_factory=CharacterStats)
    class_name: str = "Adventurer"  # Made required for consistency
    background: Optional[str] = None
    equipped_items: Dict[EquipmentSlot, str] = Field(default_factory=dict)  # slot -> item_id
    max_carry_weight: float = Field(default=100.0)  # Base carry capacity
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)  # For AI-driven character development

    @property
    def experience_to_next_level(self) -> int:
        """Calculate experience needed for next level"""
        return self.level * 100 - self.experience

    def can_level_up(self) -> bool:
        """Check if character can level up"""
        return self.experience >= self.level * 100


class Item(BaseModel):
    """Base item model for AI-generated items"""
    id: str
    name: str
    description: str
    item_type: str  # weapon, armor, consumable, tool, magical
    rarity: str = "common"  # common, uncommon, rare, epic, legendary
    equipment_slot: Optional[EquipmentSlot] = None
    effects: Optional[Dict[str, Any]] = None  # AI-generated effects
    metadata: Optional[Dict[str, Any]] = None


class InventoryItem(BaseModel):
    id: str
    name: str
    type: str  # weapon, armor, consumable, misc
    rarity: str = "common"  # common, uncommon, rare, epic, legendary
    description: Optional[str] = None
    quantity: int = Field(ge=1, default=1)
    equipped: bool = False
    equipment_slot: Optional[EquipmentSlot] = None  # Required for equippable items
    weight: float = Field(ge=0, default=1.0)  # Item weight for encumbrance
    durability: Optional[int] = None  # Item durability (None = indestructible)
    max_durability: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class QuestProgress(BaseModel):
    """Structured quest progress tracking"""
    current: int = 0
    total: int = 1
    completed_objectives: List[bool] = Field(default_factory=list)

    @property
    def percentage(self) -> float:
        """Calculate completion percentage"""
        if self.total == 0:
            return 100.0
        return (self.current / self.total) * 100.0

    @property
    def is_complete(self) -> bool:
        """Check if quest is complete"""
        return self.current >= self.total

    def __str__(self) -> str:
        """String representation for backward compatibility"""
        return f"{self.current}/{self.total}"


class QuestDependency(BaseModel):
    """Quest dependency definition"""
    quest_id: str
    required_status: str = "completed"  # completed, failed, active


class Quest(BaseModel):
    id: str
    title: str
    description: str
    status: str = "active"  # active, completed, failed, hidden
    progress: QuestProgress = Field(default_factory=QuestProgress)
    objectives: List[str] = Field(default_factory=list)
    rewards: Optional[Dict[str, Any]] = None
    dependencies: List[QuestDependency] = Field(default_factory=list)
    time_limit: Optional[int] = None  # Time limit in minutes
    failure_conditions: List[str] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None


class WorldState(BaseModel):
    current_location: str = "Unknown Location"
    time_of_day: str = "morning"
    weather: str = "clear"
    npcs_present: List[str] = Field(default_factory=list)
    available_actions: List[str] = Field(default_factory=list)
    environment_description: str = ""
    special_conditions: List[str] = Field(default_factory=list)


class GameSession(BaseModel):
    session_id: str
    character: Character
    inventory: List[InventoryItem] = Field(default_factory=list)
    quests: List[Quest] = Field(default_factory=list)
    story: List[StoryEntry] = Field(default_factory=list)
    world_state: WorldState = Field(default_factory=WorldState)
    scenario_id: Optional[str] = None
    lorebook_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: Optional[Dict[str, Any]] = None
