"""
Comprehensive tests for backend architecture improvements.

Tests the enhanced database service, AI response manager, and other
improved backend components while preserving all game logic.
"""

import asyncio
import pytest
import sys
import os
from datetime import datetime


# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database_service import DatabaseService, DB_NOT_CONNECTED_ERROR
from services.ai.response_manager import (
    AIResponseManager, NarrativeResponse, GameContext, ResponseType, ResponseMetrics
)
from models.game_models import (
    Character, CharacterStats, GameSession, WorldState, StoryEntry, ActionType
)
from utils.exceptions import DatabaseError, SessionSaveError, TransientError


class TestDatabaseServiceImprovements:
    """Test enhanced database service functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.db_service = DatabaseService()
    
    def test_database_service_initialization(self):
        """Test database service initialization with proper attributes."""
        assert self.db_service.client is None
        assert self.db_service.db is None
        assert self.db_service._connection_pool_size == 10
        assert self.db_service._connection_timeout == 30
    
    def test_database_not_connected_error(self):
        """Test proper error handling when database is not connected."""
        test_session = self._create_test_session()
        
        with pytest.raises(DatabaseError) as exc_info:
            asyncio.run(self.db_service.save_game_session(test_session))
        
        assert exc_info.value.error_code == "DB_NOT_CONNECTED"
        assert DB_NOT_CONNECTED_ERROR in str(exc_info.value)
    
    def test_error_hierarchy(self):
        """Test custom exception hierarchy."""
        # Test that SessionSaveError is a TransientError
        error = SessionSaveError("Test error", "TEST_CODE")
        assert isinstance(error, TransientError)
        assert error.error_code == "TEST_CODE"
        assert error.message == "Test error"
    
    def _create_test_session(self) -> GameSession:
        """Create a test game session."""
        character = Character(
            name="Test Hero",
            level=1,
            health=100,
            max_health=100,
            mana=50,
            max_mana=50,
            stats=CharacterStats()
        )
        
        world_state = WorldState(
            current_location="Test Location",
            time_of_day="morning",
            weather="clear"
        )
        
        return GameSession(
            session_id="test_session_001",
            character=character,
            world_state=world_state,
            story=[
                StoryEntry(
                    type=ActionType.NARRATION,
                    text="Test story entry"
                )
            ]
        )


class TestAIResponseManagerImprovements:
    """Test enhanced AI response manager functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ai_manager = AIResponseManager()
        self.test_context = self._create_test_context()
    
    def test_response_type_enum(self):
        """Test ResponseType enum values."""
        assert ResponseType.ATTACK.value == "attack"
        assert ResponseType.EXPLORE.value == "explore"
        assert ResponseType.NARRATIVE.value == "narrative"
    
    def test_narrative_response_creation(self):
        """Test NarrativeResponse creation with proper defaults."""
        response = NarrativeResponse(
            response_text="Test response",
            response_type=ResponseType.EXPLORE.value
        )
        
        assert response.response_text == "Test response"
        assert response.response_type == ResponseType.EXPLORE.value
        assert abs(response.confidence_score - 0.8) < 1e-6
        assert response.from_cache is False
        assert isinstance(response.generated_at, datetime)
    
    def test_narrative_response_confidence_clamping(self):
        """Test confidence score is properly clamped to [0,1]."""
        # Test upper bound
        response1 = NarrativeResponse("Test", confidence_score=1.5)
        assert abs(response1.confidence_score - 1.0) < 1e-6

        # Test lower bound
        response2 = NarrativeResponse("Test", confidence_score=-0.5)
        assert abs(response2.confidence_score - 0.0) < 1e-6

        # Test valid range
        response3 = NarrativeResponse("Test", confidence_score=0.7)
        assert abs(response3.confidence_score - 0.7) < 1e-6
    
    def test_narrative_response_to_dict(self):
        """Test NarrativeResponse serialization."""
        metrics = ResponseMetrics(
            generation_time=1.5,
            cache_hit=False,
            retry_count=1,
            confidence_score=0.9
        )
        
        response = NarrativeResponse(
            response_text="Test response",
            response_type=ResponseType.ATTACK.value,
            character_effects={"damage": 10},
            world_effects={"noise": True},
            suggested_actions=["Continue fighting"],
            metadata={"source": "ai"},
            metrics=metrics
        )
        
        result = response.to_dict()
        
        assert result["response_text"] == "Test response"
        assert result["response_type"] == ResponseType.ATTACK.value
        assert result["character_effects"]["damage"] == 10
        assert result["world_effects"]["noise"] is True
        assert "Continue fighting" in result["suggested_actions"]
        assert abs(result["metrics"]["generation_time"] - 1.5) < 1e-6
    
    def test_narrative_response_error_detection(self):
        """Test error response detection."""
        # Test error response type
        error_response = NarrativeResponse(
            "Error occurred",
            response_type=ResponseType.ERROR.value
        )
        assert error_response.is_error_response() is True
        
        # Test error in metadata
        metadata_error = NarrativeResponse(
            "Normal response",
            metadata={"error": "Something went wrong"}
        )
        assert metadata_error.is_error_response() is True
        
        # Test normal response
        normal_response = NarrativeResponse("Normal response")
        assert normal_response.is_error_response() is False
    
    def test_game_context_creation(self):
        """Test GameContext creation and methods."""
        context = self.test_context
        
        assert context.session.session_id == "test_session_001"
        assert context.character.name == "Test Hero"
        assert context.story_length == 1
        assert context.lorebook is None
    
    def test_game_context_to_dict(self):
        """Test GameContext serialization."""
        result = self.test_context.to_dict()
        
        assert result["session_id"] == "test_session_001"
        assert result["character"]["name"] == "Test Hero"
        assert result["story_length"] == 1
        assert result["lorebook_available"] is False
        assert result["recent_actions_count"] == 0
    
    def test_game_context_summary(self):
        """Test GameContext summary generation."""
        summary = self.test_context.get_context_summary()
        
        assert "Test Hero" in summary
        assert "Level 1" in summary
        assert "Test Location" in summary
        assert "1 entries" in summary
    
    def test_game_context_sufficient_context(self):
        """Test context sufficiency check."""
        assert self.test_context.has_sufficient_context() is True
        
        # Test insufficient context
        empty_session = GameSession(
            session_id="empty",
            character=self.test_context.character,
            world_state=self.test_context.world_state,
            story=[]  # Empty story
        )
        empty_context = GameContext(empty_session)
        assert empty_context.has_sufficient_context() is False
    
    def test_action_classification(self):
        """Test action type classification."""
        # Test attack actions
        assert self.ai_manager._classify_action("attack the enemy") == ResponseType.ATTACK.value
        assert self.ai_manager._classify_action("I strike with my sword") == ResponseType.ATTACK.value
        
        # Test exploration actions
        assert self.ai_manager._classify_action("look around") == ResponseType.EXPLORE.value
        assert self.ai_manager._classify_action("search the room") == ResponseType.EXPLORE.value
        
        # Test interaction actions
        assert self.ai_manager._classify_action("talk to the guard") == ResponseType.INTERACT.value
        assert self.ai_manager._classify_action("ask about the quest") == ResponseType.INTERACT.value
        
        # Test default classification
        assert self.ai_manager._classify_action("do something weird") == ResponseType.EXPLORE.value
    
    def test_suggested_actions_generation(self):
        """Test suggested actions generation."""
        # Test with door mention
        suggestions = self.ai_manager._generate_suggested_actions(
            "You see a wooden door ahead",
            ResponseType.EXPLORE.value,
            self.test_context
        )
        assert "Open the door" in suggestions
        
        # Test with item mention
        suggestions = self.ai_manager._generate_suggested_actions(
            "There's a shiny object on the ground",
            ResponseType.EXPLORE.value,
            self.test_context
        )
        assert "Pick up the item" in suggestions
    
    def _create_test_context(self) -> GameContext:
        """Create a test game context."""
        character = Character(
            name="Test Hero",
            level=1,
            health=100,
            max_health=100,
            mana=50,
            max_mana=50,
            stats=CharacterStats()
        )
        
        world_state = WorldState(
            current_location="Test Location",
            time_of_day="morning",
            weather="clear"
        )
        
        session = GameSession(
            session_id="test_session_001",
            character=character,
            world_state=world_state,
            story=[
                StoryEntry(
                    type=ActionType.NARRATION,
                    text="Test story entry"
                )
            ]
        )
        
        return GameContext(session)


class TestResponseMetrics:
    """Test ResponseMetrics dataclass functionality."""
    
    def test_response_metrics_creation(self):
        """Test ResponseMetrics creation."""
        metrics = ResponseMetrics(
            generation_time=2.5,
            cache_hit=True,
            retry_count=0,
            confidence_score=0.95,
            token_count=150,
            error_type=None
        )
        
        assert abs(metrics.generation_time - 2.5) < 1e-6
        assert metrics.cache_hit is True
        assert metrics.retry_count == 0
        assert abs(metrics.confidence_score - 0.95) < 1e-6
        assert metrics.token_count == 150
        assert metrics.error_type is None


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])
