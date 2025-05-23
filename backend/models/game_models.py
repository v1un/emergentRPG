from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class ActionType(str, Enum):
    NARRATION = "narration"
    ACTION = "action"
    SYSTEM = "system"


class StoryEntry(BaseModel):
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


class Character(BaseModel):
    name: str
    level: int = Field(ge=1, default=1)
    health: int = Field(ge=0, default=100)
    max_health: int = Field(ge=1, default=100)
    mana: int = Field(ge=0, default=50)
    max_mana: int = Field(ge=1, default=50)
    experience: int = Field(ge=0, default=0)
    stats: CharacterStats = Field(default_factory=CharacterStats)
    class_name: Optional[str] = "Adventurer"
    background: Optional[str] = None


class InventoryItem(BaseModel):
    id: str
    name: str
    type: str  # weapon, armor, consumable, misc
    rarity: str = "common"  # common, uncommon, rare, epic, legendary
    description: Optional[str] = None
    quantity: int = Field(ge=1, default=1)
    equipped: bool = False
    metadata: Optional[Dict[str, Any]] = None


class Quest(BaseModel):
    id: str
    title: str
    description: str
    status: str = "active"  # active, completed, failed, hidden
    progress: str = "0/1"
    objectives: List[str] = Field(default_factory=list)
    rewards: Optional[Dict[str, Any]] = None
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
