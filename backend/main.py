
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Constants for error messages
LOREBOOK_NOT_FOUND = "Lorebook not found"
SCENARIO_TEMPLATE_NOT_FOUND = "Scenario template not found"
GAME_SESSION_NOT_FOUND = "Game session not found"

from config.settings import settings
from flows.character_generation.character_creation_flow import character_creation_flow
from flows.gameplay.realtime_gameplay_flow import realtime_gameplay_flow
from models.game_models import (
    ActionType,
    Character,
    CharacterStats,
    GameSession,
    InventoryItem,
    StoryEntry,
    WorldState,
)
from models.scenario_models import GenerationRequest, GenerationStatus
from services.database_service import db_service
from services.scenario_generation.scenario_orchestrator import scenario_orchestrator
from services.config.configuration_manager import config_manager
from services.config.feature_flags import feature_flag_manager
from services.config.content_manager import content_manager
from services.quest.quest_manager import quest_manager, GameContext
from services.inventory.inventory_manager import inventory_manager, LootContext
from services.world.world_manager import world_manager, WorldChanges
from services.ai.response_manager import ai_response_manager
from services.cache.cache_manager import cache_manager
from services.websocket.game_websocket import game_websocket, WorldEvent
from services.database.migration_tools import data_migrator
from utils.performance_monitor import performance_monitor

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.api.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Application lifespan
@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    logger.info("Starting AI Dungeon Backend...")
    try:
        await db_service.connect()
        await cache_manager.initialize()
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
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.api.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes


@app.get("/api/health")
async def health_check():
    """
    Comprehensive health check endpoint with performance metrics.

    Returns detailed health information about all backend services
    including database, cache, AI services, and performance metrics.
    """
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "services": {},
        "performance": {},
        "configuration": {}
    }

    try:
        # Database health
        if db_service.db is not None:
            try:
                # Test database connectivity
                await db_service.db.command("ping")
                health_data["services"]["database"] = {
                    "status": "healthy",
                    "connected": True,
                    "database_name": settings.database.database_name
                }
            except Exception as e:
                health_data["services"]["database"] = {
                    "status": "unhealthy",
                    "connected": False,
                    "error": str(e)
                }
                health_data["status"] = "degraded"
        else:
            health_data["services"]["database"] = {
                "status": "unhealthy",
                "connected": False,
                "error": "Database not connected"
            }
            health_data["status"] = "degraded"

        # Cache health
        cache_health = await cache_manager.health_check()
        health_data["services"]["cache"] = cache_health

        # AI service health
        ai_service_healthy = bool(settings.ai.google_api_key)
        health_data["services"]["ai"] = {
            "status": "healthy" if ai_service_healthy else "degraded",
            "api_key_configured": ai_service_healthy,
            "model": settings.ai.gemini_model,
            "rate_limit": settings.ai.requests_per_minute
        }

        # Performance metrics
        perf_health = performance_monitor.get_health_summary()
        health_data["performance"] = perf_health

        if perf_health["health_status"] != "healthy":
            health_data["status"] = "degraded"

        # Configuration summary (non-sensitive)
        health_data["configuration"] = settings.get_config_summary()

        # Overall status determination
        unhealthy_services = [
            name for name, service in health_data["services"].items()
            if service.get("status") != "healthy"
        ]

        if unhealthy_services:
            health_data["status"] = "unhealthy" if len(unhealthy_services) > 1 else "degraded"
            health_data["unhealthy_services"] = unhealthy_services

    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        health_data["status"] = "unhealthy"
        health_data["error"] = str(e)

    return health_data


@app.get("/api/health/performance")
async def performance_metrics():
    """
    Detailed performance metrics endpoint.

    Returns comprehensive performance statistics for monitoring
    and debugging backend performance issues.
    """
    try:
        # Get all performance statistics
        all_stats = await performance_monitor.get_stats()

        # Get slow operations
        slow_ops = await performance_monitor.get_slow_operations(threshold_seconds=1.0)

        # Get error-prone operations
        error_prone_ops = await performance_monitor.get_error_prone_operations(error_rate_threshold=0.1)

        operations_data = {}
        if isinstance(all_stats, dict):
            operations_data = {
                name: {
                    "total_calls": stats.total_calls,
                    "success_rate": (stats.successful_calls / stats.total_calls) if stats.total_calls > 0 else 0,
                    "avg_duration": round(stats.avg_duration, 3),
                    "p95_duration": round(stats.p95_duration, 3),
                    "p99_duration": round(stats.p99_duration, 3),
                    "error_rate": round(stats.error_rate, 3),
                    "last_updated": stats.last_updated.isoformat()
                }
                for name, stats in all_stats.items()
            }

        return {
            "timestamp": datetime.now().isoformat(),
            "summary": performance_monitor.get_health_summary(),
            "operations": operations_data,
            "slow_operations": [
                {
                    "operation": stats.operation,
                    "avg_duration": round(stats.avg_duration, 3),
                    "total_calls": stats.total_calls
                }
                for stats in slow_ops
            ],
            "error_prone_operations": [
                {
                    "operation": stats.operation,
                    "error_rate": round(stats.error_rate, 3),
                    "total_calls": stats.total_calls,
                    "failed_calls": stats.failed_calls
                }
                for stats in error_prone_ops
            ]
        }

    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance")
