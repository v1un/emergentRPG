"""
Centralized AI Context Management System
Provides comprehensive, up-to-date context to all AI services for coherent decision-making
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set

from models.game_models import Character, GameSession, StoryEntry, WorldState, Quest
from models.scenario_models import Lorebook, LoreCharacter, Location
from services.ai.dynamic_world_manager import WorldStateChange
from services.ai.character_development_manager import CharacterDevelopmentSuggestion
from services.ai.consequence_manager import ConsequenceEvent

logger = logging.getLogger(__name__)


class NarrativeThread:
    """Represents an ongoing narrative thread in the story"""
    def __init__(self, thread_id: str, theme: str, importance: str, 
                 related_characters: List[str], related_locations: List[str],
                 story_entries: List[str], status: str = "active"):
        self.thread_id = thread_id
        self.theme = theme
        self.importance = importance  # major, minor, background
        self.related_characters = related_characters
        self.related_locations = related_locations
        self.story_entries = story_entries
        self.status = status  # active, resolved, dormant
        self.created_at = datetime.now()
        self.last_referenced = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "thread_id": self.thread_id,
            "theme": self.theme,
            "importance": self.importance,
            "related_characters": self.related_characters,
            "related_locations": self.related_locations,
            "story_entries": self.story_entries,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "last_referenced": self.last_referenced.isoformat()
        }


class RelationshipState:
    """Tracks character relationships and reputation"""
    def __init__(self, character_name: str, npc_name: str, 
                 relationship_type: str = "neutral", strength: int = 0,
                 history: Optional[List[str]] = None):
        self.character_name = character_name
        self.npc_name = npc_name
        self.relationship_type = relationship_type  # ally, enemy, neutral, romantic, mentor, etc.
        self.strength = strength  # -100 to +100
        self.history = history or []
        self.last_interaction = None
        self.created_at = datetime.now()
    
    def update_relationship(self, interaction: str, change: int):
        """Update relationship based on interaction"""
        self.history.append(f"{datetime.now().isoformat()}: {interaction}")
        self.strength = max(-100, min(100, self.strength + change))
        self.last_interaction = datetime.now()
        
        # Update relationship type based on strength
        if self.strength >= 75:
            self.relationship_type = "close_ally"
        elif self.strength >= 25:
            self.relationship_type = "ally"
        elif self.strength >= -25:
            self.relationship_type = "neutral"
        elif self.strength >= -75:
            self.relationship_type = "hostile"
        else:
            self.relationship_type = "enemy"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "character_name": self.character_name,
            "npc_name": self.npc_name,
            "relationship_type": self.relationship_type,
            "strength": self.strength,
            "history": self.history[-5:],  # Last 5 interactions
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None
        }


class GameContext:
    """Comprehensive game context for AI systems"""
    def __init__(self, session: GameSession, lorebook: Optional[Lorebook] = None):
        self.session = session
        self.lorebook = lorebook
        self.character = session.character
        self.world_state = session.world_state
        self.narrative_threads: List[NarrativeThread] = []
        self.relationships: Dict[str, RelationshipState] = {}
        self.world_events: List[Dict[str, Any]] = []
        self.character_development_history: List[CharacterDevelopmentSuggestion] = []
        self.consequence_history: List[ConsequenceEvent] = []
        self.world_changes: List[WorldStateChange] = []
        self.session_summary = self._build_session_summary()
        self.character_arc = self._analyze_character_arc()
        self.world_consistency = self._build_world_consistency()
        
    def _build_session_summary(self) -> Dict[str, Any]:
        """Build comprehensive session summary"""
        story_length = len(self.session.story)
        recent_actions = [entry.text for entry in self.session.story[-10:] 
                         if entry.type.value == "action"]
        
        # Analyze story progression
        story_phases = []
        if story_length < 5:
            story_phases.append("introduction")
        elif story_length < 20:
            story_phases.append("early_development")
        elif story_length < 50:
            story_phases.append("middle_development")
        else:
            story_phases.append("advanced_story")
        
        return {
            "session_id": self.session.session_id,
            "story_length": story_length,
            "character_level": self.character.level,
            "current_location": self.world_state.current_location,
            "active_quests": len([q for q in self.session.quests if q.status == "active"]),
            "completed_quests": len([q for q in self.session.quests if q.status == "completed"]),
            "recent_actions": recent_actions,
            "story_phases": story_phases,
            "session_duration": (datetime.now() - self.session.created_at).total_seconds() / 3600,
            "world_title": self.lorebook.series_metadata.title if self.lorebook else "Unknown World"
        }
    
    def _analyze_character_arc(self) -> Dict[str, Any]:
        """Analyze character development arc"""
        # Track character growth patterns
        action_patterns = {}
        for entry in self.session.story:
            if entry.type.value == "action":
                # Categorize actions
                action_text = entry.text.lower()
                if any(word in action_text for word in ["help", "assist", "save"]):
                    action_patterns["helpful"] = action_patterns.get("helpful", 0) + 1
                elif any(word in action_text for word in ["attack", "fight", "battle"]):
                    action_patterns["combat"] = action_patterns.get("combat", 0) + 1
                elif any(word in action_text for word in ["explore", "investigate", "search"]):
                    action_patterns["exploration"] = action_patterns.get("exploration", 0) + 1
                elif any(word in action_text for word in ["talk", "speak", "negotiate"]):
                    action_patterns["social"] = action_patterns.get("social", 0) + 1
        
        # Determine dominant character traits
        dominant_traits = sorted(action_patterns.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "action_patterns": action_patterns,
            "dominant_traits": [trait[0] for trait in dominant_traits],
            "character_growth_stage": self._determine_growth_stage(),
            "personality_evolution": self._track_personality_evolution()
        }
    
    def _determine_growth_stage(self) -> str:
        """Determine character's growth stage"""
        level = self.character.level
        story_length = len(self.session.story)
        
        if level <= 2 and story_length < 10:
            return "novice"
        elif level <= 5 and story_length < 30:
            return "developing"
        elif level <= 10 and story_length < 60:
            return "experienced"
        else:
            return "veteran"
    
    def _track_personality_evolution(self) -> List[str]:
        """Track how personality has evolved"""
        evolution = []
        
        # Analyze metadata for development history
        if hasattr(self.character, 'metadata') and self.character.metadata:
            if 'personality_development' in self.character.metadata:
                evolution = self.character.metadata['personality_development']
        
        return evolution
    
    def _build_world_consistency(self) -> Dict[str, Any]:
        """Build world consistency information"""
        consistency_data = {
            "established_facts": [],
            "location_history": [],
            "npc_interactions": [],
            "world_rules": []
        }
        
        if self.lorebook:
            consistency_data["world_rules"] = [
                f"Power System: {self.lorebook.series_metadata.power_system}",
                f"Setting: {self.lorebook.series_metadata.setting}",
                f"Genre: {self.lorebook.series_metadata.genre}",
                f"Tone: {self.lorebook.series_metadata.tone}"
            ]
            
            consistency_data["established_facts"] = [
                f"World: {self.lorebook.series_metadata.title}",
                f"Characters: {[char.name for char in self.lorebook.characters[:5]]}",
                f"Locations: {[loc.name for loc in self.lorebook.locations[:5]]}"
            ]
        
        # Track location history
        location_mentions = {}
        for entry in self.session.story:
            # Simple location extraction (could be enhanced with NLP)
            if "location" in entry.text.lower() or "place" in entry.text.lower():
                location_mentions[self.world_state.current_location] = location_mentions.get(
                    self.world_state.current_location, 0) + 1
        
        consistency_data["location_history"] = list(location_mentions.keys())
        
        return consistency_data
    
    def add_narrative_thread(self, theme: str, importance: str, 
                           related_characters: List[str], related_locations: List[str]):
        """Add new narrative thread"""
        thread_id = f"thread_{len(self.narrative_threads)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        thread = NarrativeThread(thread_id, theme, importance, 
                               related_characters, related_locations, [])
        self.narrative_threads.append(thread)
        return thread
    
    def update_relationship(self, npc_name: str, interaction: str, change: int):
        """Update character relationship"""
        key = f"{self.character.name}_{npc_name}"
        if key not in self.relationships:
            self.relationships[key] = RelationshipState(self.character.name, npc_name)
        
        self.relationships[key].update_relationship(interaction, change)
    
    def get_active_narrative_threads(self) -> List[NarrativeThread]:
        """Get currently active narrative threads"""
        return [thread for thread in self.narrative_threads if thread.status == "active"]
    
    def get_relationship_summary(self) -> Dict[str, Any]:
        """Get summary of all relationships"""
        summary = {}
        for key, relationship in self.relationships.items():
            summary[relationship.npc_name] = {
                "type": relationship.relationship_type,
                "strength": relationship.strength,
                "recent_interaction": relationship.history[-1] if relationship.history else None
            }
        return summary
    
    def to_comprehensive_dict(self) -> Dict[str, Any]:
        """Convert to comprehensive dictionary for AI consumption"""
        return {
            "session_summary": self.session_summary,
            "character_arc": self.character_arc,
            "world_consistency": self.world_consistency,
            "narrative_threads": [thread.to_dict() for thread in self.get_active_narrative_threads()],
            "relationships": {npc: rel.to_dict() for npc, rel in self.relationships.items()},
            "current_state": {
                "character": {
                    "name": self.character.name,
                    "level": self.character.level,
                    "class": self.character.class_name,
                    "health": f"{self.character.health}/{self.character.max_health}",
                    "mana": f"{self.character.mana}/{self.character.max_mana}",
                    "experience": self.character.experience,
                    "stats": {
                        "strength": self.character.stats.strength,
                        "dexterity": self.character.stats.dexterity,
                        "intelligence": self.character.stats.intelligence,
                        "constitution": self.character.stats.constitution,
                        "wisdom": self.character.stats.wisdom,
                        "charisma": self.character.stats.charisma
                    }
                },
                "world": {
                    "location": self.world_state.current_location,
                    "time": self.world_state.time_of_day,
                    "weather": self.world_state.weather,
                    "npcs_present": self.world_state.npcs_present,
                    "special_conditions": self.world_state.special_conditions,
                    "environment": self.world_state.environment_description
                },
                "quests": [
                    {
                        "title": quest.title,
                        "status": quest.status,
                        "progress": f"{quest.progress.current}/{quest.progress.total}",
                        "objectives": quest.objectives
                    } for quest in self.session.quests
                ]
            }
        }


