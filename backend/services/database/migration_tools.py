"""
Data Migration Tools
Handles database schema updates, data migration, and backup/restore operations
"""

import asyncio
import json
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from config.settings import settings
from services.database_service import db_service

logger = logging.getLogger(__name__)


class MigrationScript(BaseModel):
    """Database migration script"""
    version: str
    name: str
    description: str
    up_script: str
    down_script: str
    created_at: datetime
    executed_at: Optional[datetime] = None


class MigrationResult(BaseModel):
    """Migration execution result"""
    success: bool
    version: str
    execution_time: float
    affected_records: int = 0
    error_message: Optional[str] = None
    warnings: List[str] = []


class BackupInfo(BaseModel):
    """Backup metadata"""
    backup_id: str
    created_at: datetime
    file_path: str
    size_bytes: int
    collections: List[str]
    metadata: Dict[str, Any]


class RestoreResult(BaseModel):
    """Restore operation result"""
    success: bool
    backup_id: str
    restored_collections: List[str]
    restored_records: int
    execution_time: float
    error_message: Optional[str] = None


class DataMigrator:
    """
    Database migration and data management system
    """
    
    def __init__(self):
        self.migration_collection = "migrations"
        # Use a default path if BACKUP_DIR is not in settings or is None
        backup_dir_setting = getattr(settings, 'BACKUP_DIR', "./backups")
        self.backup_dir = Path(backup_dir_setting if backup_dir_setting is not None else "./backups")
        self.backup_dir.mkdir(exist_ok=True)
        self.db_service = db_service # Store an instance of DatabaseService
        
        # Database connection will be initialized when needed
        self._db_initialized = False
        
        # Migration scripts
        self.migrations = [
            MigrationScript(
                version="1.0.0",
                name="initial_schema",
                description="Create initial database schema",
                up_script="""
                // Initial schema - collections are created automatically in MongoDB
                // This migration is for tracking purposes
                """,
                down_script="// No rollback for initial schema",
                created_at=datetime.now()
            ),
            MigrationScript(
                version="1.1.0", 
                name="add_quest_system",
                description="Add quest management collections and indexes",
                up_script="""
                // Create indexes for quest system
                db.game_sessions.createIndex({"session_id": 1})
                db.game_sessions.createIndex({"character.name": 1})
                db.game_sessions.createIndex({"updated_at": -1})
                """,
                down_script="""
                // Drop quest-related indexes
                db.game_sessions.dropIndex({"session_id": 1})
                db.game_sessions.dropIndex({"character.name": 1})
                db.game_sessions.dropIndex({"updated_at": -1})
                """,
                created_at=datetime.now()
            ),
            MigrationScript(
                version="1.2.0",
                name="add_configuration_system",
                description="Add configuration management collections",
                up_script="""
                // Create configuration collections
                db.ui_configurations.createIndex({"user_id": 1, "config_type": 1})
                db.feature_flags.createIndex({"flag_name": 1})
                db.content_items.createIndex({"type": 1, "category": 1})
                """,
                down_script="""
                // Drop configuration indexes
                db.ui_configurations.dropIndex({"user_id": 1, "config_type": 1})
                db.feature_flags.dropIndex({"flag_name": 1})
                db.content_items.dropIndex({"type": 1, "category": 1})
                """,
                created_at=datetime.now()
            ),
            MigrationScript(
                version="1.3.0",
                name="add_enhanced_game_logic",
                description="Support for inventory, quests, and world state",
                up_script="""
                // Enhanced game logic indexes
                db.game_sessions.createIndex({"quests.quest_id": 1})
                db.game_sessions.createIndex({"inventory.item_id": 1})
                db.game_sessions.createIndex({"world_state.current_location": 1})
                db.game_sessions.createIndex({"lorebook_id": 1})
                """,
                down_script="""
                // Drop enhanced game logic indexes
                db.game_sessions.dropIndex({"quests.quest_id": 1})
                db.game_sessions.dropIndex({"inventory.item_id": 1}) 
                db.game_sessions.dropIndex({"world_state.current_location": 1})
                db.game_sessions.dropIndex({"lorebook_id": 1})
                """,
                created_at=datetime.now()
            )
        ]
        
        logger.info("DataMigrator initialized")
    
    async def _init_db_connection(self):
        """Initialize database connection if not already connected"""
        if not self._db_initialized and self.db_service.db is None:
            logger.info("Initializing database connection for data migrator")
            await self.db_service.connect()
            self._db_initialized = True
    
    async def get_current_version(self) -> str:
        """Get current database schema version"""
        try:
            # Ensure database is connected
            await self._init_db_connection()
            
            # Check if migrations collection exists
            db = self.db_service.db
            if db is None:
                logger.error("Database not connected")
                return "0.0.0"
                
            if self.migration_collection not in await db.list_collection_names():
                return "0.0.0"
            
            # Get latest migration
            migration_col = db[self.migration_collection]
            latest = await migration_col.find_one(
                {"executed_at": {"$ne": None}},
                sort=[("executed_at", -1)]
            )
            
            return latest["version"] if latest else "0.0.0"
            
        except Exception as e:
            logger.error(f"Error getting current version: {e}")
            return "0.0.0"
    
    async def get_pending_migrations(self) -> List[MigrationScript]:
        """Get list of pending migrations"""
        try:
            current_version = await self.get_current_version()
            
            # Find migrations newer than current version
            pending = []
            for migration in self.migrations:
                if self._compare_versions(migration.version, current_version) > 0:
                    pending.append(migration)
            
            # Sort by version
            pending.sort(key=lambda m: m.version)
            return pending
            
        except Exception as e:
            logger.error(f"Error getting pending migrations: {e}")
            return []
    
    async def run_migration(self, migration: MigrationScript) -> MigrationResult:
        """Execute a single migration"""
        start_time = datetime.now()
        
        try:
            # Ensure database is connected
            await self._init_db_connection()
            
            db = self.db_service.db
            if db is None:
                raise RuntimeError("Database not connected")
            
            # Execute migration script (simplified - real implementation would parse and execute)
            logger.info(f"Executing migration {migration.version}: {migration.name}")
            
            # For MongoDB, we mainly create indexes and collections
            affected_records = 0
            
            if "createIndex" in migration.up_script:
                # This is a simplified example - real implementation would parse the script
                logger.info(f"Migration {migration.version} would create indexes")
                affected_records = 1
            
            # Record migration execution
            migration_col = db[self.migration_collection]
            migration_record = migration.model_dump()
            migration_record["executed_at"] = datetime.now()
            
            await migration_col.replace_one(
                {"version": migration.version},
                migration_record,
                upsert=True
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            result = MigrationResult(
                success=True,
                version=migration.version,
                execution_time=execution_time,
                affected_records=affected_records
            )
            
            logger.info(f"Migration {migration.version} completed successfully")
            return result
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            error_msg = str(e)
            
            logger.error(f"Migration {migration.version} failed: {error_msg}")
            
            return MigrationResult(
                success=False,
                version=migration.version,
                execution_time=execution_time,
                error_message=error_msg
            )
    
    async def migrate_to_latest(self) -> List[MigrationResult]:
        """Run all pending migrations"""
        try:
            pending_migrations = await self.get_pending_migrations()
            
            if not pending_migrations:
                logger.info("No pending migrations")
                return []
            
            results = []
            for migration in pending_migrations:
                result = await self.run_migration(migration)
                results.append(result)
                
                if not result.success:
                    logger.error(f"Migration failed, stopping: {result.error_message}")
                    break
            
            successful_count = sum(1 for r in results if r.success)
            logger.info(f"Completed {successful_count}/{len(results)} migrations")
            
            return results
            
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
            return []
    
    async def rollback_migration(self, version: str) -> MigrationResult:
        """Rollback a specific migration"""
        start_time = datetime.now()
        
        try:
            # Find the migration
            migration = None
            for m in self.migrations:
                if m.version == version:
                    migration = m
                    break
            
            if not migration:
                raise ValueError(f"Migration version {version} not found")
            
            # Ensure database is connected
            await self._init_db_connection()
            
            db = self.db_service.db
            if db is None:
                raise RuntimeError("Database not connected")
            
            # Execute rollback script
            logger.info(f"Rolling back migration {version}: {migration.name}")
            
            # Execute down script (simplified)
            affected_records = 0
            if "dropIndex" in migration.down_script:
                logger.info(f"Migration {version} rollback would drop indexes")
                affected_records = 1
            
            # Remove migration record
            migration_col = db[self.migration_collection]
            await migration_col.delete_one({"version": version})
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            result = MigrationResult(
                success=True,
                version=version,
                execution_time=execution_time,
                affected_records=affected_records
            )
            
            logger.info(f"Migration {version} rolled back successfully")
            return result
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            error_msg = str(e)
            
            logger.error(f"Rollback of {version} failed: {error_msg}")
            
            return MigrationResult(
                success=False,
                version=version,
                execution_time=execution_time,
                error_message=error_msg
            )
    
    async def create_backup(self, backup_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> BackupInfo:
        """Create a backup of the database"""
        start_time = datetime.now()
        backup_id = backup_id or f"backup_{start_time.strftime('%Y%m%d_%H%M%S')}"
        backup_file = self.backup_dir / f"{backup_id}.json"
        
        backup_metadata: Dict[str, Any] = metadata or {} # Ensure metadata is a dict
        
        try:
            # Ensure database is connected
            await self._init_db_connection()
            
            db = self.db_service.db
            if db is None:
                raise RuntimeError("Database not connected")
                
            collections_to_backup = await db.list_collection_names()
            
            data_to_backup: Dict[str, List[Dict[str, Any]]] = {}
            total_records = 0
            
            for collection_name in collections_to_backup:
                if collection_name == self.migration_collection: # Skip migrations
                    continue
                
                collection = db[collection_name]
                records = await collection.find({}).to_list(length=None) # Get all records
                data_to_backup[collection_name] = records
                total_records += len(records)
            
            # Update metadata (ensure values are appropriate for JSON and BackupInfo)
            backup_metadata["backup_id"] = backup_id
            backup_metadata["created_at"] = start_time.isoformat() # Store as ISO string
            backup_metadata["total_records"] = total_records # int is fine for metadata dict
            backup_metadata["collections_backed_up"] = list(data_to_backup.keys()) # list of str is fine

            with open(backup_file, 'w') as f:
                json.dump({
                    "metadata": backup_metadata,
                    "data": data_to_backup
                }, f, indent=4, default=str) # Use default=str for datetime etc.
            
            file_size = backup_file.stat().st_size
            
            logger.info(f"Database backup created: {backup_id} ({file_size} bytes)")
            
            return BackupInfo(
                backup_id=backup_id,
                created_at=start_time, # datetime object for BackupInfo model
                file_path=str(backup_file),
                size_bytes=file_size,
                collections=list(data_to_backup.keys()), # Pass as list of strings
                metadata=backup_metadata # Pass the full metadata dict
            )

        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            # Consider how to handle partial backups or cleanup
            if backup_file.exists():
                backup_file.unlink() # Remove partial backup file
            raise # Re-raise the exception to indicate failure
    
    async def restore_from_backup(self, backup_id: str) -> RestoreResult:
        """Restore database from a backup file"""
        start_time = datetime.now()
        backup_file = self.backup_dir / f"{backup_id}.json"
        
        if not backup_file.exists():
            logger.error(f"Backup file not found: {backup_file}")
            return RestoreResult(
                success=False,
                backup_id=backup_id,
                restored_collections=[],
                restored_records=0,
                execution_time=0,
                error_message="Backup file not found"
            )
            
        try:
            with open(backup_file, 'r') as f:
                backup_data = json.load(f)
            
            # Ensure database is connected
            await self._init_db_connection()
            
            db = self.db_service.db
            if db is None:
                raise RuntimeError("Database not connected")
                
            data_to_restore = backup_data.get("data", {})
            restored_collections_list = []
            total_restored_records = 0
            
            for collection_name, records in data_to_restore.items():
                collection = db[collection_name]
                await collection.delete_many({}) # Clear existing data
                if records: # Ensure there are records to insert
                    await collection.insert_many(records)
                restored_collections_list.append(collection_name)
                total_restored_records += len(records)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Database restored from backup: {backup_id}")
            
            return RestoreResult(
                success=True,
                backup_id=backup_id,
                restored_collections=restored_collections_list,
                restored_records=total_restored_records,
                execution_time=execution_time
            )
            
        except Exception as e:
            logger.error(f"Error restoring from backup: {e}")
            return RestoreResult(
                success=False,
                backup_id=backup_id,
                restored_collections=[],
                restored_records=0,
                execution_time=(datetime.now() - start_time).total_seconds(),
                error_message=str(e)
            )

    async def migrate_hardcoded_data(self) -> None:
        """Migrate hardcoded data (e.g., lorebooks, initial quests) to the database"""
        try:
            # Ensure database is connected
            await self._init_db_connection()
            
            db = self.db_service.db
            if db is None:
                raise RuntimeError("Database not connected")
                
            # Example: Migrate lorebooks
            # This would typically load from a JSON/YAML file or define inline
            hardcoded_lorebooks = [
                {"lorebook_id": "world_history", "title": "History of Eldoria", "entries": []},
                {"lorebook_id": "magic_system", "title": "Principles of Arcane Arts", "entries": []}
            ]
            
            lorebook_collection = db["lorebooks"]
            for lorebook_data in hardcoded_lorebooks:
                await lorebook_collection.update_one(
                    {"lorebook_id": lorebook_data["lorebook_id"]},
                    {"$set": lorebook_data},
                    upsert=True
                )
            logger.info(f"Migrated {len(hardcoded_lorebooks)} lorebooks.")

            # Example: Migrate initial quests (if not dynamically generated)
            # ...

        except Exception as e:
            logger.error(f"Error migrating hardcoded data: {e}")

    def _compare_versions(self, v1: str, v2: str) -> int:
        """Compare two version strings"""
        try:
            v1_parts = [int(x) for x in v1.split('.')]
            v2_parts = [int(x) for x in v2.split('.')]
            
            # Pad shorter version with zeros
            max_len = max(len(v1_parts), len(v2_parts))
            v1_parts.extend([0] * (max_len - len(v1_parts)))
            v2_parts.extend([0] * (max_len - len(v2_parts)))
            
            for i, (part1, part2) in enumerate(zip(v1_parts, v2_parts)):
                if part1 > part2:
                    return 1
                elif part1 < part2:
                    return -1
            
            return 0
            
        except Exception as e:
            logger.error(f"Error comparing versions {v1} and {v2}: {e}")
            return 0


# Global data migrator instance
data_migrator = DataMigrator()