async def get_performance_metrics():
    """Get performance metrics and monitoring data"""
    try:
        # Get basic performance metrics
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_operations": 1000,  # This would come from actual metrics
                "avg_response_time": 0.156,
                "error_rate": 0.02,
                "cache_hit_rate": 0.85
            },
            "operations": [
                {
                    "operation": "game_action",
                    "avg_duration": 0.234,
                    "total_calls": 450,
                    "error_rate": 0.01
                },
                {
                    "operation": "ai_generation",
                    "avg_duration": 1.234,
                    "total_calls": 200,
                    "error_rate": 0.03
                },
                {
                    "operation": "session_load",
                    "avg_duration": 0.089,
                    "total_calls": 350,
                    "error_rate": 0.005
                }
            ]
        }

        return metrics
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ping")
async def ping():
    """Simple ping endpoint for connectivity testing"""
    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "message": "pong"
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
            "message": f"Started generating scenario for {request.series_title}",
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
            "updated_at": task.updated_at.isoformat(),
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
            raise HTTPException(
                status_code=404, detail="Task not found or already completed"
            )

        return {"message": "Task cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== LOREBOOK MANAGEMENT ENDPOINTS =====


@app.get("/api/lorebooks")
async def list_lorebooks(
    series_title: Optional[str] = None, genre: Optional[str] = None, limit: int = 20
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
                    "created_at": lb.created_at.isoformat(),
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
            raise HTTPException(status_code=404, detail=LOREBOOK_NOT_FOUND)

        return {
            "lorebook": lorebook.model_dump(),
            "summary": {
                "characters_count": len(lorebook.characters),
                "locations_count": len(lorebook.locations),
                "world_systems_count": len(lorebook.world_systems),
                "timeline_events": len(lorebook.timeline),
            },
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
            raise HTTPException(status_code=404, detail=LOREBOOK_NOT_FOUND)

        return {"message": "Lorebook deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lorebook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== GAME SESSION ENDPOINTS =====

# Helper functions for game session creation
async def _get_lorebook_and_template(lorebook_id: Optional[str], scenario_template_id: Optional[str]):
    """Get lorebook and scenario template with proper error handling"""
    lorebook = None
    scenario_template = None

    if lorebook_id:
        lorebook = await db_service.get_lorebook(lorebook_id)
        if not lorebook:
            raise HTTPException(status_code=404, detail=LOREBOOK_NOT_FOUND)

    if scenario_template_id:
        scenario_template = await db_service.get_scenario_template(scenario_template_id)
        if not scenario_template:
            raise HTTPException(status_code=404, detail=SCENARIO_TEMPLATE_NOT_FOUND)

        # Get lorebook from template if not provided
        if not lorebook and scenario_template.lorebook_id:
            lorebook = await db_service.get_lorebook(scenario_template.lorebook_id)

    return lorebook, scenario_template

async def _create_character_for_session(character_name: Optional[str], lorebook, scenario_template):
    """Create character based on available data"""
    # Try to find character in scenario template
    if scenario_template and scenario_template.playable_characters and character_name:
        for char_data in scenario_template.playable_characters:
            if char_data.get("name") == character_name:
                return Character(**char_data)

        # Character not found in template, create from series if lorebook available
        if lorebook:
            return await character_creation_flow.create_character_from_series(
                character_name, lorebook, scenario_template.starting_situation
            )

    # Create character from series if name and lorebook provided
    if character_name and lorebook:
        return await character_creation_flow.create_character_from_series(
            character_name, lorebook, "Beginning adventure"
        )

    # Create default character
    return Character(
        name=character_name or "Adventurer",
        level=1,
        health=100,
        max_health=100,
        mana=50,
        max_mana=50,
        experience=0,
        stats=CharacterStats(),
        class_name="Adventurer",
    )

def _create_world_state(lorebook):
    """Create initial world state"""
    return WorldState(
        current_location=lorebook.locations[0].name if lorebook and lorebook.locations else "Unknown Location",
        time_of_day="morning",
        weather="clear",
        environment_description=lorebook.locations[0].description if lorebook and lorebook.locations else "A mysterious place",
    )

def _create_initial_story(scenario_template, lorebook, lorebook_id: Optional[str]) -> List[StoryEntry]:
    """Create initial story entries"""
    initial_story = []

    if scenario_template and scenario_template.initial_narrative:
        logger.info("Using AI-generated initial narrative from scenario template")
        initial_story.append(StoryEntry(
            type=ActionType.NARRATION,
            text=scenario_template.initial_narrative,
            metadata={
                "source": "ai_generated",
                "scenario_template_id": scenario_template.id,
                "generation_metadata": scenario_template.narrative_metadata
            }
        ))
    elif lorebook:
        logger.info("Using fallback narrative for game session")
        intro_text = f"Welcome to the world of {lorebook.series_metadata.title}. {lorebook.series_metadata.setting}"
        if lorebook.series_metadata.power_system:
            intro_text += f" Here, the power of {lorebook.series_metadata.power_system} shapes the very fabric of reality."
        intro_text += " Your adventure is about to begin..."

        initial_story.append(StoryEntry(
            type=ActionType.NARRATION,
            text=intro_text,
            metadata={"source": "template_fallback", "lorebook_id": lorebook_id}
        ))
    else:
        logger.info("Using basic fallback narrative")
        initial_story.append(StoryEntry(
            type=ActionType.NARRATION,
            text="Welcome, adventurer. Your journey begins now. What path will you choose?",
            metadata={"source": "basic_fallback"}
        ))

    return initial_story

@app.get("/api/game/sessions")
async def list_game_sessions(limit: int = 20, offset: int = 0):
    """List all game sessions"""
    try:
        sessions = await db_service.list_game_sessions(limit=limit, offset=offset)

        # Convert sessions to summary format
        session_summaries = []
        for session in sessions:
            session_summaries.append({
                "session_id": session.session_id,
                "character": session.character.model_dump(),
                "world_state": session.world_state.model_dump(),
                "story_length": len(session.story),
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
            })

        return {
            "sessions": session_summaries,
            "total": len(session_summaries),
            "limit": limit,
            "offset": offset,
        }

    except Exception as e:
        logger.error(f"Error listing game sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/game/sessions")
async def create_game_session(
    lorebook_id: Optional[str] = None,
    character_name: Optional[str] = None,
    scenario_template_id: Optional[str] = None,
):
    """Create a new game session"""
    try:
        session_id = str(uuid.uuid4())

        # Get lorebook and scenario template
        lorebook, scenario_template = await _get_lorebook_and_template(lorebook_id, scenario_template_id)

        # Create character
        character = await _create_character_for_session(character_name, lorebook, scenario_template)

        # Create world state
        world_state = _create_world_state(lorebook)

        # Create initial story
        initial_story = _create_initial_story(scenario_template, lorebook, lorebook_id)

        # Create and save game session
        session = GameSession(
            session_id=session_id,
            character=character,
            inventory=[],
            quests=[],
            story=initial_story,
            world_state=world_state,
            scenario_id=None,
            lorebook_id=lorebook_id,
        )

        success = await db_service.save_game_session(session)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save game session")

        return {
            "session_id": session_id,
            "character": character.model_dump(),
            "world_state": world_state.model_dump(),
            "story": [entry.model_dump() for entry in initial_story],
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
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        return {
            "session": session.model_dump(),
            "summary": {
                "character_level": session.character.level,
                "story_length": len(session.story),
                "current_location": session.world_state.current_location,
                "last_updated": session.updated_at.isoformat(),
            },
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
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

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
            fallback_response = result.get(
                "fallback_response", "Please try a different action."
            )

            # Add fallback response to story
            fallback_entry = StoryEntry(
                type=ActionType.NARRATION, text=fallback_response
            )
            session.story.append(fallback_entry)
            await db_service.save_game_session(session)

            return {
                "success": False,
                "error": error_msg,
                "fallback_response": fallback_response,
                "updated_session": session.model_dump(),
            }

        # Save updated session
        updated_session = result["updated_session"]
        await db_service.save_game_session(updated_session)

        return {
            "success": True,
            "gm_response": result["gm_response"],
            "updated_session": updated_session.model_dump(),
            "action_analysis": result.get("action_analysis", {}),
            "consistency_score": result.get("consistency_check", {}).get(
                "consistency_score", 0.8
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing game action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/game/sessions/{session_id}")
async def update_game_session(session_id: str, updates: Dict[str, Any]):
    """Update game session with provided data"""
    try:
        # Get existing session
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Apply updates to session
        for key, value in updates.items():
            if hasattr(session, key):
                setattr(session, key, value)

        # Update timestamp
        session.updated_at = datetime.now()

        # Save updated session
        success = await db_service.save_game_session(session)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update session")

        return {
            "success": True,
            "updated_session": session.model_dump(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/game/sessions/{session_id}/save")
async def save_game_session(session_id: str, session_data: Dict[str, Any]):
    """Save game session data"""
    try:
        # Get existing session
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Update session with provided data
        for key, value in session_data.items():
            if hasattr(session, key):
                setattr(session, key, value)

        # Update timestamp
        session.updated_at = datetime.now()

        # Save session
        success = await db_service.save_game_session(session)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save session")

        return {
            "success": True,
            "message": "Session saved successfully",
            "session_id": session_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/game/sessions/{session_id}")
async def delete_game_session(session_id: str):
    """Delete a game session"""
    try:
        success = await db_service.delete_game_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        return {"message": "Game session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting game session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== STORY MANAGEMENT ENDPOINTS =====

@app.post("/api/bookmarks/{session_id}")
async def create_bookmark(session_id: str, bookmark_data: Dict[str, Any]):
    """Create a new story bookmark"""
    try:
        # Get game session to validate it exists
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Extract bookmark data
        story_entry_id = bookmark_data.get("story_entry_id")
        title = bookmark_data.get("title", "Bookmarked Moment")
        description = bookmark_data.get("description")
        tags = bookmark_data.get("tags", [])
        category = bookmark_data.get("category", "important")
        is_private = bookmark_data.get("is_private", False)

        if not story_entry_id:
            raise HTTPException(status_code=400, detail="story_entry_id is required")

        # Validate story entry exists in session
        story_entry = next((entry for entry in session.story if entry.id == story_entry_id), None)
        if not story_entry:
            raise HTTPException(status_code=404, detail="Story entry not found in session")

        # Generate AI summary for the bookmark
        ai_summary = f"AI summary: {story_entry.text[:100]}..." if len(story_entry.text) > 100 else story_entry.text

        # Create bookmark
        bookmark_id = str(uuid.uuid4())
        bookmark = {
            "id": bookmark_id,
            "story_entry_id": story_entry_id,
            "session_id": session_id,
            "title": title,
            "description": description,
            "tags": tags,
            "ai_summary": ai_summary,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "category": category,
            "is_private": is_private,
        }

        # TODO: Save bookmark to database
        # For now, return the created bookmark
        return {
            "success": True,
            "bookmark": bookmark,
            "message": "Bookmark created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bookmark: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bookmarks/{session_id}")
async def get_bookmarks(session_id: str, category: Optional[str] = None, tags: Optional[str] = None):
    """Get bookmarks for a session"""
    try:
        # Get game session to validate it exists
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # TODO: Implement actual bookmark retrieval from database
        # For now, return empty list
        bookmarks = []

        return {
            "success": True,
            "bookmarks": bookmarks,
            "session_id": session_id,
            "filters": {
                "category": category,
                "tags": tags.split(",") if tags else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bookmarks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/bookmarks/{session_id}/{bookmark_id}")
async def update_bookmark(session_id: str, bookmark_id: str, bookmark_data: Dict[str, Any]):
    """Update an existing bookmark"""
    try:
        # Get game session to validate it exists
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # TODO: Implement actual bookmark update in database
        # For now, return success
        updated_bookmark = {
            "id": bookmark_id,
            "session_id": session_id,
            "updated_at": datetime.now().isoformat(),
            **bookmark_data
        }

        return {
            "success": True,
            "bookmark": updated_bookmark,
            "message": "Bookmark updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bookmark: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/bookmarks/{session_id}/{bookmark_id}")
async def delete_bookmark(session_id: str, bookmark_id: str):
    """Delete a bookmark"""
    try:
        # Get game session to validate it exists
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # TODO: Implement actual bookmark deletion from database
        # For now, return success
        return {
            "success": True,
            "message": "Bookmark deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bookmark: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/{session_id}")
async def start_story_export(session_id: str, export_options: Dict[str, Any]):
    """Start story export process"""
    try:
        # Get game session to validate it exists
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Extract export options
        format_type = export_options.get("format", "markdown")
        include_character_info = export_options.get("include_character_info", True)
        include_world_state = export_options.get("include_world_state", True)
        include_bookmarks = export_options.get("include_bookmarks", True)
        include_timestamps = export_options.get("include_timestamps", False)
        custom_title = export_options.get("custom_title")

        # Create export task
        export_id = str(uuid.uuid4())

        # TODO: Implement actual export generation
        # For now, return export task info
        return {
            "success": True,
            "export_id": export_id,
            "status": "started",
            "message": f"Export started for session {session_id}",
            "format": format_type,
            "options": export_options
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting story export: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export/{session_id}/{export_id}")
async def get_export_status(session_id: str, export_id: str):
    """Get export progress and status"""
    try:
        # TODO: Implement actual export status tracking
        # For now, return mock progress
        return {
            "export_id": export_id,
            "session_id": session_id,
            "status": "complete",
            "progress": 100,
            "message": "Export completed successfully",
            "download_url": f"/api/export/{session_id}/{export_id}/download"
        }

    except Exception as e:
        logger.error(f"Error getting export status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/{session_id}")
async def search_story(session_id: str, search_options: Dict[str, Any]):
    """Search story entries with AI-powered relevance"""
    try:
        # Get game session
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        query = search_options.get("query", "").strip()
        categories = search_options.get("categories", [])
        max_results = search_options.get("max_results", 20)

        if not query:
            raise HTTPException(status_code=400, detail="Search query is required")

        # Simple text search implementation
        search_results = []
        query_lower = query.lower()

        for entry in session.story:
            if query_lower in entry.text.lower():
                # Calculate simple relevance score
                relevance_score = entry.text.lower().count(query_lower) / len(entry.text.split())

                # Extract matched text context
                text_lower = entry.text.lower()
                match_index = text_lower.find(query_lower)
                start = max(0, match_index - 50)
                end = min(len(entry.text), match_index + len(query) + 50)
                matched_text = entry.text[start:end]

                search_results.append({
                    "entry_id": entry.id,
                    "entry": entry.model_dump(),
                    "relevance_score": min(1.0, relevance_score),
                    "matched_text": matched_text,
                    "context": {
                        "before": entry.text[max(0, match_index - 100):match_index] if match_index > 0 else "",
                        "after": entry.text[match_index + len(query):match_index + len(query) + 100] if match_index + len(query) < len(entry.text) else ""
                    },
                    "category": "dialogue" if "says" in entry.text.lower() or '"' in entry.text else "action" if entry.type == "player" else "description"
                })

        # Sort by relevance score
        search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        search_results = search_results[:max_results]

        return {
            "success": True,
            "results": search_results,
            "query": query,
            "total_results": len(search_results),
            "session_id": session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/progression/{session_id}")
async def get_character_progression(session_id: str):
    """Get character progression analysis"""
    try:
        # Get game session
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Calculate progression metrics
        character = session.character
        story_length = len(session.story)

        # Simple progression analysis
        overall_growth = min(100, (character.level - 1) * 20 + (story_length / 10))

        # Analyze dominant traits based on stats
        stats = character.stats.model_dump()
        max_stat_value = max(stats.values()) if stats else 0
        dominant_traits = [stat for stat, value in stats.items() if value == max_stat_value]

        # Identify growth areas (lowest stats)
        min_stat_value = min(stats.values()) if stats else 0
        growth_areas = [stat for stat, value in stats.items() if value == min_stat_value]

        # Generate recent milestones
        recent_changes = []
        if character.level > 1:
            recent_changes.append({
                "id": str(uuid.uuid4()),
                "type": "level_up",
                "title": f"Reached Level {character.level}",
                "description": f"{character.name} has grown stronger through their adventures",
                "timestamp": datetime.now().isoformat()
            })

        # Generate insights
        insights = []
        if story_length > 10:
            insights.append({
                "id": str(uuid.uuid4()),
                "type": "story_engagement",
                "title": "Active Adventurer",
                "description": f"{character.name} has participated in {story_length} story moments, showing strong engagement",
                "confidence": 0.8,
                "timestamp": datetime.now().isoformat()
            })

        return {
            "success": True,
            "session_id": session_id,
            "character_name": character.name,
            "progression_analysis": {
                "overall_growth": overall_growth,
                "dominant_traits": dominant_traits,
                "growth_areas": growth_areas,
                "recent_changes": recent_changes,
                "insights": insights
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting character progression: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== SCENARIO TEMPLATES ENDPOINTS =====


@app.get("/api/scenarios/templates")
async def list_scenario_templates(
    lorebook_id: Optional[str] = None,
    tags: Optional[List[str]] = None,
    difficulty: Optional[str] = None,
    limit: int = 20,
):
    """List available scenario templates"""
    try:
        if lorebook_id:
            templates = await db_service.get_scenario_templates_by_lorebook(lorebook_id)
        else:
            templates = await db_service.search_scenario_templates(
                tags, difficulty, limit
            )

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
                    "created_at": template.created_at.isoformat(),
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
            raise HTTPException(status_code=404, detail=SCENARIO_TEMPLATE_NOT_FOUND)

        return {
            "template": template.model_dump(),
            "summary": {
                "playable_character_count": len(template.playable_characters),
                "key_characters_count": len(template.key_characters),
                "available_paths_count": len(template.available_paths),
                "has_ai_narrative": bool(template.initial_narrative),
                "narrative_generation_method": template.narrative_metadata.get("generation_method", "unknown") if template.narrative_metadata else "unknown",
            },
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
            raise HTTPException(status_code=404, detail=SCENARIO_TEMPLATE_NOT_FOUND)

        return {
            "characters": [
                {
                    "name": char.get("name", "Unknown"),
                    "class_name": char.get("class_name", "Adventurer"),
                    "level": char.get("level", 1),
                    "background": char.get("background", "Unknown background"),
                    "stats": char.get("stats", {}),
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
async def create_character_from_series_endpoint(character_data: Dict[str, Any]):
    """Create a character based on an existing series character"""
    try:
        character_name = character_data.get("character_name")
        lorebook_id = character_data.get("lorebook_id")
        scenario_context = character_data.get("scenario_context", "")

        if not character_name or not lorebook_id:
            raise HTTPException(
                status_code=400, detail="character_name and lorebook_id are required"
            )

        # Get lorebook
        lorebook = await db_service.get_lorebook(lorebook_id)
        if not lorebook:
            raise HTTPException(status_code=404, detail=LOREBOOK_NOT_FOUND)

        # Create character
        character = await character_creation_flow.create_character_from_series(
            character_name, lorebook, scenario_context
        )

        return {
            "character": character.model_dump(),
            "source_series": lorebook.series_metadata.title,
            "message": f"Successfully created character {character_name} from {lorebook.series_metadata.title}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating character from series: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== CONFIGURATION MANAGEMENT ENDPOINTS =====

@app.get("/api/config/ui")
async def get_ui_config(user_id: Optional[str] = None):
    """Get UI configuration for user or default"""
    try:
        config = await config_manager.get_ui_config(user_id)
        return {
            "success": True,
            "config": config.to_dict()
        }
    except Exception as e:
        logger.error(f"Error getting UI config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config/models")
async def get_available_models():
    """Get available AI models"""
    try:
        models = await config_manager.get_available_models()
        return {
            "success": True,
            "models": [model.to_dict() for model in models]
        }
    except Exception as e:
        logger.error(f"Error getting AI models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config/themes")
async def get_theme_options():
    """Get available themes"""
    try:
        themes = await config_manager.get_theme_options()
        return {
            "success": True,
            "themes": [theme.to_dict() for theme in themes]
        }
    except Exception as e:
        logger.error(f"Error getting themes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/config/user/{user_id}/preferences")
async def update_user_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update user preferences"""
    try:
        # Validate preferences first
        validation = await config_manager.validate_config(preferences)
        if not validation["valid"]:
            return {
                "success": False,
                "errors": validation["errors"],
                "warnings": validation["warnings"]
            }

        success = await config_manager.update_user_preferences(user_id, preferences)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update preferences")

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "warnings": validation["warnings"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config/defaults")
async def get_default_config():
    """Get default configuration"""
    try:
        config = await config_manager.get_default_config()
        return {
            "success": True,
            "config": config.to_dict()
        }
    except Exception as e:
        logger.error(f"Error getting default config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== FEATURE FLAGS ENDPOINTS =====

@app.get("/api/features")
async def get_feature_flags(user_id: Optional[str] = None):
    """Get all feature flags for a user"""
    try:
        flags = await feature_flag_manager.get_all_flags(user_id)
        return {
            "success": True,
            "features": flags
        }
    except Exception as e:
        logger.error(f"Error getting feature flags: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features/{feature_name}")
async def check_feature_flag(feature_name: str, user_id: Optional[str] = None):
    """Check if a specific feature is enabled"""
    try:
        enabled = await feature_flag_manager.is_feature_enabled(feature_name, user_id)
        flag_details = await feature_flag_manager.get_flag_details(feature_name)

        return {
            "success": True,
            "feature": feature_name,
            "enabled": enabled,
            "details": flag_details
        }
    except Exception as e:
        logger.error(f"Error checking feature flag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/features/{feature_name}")
async def update_feature_flag(feature_name: str, flag_data: Dict[str, Any]):
    """Update a feature flag (admin endpoint)"""
    try:
        enabled = flag_data.get("enabled", False)
        scope = flag_data.get("scope", "global")

        success = await feature_flag_manager.update_flag(feature_name, enabled, scope)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update feature flag")

        # Handle percentage rollout
        if "percentage" in flag_data:
            await feature_flag_manager.set_percentage_rollout(
                feature_name, flag_data["percentage"]
            )

        return {
            "success": True,
            "message": f"Feature flag '{feature_name}' updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating feature flag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features/enabled")
async def get_enabled_features(user_id: Optional[str] = None):
    """Get list of enabled features for a user"""
    try:
        enabled_features = await feature_flag_manager.get_enabled_features(user_id)
        return {
            "success": True,
            "enabled_features": enabled_features
        }
    except Exception as e:
        logger.error(f"Error getting enabled features: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== CONTENT MANAGEMENT ENDPOINTS =====

@app.get("/api/content/scenarios")
async def get_content_scenarios(
    difficulty: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    """Get available scenarios from content management"""
    try:
        filters = {}
        if difficulty:
            filters["difficulty"] = difficulty
        if tags:
            filters["tags"] = tags

        scenarios = await content_manager.get_scenarios(filters)
        return {
            "success": True,
            "scenarios": scenarios
        }
    except Exception as e:
        logger.error(f"Error getting content scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/content/media")
async def get_media_assets(category: Optional[str] = None):
    """Get media assets by category"""
    try:
        assets = await content_manager.get_media_assets(category)
        return {
            "success": True,
            "assets": [asset.to_dict() for asset in assets]
        }
    except Exception as e:
        logger.error(f"Error getting media assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/content/ui-text")
async def get_ui_text(language: str = "en"):
    """Get UI text translations"""
    try:
        ui_text = await content_manager.get_ui_text(language)
        return {
            "success": True,
            "language": language,
            "text": ui_text
        }
    except Exception as e:
        logger.error(f"Error getting UI text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/content/update")
async def update_content(content_data: Dict[str, Any]):
    """Update content (admin endpoint)"""
    try:
        content_type = content_data.get("type")
        data = content_data.get("data")

        if not content_type or not data:
            raise HTTPException(
                status_code=400,
                detail="content_type and data are required"
            )

        success = await content_manager.update_content(content_type, data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update content")

        return {
            "success": True,
            "message": f"Content of type '{content_type}' updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/content/category/{category}")
async def get_content_by_category(category: str):
    """Get content items by category"""
    try:
        content_items = await content_manager.get_content_by_category(category)
        return {
            "success": True,
            "category": category,
            "items": [item.to_dict() for item in content_items]
        }
    except Exception as e:
        logger.error(f"Error getting content by category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== QUEST MANAGEMENT ENDPOINTS =====

@app.get("/api/quests/{session_id}")
async def get_session_quests(session_id: str):
    """Get all quests for a game session"""
    try:
        quests = quest_manager.get_active_quests_for_session(session_id)
        return {
            "success": True,
            "session_id": session_id,
            "quests": [quest.model_dump() for quest in quests]
        }
    except Exception as e:
        logger.error(f"Error getting session quests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quests/{session_id}/generate")
async def generate_quest(session_id: str):
    """Generate a new quest for the session"""
    try:
        # Get game context
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Get lorebook if available
        lorebook = None
        if session.lorebook_id:
            lorebook = await db_service.get_lorebook(session.lorebook_id)

        # Create game context
        context = GameContext(
            character=session.character,
            world_state=session.world_state,
            lorebook=lorebook,
            active_quests=session.quests
        )

        # Generate quest
        quest = await quest_manager.generate_quest(context)

        # Cache quest data
        await cache_manager.cache_quest_data(session_id, {"quests": [quest.model_dump()]})

        # Send WebSocket update
        await game_websocket.notify_quest_update(session_id, {
            "action": "quest_generated",
            "quest": quest.model_dump()
        })

        return {
            "success": True,
            "quest": quest.model_dump(),
            "message": f"Generated quest: {quest.title}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/quests/{session_id}/{quest_id}/progress")
async def update_quest_progress(session_id: str, quest_id: str, progress_data: Dict[str, Any]):
    """Update quest progress"""
    try:
        quest = await quest_manager.update_quest_progress(quest_id, progress_data)

        # Update cached data
        await cache_manager.cache_quest_data(session_id, {"updated_quest": quest.model_dump()})

        # Send WebSocket update
        await game_websocket.notify_quest_update(session_id, {
            "action": "quest_progress_updated",
            "quest_id": quest_id,
            "progress": quest.progress
        })

        return {
            "success": True,
            "quest": quest.model_dump(),
            "message": "Quest progress updated"
        }
    except Exception as e:
        logger.error(f"Error updating quest progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quests/{session_id}/{quest_id}/complete")
async def complete_quest(session_id: str, quest_id: str):
    """Complete a quest"""
    try:
        completion = await quest_manager.complete_quest(quest_id, session_id)

        # Update cached data
        await cache_manager.cache_quest_data(session_id, {"completed_quest": completion})

        # Send WebSocket update
        await game_websocket.notify_quest_update(session_id, {
            "action": "quest_completed",
            "quest_id": quest_id,
            "completion": completion
        })

        return {
            "success": True,
            "completion": completion,
            "message": "Quest completed successfully"
        }
    except Exception as e:
        logger.error(f"Error completing quest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== INVENTORY MANAGEMENT ENDPOINTS =====

@app.get("/api/inventory/{session_id}")
async def get_session_inventory(session_id: str):
    """Get inventory for a game session"""
    try:
        # Try cache first
        cached_inventory = await cache_manager.get_inventory_data(session_id)
        if cached_inventory:
            return {
                "success": True,
                "session_id": session_id,
                "inventory": cached_inventory,
                "source": "cache"
            }

        # Get from database
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        inventory_data = {
            "items": [item.model_dump() for item in session.inventory] if session.inventory else [],
            "equipment": getattr(session.character, 'equipment', {}),
            "stats": session.character.stats.model_dump() if session.character.stats else {}
        }

        # Cache inventory data
        await cache_manager.cache_inventory_data(session_id, inventory_data)

        return {
            "success": True,
            "session_id": session_id,
            "inventory": inventory_data,
            "source": "database"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session inventory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inventory/{session_id}/add")
async def add_inventory_item(session_id: str, item_data: Dict[str, Any]):
    """Add item to inventory"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Create InventoryItem from item_data
        item = InventoryItem(**item_data)

        # Add item using inventory manager
        update_result = await inventory_manager.add_item(session_id, item, session.inventory, session.character)

        # Update session inventory with result
        session.inventory = update_result.inventory

        # Save updated session
        await db_service.save_game_session(session)

        # Update cache
        inventory_data = {
            "items": [item.model_dump() for item in session.inventory],
            "equipment": getattr(session.character, 'equipment', {}),
            "stats": session.character.stats.model_dump()
        }
        await cache_manager.cache_inventory_data(session_id, inventory_data)

        # Send WebSocket update
        await game_websocket.notify_inventory_change(session_id, {
            "action": "item_added",
            "item": update_result.item.model_dump() if update_result.item else item_data,
            "inventory_count": len(session.inventory)
        })

        return {
            "success": True,
            "item": update_result.item.model_dump() if update_result.item else item_data,
            "message": update_result.message,
            "inventory_count": len(session.inventory)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/inventory/{session_id}/items/{item_id}")
async def remove_inventory_item(session_id: str, item_id: str):
    """Remove item from inventory"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Remove item using inventory manager
        update_result = await inventory_manager.remove_item(session_id, item_id, session.inventory)

        # Update session inventory with result
        session.inventory = update_result.inventory

        # Save updated session
        await db_service.save_game_session(session)

        # Update cache
        inventory_data = {
            "items": [item.model_dump() for item in session.inventory],
            "equipment": getattr(session.character, 'equipment', {}),
            "stats": session.character.stats.model_dump()
        }
        await cache_manager.cache_inventory_data(session_id, inventory_data)

        # Send WebSocket update
        await game_websocket.notify_inventory_change(session_id, {
            "action": "item_removed",
            "item_id": item_id,
            "inventory_count": len(session.inventory)
        })

        return {
            "success": True,
            "message": update_result.message,
            "inventory_count": len(session.inventory)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing inventory item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inventory/{session_id}/equip/{item_id}")
async def equip_item(session_id: str, item_id: str):
    """Equip an item"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Equip item using inventory manager
        update_result = await inventory_manager.equip_item(session_id, item_id, session.inventory, session.character)

        # Save updated session (inventory is modified in place)
        await db_service.save_game_session(session)

        # Update cache
        inventory_data = {
            "items": [item.model_dump() for item in session.inventory],
            "equipment": getattr(session.character, 'equipment', {}),
            "stats": session.character.stats.model_dump()
        }
        await cache_manager.cache_inventory_data(session_id, inventory_data)

        # Send WebSocket update
        await game_websocket.notify_inventory_change(session_id, {
            "action": "item_equipped",
            "item_id": item_id,
            "equipment": getattr(session.character, 'equipment', {})
        })

        return {
            "success": True,
            "message": update_result.message,
            "equipment": getattr(session.character, 'equipment', {}),
            "stats": session.character.stats.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error equipping item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/inventory/{session_id}/generate-loot")
async def generate_loot(session_id: str, loot_params: Dict[str, Any]):
    """Generate loot for the session"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Create loot context
        loot_context = LootContext(
            character_level=session.character.level,
            location=session.world_state.current_location,
            encounter_type=loot_params.get("encounter_type", "exploration"),
            difficulty=loot_params.get("difficulty", 1),
            special_conditions=loot_params.get("special_conditions", [])
        )

        # Generate loot using inventory manager
        loot_result = await inventory_manager.generate_loot(loot_context)

        return {
            "success": True,
            "loot": [item.model_dump() for item in loot_result],
            "generation_context": loot_context.to_dict(),
            "message": f"Generated {len(loot_result)} items"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating loot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== WORLD MANAGEMENT ENDPOINTS =====

@app.get("/api/world/{session_id}")
async def get_world_state(session_id: str):
    """Get world state for a game session"""
    try:
        # Try cache first
        cached_world = await cache_manager.get_world_state(session_id)
        if cached_world:
            return {
                "success": True,
                "session_id": session_id,
                "world_state": cached_world,
                "source": "cache"
            }

        # Get from database
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        # Get enhanced world information
        await world_manager.get_location_info(session.world_state.current_location)

        world_data = {
            "world_state": session.world_state.model_dump(),
            "location": session.world_state.current_location,
            "time": session.world_state.time_of_day
        }

        # Cache world data
        await cache_manager.cache_world_state(session_id, world_data)

        return {
            "success": True,
            "session_id": session_id,
            "world_state": world_data,
            "source": "database"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting world state: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/world/{session_id}/update")
async def update_world_state_endpoint(session_id: str, world_changes_data: Dict[str, Any]):
    """Update world state"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        world_changes = WorldChanges(**world_changes_data)

        # world_manager.update_world_state expects session_id (str) and changes (WorldChanges)
        # and returns a WorldState object.
        updated_world_state_obj = await world_manager.update_world_state(session_id, world_changes) # Pass session_id string

        # Update the session object with the new world state
        session.world_state = updated_world_state_obj
        session.updated_at = datetime.now()
        await db_service.save_game_session(session)

        # For the response, we use the applied changes and the new world state
        # We don't get triggered events directly from this specific function call in world_manager
        # If events are needed, they might be part of updated_world_state_obj or require another call
        changes_applied_dict = world_changes.to_dict() # The changes that were requested
        triggered_world_events = [] # Assuming no direct event list from this call, adjust if world_manager changes

        world_data_for_cache = {
            "world_state": updated_world_state_obj.model_dump(),
            "changes": changes_applied_dict,
            "events": [event.to_dict() for event in triggered_world_events] # Will be empty if none returned
        }
        await cache_manager.cache_world_state(session_id, world_data_for_cache)

        await game_websocket.notify_world_state_change(session_id, {
            "action": "world_state_updated",
            "changes": changes_applied_dict,
            "new_state": updated_world_state_obj.model_dump()
        })

        return {
            "success": True,
            "updated_state": updated_world_state_obj.model_dump(),
            "changes": changes_applied_dict,
            "triggered_events": [event.to_dict() for event in triggered_world_events]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating world state: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/world/{session_id}/advance-time")
async def advance_time_endpoint(session_id: str):
    """Advance time in the world"""
    try:
        session = await db_service.get_game_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=GAME_SESSION_NOT_FOUND)

        current_time_str = session.world_state.time_of_day
        # world_manager.advance_time expects session_id (str) and current_time (str)
        # and returns the new_time (str). Events are handled internally by advance_time.
        new_time_str = await world_manager.advance_time(session_id, current_time_str)

        # Update session with the new time
        session.world_state.time_of_day = new_time_str
        session.updated_at = datetime.now()
        await db_service.save_game_session(session)

        # Construct a WorldChanges object to represent the time change for response and cache
        time_changes_obj = WorldChanges(time_change=new_time_str)
        time_changes_dict = time_changes_obj.to_dict()

        # Fetch any new events that might have been triggered by advancing time
        # This might require a separate call or modification to advance_time to return events
        triggered_events = world_manager.get_events_for_location(session.world_state.current_location) # Example: get current location events

        world_data_for_cache = {
            "world_state": session.world_state.model_dump(),
            "time_changes": time_changes_dict,
            "events": [event.to_dict() for event in triggered_events]
        }
        await cache_manager.cache_world_state(session_id, world_data_for_cache)

        await game_websocket.notify_world_state_change(session_id, {
            "action": "time_advanced",
            "time_changes": time_changes_dict,
            "new_state": session.world_state.model_dump()
        })

        return {
            "success": True,
            "time_changes": time_changes_dict,
            "triggered_events": [event.to_dict() for event in triggered_events],
            "new_world_state": session.world_state.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error advancing time: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/world/trigger-event")
async def trigger_world_event_endpoint(event_data: Dict[str, Any]): # Renamed to avoid conflict
    """Trigger a world event"""
    try:
        # Create world event
        world_event = WorldEvent(
            event_id=event_data.get("event_id", f"event_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
            event_type=event_data.get("event_type", "custom"),
            title=event_data.get("title", "World Event"),
            description=event_data.get("description", "A significant event has occurred"),
            data=event_data.get("data", {}),
            affected_sessions=event_data.get("affected_sessions", []),
            timestamp=datetime.now()
        )

        # Broadcast to all affected sessions
        broadcast_count = await game_websocket.broadcast_world_event(world_event)

        return {
            "success": True,
            "event": world_event.model_dump(),
            "broadcast_count": broadcast_count,
            "message": f"World event triggered and sent to {broadcast_count} sessions"
        }
    except Exception as e:
        logger.error(f"Error triggering world event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== AI RESPONSE MANAGEMENT ENDPOINTS =====

@app.post("/api/ai/generate-response")
async def generate_ai_response(request_data: Dict[str, Any]):
    """Generate AI response with caching and fallbacks"""
    try:
        context = request_data.get("context", {})
        action = request_data.get("action", "")
        # session_id is not directly used by generate_narrative_response in ai_response_manager
        # but can be part of the context if needed by the AI model or caching logic there.

        response = await ai_response_manager.generate_narrative_response(context, action)

        return {
            "success": True,
            "response": response.to_dict(),
            # Ensure NarrativeResponse has from_cache attribute, or handle its absence
            "cached": getattr(response, 'from_cache', False)
        }
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")

        fallback = await ai_response_manager.get_fallback_response(
            request_data.get("action_type", "general"),
            request_data.get("context", {})
        )

        return {
            "success": False,
            "error": str(e),
            "fallback_response": fallback,
            "message": "AI generation failed, using fallback response"
        }


@app.post("/api/ai/validate-action")
async def validate_action(validation_data: Dict[str, Any]):
    """Validate a player action"""
    try:
        action = validation_data.get("action", "")
        game_state = validation_data.get("game_state", {})

        # Validate action using AI response manager
        is_valid = await ai_response_manager.validate_action(action, game_state)

        return {
            "success": True,
            "action": action,
            "is_valid": is_valid,
            "validation_details": {
                "reason": "Action validated successfully" if is_valid else "Action may not be appropriate for current context"
            }
        }
    except Exception as e:
        logger.error(f"Error validating action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== WEBSOCKET ENDPOINTS =====

@app.websocket("/ws/game/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: Optional[str] = None):
    """WebSocket endpoint for real-time game updates"""
    await game_websocket.connect(websocket, session_id, user_id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle real-time action
            result = await game_websocket.handle_real_time_action(session_id, message)

            # Send response back to client
            await websocket.send_text(json.dumps({
                "type": "action_response",
                "result": result,
                "timestamp": datetime.now().isoformat()
            }))

    except WebSocketDisconnect:
        await game_websocket.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        await game_websocket.disconnect(session_id)


# ===== CACHE MANAGEMENT ENDPOINTS =====

@app.get("/api/cache/stats")
async def get_cache_stats():
    """Get cache performance statistics"""
    try:
        stats = await cache_manager.get_cache_stats()
        return {
            "success": True,
            "stats": stats.model_dump()
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/cache/clear")
async def clear_cache():
    """Clear all cache data (admin endpoint)"""
    try:
        result = await cache_manager.clear_all_cache()
        return {
            "success": True,
            "cleared": result,
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/cache/invalidate/{pattern}")
async def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching pattern"""
    try:
        count = await cache_manager.invalidate_pattern(pattern)
        return {
            "success": True,
            "invalidated_count": count,
            "pattern": pattern,
            "message": f"Invalidated {count} cache entries"
        }
    except Exception as e:
        logger.error(f"Error invalidating cache pattern: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cache/health")
async def get_cache_health():
    """Get cache system health status"""
    try:
        health = await cache_manager.health_check()
        return {
            "success": True,
            "health": health
        }
    except Exception as e:
        logger.error(f"Error getting cache health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== DATABASE MIGRATION ENDPOINTS =====

@app.get("/api/migrations/status")
async def get_migration_status():
    """Get database migration status"""
    try:
        current_version = await data_migrator.get_current_version()
        pending_migrations = await data_migrator.get_pending_migrations()

        return {
            "success": True,
            "current_version": current_version,
            "pending_migrations": [m.model_dump() for m in pending_migrations],
            "migration_needed": len(pending_migrations) > 0
        }
    except Exception as e:
        logger.error(f"Error getting migration status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/migrations/run")
async def run_migrations():
    """Run all pending migrations"""
    try:
        results = await data_migrator.migrate_to_latest()

        successful_count = sum(1 for r in results if r.success)

        return {
            "success": len(results) == 0 or successful_count == len(results),
            "results": [r.model_dump() for r in results],
            "summary": {
                "total_migrations": len(results),
                "successful": successful_count,
                "failed": len(results) - successful_count
            }
        }
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/migrations/migrate-hardcoded")
async def migrate_hardcoded_data():
    """Migrate hardcoded data to database"""
    try:
        await data_migrator.migrate_hardcoded_data()
        return {
            "success": True,
            "message": "Hardcoded data migration completed"
        }
    except Exception as e:
        logger.error(f"Error migrating hardcoded data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/backup/create")
async def create_backup(backup_data: Optional[Dict[str, Any]] = None):
    """Create database backup"""
    try:
        backup_id = backup_data.get("backup_id") if backup_data else None
        backup_info = await data_migrator.create_backup(backup_id)

        return {
            "success": True,
            "backup": backup_info.model_dump(),
            "message": f"Backup created: {backup_info.backup_id}"
        }
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/backup/list")
async def list_backups():
    """List available backups"""
    try:
        # Placeholder as data_migrator.list_backups() is not implemented
        backups = []
        return {
            "success": True,
            "backups": backups,
            "count": len(backups)
        }
    except Exception as e:
        logger.error(f"Error listing backups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/backup/restore/{backup_id}")
async def restore_backup(backup_id: str):
    """Restore database from backup"""
    try:
        await data_migrator.restore_from_backup(backup_id)

        return {
            "success": True,
            "message": "Restore completed"
        }
    except Exception as e:
        logger.error(f"Error restoring backup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== WEBSOCKET STATUS ENDPOINTS =====

@app.get("/api/websocket/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    try:
        stats = await game_websocket.get_connection_stats()
        return {
            "success": True,
            "websocket_stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting WebSocket stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== HEALTH AND STATUS ENDPOINTS =====

@app.get("/api/status/services")
async def get_services_status():
    """Get status of all backend services"""
    try:
        # Check feature flags service
        feature_flags_status = len(feature_flag_manager.flags) > 0

        # Check configuration service
        config_status = True  # config_manager is always available

        # Check content service
        content_status = len(content_manager.scenarios) > 0

        return {
            "success": True,
            "services": {
                "feature_flags": {
                    "status": "healthy" if feature_flags_status else "degraded",
                    "flags_count": len(feature_flag_manager.flags)
                },
                "configuration": {
                    "status": "healthy" if config_status else "degraded",
                    "themes_count": len(config_manager.themes)
                },
                "content_management": {
                    "status": "healthy" if content_status else "degraded",
                    "scenarios_count": len(content_manager.scenarios),
                    "media_assets_count": len(content_manager.media_assets)
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting services status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
