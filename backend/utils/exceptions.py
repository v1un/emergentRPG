"""
Custom exception types for EmergentRPG
Provides specific exception types for better error handling and retry mechanisms
"""

from typing import Any, Dict, Optional


class EmergentRPGException(Exception):
    """Base exception for all EmergentRPG errors"""
    
    def __init__(self, message: str, error_code: Optional[str] = None, 
                 metadata: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.metadata = metadata or {}


class TransientError(EmergentRPGException):
    """Errors that might succeed if retried"""
    pass


class PermanentError(EmergentRPGException):
    """Errors that will not succeed if retried"""
    pass


# Database Errors
class DatabaseError(EmergentRPGException):
    """Database operation errors"""
    pass


class SessionNotFoundError(PermanentError):
    """Game session not found"""
    pass


class SessionSaveError(TransientError):
    """Failed to save game session"""
    pass


# AI Service Errors
class AIServiceError(EmergentRPGException):
    """AI service errors"""
    pass


class AIServiceUnavailableError(TransientError):
    """AI service temporarily unavailable"""
    pass


class AIResponseParsingError(PermanentError):
    """Failed to parse AI response"""
    pass


# Game Logic Errors
class GameLogicError(EmergentRPGException):
    """Game logic errors"""
    pass


class InvalidActionError(PermanentError):
    """Invalid player action"""
    pass


class CharacterLevelUpError(GameLogicError):
    """Character level up errors"""
    pass


# Inventory Errors
class InventoryError(GameLogicError):
    """Inventory management errors"""
    pass


class ItemNotFoundError(PermanentError):
    """Item not found in inventory"""
    pass


class EquipmentSlotOccupiedError(PermanentError):
    """Equipment slot already occupied"""
    pass


class InvalidEquipmentSlotError(PermanentError):
    """Item cannot be equipped in specified slot"""
    pass


class InventoryFullError(PermanentError):
    """Inventory is full"""
    pass


class InsufficientCarryCapacityError(PermanentError):
    """Character cannot carry more weight"""
    pass


class InvalidItemQuantityError(PermanentError):
    """Invalid item quantity (negative or zero)"""
    pass


# Quest Errors
class QuestError(GameLogicError):
    """Quest system errors"""
    pass


class QuestNotFoundError(PermanentError):
    """Quest not found"""
    pass


class QuestDependencyNotMetError(PermanentError):
    """Quest dependencies not satisfied"""
    pass


class QuestAlreadyCompletedError(PermanentError):
    """Quest is already completed"""
    pass


class QuestTimeExpiredError(PermanentError):
    """Quest time limit expired"""
    pass


# World State Errors
class WorldStateError(GameLogicError):
    """World state management errors"""
    pass


class LocationNotFoundError(PermanentError):
    """Location not found"""
    pass


class NPCNotFoundError(PermanentError):
    """NPC not found"""
    pass


# Validation Errors
class ValidationError(PermanentError):
    """Data validation errors"""
    pass


class InvalidStatValueError(ValidationError):
    """Invalid character stat value"""
    pass


class InvalidLevelError(ValidationError):
    """Invalid character level"""
    pass


class InvalidExperienceError(ValidationError):
    """Invalid experience value"""
    pass


# Network/Communication Errors
class NetworkError(TransientError):
    """Network communication errors"""
    pass


class WebSocketError(NetworkError):
    """WebSocket communication errors"""
    pass


class CacheError(TransientError):
    """Cache operation errors"""
    pass


# Configuration Errors
class ConfigurationError(PermanentError):
    """Configuration errors"""
    pass


class MissingConfigurationError(ConfigurationError):
    """Required configuration missing"""
    pass


class InvalidConfigurationError(ConfigurationError):
    """Invalid configuration value"""
    pass


# Utility functions for error handling
def is_retryable_error(error: Exception) -> bool:
    """Check if an error is retryable"""
    return isinstance(error, TransientError)


def get_error_metadata(error: Exception) -> Dict[str, Any]:
    """Extract metadata from an error"""
    if isinstance(error, EmergentRPGException):
        return {
            "error_code": error.error_code,
            "metadata": error.metadata,
            "error_type": type(error).__name__
        }
    return {
        "error_type": type(error).__name__,
        "error_message": str(error)
    }


def create_error_response(error: Exception, include_traceback: bool = False) -> Dict[str, Any]:
    """Create a standardized error response"""
    response = {
        "success": False,
        "error": str(error),
        "error_type": type(error).__name__,
        "retryable": is_retryable_error(error)
    }
    
    if isinstance(error, EmergentRPGException):
        response.update({
            "error_code": error.error_code,
            "metadata": error.metadata
        })
    
    if include_traceback:
        import traceback
        response["traceback"] = traceback.format_exc()
    
    return response
