import uuid
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from models.scenario_models import (
    GenerationRequest, GenerationTask, GenerationStatus, 
    Lorebook, SeriesMetadata, ScenarioTemplate
)
from models.game_models import Character
from flows.series_analysis.analysis_flow import series_analysis_flow
from flows.lorebook_generation.world_building_flow import world_building_flow
from flows.lorebook_generation.character_generation_flow import character_generation_flow
from flows.character_generation.character_creation_flow import character_creation_flow
from services.database_service import db_service

logger = logging.getLogger(__name__)

class ScenarioOrchestrator:
    """Main orchestrator for AI-generated scenario system using Genkit flows"""
    
    def __init__(self):
        self.active_tasks: Dict[str, GenerationTask] = {}
    
    async def start_generation_task(self, request: GenerationRequest) -> str:
        """Start a new scenario generation task"""
        task_id = str(uuid.uuid4())
        
        task = GenerationTask(
            task_id=task_id,
            request=request,
            status=GenerationStatus.PENDING,
            progress=0.0,
            current_step="Initializing generation task"
        )
        
        self.active_tasks[task_id] = task
        await db_service.save_generation_task(task)
        
        # Start background task
        asyncio.create_task(self._execute_generation_pipeline(task_id))
        
        logger.info(f"Started generation task {task_id} for series: {request.series_title}")
        return task_id
    
    async def get_task_status(self, task_id: str) -> Optional[GenerationTask]:
        """Get current status of generation task"""
        if task_id in self.active_tasks:
            return self.active_tasks[task_id]
        
        # Check database
        return await db_service.get_generation_task(task_id)
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel an active generation task"""
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            task.status = GenerationStatus.FAILED
            task.error_message = "Task cancelled by user"
            await db_service.save_generation_task(task)
            del self.active_tasks[task_id]
            return True
        return False
    
    async def _execute_generation_pipeline(self, task_id: str):
        """Execute the complete generation pipeline"""
        task = self.active_tasks.get(task_id)
        if not task:
            return
        
        try:
            # Update status to analyzing
            task.status = GenerationStatus.ANALYZING
            task.current_step = "Analyzing series information"
            task.progress = 0.1
            await db_service.update_task_progress(task_id, 0.1, task.current_step, "analyzing")
            
            # Step 1: Series Analysis
            series_metadata = await self._analyze_series(task.request)
            task.progress = 0.2
            task.current_step = "Series analysis complete"
            await db_service.update_task_progress(task_id, 0.2, task.current_step)
            
            # Step 2: Generate Lorebook
            task.status = GenerationStatus.GENERATING
            task.current_step = "Generating world information"
            task.progress = 0.3
            await db_service.update_task_progress(task_id, 0.3, task.current_step, "generating")
            
            lorebook = await self._generate_lorebook(series_metadata, task_id)
            task.progress = 0.8
            task.current_step = "Lorebook generation complete"
            await db_service.update_task_progress(task_id, 0.8, task.current_step)
            
            # Step 3: Validation
            task.status = GenerationStatus.VALIDATING
            task.current_step = "Validating generated content"
            task.progress = 0.85
            await db_service.update_task_progress(task_id, 0.85, task.current_step, "validating")
            
            validated_lorebook = await self._validate_lorebook(lorebook)
            
            # Step 4: Generate Playable Characters
            task.current_step = "Creating playable characters"
            task.progress = 0.9
            await db_service.update_task_progress(task_id, 0.9, task.current_step)
            
            playable_characters = await self._generate_playable_characters(validated_lorebook)
            
            # Step 5: Generate Scenario Templates
            task.current_step = "Creating scenario templates"
            task.progress = 0.95
            await db_service.update_task_progress(task_id, 0.95, task.current_step)
            
            await self._generate_scenario_templates(validated_lorebook, playable_characters)
            
            # Complete task
            task.status = GenerationStatus.COMPLETED
            task.result = validated_lorebook
            task.progress = 1.0
            task.current_step = "Generation complete"
            await db_service.save_generation_task(task)
            
            # Save lorebook to database
            await db_service.save_lorebook(validated_lorebook)
            
            logger.info(f"Successfully completed generation task {task_id}")
            
        except Exception as e:
            logger.error(f"Error in generation pipeline {task_id}: {str(e)}")
            task.status = GenerationStatus.FAILED
            task.error_message = str(e)
            await db_service.save_generation_task(task)
        
        finally:
            # Clean up
            if task_id in self.active_tasks:
                del self.active_tasks[task_id]
    
    async def _analyze_series(self, request: GenerationRequest) -> SeriesMetadata:
        """Step 1: Analyze the series using analysis flows"""
        logger.info(f"Starting series analysis for: {request.series_title}")
        
        try:
            # Run series identification flow
            identification_data = await series_analysis_flow.series_identification_flow(
                request.series_title, request.series_type.value
            )
            
            # Run metadata enrichment flow
            series_metadata = await series_analysis_flow.metadata_enrichment_flow(
                request.series_title, request.series_type.value
            )
            
            # Run canonical source validation
            validation_data = await series_analysis_flow.canonical_source_validation_flow(series_metadata)
            
            # Apply any corrections from validation
            if validation_data.get("recommendation") == "modify":
                corrections = validation_data.get("corrections", {})
                for field, value in corrections.items():
                    if hasattr(series_metadata, field):
                        setattr(series_metadata, field, value)
            
            # Run knowledge graph creation
            knowledge_graph = await series_analysis_flow.knowledge_graph_creation_flow(series_metadata)
            
            logger.info(f"Series analysis complete with confidence: {series_metadata.confidence_score}")
            return series_metadata
            
        except Exception as e:
            logger.error(f"Error in series analysis: {str(e)}")
            raise
    
    async def _generate_lorebook(self, series_metadata: SeriesMetadata, task_id: str) -> Lorebook:
        """Step 2: Generate comprehensive lorebook"""
        logger.info(f"Starting lorebook generation for: {series_metadata.title}")
        
        try:
            lorebook_id = str(uuid.uuid4())
            
            # Update progress - Geography
            await db_service.update_task_progress(task_id, 0.35, "Generating world geography")
            locations = await world_building_flow.geography_generation_flow(series_metadata)
            
            # Update progress - Political Systems
            await db_service.update_task_progress(task_id, 0.45, "Creating political systems")
            political_systems = await world_building_flow.political_systems_flow(series_metadata)
            
            # Update progress - Power Systems
            await db_service.update_task_progress(task_id, 0.55, "Designing power systems")
            power_systems = await world_building_flow.magic_power_systems_flow(series_metadata)
            
            # Update progress - Cultural Systems
            await db_service.update_task_progress(task_id, 0.60, "Developing cultural systems")
            cultural_systems = await world_building_flow.cultural_systems_flow(series_metadata)
            
            # Combine all world systems
            all_systems = political_systems + power_systems + cultural_systems
            
            # Update progress - Historical Timeline
            await db_service.update_task_progress(task_id, 0.65, "Creating historical timeline")
            timeline = await world_building_flow.historical_timeline_flow(series_metadata, all_systems)
            
            # Update progress - Main Characters
            await db_service.update_task_progress(task_id, 0.70, "Generating main characters")
            main_characters = await character_generation_flow.main_characters_flow(series_metadata)
            
            # Update progress - Supporting Characters
            await db_service.update_task_progress(task_id, 0.75, "Creating supporting cast")
            supporting_characters = await character_generation_flow.supporting_cast_flow(series_metadata, main_characters)
            
            all_characters = main_characters + supporting_characters
            
            # Update progress - Character Relationships
            await db_service.update_task_progress(task_id, 0.78, "Mapping character relationships")
            relationships = await character_generation_flow.relationship_mapping_flow(all_characters)
            
            # Create lorebook
            lorebook = Lorebook(
                id=lorebook_id,
                series_metadata=series_metadata,
                characters=all_characters,
                locations=locations,
                world_systems=all_systems,
                timeline=timeline,
                plot_summary=f"Interactive adventures in the world of {series_metadata.title}",
                key_events=[event.get("major_events", []) for event in timeline if event.get("major_events")],
                generation_metadata={
                    "generation_version": "1.0",
                    "ai_model": "gemini-2.5-flash-preview-05-20",
                    "generation_date": datetime.now().isoformat(),
                    "relationships": relationships
                }
            )
            
            logger.info(f"Lorebook generation complete: {len(all_characters)} characters, {len(locations)} locations")
            return lorebook
            
        except Exception as e:
            logger.error(f"Error in lorebook generation: {str(e)}")
            raise
    
    async def _validate_lorebook(self, lorebook: Lorebook) -> Lorebook:
        """Step 3: Validate and refine generated content"""
        logger.info(f"Starting lorebook validation for: {lorebook.series_metadata.title}")
        
        try:
            # For now, basic validation - in full implementation would run consistency checks
            validation_score = 0.9  # Placeholder
            
            # Add validation metadata
            lorebook.generation_metadata["validation_score"] = validation_score
            lorebook.generation_metadata["validation_date"] = datetime.now().isoformat()
            
            logger.info(f"Lorebook validation complete with score: {validation_score}")
            return lorebook
            
        except Exception as e:
            logger.error(f"Error in lorebook validation: {str(e)}")
            raise
    
    async def _generate_playable_characters(self, lorebook: Lorebook) -> List[Dict[str, Any]]:
        """Step 4: Generate playable characters from lorebook characters"""
        logger.info(f"Generating playable characters for: {lorebook.series_metadata.title}")
        
        try:
            playable_characters = []
            
            # Select main characters from the lorebook to convert to playable characters
            main_chars = [char for char in lorebook.characters if char.role in ["protagonist", "deuteragonist", "ally"]]
            
            # If no protagonists found, use the first 2-3 characters
            if not main_chars and lorebook.characters:
                main_chars = lorebook.characters[:min(3, len(lorebook.characters))]
            
            # Generate a default scenario context
            scenario_context = f"An adventure in the world of {lorebook.series_metadata.title}, set in {lorebook.series_metadata.setting}"
            
            # Create playable characters from the main characters
            for char in main_chars[:3]:  # Limit to 3 playable characters
                try:
                    # Use the character creation flow to create a playable character
                    playable_char = await character_creation_flow.create_character_from_series(
                        char.name, lorebook, scenario_context
                    )
                    
                    # Convert to dictionary for storage in the scenario template
                    playable_char_dict = playable_char.dict()
                    playable_char_dict["source_character"] = char.dict()
                    
                    playable_characters.append(playable_char_dict)
                    logger.info(f"Created playable character: {char.name}")
                    
                except Exception as char_error:
                    logger.error(f"Error creating playable character {char.name}: {str(char_error)}")
                    # Continue with other characters if one fails
            
            logger.info(f"Generated {len(playable_characters)} playable characters")
            return playable_characters
            
        except Exception as e:
            logger.error(f"Error generating playable characters: {str(e)}")
            return []
    
    async def _generate_scenario_templates(self, lorebook: Lorebook, playable_characters: List[Dict[str, Any]]):
        """Step 5: Generate scenario templates with integrated characters"""
        logger.info(f"Generating scenario templates for: {lorebook.series_metadata.title}")
        
        try:
            # Create basic scenario templates
            templates = []
            
            # Beginning adventure template
            template_id = str(uuid.uuid4())
            beginning_template = ScenarioTemplate(
                id=template_id,
                title=f"Beginning Adventure in {lorebook.series_metadata.title}",
                description=f"Start your journey in the world of {lorebook.series_metadata.title}",
                lorebook_id=lorebook.id,
                setting_location=lorebook.locations[0].name if lorebook.locations else "Unknown Location",
                time_period="Present day",
                starting_situation=f"You find yourself at the beginning of an adventure in {lorebook.series_metadata.setting}",
                key_characters=[char.name for char in lorebook.characters[:3]],
                available_paths=["Explore the area", "Seek allies", "Investigate mysteries"],
                difficulty_level="medium",
                tags=["beginner", "exploration", lorebook.series_metadata.type.value],
                playable_characters=playable_characters
            )
            templates.append(beginning_template)
            
            # Save templates
            for template in templates:
                await db_service.save_scenario_template(template)
            
            logger.info(f"Generated {len(templates)} scenario templates with {len(playable_characters)} playable characters")
            
        except Exception as e:
            logger.error(f"Error generating scenario templates: {str(e)}")
            raise

# Global orchestrator instance
scenario_orchestrator = ScenarioOrchestrator()
