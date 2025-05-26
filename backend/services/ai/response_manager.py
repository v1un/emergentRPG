"""
AI Response Management Service
Handles AI response generation, caching, and fallback responses
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from cachetools import TTLCache

from models.game_models import Character, GameSession, WorldState
from models.scenario_models import Lorebook
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class NarrativeResponse:
    """Structured narrative response from AI"""
    def __init__(self, response_text: str, response_type: str = "narrative",
                 character_effects: Optional[Dict[str, Any]] = None,
                 world_effects: Optional[Dict[str, Any]] = None,
                 suggested_actions: Optional[List[str]] = None,
                 metadata: Optional[Dict[str, Any]] = None):
        self.response_text = response_text
        self.response_type = response_type  # narrative, dialogue, action_result, system
        self.character_effects = character_effects or {}
        self.world_effects = world_effects or {}
        self.suggested_actions = suggested_actions or []
        self.metadata = metadata or {}
        self.generated_at = datetime.now()
        self.confidence_score = 0.8  # Default confidence
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "response_text": self.response_text,
            "response_type": self.response_type,
            "character_effects": self.character_effects,
            "world_effects": self.world_effects,
            "suggested_actions": self.suggested_actions,
            "metadata": self.metadata,
            "generated_at": self.generated_at.isoformat(),
            "confidence_score": self.confidence_score
        }


class GameContext:
    """Context information for AI response generation"""
    def __init__(self, session: GameSession, lorebook: Optional[Lorebook] = None,
                 recent_actions: Optional[List[str]] = None):
        self.session = session
        self.lorebook = lorebook
        self.recent_actions = recent_actions or []
        self.character = session.character
        self.world_state = session.world_state
        self.story_length = len(session.story)
        self.last_actions = recent_actions[-5:] if recent_actions else []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "character": self.character.model_dump(),
            "world_state": self.world_state.model_dump(),
            "story_length": self.story_length,
            "last_actions": self.last_actions,
            "lorebook_available": self.lorebook is not None,
            "lorebook_title": self.lorebook.series_metadata.title if self.lorebook else None
        }


class AIResponseManager:
    """Manages AI response generation with fallbacks and caching"""
    
    def __init__(self):
        self.response_cache = TTLCache(maxsize=1000, ttl=300)  # 5 minute cache
        self.fallback_responses = self._load_fallback_responses()
        self.response_templates = self._load_response_templates()
        self.max_retries = 3
        self.rate_limit_cache = TTLCache(maxsize=100, ttl=60)  # Rate limiting
    
    def _load_fallback_responses(self) -> Dict[str, Dict[str, List[str]]]:
        """Load fallback responses for when AI is unavailable"""
        return {
            "attack": {
                "fantasy": [
                    "You swing your weapon with determination, the blade cutting through the air.",
                    "Your attack connects, sending sparks flying in the dim light.",
                    "You strike out with fierce resolve, your weapon finding its mark.",
                    "The clash of metal rings out as you engage in combat.",
                    "Your offensive move creates an opening in your opponent's defense."
                ],
                "sci_fi": [
                    "Your energy weapon discharges with a brilliant flash of light.",
                    "The plasma burst illuminates the metallic corridor as you fire.",
                    "Your tactical strike disrupts the enemy's defensive systems.",
                    "The laser beam cuts through the atmosphere with deadly precision.",
                    "Your advanced weaponry activates with a satisfying hum."
                ],
                "modern": [
                    "You take aim and fire, the sound echoing in the space around you.",
                    "Your tactical movement puts you in an advantageous position.",
                    "The confrontation escalates as you make your move.",
                    "Your training kicks in as you engage the threat.",
                    "You react swiftly, your actions precise and calculated."
                ]
            },
            "defend": {
                "fantasy": [
                    "You raise your shield, deflecting the incoming attack.",
                    "Your defensive stance proves effective against the assault.",
                    "You parry skillfully, turning aside the threatening blow.",
                    "Your armor absorbs the impact with a satisfying clang.",
                    "You dodge gracefully, avoiding the dangerous strike."
                ],
                "sci_fi": [
                    "Your energy shields flare to life, protecting you from harm.",
                    "The defensive matrix activates, creating a protective barrier.",
                    "Your suit's defensive systems engage automatically.",
                    "You take cover behind the metallic structure.",
                    "Your evasive maneuvers prove effective against the attack."
                ],
                "modern": [
                    "You take cover, using the environment to your advantage.",
                    "Your defensive position holds against the assault.",
                    "You react quickly, minimizing the incoming damage.",
                    "Your tactical retreat proves to be the right choice.",
                    "You successfully counter the threatening move."
                ]
            },
            "explore": {
                "fantasy": [
                    "You venture forth, discovering new wonders in this mystical realm.",
                    "The path ahead reveals itself as you explore deeper.",
                    "Your curiosity leads you to uncover hidden secrets.",
                    "The ancient stones seem to whisper tales of old.",
                    "You find yourself drawn to investigate the mysterious area."
                ],
                "sci_fi": [
                    "Your sensors detect anomalous readings as you scan the area.",
                    "The advanced technology around you hums with unknown purpose.",
                    "Your exploration reveals fascinating technological marvels.",
                    "The alien architecture defies conventional understanding.",
                    "Your investigation uncovers evidence of advanced civilization."
                ],
                "modern": [
                    "You investigate the area, looking for clues and information.",
                    "Your careful observation reveals interesting details.",
                    "The environment holds secrets waiting to be discovered.",
                    "You methodically search the space for anything useful.",
                    "Your exploration yields unexpected discoveries."
                ]
            },
            "interact": {
                "fantasy": [
                    "You approach with diplomatic intent, ready for conversation.",
                    "The interaction reveals new information about your situation.",
                    "Your social skills prove valuable in this encounter.",
                    "The exchange provides insight into the local customs.",
                    "You engage meaningfully with those around you."
                ],
                "sci_fi": [
                    "You initiate contact using the universal communication protocols.",
                    "The technological interface responds to your input.",
                    "Your diplomatic subroutines activate for the interaction.",
                    "The exchange of information proves mutually beneficial.",
                    "You successfully establish a communication link."
                ],
                "modern": [
                    "You strike up a conversation, gathering valuable information.",
                    "The interaction provides new perspective on the situation.",
                    "Your communication skills help build rapport.",
                    "The exchange reveals important details about your environment.",
                    "You engage professionally with the people around you."
                ]
            },
            "rest": {
                "fantasy": [
                    "You find a peaceful spot to rest and recover your strength.",
                    "The brief respite allows you to gather your thoughts.",
                    "You take time to tend to your wounds and equipment.",
                    "The rest proves refreshing, restoring your energy.",
                    "You use this quiet moment to plan your next move."
                ],
                "sci_fi": [
                    "Your regeneration systems activate during the rest period.",
                    "The medical bay's systems help restore your condition.",
                    "You enter a recovery cycle, recharging your energy reserves.",
                    "The advanced life support systems aid in your recovery.",
                    "Your suit's repair functions work while you rest."
                ],
                "modern": [
                    "You take a well-deserved break to recover.",
                    "The rest allows you to regain your composure.",
                    "You use the downtime to assess your situation.",
                    "The brief respite helps clear your mind.",
                    "You take care of your immediate needs during the rest."
                ]
            },
            "look": {
                "fantasy": [
                    "You survey your surroundings with careful attention.",
                    "The mystical environment reveals its hidden details.",
                    "Your keen observation uncovers interesting features.",
                    "The ancient setting holds many secrets to discover.",
                    "You take in the magical atmosphere of the place."
                ],
                "sci_fi": [
                    "Your visual sensors scan the technological environment.",
                    "The advanced systems around you display fascinating complexity.",
                    "Your analysis reveals the sophisticated nature of this place.",
                    "The alien technology presents intriguing possibilities.",
                    "Your enhanced vision picks up details others might miss."
                ],
                "modern": [
                    "You carefully observe your current environment.",
                    "The details of the area become clear as you look around.",
                    "Your attention to detail reveals important information.",
                    "The setting provides clues about what to do next.",
                    "You take stock of the situation and your options."
                ]
            }
        }
    
    def _load_response_templates(self) -> Dict[str, str]:
        """Load response templates for structured generation"""
        return {
            "action_result": """Based on the player's action "{action}", generate a response that:
