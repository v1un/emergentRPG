import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from config.settings import settings
from services.database_service import db_service
from services.scenario_generation.scenario_orchestrator import scenario_orchestrator
from flows.gameplay.realtime_gameplay_flow import realtime_gameplay_flow
from flows.character_generation.character_creation_flow import character_creation_flow

from models.game_models import GameSession, Character, StoryEntry, ActionType, WorldState, CharacterStats
from models.scenario_models import (
    GenerationRequest, GenerationTask, Lorebook, ScenarioTemplate, 
    SeriesType, GenerationStatus
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Dungeon Backend...")
    try:
        await db_service.connect()
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Dungeon Backend...")
    await db_service.disconnect()
    logger.info("Application shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="AI Dungeon Backend",
    description="Advanced AI-Generated Scenario System with Gemini + Genkit",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# ===== SCENARIO GENERATION ENDPOINTS =====

@app.post("/api/scenarios/generate")
async def start_scenario_generation(request: GenerationRequest):
    """Start AI generation of a new scenario from a series"""
    try:
        task_id = await scenario_orchestrator.start_generation_task(request)
        return {
            "task_id": task_id,
            "status": "started",
            "message": f"Started generating scenario for {request.series_title}"
        }
    except Exception as e:
        logger.error(f"Error starting scenario generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios/generate/{task_id}")
async def get_generation_status(task_id: str):
    """Get status of scenario generation task"""
    try:
        task = await scenario_orchestrator.get_task_status(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        response_data = {
            "task_id": task.task_id,
            "status": task.status.value,
            "progress": task.progress,
            "current_step": task.current_step,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
        
        if task.status == GenerationStatus.COMPLETED and task.result:
            response_data["lorebook_id"] = task.result.id
            response_data["series_title"] = task.result.series_metadata.title
        
        if task.status == GenerationStatus.FAILED and task.error_message:
            response_data["error"] = task.error_message
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting generation status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/scenarios/generate/{task_id}")
async def cancel_generation_task(task_id: str):
    """Cancel an active generation task"""
    try:
        success = await scenario_orchestrator.cancel_task(task_id)
        if not success:
            raise HTTPException(status_code=404, detail="Task not found or already completed")
        
        return {"message": "Task cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== LOREBOOK MANAGEMENT ENDPOINTS =====

@app.get("/api/lorebooks")
async def list_lorebooks(
    series_title: Optional[str] = None,
    genre: Optional[str] = None,
    limit: int = 20
):
    """List available lorebooks with optional filtering"""
    try:
        lorebooks = await db_service.search_lorebooks(series_title, genre, limit)
        
        return {
            "lorebooks": [
                {
                    "id": lb.id,
                    "title": lb.series_metadata.title,
                    "type": lb.series_metadata.type.value,
                    "genre": lb.series_metadata.genre,
                    "setting": lb.series_metadata.setting,
                    "characters_count": len(lb.characters),
                    "locations_count": len(lb.locations),
                    "created_at": lb.created_at.isoformat()
                }
                for lb in lorebooks
            ]
        }
        
    except Exception as e:
        logger.error(f"Error listing lorebooks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lorebooks/{lorebook_id}")
async def get_lorebook_details(lorebook_id: str):
    """Get detailed information about a specific lorebook"""
    try:
        lorebook = await db_service.get_lorebook(lorebook_id)
        if not lorebook:
            raise HTTPException(status_code=404, detail="Lorebook not found")
        
        return {
            "lorebook": lorebook.model_dump(),
            "summary": {
                "characters_count": len(lorebook.characters),
                "locations_count": len(lorebook.locations),
                "world_systems_count": len(lorebook.world_systems),
                "timeline_events": len(lorebook.timeline)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lorebook details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/lorebooks/{lorebook_id}")
async def delete_lorebook(lorebook_id: str):
    """Delete a lorebook"""
    try:
        success = await db_service.delete_lorebook(lorebook_id)
        if not success:
            raise HTTPException(status_code=404, detail="Lorebook not found")
        
        return {"message": "Lorebook deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lorebook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== GAME SESSION ENDPOINTS =====

@app.post("/api/game/sessions")
async def create_game_session(
    lorebook_id: Optional[str] = None,
    character_name: Optional[str] = None,
    scenario_template_id: Optional[str] = None,
    scenario_type: str = "custom"
):
    """Create a new game session"""
    try:
        session_id = str(uuid.uuid4())
        
        # Get lorebook if specified
        lorebook = None
        if lorebook_id:
            lorebook = await db_service.get_lorebook(lorebook_id)
            if not lorebook:
                raise HTTPException(status_code=404, detail="Lorebook not found")
        
        # Get scenario template if specified
        scenario_template = None
        if scenario_template_id:
            scenario_template = await db_service.get_scenario_template(scenario_template_id)
            if not scenario_template:
                raise HTTPException(status_code=404, detail="Scenario template not found")
            
            # If we have a scenario template but no lorebook, get the lorebook from the template
            if not lorebook and scenario_template.lorebook_id:
                lorebook = await db_service.get_lorebook(scenario_template.lorebook_id)
        
        # Create character
        if scenario_template and scenario_template.playable_characters and character_name:
            # Find the selected character in the template's playable characters
            selected_character = None
            for char_data in scenario_template.playable_characters:
                if char_data.get("name") == character_name:
                    # Create character from template data
                    selected_character = Character(**char_data)
                    break
            
            if not selected_character and lorebook:
                # If character not found in template but name and lorebook provided, create it
                character = await character_creation_flow.create_character_from_series(
                    character_name, lorebook, scenario_template.starting_situation
                )
            else:
                character = selected_character or Character(
                    name=character_name or "Adventurer",
                    level=1,
                    health=100,
                    max_health=100,
                    mana=50,
                    max_mana=50,
                    experience=0,
                    stats=CharacterStats(),
                    class_name="Adventurer"
                )
        elif character_name and lorebook:
            # Create character from series
            character = await character_creation_flow.create_character_from_series(
                character_name, lorebook, "Beginning adventure"
            )
        else:
            # Create default character
            character = Character(
                name=character_name or "Adventurer",
                level=1,
                health=100,
                max_health=100,
                mana=50,
                max_mana=50,
                experience=0,
                stats=CharacterStats(),
                class_name="Adventurer"
            )
        
        # Create initial world state
        world_state = WorldState(
            current_location=lorebook.locations[0].name if lorebook and lorebook.locations else "Unknown Location",
            time_of_day="morning",
            weather="clear",
            environment_description=lorebook.locations[0].description if lorebook and lorebook.locations else "A mysterious place"
        )
        
        # Create initial story
        initial_story = []
        if lorebook:
            intro_text = f"Welcome to the world of {lorebook.series_metadata.title}. {lorebook.series_metadata.setting}"
            initial_story.append(StoryEntry(type=ActionType.NARRATION, text=intro_text))
        
        # Create game session
        session = GameSession(
            session_id=session_id,
            character=character,
            inventory=[],
            quests=[],
            story=initial_story,
            world_state=world_state,
            scenario_id=None,
            lorebook_id=lorebook_id
        )
        
        # Save session
        success = await db_service.save_game_session(session)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save game session")
        
        return {
            "session_id": session_id,
            "character": character.model_dump(),
            "world_state": world_state.model_dump(),
            "story": [entry.model_dump() for entry in initial_story]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/game/sessions/{session_id}")
async def get_game_session(session_id: str):
    """Get game session details"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        return {
            "session": session.model_dump(),
            "summary": {
                "character_level": session.character.level,
                "story_length": len(session.story),
                "current_location": session.world_state.current_location,
                "last_updated": session.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/game/sessions/{session_id}/action")
async def perform_game_action(session_id: str, action_data: Dict[str, Any]):
    """Perform a game action and get AI response"""
    try:
        # Get game session
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        # Get player action
        player_action = action_data.get("action", "").strip()
        if not player_action:
            raise HTTPException(status_code=400, detail="Action text is required")
        
        # Get lorebook if available
        lorebook = None
        if session.lorebook_id:
            lorebook = await db_service.get_lorebook(session.lorebook_id)
        
        # Execute turn using realtime gameplay flow
        result = await realtime_gameplay_flow.execute_full_turn(
            player_action, session, lorebook
        )
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error occurred")
            fallback_response = result.get("fallback_response", "Please try a different action.")
            
            # Add fallback response to story
            fallback_entry = StoryEntry(type=ActionType.NARRATION, text=fallback_response)
            session.story.append(fallback_entry)
            await db_service.save_game_session(session)
            
            return {
                "success": False,
                "error": error_msg,
                "fallback_response": fallback_response,
                "updated_session": session.model_dump()
            }
        
        # Save updated session
        updated_session = result["updated_session"]
        await db_service.save_game_session(updated_session)
        
        return {
            "success": True,
            "gm_response": result["gm_response"],
            "updated_session": updated_session.model_dump(),
            "action_analysis": result.get("action_analysis", {}),
            "consistency_score": result.get("consistency_check", {}).get("consistency_score", 0.8)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing game action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/game/sessions/{session_id}")
async def delete_game_session(session_id: str):
    """Delete a game session"""
    try:
        success = await db_service.delete_game_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Game session not found")
        
        return {"message": "Game session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== SCENARIO TEMPLATES ENDPOINTS =====

@app.get("/api/scenarios/templates")
async def list_scenario_templates(
    lorebook_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    difficulty: Optional[str] = None,
    limit: int = 20
):
    """List available scenario templates"""
    try:
        if lorebook_id:
            templates = await db_service.get_scenario_templates_by_lorebook(lorebook_id)
        else:
            templates = await db_service.search_scenario_templates(tags, difficulty, limit)
        
        return {
            "templates": [
                {
                    "id": template.id,
                    "title": template.title,
                    "description": template.description,
                    "lorebook_id": template.lorebook_id,
                    "difficulty_level": template.difficulty_level,
                    "estimated_duration": template.estimated_duration,
                    "tags": template.tags,
                    "has_playable_characters": len(template.playable_characters) > 0,
                    "playable_character_count": len(template.playable_characters),
                    "created_at": template.created_at.isoformat()
                }
                for template in templates
            ]
        }
        
    except Exception as e:
        logger.error(f"Error listing scenario templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios/templates/{template_id}")
async def get_scenario_template(template_id: str):
    """Get detailed information about a specific scenario template"""
    try:
        template = await db_service.get_scenario_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Scenario template not found")
        
        return {
            "template": template.model_dump(),
            "summary": {
                "playable_character_count": len(template.playable_characters),
                "key_characters_count": len(template.key_characters),
                "available_paths_count": len(template.available_paths)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scenario template details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios/templates/{template_id}/characters")
async def get_template_playable_characters(template_id: str):
    """Get playable characters for a specific scenario template"""
    try:
        template = await db_service.get_scenario_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Scenario template not found")
        
        return {
            "characters": [
                {
                    "name": char.get("name", "Unknown"),
                    "class_name": char.get("class_name", "Adventurer"),
                    "level": char.get("level", 1),
                    "background": char.get("background", "Unknown background"),
                    "stats": char.get("stats", {})
                }
                for char in template.playable_characters
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template characters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== CHARACTER CREATION ENDPOINTS =====

@app.post("/api/characters/create-from-series")
async def create_character_from_series_endpoint(
    character_data: Dict[str, Any]
):
    """Create a character based on an existing series character"""
    try:
        character_name = character_data.get("character_name")
        lorebook_id = character_data.get("lorebook_id")
        scenario_context = character_data.get("scenario_context", "")
        
        if not character_name or not lorebook_id:
            raise HTTPException(status_code=400, detail="character_name and lorebook_id are required")
        
        # Get lorebook
        lorebook = await db_service.get_lorebook(lorebook_id)
        if not lorebook:
            raise HTTPException(status_code=404, detail="Lorebook not found")
        
        # Create character
        character = await character_creation_flow.create_character_from_series(
            character_name, lorebook, scenario_context
        )
        
        return {
            "character": character.model_dump(),
            "source_series": lorebook.series_metadata.title,
            "message": f"Successfully created character {character_name} from {lorebook.series_metadata.title}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating character from series: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
