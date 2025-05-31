"""
Cache Management Service
Provides Redis + in-memory caching for improved performance
"""

import asyncio
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from cachetools import TTLCache
from pydantic import BaseModel

from models.game_models import GameSession
from config.settings import settings

# Try to import redis.asyncio, fallback to None if not installed
try:
    import redis.asyncio as redis
except ImportError:
    redis = None
    logging.warning("redis.asyncio is not installed. Redis cache will be unavailable.")

logger = logging.getLogger(__name__)


class CacheEntry(BaseModel):
    """Cache entry with metadata"""
    key: str
    value: Any
    expires_at: datetime
    created_at: datetime
    hit_count: int = 0
    cache_type: str = "memory"  # "memory" or "redis"


class CacheStats(BaseModel):
    """Cache performance statistics"""
    total_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    hit_rate: float = 0.0
    memory_cache_size: int = 0
    redis_cache_keys: int = 0
    last_reset: datetime


class CacheManager:
    """
    Multi-layered cache management system
    - L1: In-memory cache for frequently accessed data (TTL: 10 minutes)
    - L2: Redis cache for session data and larger objects (TTL: 24 hours)
    """
    
    def __init__(self):
        # In-memory cache for quick access
        self.memory_cache = TTLCache(maxsize=5000, ttl=600)  # 10 minutes
        
        # Redis client for persistent caching
        self.redis_client = None
        self.redis_available = False
        
        # Cache statistics
        self.stats = CacheStats(last_reset=datetime.now())
        
        # Cache configuration
        self.config = {
            "memory_ttl": 600,      # 10 minutes
            "redis_ttl": 86400,     # 24 hours
            "ai_response_ttl": 3600, # 1 hour
            "game_state_ttl": 86400, # 24 hours
            "config_ttl": 1800,     # 30 minutes
        }
        
        logger.info("CacheManager initialized")
    
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            redis_url = settings.cache.redis_url
            # Check if REDIS_ENABLED is set to true in environment
            redis_enabled = settings.cache.redis_enabled

            if redis_enabled and redis and redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self.redis_client.ping()
                self.redis_available = True
                logger.info("Redis cache connected successfully")
            else:
                # If Redis is not enabled, don't show a warning
                if redis_enabled:
                    logger.warning("Redis URL not configured or redis.asyncio not available, using memory cache only")
                else:
                    logger.info("Redis cache disabled by configuration, using memory cache only")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using memory cache only")
            self.redis_available = False
    
    def _generate_cache_key(self, namespace: str, key: str) -> str:
        """Generate standardized cache key"""
        return f"emergent_rpg:{namespace}:{key}"
    
    def _hash_key(self, data: Union[str, Dict]) -> str:
        """Generate hash for complex keys"""
        if isinstance(data, dict):
            data = json.dumps(data, sort_keys=True)
        return hashlib.md5(data.encode()).hexdigest()
    
    async def get(self, namespace: str, key: str, default: Any = None) -> Any:
        """Get value from cache (memory first, then Redis)"""
        self.stats.total_requests += 1
        cache_key = self._generate_cache_key(namespace, key)
        try:
            # Try memory cache first
            if cache_key in self.memory_cache:
                self.stats.cache_hits += 1
                logger.debug(f"Memory cache hit: {cache_key}")
                return self.memory_cache[cache_key]
            # Try Redis cache
            if self.redis_available and self.redis_client:
                redis_value = await self.redis_client.get(cache_key)
                if redis_value is not None:
                    try:
                        value = json.loads(redis_value)
                        # Promote to memory cache
                        self.memory_cache[cache_key] = value
                        self.stats.cache_hits += 1
                        logger.debug(f"Redis cache hit (promoted): {cache_key}")
                        return value
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode Redis value for key: {cache_key}")
            # Cache miss
            self.stats.cache_misses += 1
            logger.debug(f"Cache miss: {cache_key}")
            return default
        except Exception as e:
            logger.error(f"Cache get error for {cache_key}: {e}")
            self.stats.cache_misses += 1
            return default
    
    async def set(self, namespace: str, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        cache_key = self._generate_cache_key(namespace, key)
        try:
            # Set in memory cache
            self.memory_cache[cache_key] = value
            # Set in Redis if available
            if self.redis_available and self.redis_client:
                json_value = json.dumps(value, default=str)
                cache_ttl = ttl or self.config.get(f"{namespace}_ttl", self.config["redis_ttl"])
                await self.redis_client.setex(cache_key, cache_ttl, json_value)
            logger.debug(f"Cache set: {cache_key}")
            return True
        except Exception as e:
            logger.error(f"Cache set error for {cache_key}: {e}")
            return False
    
    async def delete(self, namespace: str, key: str) -> bool:
        """Delete value from cache"""
        cache_key = self._generate_cache_key(namespace, key)
        try:
            # Remove from memory cache
            self.memory_cache.pop(cache_key, None)
            # Remove from Redis
            if self.redis_available and self.redis_client:
                await self.redis_client.delete(cache_key)
            logger.debug(f"Cache deleted: {cache_key}")
            return True
        except Exception as e:
            logger.error(f"Cache delete error for {cache_key}: {e}")
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        try:
            count = 0
            # Invalidate memory cache entries
            keys_to_remove = []
            for key in self.memory_cache.keys():
                if pattern in key:
                    keys_to_remove.append(key)
            for key in keys_to_remove:
                self.memory_cache.pop(key, None)
                count += 1
            # Invalidate Redis cache entries
            if self.redis_available and self.redis_client:
                redis_pattern = f"emergent_rpg:*{pattern}*"
                keys = await self.redis_client.keys(redis_pattern)
                if keys:
                    await self.redis_client.delete(*keys)
                    count += len(keys)
            logger.info(f"Invalidated {count} cache entries matching pattern: {pattern}")
            return count
        except Exception as e:
            logger.error(f"Cache pattern invalidation error: {e}")
            return 0
    
    # Specialized cache methods for common data types
    
    async def cache_game_state(self, session_id: str, state: GameSession) -> bool:
        """Cache game session state"""
        try:
            state_dict = state.model_dump() if hasattr(state, 'model_dump') else state
            return await self.set("game_state", session_id, state_dict, 
                                ttl=self.config["game_state_ttl"])
        except Exception as e:
            logger.error(f"Error caching game state: {e}")
            return False
    
    async def get_game_state(self, session_id: str) -> Optional[Dict]:
        """Get cached game session state"""
        return await self.get("game_state", session_id)
    
    async def cache_ai_response(self, prompt_hash: str, response: str) -> bool:
        """Cache AI response"""
        cache_data = {
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "prompt_hash": prompt_hash
        }
        return await self.set("ai_response", prompt_hash, cache_data, 
                            ttl=self.config["ai_response_ttl"])
    
    async def get_ai_response(self, prompt_hash: str) -> Optional[str]:
        """Get cached AI response"""
        cached_data = await self.get("ai_response", prompt_hash)
        if cached_data and isinstance(cached_data, dict):
            return cached_data.get("response")
        return cached_data
    
    async def cache_config(self, config_type: str, user_id: Optional[str], config_data: Dict) -> bool:
        """Cache configuration data"""
        key = f"{config_type}:{user_id or 'default'}"
        return await self.set("config", key, config_data, ttl=self.config["config_ttl"])
    
    async def get_config(self, config_type: str, user_id: Optional[str] = None) -> Optional[Dict]:
        """Get cached configuration"""
        key = f"{config_type}:{user_id or 'default'}"
        return await self.get("config", key)
    
    async def cache_quest_data(self, session_id: str, quest_data: Dict) -> bool:
        """Cache quest data for session"""
        return await self.set("quest", session_id, quest_data)
    
    async def get_quest_data(self, session_id: str) -> Optional[Dict]:
        """Get cached quest data"""
        return await self.get("quest", session_id)
    
    async def cache_inventory_data(self, session_id: str, inventory_data: Dict) -> bool:
        """Cache inventory data for session"""
        return await self.set("inventory", session_id, inventory_data)
    
    async def get_inventory_data(self, session_id: str) -> Optional[Dict]:
        """Get cached inventory data"""
        return await self.get("inventory", session_id)
    
    async def cache_world_state(self, session_id: str, world_data: Dict) -> bool:
        """Cache world state for session"""
        return await self.set("world", session_id, world_data)
    
    async def get_world_state(self, session_id: str) -> Optional[Dict]:
        """Get cached world state"""
        return await self.get("world", session_id)
    
    # Cache management and monitoring
    
    async def get_cache_stats(self) -> CacheStats:
        """Get cache performance statistics"""
        # Update hit rate
        if self.stats.total_requests > 0:
            self.stats.hit_rate = self.stats.cache_hits / self.stats.total_requests
        
        # Update cache sizes
        self.stats.memory_cache_size = len(self.memory_cache)
        
        if self.redis_available and self.redis_client:
            try:
                redis_info = await self.redis_client.info()
                self.stats.redis_cache_keys = redis_info.get('db0', {}).get('keys', 0)
            except Exception as e:
                logger.error(f"Error getting Redis stats: {e}")
        
        return self.stats
    
    async def reset_stats(self):
        """Reset cache statistics"""
        self.stats = CacheStats(last_reset=datetime.now())
    
    async def clear_all_cache(self) -> Dict[str, int]:
        """Clear all cache data"""
        try:
            memory_cleared = len(self.memory_cache)
            self.memory_cache.clear()
            redis_cleared = 0
            if self.redis_available and self.redis_client:
                # Get count before clearing
                keys = await self.redis_client.keys("emergent_rpg:*")
                redis_cleared = len(keys)
                if keys:
                    await self.redis_client.delete(*keys)
            logger.info(f"Cache cleared: {memory_cleared} memory, {redis_cleared} Redis entries")
            return {
                "memory_cleared": memory_cleared,
                "redis_cleared": redis_cleared,
                "total_cleared": memory_cleared + redis_cleared
            }
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return {"memory_cleared": 0, "redis_cleared": 0, "total_cleared": 0}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check cache system health"""
        health = {
            "memory_cache": {
                "status": "healthy",
                "size": len(self.memory_cache),
                "max_size": self.memory_cache.maxsize
            },
            "redis_cache": {
                "status": "unavailable" if not (self.redis_available and self.redis_client) else "healthy",
                "connected": self.redis_available and self.redis_client is not None
            },
            "stats": await self.get_cache_stats()
        }
        
        if self.redis_available and self.redis_client:
            try:
                await self.redis_client.ping()
                health["redis_cache"]["status"] = "healthy"
            except Exception as e:
                health["redis_cache"]["status"] = "error"
                health["redis_cache"]["error"] = str(e)
        
        return health


# Global cache manager instance
cache_manager = CacheManager()
