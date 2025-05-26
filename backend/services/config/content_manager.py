"""
Content Management System
Handles dynamic content, media assets, and localization
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class MediaAsset:
    """Media Asset model for images, audio, video"""
    def __init__(self, asset_id: str, asset_type: str, url: str, 
                 fallback_url: Optional[str] = None, alt_text: Optional[str] = None,
                 tags: Optional[List[str]] = None, metadata: Optional[Dict[str, Any]] = None):
        self.id = asset_id
        self.type = asset_type  # image, audio, video
        self.url = url
        self.fallback_url = fallback_url
        self.alt_text = alt_text
        self.tags = tags or []
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "url": self.url,
            "fallback_url": self.fallback_url,
            "alt_text": self.alt_text,
            "tags": self.tags,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class UIText:
    """UI Text model for localization"""
    def __init__(self, key: str, language: str, value: str, 
                 context: Optional[str] = None, category: str = "general"):
        self.key = key
        self.language = language
        self.value = value
        self.context = context
        self.category = category
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "key": self.key,
            "language": self.language,
            "value": self.value,
            "context": self.context,
            "category": self.category,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class ContentItem:
    """Generic content item model"""
    def __init__(self, item_id: str, content_type: str, category: str,
                 data: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None):
        self.id = item_id
        self.type = content_type
        self.category = category
        self.data = data
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.version = 1
        self.published = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "category": self.category,
            "data": self.data,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "version": self.version,
            "published": self.published
        }


class ContentManager:
    """Manages dynamic content, media assets, and localization"""
    
    def __init__(self):
        self.media_assets: Dict[str, MediaAsset] = {}
        self.ui_texts: Dict[str, Dict[str, UIText]] = {}  # {language: {key: UIText}}
        self.content_items: Dict[str, ContentItem] = {}
        self.scenarios: Dict[str, Dict[str, Any]] = {}
        self._initialize_default_content()
    
    def _initialize_default_content(self):
        """Initialize default content and media assets"""
        # Initialize default media assets
        default_assets = [
            MediaAsset("character-avatar-1", "image", "/images/avatars/knight.png", 
                      "/images/avatars/default.png", "Knight character avatar", 
                      ["character", "avatar", "knight"]),
            MediaAsset("character-avatar-2", "image", "/images/avatars/mage.png",
                      "/images/avatars/default.png", "Mage character avatar",
                      ["character", "avatar", "mage"]),
            MediaAsset("scenario-bg-fantasy", "image", "/images/backgrounds/fantasy-castle.jpg",
                      "/images/backgrounds/default.jpg", "Fantasy castle background",
                      ["background", "fantasy", "castle"]),
            MediaAsset("scenario-bg-scifi", "image", "/images/backgrounds/space-station.jpg",
                      "/images/backgrounds/default.jpg", "Space station background",
                      ["background", "scifi", "space"]),
            MediaAsset("inventory-icon-sword", "image", "/images/icons/sword.svg",
                      "/images/icons/default-item.svg", "Sword icon",
                      ["icon", "weapon", "sword"]),
            MediaAsset("inventory-icon-potion", "image", "/images/icons/potion.svg",
                      "/images/icons/default-item.svg", "Health potion icon",
                      ["icon", "consumable", "potion"])
        ]
        
        for asset in default_assets:
            self.media_assets[asset.id] = asset
        
        # Initialize default UI texts
        self._initialize_ui_texts()
        
        # Initialize default scenarios
        self._initialize_scenarios()
        
        # Initialize default content items
        self._initialize_content_items()
        
        logger.info(f"Initialized content manager with {len(default_assets)} media assets")
    
    def _initialize_ui_texts(self):
        """Initialize default UI text translations"""
        default_texts = {
            "en": [
                ("action.look", "Look Around", "Player action"),
                ("action.inventory", "Check Inventory", "Player action"),
                ("action.status", "Check Status", "Player action"),
                ("action.rest", "Rest", "Player action"),
                ("action.search", "Search Area", "Player action"),
                ("action.interact", "Interact", "Player action"),
                ("ui.character", "Character", "UI tab"),
                ("ui.inventory", "Inventory", "UI tab"),
                ("ui.quests", "Quests", "UI tab"),
                ("ui.story", "Story", "UI tab"),
                ("message.loading", "Loading...", "Loading message"),
                ("message.error", "An error occurred", "Error message"),
                ("message.offline", "Playing offline", "Offline indicator"),
                ("rarity.common", "Common", "Item rarity"),
                ("rarity.uncommon", "Uncommon", "Item rarity"),
                ("rarity.rare", "Rare", "Item rarity"),
                ("rarity.epic", "Epic", "Item rarity"),
                ("rarity.legendary", "Legendary", "Item rarity")
            ],
            "es": [
                ("action.look", "Mirar Alrededor", "Player action"),
                ("action.inventory", "Ver Inventario", "Player action"),
                ("action.status", "Ver Estado", "Player action"),
                ("action.rest", "Descansar", "Player action"),
                ("action.search", "Buscar Área", "Player action"),
                ("action.interact", "Interactuar", "Player action"),
                ("ui.character", "Personaje", "UI tab"),
                ("ui.inventory", "Inventario", "UI tab"),
                ("ui.quests", "Misiones", "UI tab"),
                ("ui.story", "Historia", "UI tab"),
                ("message.loading", "Cargando...", "Loading message"),
                ("message.error", "Ocurrió un error", "Error message"),
                ("message.offline", "Jugando sin conexión", "Offline indicator")
            ]
        }
        
        for language, texts in default_texts.items():
            if language not in self.ui_texts:
                self.ui_texts[language] = {}
            
            for key, value, context in texts:
                self.ui_texts[language][key] = UIText(key, language, value, context)
    
    def _initialize_scenarios(self):
        """Initialize default scenario configurations"""
        self.scenarios = {
            "fantasy-adventure": {
                "id": "fantasy-adventure",
                "name": "Fantasy Adventure",
                "description": "Classic fantasy setting with magic and monsters",
                "background_image": "scenario-bg-fantasy",
                "character_classes": ["warrior", "mage", "rogue", "cleric"],
                "starting_location": "Village of Millhaven",
                "difficulty": "medium",
                "tags": ["fantasy", "magic", "adventure"]
            },
            "space-exploration": {
                "id": "space-exploration", 
                "name": "Space Exploration",
                "description": "Sci-fi adventure among the stars",
                "background_image": "scenario-bg-scifi",
                "character_classes": ["pilot", "engineer", "scientist", "soldier"],
                "starting_location": "Orbital Station Alpha",
                "difficulty": "hard",
                "tags": ["scifi", "space", "exploration"]
            },
            "modern-mystery": {
                "id": "modern-mystery",
                "name": "Modern Mystery",
                "description": "Contemporary mystery and investigation",
                "background_image": "scenario-bg-city",
                "character_classes": ["detective", "journalist", "hacker", "lawyer"],
                "starting_location": "Downtown Metro City",
                "difficulty": "medium",
                "tags": ["modern", "mystery", "investigation"]
            }
        }
    
    def _initialize_content_items(self):
        """Initialize default content items"""
        content_items = [
            ContentItem("quick-actions-default", "ui-config", "actions", {
                "actions": [
                    {"id": "look", "label": "Look Around", "icon": "👀"},
                    {"id": "inventory", "label": "Check Inventory", "icon": "🎒"},
                    {"id": "status", "label": "Check Status", "icon": "❤️"},
                    {"id": "rest", "label": "Rest", "icon": "😴"},
                    {"id": "search", "label": "Search Area", "icon": "🔍"},
                    {"id": "interact", "label": "Interact", "icon": "🤝"}
                ]
            }),
            ContentItem("tutorial-intro", "tutorial", "onboarding", {
                "title": "Welcome to EmergentRPG!",
                "content": "Begin your adventure by choosing a scenario and creating your character.",
                "steps": [
                    "Select a scenario that interests you",
                    "Create or customize your character", 
                    "Start playing and let your story unfold!"
                ]
            })
        ]
        
        for item in content_items:
            self.content_items[item.id] = item
    
    async def get_scenarios(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get available scenarios with optional filtering"""
        try:
            scenarios = list(self.scenarios.values())
            
            if filters:
                # Apply filters
                if "difficulty" in filters:
                    scenarios = [s for s in scenarios if s.get("difficulty") == filters["difficulty"]]
                if "tags" in filters:
                    filter_tags = filters["tags"] if isinstance(filters["tags"], list) else [filters["tags"]]
                    scenarios = [s for s in scenarios if any(tag in s.get("tags", []) for tag in filter_tags)]
            
            logger.debug(f"Returning {len(scenarios)} scenarios")
            return scenarios
            
        except Exception as e:
            logger.error(f"Error getting scenarios: {str(e)}")
            return []
    
    async def get_media_assets(self, category: Optional[str] = None) -> List[MediaAsset]:
        """Get media assets by category"""
        try:
            assets = list(self.media_assets.values())
            
            if category:
                assets = [asset for asset in assets if category in asset.tags]
            
            logger.debug(f"Returning {len(assets)} media assets for category '{category}'")
            return assets
            
        except Exception as e:
            logger.error(f"Error getting media assets: {str(e)}")
            return []
    
    async def get_ui_text(self, language: str = "en") -> Dict[str, str]:
        """Get UI text translations for a language"""
        try:
            if language not in self.ui_texts:
                language = "en"  # Fallback to English
            
            result = {}
            if language in self.ui_texts:
                for key, ui_text in self.ui_texts[language].items():
                    result[key] = ui_text.value
            
            logger.debug(f"Returning {len(result)} UI texts for language '{language}'")
            return result
            
        except Exception as e:
            logger.error(f"Error getting UI text: {str(e)}")
            return {}
    
    async def update_content(self, content_type: str, data: Dict[str, Any]) -> bool:
        """Update content data"""
        try:
            if content_type == "scenario":
                scenario_id = data.get("id")
                if scenario_id:
                    self.scenarios[scenario_id] = data
                    logger.info(f"Updated scenario '{scenario_id}'")
                    return True
            
            elif content_type == "media_asset":
                asset_id = data.get("id")
                if asset_id:
                    # Update existing or create new
                    if asset_id in self.media_assets:
                        asset = self.media_assets[asset_id]
                        asset.url = data.get("url", asset.url)
                        asset.fallback_url = data.get("fallback_url", asset.fallback_url)
                        asset.alt_text = data.get("alt_text", asset.alt_text)
                        asset.tags = data.get("tags", asset.tags)
                        asset.updated_at = datetime.now()
                    else:
                        self.media_assets[asset_id] = MediaAsset(
                            asset_id, data.get("type", "image"), 
                            data.get("url", ""), data.get("fallback_url"),
                            data.get("alt_text"), data.get("tags", [])
                        )
                    logger.info(f"Updated media asset '{asset_id}'")
                    return True
            
            elif content_type == "ui_text":
                language = data.get("language", "en")
                key = data.get("key")
                value = data.get("value")
                
                if key and value:
                    if language not in self.ui_texts:
                        self.ui_texts[language] = {}
                    
                    self.ui_texts[language][key] = UIText(
                        key, language, value, 
                        data.get("context"), data.get("category", "general")
                    )
                    logger.info(f"Updated UI text '{key}' for language '{language}'")
                    return True
            
            logger.warning(f"Unknown content type or missing data: {content_type}")
            return False
            
        except Exception as e:
            logger.error(f"Error updating content: {str(e)}")
            return False
    
    async def get_content_by_category(self, category: str) -> List[ContentItem]:
        """Get content items by category"""
        try:
            items = [item for item in self.content_items.values() if item.category == category]
            logger.debug(f"Returning {len(items)} content items for category '{category}'")
            return items
            
        except Exception as e:
            logger.error(f"Error getting content by category: {str(e)}")
            return []
    
    async def create_media_asset(self, asset_id: str, asset_type: str, url: str,
                               fallback_url: Optional[str] = None, alt_text: Optional[str] = None,
                               tags: Optional[List[str]] = None) -> bool:
        """Create a new media asset"""
        try:
            if asset_id in self.media_assets:
                logger.warning(f"Media asset '{asset_id}' already exists")
                return False
            
            self.media_assets[asset_id] = MediaAsset(
                asset_id, asset_type, url, fallback_url, alt_text, tags
            )
            logger.info(f"Created new media asset '{asset_id}'")
            return True
            
        except Exception as e:
            logger.error(f"Error creating media asset: {str(e)}")
            return False
    
    async def delete_media_asset(self, asset_id: str) -> bool:
        """Delete a media asset"""
        try:
            if asset_id in self.media_assets:
                del self.media_assets[asset_id]
                logger.info(f"Deleted media asset '{asset_id}'")
                return True
            else:
                logger.warning(f"Media asset '{asset_id}' not found")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting media asset: {str(e)}")
            return False


# Global content manager instance
content_manager = ContentManager()
