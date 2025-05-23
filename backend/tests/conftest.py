import pytest
import asyncio
from fastapi.testclient import TestClient
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def sample_character_data():
    """Sample character data for testing."""
    return {
        "name": "Test Hero",
        "background": "A brave warrior from the northern lands",
        "class_type": "warrior",
        "stats": {
            "strength": 15,
            "dexterity": 12,
            "constitution": 14,
            "intelligence": 10,
            "wisdom": 13,
            "charisma": 11
        }
    }

@pytest.fixture
def sample_game_session_data():
    """Sample game session data for testing."""
    return {
        "session_name": "Test Adventure",
        "scenario_type": "fantasy",
        "difficulty": "medium"
    }
