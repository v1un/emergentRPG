import os
import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    mongo_url: str
    database_name: str
    connection_pool_size: int = 10
    connection_timeout: int = 30

    def __post_init__(self):
        """Validate database configuration."""
        if not self.mongo_url:
            raise ValueError("MONGO_URL is required")
        if not self.database_name:
            raise ValueError("DATABASE_NAME is required")


@dataclass
class AIConfig:
    """AI service configuration settings."""
    google_api_key: Optional[str]
    gemini_model: str
    requests_per_minute: int = 60
    max_context_length: int = 32000
    temperature: float = 0.7
    max_output_tokens: int = 2048

    def __post_init__(self):
        """Validate AI configuration."""
        if not self.google_api_key:
            logger.warning("GOOGLE_API_KEY not set - AI features may not work")
        if self.requests_per_minute <= 0:
            raise ValueError("GEMINI_REQUESTS_PER_MINUTE must be positive")
        if self.max_context_length <= 0:
            raise ValueError("MAX_CONTEXT_LENGTH must be positive")


@dataclass
class APIConfig:
    """API server configuration settings."""
    cors_origins: List[str]
    debug: bool
    log_level: str
    host: str = "127.0.0.1"
    port: int = 8001

    def __post_init__(self):
        """Validate API configuration."""
        valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.log_level.upper() not in valid_log_levels:
            raise ValueError(f"LOG_LEVEL must be one of {valid_log_levels}")


@dataclass
class GameConfig:
    """Game-specific configuration settings."""
    max_story_length: int = 100
    auto_save_interval: int = 30
    max_inventory_size: int = 50
    default_character_health: int = 100
    default_character_mana: int = 50

    def __post_init__(self):
        """Validate game configuration."""
        if self.max_story_length <= 0:
            raise ValueError("MAX_STORY_LENGTH must be positive")
        if self.auto_save_interval <= 0:
            raise ValueError("AUTO_SAVE_INTERVAL must be positive")


@dataclass
class CacheConfig:
    """Cache configuration settings."""
    redis_enabled: bool
    redis_url: str
    memory_cache_size: int = 1000
    default_ttl: int = 300

    def __post_init__(self):
        """Validate cache configuration."""
        if self.redis_enabled and not self.redis_url:
            raise ValueError("REDIS_URL is required when Redis is enabled")


class Settings:
    """
    Centralized configuration management for emergentRPG backend.

    Provides validated configuration objects for different subsystems
    with proper error handling and environment variable parsing.
    """

    def __init__(self):
        """Initialize settings from environment variables."""
        self._load_configurations()
        self._validate_critical_settings()

    def _load_configurations(self):
        """Load all configuration sections."""
        # Database configuration
        self.database = DatabaseConfig(
            mongo_url=os.getenv("MONGO_URL", "mongodb://localhost:27017"),
            database_name=os.getenv("DATABASE_NAME", "ai_dungeon_db"),
            connection_pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            connection_timeout=int(os.getenv("DB_TIMEOUT", "30"))
        )

        # AI configuration
        self.ai = AIConfig(
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-preview-05-20"),
            requests_per_minute=int(os.getenv("GEMINI_REQUESTS_PER_MINUTE", "60")),
            max_context_length=int(os.getenv("MAX_CONTEXT_LENGTH", "32000")),
            temperature=float(os.getenv("AI_TEMPERATURE", "0.7")),
            max_output_tokens=int(os.getenv("AI_MAX_TOKENS", "2048"))
        )

        # API configuration
        self.api = APIConfig(
            cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
            debug=os.getenv("DEBUG", "True").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
            host=os.getenv("HOST", "127.0.0.1"),
            port=int(os.getenv("PORT", "8001"))
        )

        # Game configuration
        self.game = GameConfig(
            max_story_length=int(os.getenv("MAX_STORY_LENGTH", "100")),
            auto_save_interval=int(os.getenv("AUTO_SAVE_INTERVAL", "30")),
            max_inventory_size=int(os.getenv("MAX_INVENTORY_SIZE", "50")),
            default_character_health=int(os.getenv("DEFAULT_CHARACTER_HEALTH", "100")),
            default_character_mana=int(os.getenv("DEFAULT_CHARACTER_MANA", "50"))
        )

        # Cache configuration
        self.cache = CacheConfig(
            redis_enabled=os.getenv("REDIS_ENABLED", "false").lower() == "true",
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            memory_cache_size=int(os.getenv("MEMORY_CACHE_SIZE", "1000")),
            default_ttl=int(os.getenv("CACHE_TTL", "300"))
        )

        # Environment-specific configuration
        self.GENKIT_ENV = os.getenv("GENKIT_ENV", "dev")

    def _validate_critical_settings(self):
        """Validate critical settings that could break the application."""
        critical_issues = []

        # Check database connectivity requirements
        if not self.database.mongo_url:
            critical_issues.append("Database URL is not configured")

        # Check AI service requirements
        if not self.ai.google_api_key and not self.api.debug:
            critical_issues.append("Google API key is required for production")

        if critical_issues:
            error_msg = "Critical configuration issues found:\n" + "\n".join(f"- {issue}" for issue in critical_issues)
            logger.error(error_msg)
            if not self.api.debug:
                raise ValueError(error_msg)

    def get_config_summary(self) -> Dict[str, Any]:
        """Get a summary of current configuration (without sensitive data)."""
        return {
            "database": {
                "database_name": self.database.database_name,
                "connection_pool_size": self.database.connection_pool_size,
                "connection_timeout": self.database.connection_timeout
            },
            "ai": {
                "model": self.ai.gemini_model,
                "requests_per_minute": self.ai.requests_per_minute,
                "max_context_length": self.ai.max_context_length,
                "api_key_configured": bool(self.ai.google_api_key)
            },
            "api": {
                "debug": self.api.debug,
                "log_level": self.api.log_level,
                "cors_origins_count": len(self.api.cors_origins)
            },
            "game": {
                "max_story_length": self.game.max_story_length,
                "auto_save_interval": self.game.auto_save_interval,
                "max_inventory_size": self.game.max_inventory_size
            },
            "cache": {
                "redis_enabled": self.cache.redis_enabled,
                "memory_cache_size": self.cache.memory_cache_size,
                "default_ttl": self.cache.default_ttl
            }
        }


# Global settings instance
settings = Settings()
