"""
Feature Flags Management System
Handles feature toggles for gradual rollouts and A/B testing
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class FeatureFlag:
    """Individual feature flag model"""
    def __init__(self, feature: str, enabled: bool = False, scope: str = "global", 
                 description: str = "", created_at: Optional[datetime] = None):
        self.feature = feature
        self.enabled = enabled
        self.scope = scope  # global, user, percentage
        self.description = description
        self.created_at = created_at or datetime.now()
        self.updated_at = datetime.now()
        self.percentage = 0  # For percentage-based rollouts
        self.user_whitelist: List[str] = []
        self.user_blacklist: List[str] = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "feature": self.feature,
            "enabled": self.enabled,
            "scope": self.scope,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "percentage": self.percentage,
            "user_whitelist": self.user_whitelist,
            "user_blacklist": self.user_blacklist
        }


class FeatureFlagManager:
    """Manages feature flags for dynamic feature control"""
    
    def __init__(self):
        self.flags: Dict[str, FeatureFlag] = {}
        self._initialize_default_flags()
    
    def _initialize_default_flags(self):
        """Initialize default feature flags"""
        default_flags = [
            FeatureFlag("dynamic_themes", True, "global", "Enable dynamic theme switching"),
            FeatureFlag("ai_response_caching", True, "global", "Cache AI responses for better performance"),
            FeatureFlag("realtime_updates", True, "global", "Enable WebSocket real-time updates"),
            FeatureFlag("mobile_optimizations", True, "global", "Enable mobile-specific optimizations"),
            FeatureFlag("accessibility_enhancements", True, "global", "Enable accessibility features"),
            FeatureFlag("debug_mode", False, "global", "Enable debug information and tools"),
            FeatureFlag("beta_features", False, "global", "Enable beta feature access"),
            FeatureFlag("analytics_tracking", True, "global", "Enable usage analytics"),
            FeatureFlag("offline_mode", True, "global", "Enable offline gameplay mode"),
            FeatureFlag("auto_save", True, "global", "Enable automatic game state saving")
        ]
        
        for flag in default_flags:
            self.flags[flag.feature] = flag
        
        logger.info(f"Initialized {len(default_flags)} default feature flags")
    
    async def is_feature_enabled(self, feature: str, user_id: Optional[str] = None) -> bool:
        """Check if a feature is enabled for a specific user or globally"""
        try:
            if feature not in self.flags:
                logger.warning(f"Feature flag '{feature}' not found, defaulting to False")
                return False
            
            flag = self.flags[feature]
            
            # Check user blacklist first
            if user_id and user_id in flag.user_blacklist:
                logger.debug(f"Feature '{feature}' disabled for user {user_id} (blacklisted)")
                return False
            
            # Check user whitelist
            if user_id and user_id in flag.user_whitelist:
                logger.debug(f"Feature '{feature}' enabled for user {user_id} (whitelisted)")
                return True
            
            # Global scope - return flag state
            if flag.scope == "global":
                logger.debug(f"Feature '{feature}' global state: {flag.enabled}")
                return flag.enabled
            
            # Percentage-based rollout
            if flag.scope == "percentage" and user_id:
                # Simple hash-based percentage calculation
                user_hash = hash(user_id) % 100
                enabled = user_hash < flag.percentage
                logger.debug(f"Feature '{feature}' percentage rollout for user {user_id}: {enabled}")
                return enabled
            
            # User-specific scope
            if flag.scope == "user":
                # Only enabled for users in whitelist
                enabled = user_id in flag.user_whitelist if user_id else False
                logger.debug(f"Feature '{feature}' user-specific for {user_id}: {enabled}")
                return enabled
            
            # Default to disabled
            logger.debug(f"Feature '{feature}' defaulting to disabled")
            return False
            
        except Exception as e:
            logger.error(f"Error checking feature flag '{feature}': {str(e)}")
            return False
    
    async def get_all_flags(self, user_id: Optional[str] = None) -> Dict[str, bool]:
        """Get all feature flags with their states for a user"""
        try:
            result = {}
            for feature_name in self.flags.keys():
                result[feature_name] = await self.is_feature_enabled(feature_name, user_id)
            
            logger.debug(f"Retrieved {len(result)} feature flags for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error getting all flags: {str(e)}")
            return {}
    
    async def update_flag(self, feature: str, enabled: bool, scope: str = "global") -> bool:
        """Update a feature flag"""
        try:
            if feature not in self.flags:
                # Create new flag if it doesn't exist
                self.flags[feature] = FeatureFlag(feature, enabled, scope)
                logger.info(f"Created new feature flag '{feature}': {enabled}")
            else:
                # Update existing flag
                self.flags[feature].enabled = enabled
                self.flags[feature].scope = scope
                self.flags[feature].updated_at = datetime.now()
                logger.info(f"Updated feature flag '{feature}': {enabled}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating feature flag '{feature}': {str(e)}")
            return False
    
    async def set_percentage_rollout(self, feature: str, percentage: int) -> bool:
        """Set percentage-based rollout for a feature"""
        try:
            if feature not in self.flags:
                self.flags[feature] = FeatureFlag(feature, True, "percentage")
            
            if 0 <= percentage <= 100:
                self.flags[feature].percentage = percentage
                self.flags[feature].scope = "percentage"
                self.flags[feature].enabled = True
                self.flags[feature].updated_at = datetime.now()
                logger.info(f"Set {percentage}% rollout for feature '{feature}'")
                return True
            else:
                logger.error(f"Invalid percentage {percentage} for feature '{feature}'")
                return False
                
        except Exception as e:
            logger.error(f"Error setting percentage rollout for '{feature}': {str(e)}")
            return False
    
    async def add_user_to_whitelist(self, feature: str, user_id: str) -> bool:
        """Add user to feature whitelist"""
        try:
            if feature not in self.flags:
                self.flags[feature] = FeatureFlag(feature, True, "user")
            
            if user_id not in self.flags[feature].user_whitelist:
                self.flags[feature].user_whitelist.append(user_id)
                self.flags[feature].updated_at = datetime.now()
                logger.info(f"Added user {user_id} to whitelist for feature '{feature}'")
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding user to whitelist: {str(e)}")
            return False
    
    async def remove_user_from_whitelist(self, feature: str, user_id: str) -> bool:
        """Remove user from feature whitelist"""
        try:
            if feature in self.flags and user_id in self.flags[feature].user_whitelist:
                self.flags[feature].user_whitelist.remove(user_id)
                self.flags[feature].updated_at = datetime.now()
                logger.info(f"Removed user {user_id} from whitelist for feature '{feature}'")
            
            return True
            
        except Exception as e:
            logger.error(f"Error removing user from whitelist: {str(e)}")
            return False
    
    async def add_user_to_blacklist(self, feature: str, user_id: str) -> bool:
        """Add user to feature blacklist"""
        try:
            if feature not in self.flags:
                self.flags[feature] = FeatureFlag(feature, True, "global")
            
            if user_id not in self.flags[feature].user_blacklist:
                self.flags[feature].user_blacklist.append(user_id)
                self.flags[feature].updated_at = datetime.now()
                logger.info(f"Added user {user_id} to blacklist for feature '{feature}'")
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding user to blacklist: {str(e)}")
            return False
    
    async def get_flag_details(self, feature: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a feature flag"""
        try:
            if feature in self.flags:
                return self.flags[feature].to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Error getting flag details: {str(e)}")
            return None
    
    async def get_enabled_features(self, user_id: Optional[str] = None) -> List[str]:
        """Get list of enabled features for a user"""
        try:
            enabled_features = []
            for feature_name in self.flags.keys():
                if await self.is_feature_enabled(feature_name, user_id):
                    enabled_features.append(feature_name)
            
            logger.debug(f"User {user_id} has {len(enabled_features)} enabled features")
            return enabled_features
            
        except Exception as e:
            logger.error(f"Error getting enabled features: {str(e)}")
            return []
    
    async def create_feature_flag(self, feature: str, enabled: bool = False, 
                                scope: str = "global", description: str = "") -> bool:
        """Create a new feature flag"""
        try:
            if feature in self.flags:
                logger.warning(f"Feature flag '{feature}' already exists")
                return False
            
            self.flags[feature] = FeatureFlag(feature, enabled, scope, description)
            logger.info(f"Created new feature flag '{feature}' with scope '{scope}'")
            return True
            
        except Exception as e:
            logger.error(f"Error creating feature flag '{feature}': {str(e)}")
            return False
    
    async def delete_feature_flag(self, feature: str) -> bool:
        """Delete a feature flag"""
        try:
            if feature in self.flags:
                del self.flags[feature]
                logger.info(f"Deleted feature flag '{feature}'")
                return True
            else:
                logger.warning(f"Feature flag '{feature}' not found for deletion")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting feature flag '{feature}': {str(e)}")
            return False


# Global feature flag manager instance
feature_flag_manager = FeatureFlagManager()