class ContextManager:
    """Centralized context management for all AI systems"""
    
    def __init__(self):
        self.active_contexts: Dict[str, GameContext] = {}
        self.context_cache_duration = timedelta(minutes=30)
    
    def get_context(self, session: GameSession, lorebook: Optional[Lorebook] = None) -> GameContext:
        """Get or create comprehensive game context"""
        session_id = session.session_id
        
        # Check if we have a cached context
        if session_id in self.active_contexts:
            context = self.active_contexts[session_id]
            # Update with current session state
            context.session = session
            context.character = session.character
            context.world_state = session.world_state
            return context
        
        # Create new context
        context = GameContext(session, lorebook)
        self.active_contexts[session_id] = context
        
        logger.info(f"Created new game context for session {session_id}")
        return context
    
    def update_context(self, session_id: str, **updates):
        """Update specific context elements"""
        if session_id in self.active_contexts:
            context = self.active_contexts[session_id]
            for key, value in updates.items():
                if hasattr(context, key):
                    setattr(context, key, value)
    
    def cleanup_old_contexts(self):
        """Remove old cached contexts"""
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, context in self.active_contexts.items():
            if current_time - context.session.updated_at > self.context_cache_duration:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.active_contexts[session_id]
            logger.info(f"Cleaned up expired context for session {session_id}")


# Global context manager instance
context_manager = ContextManager()
