import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import motor.motor_asyncio
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure

from config.settings import settings
from models.game_models import GameSession
from models.scenario_models import GenerationTask, Lorebook, ScenarioTemplate
from utils.exceptions import DatabaseError, SessionSaveError

logger = logging.getLogger(__name__)

# Constants
DB_NOT_CONNECTED_ERROR = "Database is not connected. Please call connect() first."


class DatabaseService:
    """
    Async MongoDB database service for emergentRPG.

    Provides high-level database operations with proper error handling,
    connection management, and performance optimization.

    Attributes:
        client: MongoDB async client instance
        db: Database instance
        _connection_pool_size: Maximum connection pool size
        _connection_timeout: Connection timeout in seconds
    """

    def __init__(self):
        self.client = None
        self.db = None
        self._connection_pool_size = 10
        self._connection_timeout = 30

    async def connect(self) -> None:
        """
        Initialize database connection with proper error handling.

        Raises:
            DatabaseError: If connection fails
            ConnectionFailure: If MongoDB is unreachable
        """
        try:
            # Create client with connection pool settings
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGO_URL,
                maxPoolSize=self._connection_pool_size,
                serverSelectionTimeoutMS=self._connection_timeout * 1000
            )

            if self.client:
                self.db = self.client[settings.DATABASE_NAME]

                # Test connection
                await self.client.admin.command("ping")
                logger.info("Successfully connected to MongoDB")

                # Create indexes
                await self.create_indexes()

        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise DatabaseError(f"Database connection failed: {str(e)}", "DB_CONNECTION_FAILED")
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
            raise DatabaseError(f"Database initialization failed: {str(e)}", "DB_INIT_FAILED")

    async def create_indexes(self) -> None:
        """
        Create database indexes for better performance.

        Raises:
            DatabaseError: If database is not connected or index creation fails
        """
        if self.db is None:
            raise DatabaseError(DB_NOT_CONNECTED_ERROR, "DB_NOT_CONNECTED")

        try:
            # Game sessions indexes
            await self.db.game_sessions.create_index(
                [("session_id", ASCENDING)], unique=True
            )
            await self.db.game_sessions.create_index([("created_at", DESCENDING)])
            await self.db.game_sessions.create_index([("scenario_id", ASCENDING)])

            # Lorebooks indexes
            await self.db.lorebooks.create_index([("id", ASCENDING)], unique=True)
            await self.db.lorebooks.create_index([("series_metadata.title", ASCENDING)])
            await self.db.lorebooks.create_index([("created_at", DESCENDING)])

            # Generation tasks indexes
            await self.db.generation_tasks.create_index(
                [("task_id", ASCENDING)], unique=True
            )
            await self.db.generation_tasks.create_index([("status", ASCENDING)])
            await self.db.generation_tasks.create_index([("created_at", DESCENDING)])

            # Scenario templates indexes
            await self.db.scenario_templates.create_index(
                [("id", ASCENDING)], unique=True
            )
            await self.db.scenario_templates.create_index([("lorebook_id", ASCENDING)])
            await self.db.scenario_templates.create_index([("tags", ASCENDING)])

            logger.info("Database indexes created successfully")

        except Exception as e:
            logger.error(f"Error creating indexes: {str(e)}")

    async def disconnect(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    # Game Session Operations
    async def save_game_session(self, session: GameSession) -> bool:
        """
        Save or update game session.

        Args:
            session: GameSession instance to save

        Returns:
            bool: True if successful, False otherwise

        Raises:
            DatabaseError: If database is not connected
            SessionSaveError: If save operation fails
        """
        if self.db is None:
            raise DatabaseError(DB_NOT_CONNECTED_ERROR, "DB_NOT_CONNECTED")

        try:
            session.updated_at = datetime.now()
            session_dict = session.model_dump()

            await self.db.game_sessions.replace_one(
                {"session_id": session.session_id}, session_dict, upsert=True
            )

            logger.info(f"Saved game session {session.session_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving game session: {str(e)}")
            raise SessionSaveError(f"Failed to save session {session.session_id}: {str(e)}", "SESSION_SAVE_FAILED")

    async def get_game_session(self, session_id: str) -> Optional[GameSession]:
        """Retrieve game session by ID"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            session_data = await self.db.game_sessions.find_one(
                {"session_id": session_id}
            )
            if session_data:
                return GameSession(**session_data)
            return None

        except Exception as e:
            logger.error(f"Error retrieving game session: {str(e)}")
            return None

    async def delete_game_session(self, session_id: str) -> bool:
        """Delete game session"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            result = await self.db.game_sessions.delete_one({"session_id": session_id})
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting game session: {str(e)}")
            return False

    async def list_game_sessions(
        self, limit: int = 50, offset: int = 0
    ) -> List[GameSession]:
        """List game sessions with pagination"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            cursor = (
                self.db.game_sessions.find()
                .sort("updated_at", DESCENDING)
                .skip(offset)
                .limit(limit)
            )
            sessions = []
            async for session_data in cursor:
                sessions.append(GameSession(**session_data))
            return sessions

        except Exception as e:
            logger.error(f"Error listing game sessions: {str(e)}")
            return []

    # Lorebook Operations
    async def save_lorebook(self, lorebook: Lorebook) -> bool:
        """
        Save or update lorebook.

        Args:
            lorebook: Lorebook instance to save

        Returns:
            bool: True if successful

        Raises:
            DatabaseError: If database is not connected or save fails
        """
        if self.db is None:
            raise DatabaseError(DB_NOT_CONNECTED_ERROR, "DB_NOT_CONNECTED")

        try:
            lorebook.updated_at = datetime.now()
            lorebook_dict = lorebook.model_dump()

            await self.db.lorebooks.replace_one(
                {"id": lorebook.id}, lorebook_dict, upsert=True
            )

            logger.info(f"Saved lorebook {lorebook.id}")
            return True

        except Exception as e:
            logger.error(f"Error saving lorebook: {str(e)}")
            raise DatabaseError(f"Failed to save lorebook {lorebook.id}: {str(e)}", "LOREBOOK_SAVE_FAILED")

    async def get_lorebook(self, lorebook_id: str) -> Optional[Lorebook]:
        """Retrieve lorebook by ID"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            lorebook_data = await self.db.lorebooks.find_one({"id": lorebook_id})
            if lorebook_data:
                return Lorebook(**lorebook_data)
            return None

        except Exception as e:
            logger.error(f"Error retrieving lorebook: {str(e)}")
            return None

    async def search_lorebooks(
        self,
        series_title: Optional[str] = None,
        genre: Optional[str] = None,
        limit: int = 20,
    ) -> List[Lorebook]:
        """Search lorebooks by criteria"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            query = {}
            if series_title:
                query["series_metadata.title"] = {
                    "$regex": series_title,
                    "$options": "i",
                }
            if genre:
                query["series_metadata.genre"] = {"$in": [genre]}

            cursor = (
                self.db.lorebooks.find(query)
                .sort("created_at", DESCENDING)
                .limit(limit)
            )
            lorebooks = []
            async for lorebook_data in cursor:
                lorebooks.append(Lorebook(**lorebook_data))
            return lorebooks

        except Exception as e:
            logger.error(f"Error searching lorebooks: {str(e)}")
            return []

    async def delete_lorebook(self, lorebook_id: str) -> bool:
        """Delete lorebook"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            result = await self.db.lorebooks.delete_one({"id": lorebook_id})
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting lorebook: {str(e)}")
            return False

    # Generation Task Operations
    async def save_generation_task(self, task: GenerationTask) -> bool:
        """
        Save or update generation task.

        Args:
            task: GenerationTask instance to save

        Returns:
            bool: True if successful

        Raises:
            DatabaseError: If database is not connected or save fails
        """
        if self.db is None:
            raise DatabaseError(DB_NOT_CONNECTED_ERROR, "DB_NOT_CONNECTED")

        try:
            task.updated_at = datetime.now()
            task_dict = task.model_dump()

            await self.db.generation_tasks.replace_one(
                {"task_id": task.task_id}, task_dict, upsert=True
            )

            logger.info(f"Saved generation task {task.task_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving generation task: {str(e)}")
            raise DatabaseError(f"Failed to save generation task {task.task_id}: {str(e)}", "TASK_SAVE_FAILED")

    async def get_generation_task(self, task_id: str) -> Optional[GenerationTask]:
        """Retrieve generation task by ID"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            task_data = await self.db.generation_tasks.find_one({"task_id": task_id})
            if task_data:
                return GenerationTask(**task_data)
            return None

        except Exception as e:
            logger.error(f"Error retrieving generation task: {str(e)}")
            return None

    async def update_task_progress(
        self,
        task_id: str,
        progress: float,
        current_step: str,
        status: Optional[str] = None,
    ) -> bool:
        """Update generation task progress"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            update_data = {
                "progress": progress,
                "current_step": current_step,
                "updated_at": datetime.now(),
            }
            if status:
                update_data["status"] = status

            result = await self.db.generation_tasks.update_one(
                {"task_id": task_id}, {"$set": update_data}
            )

            return result.matched_count > 0

        except Exception as e:
            logger.error(f"Error updating task progress: {str(e)}")
            return False

    # Scenario Template Operations
    async def save_scenario_template(self, template: ScenarioTemplate) -> bool:
        """
        Save scenario template.

        Args:
            template: ScenarioTemplate instance to save

        Returns:
            bool: True if successful

        Raises:
            DatabaseError: If database is not connected or save fails
        """
        if self.db is None:
            raise DatabaseError(DB_NOT_CONNECTED_ERROR, "DB_NOT_CONNECTED")

        try:
            template_dict = template.model_dump()

            await self.db.scenario_templates.replace_one(
                {"id": template.id}, template_dict, upsert=True
            )

            logger.info(f"Saved scenario template {template.id}")
            return True

        except Exception as e:
            logger.error(f"Error saving scenario template: {str(e)}")
            raise DatabaseError(f"Failed to save scenario template {template.id}: {str(e)}", "TEMPLATE_SAVE_FAILED")

    async def get_scenario_templates_by_lorebook(
        self, lorebook_id: str
    ) -> List[ScenarioTemplate]:
        """Get scenario templates for a specific lorebook"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            cursor = self.db.scenario_templates.find({"lorebook_id": lorebook_id})
            templates = []
            async for template_data in cursor:
                templates.append(ScenarioTemplate(**template_data))
            return templates

        except Exception as e:
            logger.error(f"Error retrieving scenario templates: {str(e)}")
            return []

    async def search_scenario_templates(
        self,
        tags: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        limit: int = 20,
    ) -> List[ScenarioTemplate]:
        """Search scenario templates by criteria"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            query = {}
            if tags:
                query["tags"] = {"$in": tags}
            if difficulty:
                query["difficulty_level"] = difficulty

            cursor = (
                self.db.scenario_templates.find(query)
                .sort("created_at", DESCENDING)
                .limit(limit)
            )
            templates = []
            async for template_data in cursor:
                templates.append(ScenarioTemplate(**template_data))
            return templates

        except Exception as e:
            logger.error(f"Error searching scenario templates: {str(e)}")
            return []

    async def get_scenario_template(
        self, template_id: str
    ) -> Optional[ScenarioTemplate]:
        """Get scenario template by ID"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            template_data = await self.db.scenario_templates.find_one(
                {"id": template_id}
            )
            if template_data:
                return ScenarioTemplate(**template_data)
            return None

        except Exception as e:
            logger.error(f"Error retrieving scenario template: {str(e)}")
            return None

    async def update_scenario_template(
        self, template_id: str, update_data: Dict[str, Any]
    ) -> bool:
        """Update scenario template with new data"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            # Add updated timestamp
            update_data["updated_at"] = datetime.now()

            result = await self.db.scenario_templates.update_one(
                {"id": template_id}, {"$set": update_data}
            )

            if result.matched_count > 0:
                logger.info(f"Updated scenario template {template_id}")
                return True
            else:
                logger.warning(f"No scenario template found with ID {template_id}")
                return False

        except Exception as e:
            logger.error(f"Error updating scenario template: {str(e)}")
            return False

    async def delete_scenario_template(self, template_id: str) -> bool:
        """Delete scenario template"""
        if self.db is None:
            raise RuntimeError(DB_NOT_CONNECTED_ERROR)

        try:
            result = await self.db.scenario_templates.delete_one({"id": template_id})
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting scenario template: {str(e)}")
            return False


# Global database service instance
db_service = DatabaseService()