1. Describes the immediate result of the action
2. Includes any effects on the character or world
3. Sets up potential next actions
4. Maintains consistency with the story so far

Context: {context}
Character: {character_info}
Current situation: {situation}""",
            
            "dialogue": """Generate dialogue for the following interaction:
Player action: "{action}"
NPC/Character: {npc_info}
Setting: {setting}
Mood: {mood}

The dialogue should be:
- Consistent with the character's personality
- Appropriate for the setting and situation
- Engaging and forward-moving""",
            
            "exploration": """The player is exploring: {location}
Previous discoveries: {discoveries}
Character level: {level}
Time of day: {time}

Generate an exploration result that:
1. Describes what the character finds or observes
2. May include discovery of items, NPCs, or locations
3. Provides options for further exploration
4. Maintains atmosphere appropriate to the setting""",
            
            "combat": """Combat action: {action}
Enemy: {enemy}
Character stats: {stats}
Equipment: {equipment}
Environment: {environment}

Generate a combat result that:
1. Describes the action's effectiveness
2. Includes tactical details
3. Shows consequences for both sides
4. Advances the combat narrative"""
        }
    
    async def generate_narrative_response(self, context: GameContext, action: str) -> NarrativeResponse:
        """Generate AI narrative response for player action"""
        try:
            # Check cache first
            cache_key = self._generate_cache_key(context, action)
            if cache_key in self.response_cache:
                logger.debug(f"Using cached response for action: {action}")
                return self.response_cache[cache_key]
            
            # Check rate limiting
            if self._is_rate_limited(context.session.session_id):
                logger.warning(f"Rate limited session {context.session.session_id}")
                return await self.get_fallback_response("rate_limited", context.to_dict())
            
            # Generate AI response
            response = await self._generate_ai_response(context, action)
            
            # Cache the response
            self.response_cache[cache_key] = response
            
            logger.info(f"Generated AI response for action: {action[:50]}...")
            return response
            
        except Exception as e:
            logger.error(f"Error generating narrative response: {str(e)}")
            return await self.get_fallback_response("error", context.to_dict())
    
    def _generate_cache_key(self, context: GameContext, action: str) -> str:
        """Generate cache key for response"""
        # Create a hash based on relevant context
        context_str = f"{action}_{context.character.level}_{context.world_state.current_location}_{len(context.session.story)}"
        return hashlib.md5(context_str.encode()).hexdigest()
    
    def _is_rate_limited(self, session_id: str) -> bool:
        """Check if session is rate limited"""
        current_count = self.rate_limit_cache.get(session_id, 0)
        if current_count >= 10:  # 10 requests per minute
            return True
        
        self.rate_limit_cache[session_id] = current_count + 1
        return False
    
    async def _generate_ai_response(self, context: GameContext, action: str) -> NarrativeResponse:
        """Generate response using AI with retries"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Determine response type
                response_type = self._classify_action(action)
                
                # Build prompt based on type
                prompt = await self._build_prompt(context, action, response_type)
                
                # Generate with AI
                ai_response = await gemini_client.generate_text(prompt)
                
                # Parse and structure response
                narrative_response = await self._parse_ai_response(ai_response, response_type, context, action)
                
                return narrative_response
                
            except Exception as e:
                last_error = e
                logger.warning(f"AI generation attempt {attempt + 1} failed: {str(e)}")
                if attempt < self.max_retries - 1:
                    await self._wait_between_retries(attempt)
        
        # All retries failed, use fallback
        logger.error(f"All AI generation attempts failed: {str(last_error)}")
        return await self.get_fallback_response(self._classify_action(action), context.to_dict())
    
    def _classify_action(self, action: str) -> str:
        """Classify the type of action for appropriate response generation"""
        action_lower = action.lower()
        
        # Combat actions
        if any(word in action_lower for word in ["attack", "fight", "strike", "hit", "shoot", "stab", "slash"]):
            return "attack"
        
        # Defensive actions
        if any(word in action_lower for word in ["defend", "block", "parry", "dodge", "shield", "guard"]):
            return "defend"
        
        # Exploration actions
        if any(word in action_lower for word in ["explore", "search", "investigate", "examine", "look"]):
            return "explore"
        
        # Social actions
        if any(word in action_lower for word in ["talk", "speak", "say", "ask", "tell", "greet", "convince"]):
            return "interact"
        
        # Rest actions
        if any(word in action_lower for word in ["rest", "sleep", "wait", "camp", "recover"]):
            return "rest"
        
        # Default to exploration for unknown actions
        return "explore"
    
    async def _build_prompt(self, context: GameContext, action: str, response_type: str) -> str:
        """Build AI prompt based on context and action type"""
        try:
            # Base context
            base_context = f"""
Current Character: {context.character.name} (Level {context.character.level}, {context.character.class_name})
Current Location: {context.world_state.current_location}
Time: {context.world_state.time_of_day}, Weather: {context.world_state.weather}
Story Length: {context.story_length} entries

Player Action: "{action}"
"""
            
            # Add lorebook context if available
            if context.lorebook:
                base_context += f"""
World Setting: {context.lorebook.series_metadata.title} - {context.lorebook.series_metadata.setting}
Genre: {context.lorebook.series_metadata.genre}
"""
            
            # Add recent story context
            if context.session.story:
                recent_story = context.session.story[-3:]  # Last 3 entries
                base_context += "Recent Story Context:\n"
                for entry in recent_story:
                    base_context += f"- {entry.text}\n"
            
            # Use specific template if available
            if response_type in self.response_templates:
                template = self.response_templates[response_type]
                prompt = template.format(
                    action=action,
                    context=base_context,
                    character_info=f"{context.character.name} ({context.character.class_name})",
                    situation=context.world_state.environment_description,
                    location=context.world_state.current_location,
                    level=context.character.level,
                    time=context.world_state.time_of_day
                )
            else:
                # General prompt
                prompt = f"""{base_context}

Generate a narrative response to the player's action. The response should:
1. Be 2-4 sentences long
2. Describe the result of the action
3. Maintain consistency with the world and character
4. Provide engaging story progression
5. Set up potential next actions

Response:"""
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error building prompt: {str(e)}")
            return f"The player performs the action: {action}. Generate an appropriate response."
    
    async def _parse_ai_response(self, ai_response: str, response_type: str, 
                                context: GameContext, action: str) -> NarrativeResponse:
        """Parse AI response into structured format"""
        try:
            # Clean up the response
            response_text = ai_response.strip()
            
            # Extract effects based on response type
            character_effects = {}
            world_effects = {}
            suggested_actions = []
            
            # Analyze response for implicit effects
            if response_type == "attack":
                # Look for combat results
                if any(word in response_text.lower() for word in ["hit", "strike", "damage"]):
                    character_effects["combat_action"] = "successful_attack"
                
            elif response_type == "rest":
                # Look for recovery effects
                if any(word in response_text.lower() for word in ["recover", "heal", "restore"]):
                    character_effects["rest_bonus"] = True
            
            elif response_type == "explore":
                # Look for discoveries
                if any(word in response_text.lower() for word in ["find", "discover", "notice"]):
                    world_effects["discovery"] = True
            
            # Generate suggested actions based on response
            suggested_actions = self._generate_suggested_actions(response_text, response_type, context)
            
            return NarrativeResponse(
                response_text=response_text,
                response_type=response_type,
                character_effects=character_effects,
                world_effects=world_effects,
                suggested_actions=suggested_actions,
                metadata={
                    "original_action": action,
                    "generation_method": "ai",
                    "context_hash": self._generate_cache_key(context, action)
                }
            )
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            # Return basic response
            return NarrativeResponse(
                response_text=ai_response.strip(),
                response_type=response_type,
                metadata={"error": str(e), "generation_method": "ai_fallback"}
            )
    
    def _generate_suggested_actions(self, response_text: str, response_type: str, 
                                  context: GameContext) -> List[str]:
        """Generate suggested next actions based on response"""
        suggestions = []
        
        # Base suggestions by response type
        type_suggestions = {
            "attack": ["Continue fighting", "Defend yourself", "Look for cover"],
            "defend": ["Counter-attack", "Retreat", "Hold position"],
            "explore": ["Investigate further", "Move to new area", "Search for items"],
            "interact": ["Continue conversation", "Ask questions", "Make a request"],
            "rest": ["Continue resting", "Check surroundings", "Plan next move"]
        }
        
        suggestions.extend(type_suggestions.get(response_type, ["Look around", "Think about options"]))
        
        # Add context-specific suggestions
        if context.world_state.npcs_present:
            suggestions.append("Talk to someone")
        
        if context.world_state.available_actions:
            suggestions.extend(context.world_state.available_actions[:2])
        
        return suggestions[:4]  # Limit to 4 suggestions
    
    async def _wait_between_retries(self, attempt: int):
        """Wait between retry attempts with exponential backoff"""
        import asyncio
        wait_time = 2 ** attempt  # Exponential backoff
        await asyncio.sleep(wait_time)
    
    async def get_fallback_response(self, action_type: str, context: dict) -> NarrativeResponse:
        """Get fallback response when AI is unavailable"""
        try:
            # Determine scenario type for appropriate fallback
            scenario_type = "fantasy"  # Default
            
            if context.get("lorebook_title"):
                title = context["lorebook_title"].lower()
                if any(word in title for word in ["space", "future", "cyber", "tech"]):
                    scenario_type = "sci_fi"
                elif any(word in title for word in ["modern", "contemporary", "city"]):
                    scenario_type = "modern"
            
            # Get fallback responses for this action type and scenario
            responses = self.fallback_responses.get(action_type, {}).get(scenario_type, [])
            
            if not responses:
                # Use generic fallback
                responses = [
                    "You take action, and something happens as a result.",
                    "Your action has an effect on the situation.",
                    "You proceed with your chosen course of action."
                ]
            
            # Select random response
            import random
            response_text = random.choice(responses)
            
            return NarrativeResponse(
                response_text=response_text,
                response_type=action_type,
                suggested_actions=["Continue", "Look around", "Try something else"],
                metadata={
                    "generation_method": "fallback",
                    "scenario_type": scenario_type,
                    "fallback_reason": "ai_unavailable"
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating fallback response: {str(e)}")
            return NarrativeResponse(
                response_text="Something happens in response to your action.",
                response_type="generic",
                metadata={"generation_method": "emergency_fallback", "error": str(e)}
            )
    
    async def validate_action(self, action: str, context: GameContext) -> Tuple[bool, str]:
        """Validate if an action is appropriate for the current context"""
        try:
            # Basic validation
            if not action or len(action.strip()) < 2:
                return False, "Action is too short or empty."
            
            if len(action) > 500:
                return False, "Action is too long. Please be more concise."
            
            # Content validation
            inappropriate_words = ["hack", "cheat", "exploit", "break game"]
            if any(word in action.lower() for word in inappropriate_words):
                return False, "Action contains inappropriate content."
            
            # Context validation
            character = context.character
            
            # Check if action requires specific resources
            if any(word in action.lower() for word in ["cast spell", "magic"]):
                if character.mana <= 0:
                    return False, "You don't have enough mana for magical actions."
            
            if any(word in action.lower() for word in ["attack", "fight"]):
                if character.health <= 10:
                    return False, "You're too injured to engage in combat."
            
            # All checks passed
            return True, "Action is valid."
            
        except Exception as e:
            logger.error(f"Error validating action: {str(e)}")
            return True, "Validation error, but allowing action."
    
    def get_response_statistics(self) -> Dict[str, Any]:
        """Get statistics about response generation"""
        return {
            "cache_size": len(self.response_cache),
            "cache_hits": getattr(self.response_cache, 'hits', 0),
            "cache_misses": getattr(self.response_cache, 'misses', 0),
            "fallback_types": list(self.fallback_responses.keys()),
            "supported_scenarios": ["fantasy", "sci_fi", "modern"]
        }
    
    def clear_cache(self):
        """Clear the response cache"""
        self.response_cache.clear()
        logger.info("Response cache cleared")


# Global AI response manager instance
ai_response_manager = AIResponseManager()
