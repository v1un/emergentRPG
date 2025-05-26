#!/usr/bin/env python3
"""
Test script for database migration tools
"""
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_migrations():
    from services.database.migration_tools import data_migrator
    from services.database_service import db_service
    
    logger.info("Connecting to database...")
    await db_service.connect()
    
    try:
        # Test database connection
        logger.info(f"Database connected: {db_service.db is not None}")
        
        # Test migration functionality
        current_version = await data_migrator.get_current_version()
        logger.info(f"Current database version: {current_version}")
        
        pending_migrations = await data_migrator.get_pending_migrations()
        logger.info(f"Pending migrations: {len(pending_migrations)}")
        for migration in pending_migrations:
            logger.info(f"  - {migration.version}: {migration.name}")
        
        # Test backup functionality (without actually creating a backup)
        logger.info(f"Backup directory: {data_migrator.backup_dir}")
        
    finally:
        # Disconnect from database
        await db_service.disconnect()
        logger.info("Database disconnected")

if __name__ == "__main__":
    asyncio.run(test_migrations())
