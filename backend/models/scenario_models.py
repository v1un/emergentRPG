from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SeriesType(str, Enum):
    ANIME = "anime"
    MANGA = "manga"
    GAME = "game"
    NOVEL = "novel"
    MOVIE = "movie"
    TV_SHOW = "tv_show"
    BOOK = "book"
    COMIC = "comic"


class GenerationStatus(str, Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


class SeriesMetadata(BaseModel):
    title: str
    type: SeriesType
    genre: List[str] = Field(default_factory=list)
    themes: List[str] = Field(default_factory=list)
    setting: str = ""
    tone: str = ""
    power_system: Optional[str] = None
    time_period: Optional[str] = None
    source_urls: List[str] = Field(default_factory=list)
    confidence_score: float = Field(ge=0, le=1, default=0.0)


class LoreCharacter(BaseModel):
    """Character model for lorebook/scenario generation - distinct from game Character"""
    name: str
    role: str  # protagonist, antagonist, supporting, etc.
    description: str
    personality: List[str] = Field(default_factory=list)
    abilities: List[str] = Field(default_factory=list)
    relationships: Dict[str, str] = Field(default_factory=dict)
    background: str = ""
    goals: List[str] = Field(default_factory=list)
    speech_patterns: List[str] = Field(default_factory=list)


class Location(BaseModel):
    name: str
    type: str  # city, dungeon, forest, etc.
    description: str
    notable_features: List[str] = Field(default_factory=list)
    inhabitants: List[str] = Field(default_factory=list)
    connected_locations: List[str] = Field(default_factory=list)
    atmosphere: str = ""
    dangers: List[str] = Field(default_factory=list)


class WorldSystem(BaseModel):
    name: str
    type: str  # magic, political, economic, etc.
    description: str
    rules: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    key_figures: List[str] = Field(default_factory=list)
    historical_events: List[str] = Field(default_factory=list)


class Lorebook(BaseModel):
    id: str
    series_metadata: SeriesMetadata
    characters: List[LoreCharacter] = Field(default_factory=list)
    locations: List[Location] = Field(default_factory=list)
    world_systems: List[WorldSystem] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    plot_summary: str = ""
    key_events: List[str] = Field(default_factory=list)
    important_items: List[Dict[str, Any]] = Field(default_factory=list)
    factions: List[Dict[str, Any]] = Field(default_factory=list)
    generation_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ScenarioTemplate(BaseModel):
    id: str
    title: str
    description: str
    lorebook_id: str
    setting_location: str
    time_period: str
    starting_situation: str
    key_characters: List[str] = Field(default_factory=list)
    playable_characters: List[Dict[str, Any]] = Field(default_factory=list)
    available_paths: List[str] = Field(default_factory=list)
    difficulty_level: str = "medium"
    estimated_duration: str = "2-4 hours"
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)


class GenerationRequest(BaseModel):
    series_title: str
    series_type: SeriesType
    additional_context: Optional[str] = None
    user_preferences: Optional[Dict[str, Any]] = None
    generation_options: Optional[Dict[str, Any]] = None


class GenerationTask(BaseModel):
    task_id: str
    request: GenerationRequest
    status: GenerationStatus = GenerationStatus.PENDING
    progress: float = Field(ge=0, le=1, default=0.0)
    current_step: str = ""
    result: Optional[Lorebook] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
