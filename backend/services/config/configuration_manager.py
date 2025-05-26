"""
Configuration Management Service
Handles dynamic UI configuration, themes, and user preferences
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class UIConfig:
    """UI Configuration model"""
    def __init__(self, user_id: Optional[str] = None):
        self.user_id = user_id
        self.theme = "dark"
        self.language = "en"
        self.quick_actions = self._get_default_quick_actions()
        self.tabs = self._get_default_tabs()
        self.rarity_colors = self._get_default_rarity_colors()
        self.accessibility = self._get_default_accessibility()
        
    def _get_default_quick_actions(self) -> List[Dict[str, str]]:
        """Get default quick actions"""
        return [
            {"id": "look", "label": "Look Around", "icon": "👀"},
            {"id": "inventory", "label": "Check Inventory", "icon": "🎒"},
            {"id": "status", "label": "Check Status", "icon": "❤️"},
            {"id": "rest", "label": "Rest", "icon": "😴"},
            {"id": "search", "label": "Search Area", "icon": "🔍"},
            {"id": "interact", "label": "Interact", "icon": "🤝"}
        ]
    
    def _get_default_tabs(self) -> Dict[str, Dict[str, str]]:
        """Get default tab configurations"""
        return {
            "character": {"id": "character", "label": "Character", "icon": "User"},
            "inventory": {"id": "inventory", "label": "Inventory", "icon": "Backpack"},
            "quests": {"id": "quests", "label": "Quests", "icon": "ScrollText"},
            "story": {"id": "story", "label": "Story", "icon": "Book"}
        }
    
    def _get_default_rarity_colors(self) -> Dict[str, str]:
        """Get default rarity color scheme"""
        return {
            "common": "#9CA3AF",
            "uncommon": "#10B981",
            "rare": "#3B82F6", 
            "epic": "#8B5CF6",
            "legendary": "#F59E0B",
            "artifact": "#EF4444"
        }
    
    def _get_default_accessibility(self) -> Dict[str, Any]:
        """Get default accessibility settings"""
        return {
            "high_contrast": False,
            "large_text": False,
            "reduced_motion": False,
            "screen_reader": False
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "theme": self.theme,
            "language": self.language,
            "quick_actions": self.quick_actions,
            "tabs": self.tabs,
            "rarity_colors": self.rarity_colors,
            "accessibility": self.accessibility,
            "updated_at": datetime.now().isoformat()
        }


class Theme:
    """Theme configuration model"""
    def __init__(self, theme_id: str, name: str, colors: Dict[str, str]):
        self.id = theme_id
        self.name = name
        self.colors = colors
        self.created_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "colors": self.colors,
            "created_at": self.created_at.isoformat()
        }


class AIModel:
    """AI Model configuration"""
    def __init__(self, model_id: str, name: str, capabilities: List[str], performance: Dict[str, float]):
        self.id = model_id
        self.name = name
        self.capabilities = capabilities
        self.performance = performance
        self.available = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "capabilities": self.capabilities,
            "performance": self.performance,
            "available": self.available
        }


class ConfigurationManager:
    """Manages dynamic UI configuration, themes, and user preferences"""
    
    def __init__(self):
        self.user_configs: Dict[str, UIConfig] = {}
        self.themes = self._initialize_themes()
        self.ai_models = self._initialize_ai_models()
    
    def _initialize_themes(self) -> List[Theme]:
        """Initialize default themes"""
        themes = [
            Theme("dark", "Dark Theme", {
                "primary": "#1F2937",
                "secondary": "#374151",
                "accent": "#3B82F6",
                "background": "#111827",
                "text": "#F9FAFB"
            }),
            Theme("light", "Light Theme", {
                "primary": "#F9FAFB", 
                "secondary": "#E5E7EB",
                "accent": "#3B82F6",
                "background": "#FFFFFF",
                "text": "#111827"
            }),
            Theme("high-contrast", "High Contrast", {
                "primary": "#000000",
                "secondary": "#FFFFFF", 
                "accent": "#FFFF00",
                "background": "#000000",
                "text": "#FFFFFF"
            })
        ]
        return themes
    
    def _initialize_ai_models(self) -> List[AIModel]:
        """Initialize available AI models"""
        models = [
            AIModel("gemini-pro", "Gemini Pro", ["text", "narrative", "dialogue"], {
                "speed": 0.8,
                "creativity": 0.9,
                "consistency": 0.85
            }),
            AIModel("gemini-flash", "Gemini Flash", ["text", "quick-response"], {
                "speed": 0.95,
                "creativity": 0.7,
                "consistency": 0.8
            })
        ]
        return models
    
    async def get_ui_config(self, user_id: Optional[str] = None) -> UIConfig:
        """Get UI configuration for user or default"""
        try:
            if user_id and user_id in self.user_configs:
                logger.debug(f"Returning personalized config for user {user_id}")
                return self.user_configs[user_id]
            
            # Return default configuration
            default_config = UIConfig(user_id)
            logger.debug("Returning default UI configuration")
            return default_config
            
        except Exception as e:
            logger.error(f"Error getting UI config: {str(e)}")
            return UIConfig(user_id)
    
    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> bool:
        """Update user preferences"""
        try:
            if user_id not in self.user_configs:
                self.user_configs[user_id] = UIConfig(user_id)
            
            config = self.user_configs[user_id]
            
            # Update preferences
            if "theme" in preferences:
                config.theme = preferences["theme"]
            if "language" in preferences:
                config.language = preferences["language"]
            if "quick_actions" in preferences:
                config.quick_actions = preferences["quick_actions"]
            if "accessibility" in preferences:
                config.accessibility.update(preferences["accessibility"])
            
            logger.info(f"Updated preferences for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            return False
    
    async def get_available_models(self) -> List[AIModel]:
        """Get list of available AI models"""
        try:
            available_models = [model for model in self.ai_models if model.available]
            logger.debug(f"Returning {len(available_models)} available models")
            return available_models
            
        except Exception as e:
            logger.error(f"Error getting AI models: {str(e)}")
            return []
    
    async def get_theme_options(self) -> List[Theme]:
        """Get available theme options"""
        try:
            logger.debug(f"Returning {len(self.themes)} theme options")
            return self.themes
            
        except Exception as e:
            logger.error(f"Error getting themes: {str(e)}")
            return []
    
    async def validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate configuration data"""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            # Validate theme
            if "theme" in config:
                valid_themes = [theme.id for theme in self.themes]
                if config["theme"] not in valid_themes:
                    validation_result["errors"].append(f"Invalid theme: {config['theme']}")
                    validation_result["valid"] = False
            
            # Validate language
            if "language" in config:
                valid_languages = ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"]
                if config["language"] not in valid_languages:
                    validation_result["warnings"].append(f"Language {config['language']} may not be fully supported")
            
            # Validate quick actions
            if "quick_actions" in config:
                if not isinstance(config["quick_actions"], list):
                    validation_result["errors"].append("quick_actions must be a list")
                    validation_result["valid"] = False
                elif len(config["quick_actions"]) > 10:
                    validation_result["warnings"].append("More than 10 quick actions may impact performance")
            
            logger.debug(f"Config validation result: {validation_result}")
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating config: {str(e)}")
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": []
            }
    
    async def get_default_config(self) -> UIConfig:
        """Get default configuration"""
        try:
            return UIConfig()
        except Exception as e:
            logger.error(f"Error getting default config: {str(e)}")
            return UIConfig()


# Global configuration manager instance
config_manager = ConfigurationManager()
