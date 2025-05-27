#!/usr/bin/env python3
"""
Database migration script to add initial_narrative and narrative_metadata fields to ScenarioTemplate collection.

This migration:
1. Adds initial_narrative field (Optional[str]) to existing scenario templates
2. Adds narrative_metadata field (Dict[str, Any]) to existing scenario templates
3. Optionally regenerates AI narratives for existing templates

Usage:
    python -m migrations.add_scenario_narrative_fields [--regenerate-narratives]
"""

import asyncio
import logging
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Add backend to path for imports
sys.path.append('/home/vinij/Documents/Working/emergentRPG/backend')

from services.database_service import db_service
from services.scenario_generation.scenario_orchestrator import scenario_orchestrator
from models.scenario_models import ScenarioTemplate, Lorebook

logger = logging.getLogger(__name__)


class ScenarioNarrativeMigration:
    """Migration class for adding narrative fields to scenario templates"""
    
    def __init__(self):
        self.migration_name = "add_scenario_narrative_fields"
        self.migration_version = "1.0.0"
        self.migration_date = datetime.now().isoformat()
    
    async def check_migration_needed(self) -> bool:
        """Check if migration is needed by examining existing templates"""
        try:
            # Get a sample template to check if fields exist
            templates = await db_service.search_scenario_templates(limit=1)
            
            if not templates:
                logger.info("No scenario templates found, migration not needed")
                return False
            
            template = templates[0]
            
            # Check if new fields exist
            has_initial_narrative = hasattr(template, 'initial_narrative')
            has_narrative_metadata = hasattr(template, 'narrative_metadata')
            
            if has_initial_narrative and has_narrative_metadata:
                logger.info("Scenario templates already have narrative fields")
                return False
            
            logger.info(f"Migration needed: initial_narrative={has_initial_narrative}, narrative_metadata={has_narrative_metadata}")
            return True
            
        except Exception as e:
            logger.error(f"Error checking migration status: {str(e)}")
            return True  # Assume migration needed if we can't check
    
    async def add_fields_to_existing_templates(self) -> int:
        """Add new fields to existing scenario templates"""
        logger.info("Adding narrative fields to existing scenario templates")
        
        try:
            # Get all existing templates
            all_templates = await db_service.search_scenario_templates(limit=1000)
            updated_count = 0
            
            for template in all_templates:
                try:
                    # Create update document
                    update_doc = {}
                    
                    # Add initial_narrative field if missing
                    if not hasattr(template, 'initial_narrative') or template.initial_narrative is None:
                        update_doc['initial_narrative'] = None
                    
                    # Add narrative_metadata field if missing
                    if not hasattr(template, 'narrative_metadata') or template.narrative_metadata is None:
                        update_doc['narrative_metadata'] = {
                            "generation_method": "not_generated",
                            "migration_date": self.migration_date,
                            "migration_version": self.migration_version
                        }
                    
                    if update_doc:
                        # Update the template in database
                        await db_service.update_scenario_template(template.id, update_doc)
                        updated_count += 1
                        logger.info(f"Updated template: {template.title}")
                
                except Exception as template_error:
                    logger.error(f"Error updating template {template.id}: {str(template_error)}")
                    continue
            
            logger.info(f"Successfully updated {updated_count} scenario templates")
            return updated_count
            
        except Exception as e:
            logger.error(f"Error adding fields to templates: {str(e)}")
            raise
    
    async def regenerate_narratives(self) -> int:
        """Regenerate AI narratives for existing templates"""
        logger.info("Regenerating AI narratives for existing scenario templates")
        
        try:
            # Get all templates that need narratives
            all_templates = await db_service.search_scenario_templates(limit=1000)
            regenerated_count = 0
            
            for template in all_templates:
                try:
                    # Skip if template already has AI-generated narrative
                    if (template.initial_narrative and 
                        template.narrative_metadata and 
                        template.narrative_metadata.get("generation_method") == "ai"):
                        logger.info(f"Skipping template {template.title} - already has AI narrative")
                        continue
                    
                    # Get associated lorebook
                    lorebook = await db_service.get_lorebook(template.lorebook_id)
                    if not lorebook:
                        logger.warning(f"No lorebook found for template {template.id}")
                        continue
                    
                    # Generate AI narrative
                    logger.info(f"Generating AI narrative for template: {template.title}")
                    initial_narrative = await scenario_orchestrator._generate_initial_narrative(lorebook, template)
                    
                    # Update template with new narrative
                    update_doc = {
                        'initial_narrative': initial_narrative,
                        'narrative_metadata': {
                            "generation_method": "ai",
                            "ai_model": "gemini-2.5-flash-preview",
                            "generation_date": datetime.now().isoformat(),
                            "migration_regenerated": True,
                            "migration_version": self.migration_version,
                            "character_count": len(template.playable_characters),
                            "world_elements_used": {
                                "locations": len(lorebook.locations),
                                "characters": len(lorebook.characters),
                                "power_system": bool(lorebook.series_metadata.power_system),
                                "genre": lorebook.series_metadata.genre,
                            }
                        }
                    }
                    
                    await db_service.update_scenario_template(template.id, update_doc)
                    regenerated_count += 1
                    logger.info(f"Successfully regenerated narrative for: {template.title}")
                    
                    # Add small delay to avoid rate limiting
                    await asyncio.sleep(1)
                
                except Exception as template_error:
                    logger.error(f"Error regenerating narrative for template {template.id}: {str(template_error)}")
                    # Continue with other templates
                    continue
            
            logger.info(f"Successfully regenerated narratives for {regenerated_count} templates")
            return regenerated_count
            
        except Exception as e:
            logger.error(f"Error regenerating narratives: {str(e)}")
            raise
    
    async def run_migration(self, regenerate_narratives: bool = False) -> Dict[str, Any]:
        """Run the complete migration"""
        logger.info(f"Starting scenario narrative migration (regenerate={regenerate_narratives})")
        
        try:
            # Check if migration is needed
            if not await self.check_migration_needed():
                return {
                    "status": "skipped",
                    "reason": "Migration not needed",
                    "updated_templates": 0,
                    "regenerated_narratives": 0
                }
            
            # Add fields to existing templates
            updated_count = await self.add_fields_to_existing_templates()
            regenerated_count = 0
            
            # Optionally regenerate narratives
            if regenerate_narratives:
                regenerated_count = await self.regenerate_narratives()
            
            logger.info("Migration completed successfully")
            return {
                "status": "completed",
                "updated_templates": updated_count,
                "regenerated_narratives": regenerated_count,
                "migration_date": self.migration_date,
                "migration_version": self.migration_version
            }
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "migration_date": self.migration_date
            }


async def main():
    """Main migration function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Add narrative fields to scenario templates")
    parser.add_argument(
        "--regenerate-narratives", 
        action="store_true", 
        help="Regenerate AI narratives for existing templates"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check what would be migrated without making changes"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    migration = ScenarioNarrativeMigration()
    
    if args.dry_run:
        logger.info("DRY RUN: Checking migration status...")
        needs_migration = await migration.check_migration_needed()
        logger.info(f"Migration needed: {needs_migration}")
        return
    
    # Run the migration
    result = await migration.run_migration(regenerate_narratives=args.regenerate_narratives)
    
    logger.info("Migration result:")
    for key, value in result.items():
        logger.info(f"  {key}: {value}")
    
    if result["status"] == "failed":
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
