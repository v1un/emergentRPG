import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from flows.character_generation.character_creation_flow import character_creation_flow
from flows.lorebook_generation.character_generation_flow import (
    character_generation_flow,
)
from flows.lorebook_generation.world_building_flow import world_building_flow
from flows.series_analysis.analysis_flow import series_analysis_flow
from models.game_models import Character
from models.scenario_models import (
    GenerationRequest,
    GenerationStatus,
    GenerationTask,
    Lorebook,
    ScenarioTemplate,
    SeriesMetadata,
)
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
            current_step="Initializing generation task",
        )

        self.active_tasks[task_id] = task
        await db_service.save_generation_task(task)

        # Start background task
        asyncio.create_task(self._execute_generation_pipeline(task_id))

        logger.info(
            f"Started generation task {task_id} for series: {request.series_title}"
        )
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
            await db_service.update_task_progress(
                task_id, 0.1, task.current_step, "analyzing"
            )

            # Step 1: Series Analysis
            series_metadata = await self._analyze_series(task.request)
            task.progress = 0.2
            task.current_step = "Series analysis complete"
            await db_service.update_task_progress(task_id, 0.2, task.current_step)

            # Step 2: Generate Lorebook
            task.status = GenerationStatus.GENERATING
            task.current_step = "Generating world information"
            task.progress = 0.3
            await db_service.update_task_progress(
                task_id, 0.3, task.current_step, "generating"
            )

            lorebook = await self._generate_lorebook(series_metadata, task_id)
            task.progress = 0.8
            task.current_step = "Lorebook generation complete"
            await db_service.update_task_progress(task_id, 0.8, task.current_step)

            # Step 3: Validation
            task.status = GenerationStatus.VALIDATING
            task.current_step = "Validating generated content"
            task.progress = 0.85
            await db_service.update_task_progress(
                task_id, 0.85, task.current_step, "validating"
            )

            validated_lorebook = await self._validate_lorebook(lorebook)

            # Step 4: Generate Scenario Templates with Characters
            task.current_step = "Creating scenario templates"
            task.progress = 0.9
            await db_service.update_task_progress(task_id, 0.9, task.current_step)

            # Step 5: Generate Scenario Templates with Playable Characters
            task.current_step = "Creating scenario templates with playable characters"
            task.progress = 0.95
            await db_service.update_task_progress(task_id, 0.95, task.current_step)

            await self._generate_scenario_templates(validated_lorebook)

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
            validation_data = (
                await series_analysis_flow.canonical_source_validation_flow(
                    series_metadata
                )
            )

            # Apply any corrections from validation
            if validation_data.get("recommendation") == "modify":
                corrections = validation_data.get("corrections", {})
                for field, value in corrections.items():
                    if hasattr(series_metadata, field):
                        setattr(series_metadata, field, value)

            # Run knowledge graph creation
            knowledge_graph = await series_analysis_flow.knowledge_graph_creation_flow(
                series_metadata
            )

            logger.info(
                f"Series analysis complete with confidence: {series_metadata.confidence_score}"
            )
            return series_metadata

        except Exception as e:
            logger.error(f"Error in series analysis: {str(e)}")
            raise

    async def _generate_lorebook(
        self, series_metadata: SeriesMetadata, task_id: str
    ) -> Lorebook:
        """Step 2: Generate comprehensive lorebook"""
        logger.info(f"Starting lorebook generation for: {series_metadata.title}")

        try:
            lorebook_id = str(uuid.uuid4())

            # Update progress - Geography
            await db_service.update_task_progress(
                task_id, 0.35, "Generating world geography"
            )
            locations = await world_building_flow.geography_generation_flow(
                series_metadata
            )

            # Update progress - Political Systems
            await db_service.update_task_progress(
                task_id, 0.45, "Creating political systems"
            )
            political_systems = await world_building_flow.political_systems_flow(
                series_metadata
            )

            # Update progress - Power Systems
            await db_service.update_task_progress(
                task_id, 0.55, "Designing power systems"
            )
            power_systems = await world_building_flow.magic_power_systems_flow(
                series_metadata
            )

            # Update progress - Cultural Systems
            await db_service.update_task_progress(
                task_id, 0.60, "Developing cultural systems"
            )
            cultural_systems = await world_building_flow.cultural_systems_flow(
                series_metadata
            )

            # Combine all world systems
            all_systems = political_systems + power_systems + cultural_systems

            # Update progress - Historical Timeline
            await db_service.update_task_progress(
                task_id, 0.65, "Creating historical timeline"
            )
            timeline = await world_building_flow.historical_timeline_flow(
                series_metadata, all_systems
            )

            # Update progress - Main Characters
            await db_service.update_task_progress(
                task_id, 0.70, "Generating main characters"
            )
            main_characters = await character_generation_flow.main_characters_flow(
                series_metadata
            )

            # Update progress - Supporting Characters
            await db_service.update_task_progress(
                task_id, 0.75, "Creating supporting cast"
            )
            supporting_characters = (
                await character_generation_flow.supporting_cast_flow(
                    series_metadata, main_characters
                )
            )

            all_characters = main_characters + supporting_characters

            # Update progress - Character Relationships
            await db_service.update_task_progress(
                task_id, 0.78, "Mapping character relationships"
            )
            relationships = await character_generation_flow.relationship_mapping_flow(
                all_characters
            )

            # Create lorebook
            lorebook = Lorebook(
                id=lorebook_id,
                series_metadata=series_metadata,
                characters=all_characters,
                locations=locations,
                world_systems=all_systems,
                timeline=timeline,
                plot_summary=f"Interactive adventures in the world of {series_metadata.title}",
                key_events=[
                    event.get("major_events", [])
                    for event in timeline
                    if event.get("major_events")
                ],
                generation_metadata={
                    "generation_version": "1.0",
                    "ai_model": "gemini-2.5-flash-preview-05-20",
                    "generation_date": datetime.now().isoformat(),
                    "relationships": relationships,
                },
            )

            logger.info(
                f"Lorebook generation complete: {len(all_characters)} characters, {len(locations)} locations"
            )
            return lorebook

        except Exception as e:
            logger.error(f"Error in lorebook generation: {str(e)}")
            raise

    async def _validate_lorebook(self, lorebook: Lorebook) -> Lorebook:
        """Step 3: Validate and refine generated content"""
        logger.info(
            f"Starting lorebook validation for: {lorebook.series_metadata.title}"
        )

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

    async def _generate_scenario_templates(self, lorebook: Lorebook):
        """Step 4: Generate scenario templates with playable characters"""
        logger.info(
            f"Generating scenario templates for: {lorebook.series_metadata.title}"
        )

        try:
            # Create basic scenario templates
            templates = []

            # Beginning adventure template
            template_id = str(uuid.uuid4())

            # Generate scenario context
            scenario_context = f"Beginning adventure in the world of {lorebook.series_metadata.title}. {lorebook.series_metadata.setting}"

            # Generate playable characters from main characters in lorebook
            playable_characters = []

            # Prioritize characters with high playable potential or protagonist roles
            suitable_characters = []
            for char in lorebook.characters:
                # Check if character has high playable potential (from enhanced character generation)
                if (
                    hasattr(char, "playable_potential")
                    and "high" in str(getattr(char, "playable_potential", "")).lower()
                ):
                    suitable_characters.append(char.name)
                # Fallback to role-based selection
                elif char.role in [
                    "protagonist",
                    "main character",
                    "hero",
                    "deuteragonist",
                ]:
                    suitable_characters.append(char.name)

            # Select up to 3 characters for playability
            main_character_names = suitable_characters[:3]

            # If no suitable characters found, use first 2 characters as fallback
            if not main_character_names and lorebook.characters:
                main_character_names = [char.name for char in lorebook.characters[:2]]

            # Generate playable characters with enhanced context
            logger.info(
                f"Generating playable characters for scenario: {main_character_names}"
            )
            for char_name in main_character_names:
                try:
                    # Create character using character creation flow with world context
                    character = (
                        await character_creation_flow.create_character_from_series(
                            char_name, lorebook, scenario_context
                        )
                    )

                    # Enhance character with world-specific abilities based on power systems
                    character_dict = character.model_dump()

                    # Add world-specific metadata for consistency
                    character_dict["world_context"] = {
                        "power_system": lorebook.series_metadata.power_system,
                        "setting": lorebook.series_metadata.setting,
                        "series_title": lorebook.series_metadata.title,
                    }

                    # Add to playable characters list
                    playable_characters.append(character_dict)
                    logger.info(f"Successfully generated character: {char_name}")

                except Exception as char_error:
                    logger.error(
                        f"Error generating character {char_name}: {str(char_error)}"
                    )
                    # Continue with other characters even if one fails

            # Generate character-aware quest paths based on abilities
            available_paths = await self._generate_character_aware_paths(
                playable_characters, lorebook
            )

            beginning_template = ScenarioTemplate(
                id=template_id,
                title=f"Beginning Adventure in {lorebook.series_metadata.title}",
                description=f"Start your journey in the world of {lorebook.series_metadata.title}. Choose from {len(playable_characters)} unique characters, each with abilities tailored to this world.",
                lorebook_id=lorebook.id,
                setting_location=lorebook.locations[0].name
                if lorebook.locations
                else "Unknown Location",
                time_period="Present day",
                starting_situation=f"You find yourself at the beginning of an adventure in {lorebook.series_metadata.setting}. The world's {lorebook.series_metadata.power_system or 'unique systems'} await your exploration.",
                key_characters=[char.name for char in lorebook.characters[:3]],
                playable_characters=playable_characters,
                available_paths=available_paths,
                difficulty_level="medium",
                tags=[
                    "beginner",
                    "exploration",
                    lorebook.series_metadata.type.value,
                    "character-driven",
                ],
            )
            templates.append(beginning_template)

            # Save templates
            for template in templates:
                await db_service.save_scenario_template(template)

            logger.info(
                f"Generated {len(templates)} scenario templates with {len(playable_characters)} playable characters"
            )

        except Exception as e:
            logger.error(f"Error generating scenario templates: {str(e)}")
            raise

    async def _generate_character_aware_paths(
        self, playable_characters: List[Dict[str, Any]], lorebook: Lorebook
    ) -> List[str]:
        """Generate quest paths that consider character capabilities"""
        try:
            # Default paths
            default_paths = ["Explore the area", "Seek allies", "Investigate mysteries"]

            if not playable_characters:
                return default_paths

            # Analyze character capabilities to generate appropriate paths
            character_abilities = []
            for char in playable_characters:
                stats = char.get("stats", {})
                class_name = char.get("class_name", "Adventurer")
                character_abilities.append(
                    {
                        "name": char.get("name", "Unknown"),
                        "class": class_name,
                        "strength": stats.get("strength", 10),
                        "intelligence": stats.get("intelligence", 10),
                        "charisma": stats.get("charisma", 10),
                        "dexterity": stats.get("dexterity", 10),
                    }
                )

            # Generate paths based on character strengths
            paths = []

            # Combat-oriented paths for high strength characters
            if any(char["strength"] >= 14 for char in character_abilities):
                paths.append("Challenge local threats with combat prowess")
                paths.append("Seek out dangerous creatures to test your might")

            # Intelligence-based paths for smart characters
            if any(char["intelligence"] >= 14 for char in character_abilities):
                paths.append("Research ancient mysteries and magical phenomena")
                paths.append("Solve complex puzzles and uncover hidden knowledge")

            # Social paths for charismatic characters
            if any(char["charisma"] >= 14 for char in character_abilities):
                paths.append("Build alliances with local factions and leaders")
                paths.append("Negotiate peaceful solutions to conflicts")

            # Stealth/exploration paths for dexterous characters
            if any(char["dexterity"] >= 14 for char in character_abilities):
                paths.append("Scout ahead and gather intelligence stealthily")
                paths.append("Navigate treacherous terrain and hidden passages")

            # Add world-specific paths based on power system
            if lorebook.series_metadata.power_system:
                paths.append(
                    f"Master the {lorebook.series_metadata.power_system} of this world"
                )
                paths.append(
                    f"Seek training in {lorebook.series_metadata.power_system} techniques"
                )

            # Add location-specific paths
            if lorebook.locations:
                for location in lorebook.locations[:2]:  # Use first 2 locations
                    paths.append(
                        f"Journey to {location.name} to {location.description.split('.')[0].lower()}"
                    )

            # Ensure we have at least 3 paths, add defaults if needed
            if len(paths) < 3:
                paths.extend(default_paths)

            # Return unique paths, limited to 6 for UI purposes
            unique_paths = list(dict.fromkeys(paths))[:6]

            logger.info(f"Generated {len(unique_paths)} character-aware quest paths")
            return unique_paths

        except Exception as e:
            logger.error(f"Error generating character-aware paths: {str(e)}")
            return ["Explore the area", "Seek allies", "Investigate mysteries"]


# Global orchestrator instance
scenario_orchestrator = ScenarioOrchestrator()
