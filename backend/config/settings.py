import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_dungeon_db")

    # Google AI / Gemini
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-preview-05-20")

    # API Settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Genkit Configuration
    GENKIT_ENV = os.getenv("GENKIT_ENV", "dev")

    # Rate Limiting
    GEMINI_REQUESTS_PER_MINUTE = int(os.getenv("GEMINI_REQUESTS_PER_MINUTE", "60"))
    MAX_CONTEXT_LENGTH = int(os.getenv("MAX_CONTEXT_LENGTH", "32000"))

    # Game Configuration
    MAX_STORY_LENGTH = int(os.getenv("MAX_STORY_LENGTH", "100"))
    AUTO_SAVE_INTERVAL = int(os.getenv("AUTO_SAVE_INTERVAL", "30"))


settings = Settings()
