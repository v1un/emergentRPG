import json
import logging
from typing import Dict, List, Any, Optional
from utils.gemini_client import gemini_client
from models.game_models import GameSession, StoryEntry, ActionType, WorldState, Character
from models.scenario_models import Lorebook

logger = logging.getLogger(__name__)

class RealtimeGameplayFlow:
    """Genkit-style flow for real-time AI Game Master functionality"""
    
    async def action_interpretation_flow(self, 
                                       player_action: str, 
                                       game_session: GameSession, 
                                       lorebook: Optional[Lorebook] = None) -> Dict[str, Any]:
        """Flow: Interpret and analyze player actions using Gemini Flash"""
        
        # Build context from recent story
        recent_story = game_session.story[-5:] if len(game_session.story) > 5 else game_session.story
        story_context = "\n".join([f"{entry.type}: {entry.text}" for entry in recent_story])
        
        # Build world context from lorebook
        world_context = ""
        if lorebook:
            world_context = f"""
            Setting: {lorebook.series_metadata.setting}
            Power System: {lorebook.series_metadata.power_system}
            Key Characters: {[c.name for c in lorebook.characters[:5]]}
            Current Location: {game_session.world_state.current_location}
            """
        
        prompt = f"""
        Analyze this player action in the context of the ongoing adventure:
        
        Player Action: "{player_action}"
        
        Current Context:
        {world_context}
        
        Recent Story:
        {story_context}
        
        Character: {game_session.character.name} (Level {game_session.character.level})
        Current Location: {game_session.world_state.current_location}
        Health: {game_session.character.health}/{game_session.character.max_health}
        
        Analyze the action and provide interpretation in JSON format:
        {{
            "action_type": "combat/exploration/social/magic/stealth/investigation/other",
            "intent": "what the player is trying to accomplish",
            "feasibility": "possible/difficult/impossible/requires_roll",
            "skill_requirements": ["skills needed for this action"],
            "potential_consequences": ["positive outcomes", "negative outcomes"],
            "environmental_factors": ["how location affects this action"],
            "character_factors": ["how character traits affect this"],
            "difficulty_level": "trivial/easy/medium/hard/extreme",
            "required_resources": ["items, mana, etc. needed"],
            "time_required": "instant/short/medium/long",
            "stealth_level": "overt/subtle/hidden",
            "risk_level": "safe/low/medium/high/dangerous",
            "narrative_weight": "minor/moderate/major/climactic",
            "suggested_outcomes": [
                {{
                    "outcome_type": "success/partial_success/failure/critical_failure",
                    "probability": 0.7,
                    "description": "what happens with this outcome",
                    "consequences": ["immediate effects"],
                    "follow_up_opportunities": ["what this enables"]
                }}
            ]
        }}
        """
        
        system_instruction = """You are an expert Game Master with deep understanding of game mechanics and narrative flow.
        Analyze player actions fairly, considering both character capabilities and story context.
        Provide multiple possible outcomes with realistic probabilities.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.4,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse action interpretation JSON: {response}")
            return {
                "action_type": "other",
                "intent": "unclear",
                "feasibility": "possible",
                "difficulty_level": "medium",
                "suggested_outcomes": [{
                    "outcome_type": "success",
                    "probability": 0.6,
                    "description": "The action succeeds with some effort",
                    "consequences": ["minor positive result"],
                    "follow_up_opportunities": ["continue adventure"]
                }]
            }
    
    async def state_update_flow(self, 
                              action_analysis: Dict[str, Any], 
                              game_session: GameSession) -> GameSession:
        """Flow: Update game world based on action results"""
        
        # Determine outcome based on probabilities
        outcomes = action_analysis.get("suggested_outcomes", [])
        if not outcomes:
            return game_session
            
        # For now, select most likely outcome (in real implementation, would roll dice)
        selected_outcome = max(outcomes, key=lambda x: x.get("probability", 0))
        
        # Update character state based on action
        action_type = action_analysis.get("action_type", "other")
        difficulty = action_analysis.get("difficulty_level", "medium")
        
        # Award experience for actions
        exp_gain = {"trivial": 1, "easy": 2, "medium": 5, "hard": 10, "extreme": 20}.get(difficulty, 5)
        game_session.character.experience += exp_gain
        
        # Handle level up
        if game_session.character.experience >= game_session.character.level * 100:
            game_session.character.level += 1
            game_session.character.max_health += 10
            game_session.character.health = game_session.character.max_health
            game_session.character.max_mana += 5
            game_session.character.mana = game_session.character.max_mana
        
        # Update world state based on consequences
        consequences = selected_outcome.get("consequences", [])
        for consequence in consequences:
            if "discovered" in consequence.lower():
                game_session.world_state.special_conditions.append(consequence)
            elif "enemy" in consequence.lower():
                game_session.world_state.npcs_present.append("Hostile Entity")
        
        return game_session
    
    async def response_generation_flow(self, 
                                     player_action: str,
                                     action_analysis: Dict[str, Any],
                                     game_session: GameSession,
                                     lorebook: Optional[Lorebook] = None) -> str:
        """Flow: Generate GM response using context and consistency"""
        
        # Get selected outcome
        outcomes = action_analysis.get("suggested_outcomes", [])
        selected_outcome = max(outcomes, key=lambda x: x.get("probability", 0)) if outcomes else {}
        
        # Build rich context
        recent_story = game_session.story[-3:] if len(game_session.story) > 3 else game_session.story
        story_context = "\n".join([f"{entry.type}: {entry.text}" for entry in recent_story])
        
        world_context = ""
        if lorebook:
            # Get relevant characters and locations
            relevant_chars = [c.name for c in lorebook.characters[:3]]
            world_context = f"""
            Series: {lorebook.series_metadata.title}
            Setting: {lorebook.series_metadata.setting}
            Tone: {lorebook.series_metadata.tone}
            Key Characters: {relevant_chars}
            Power System: {lorebook.series_metadata.power_system}
            """
        
        prompt = f"""
        As the AI Game Master, respond to the player's action with a compelling narrative.
        
        World Context:
        {world_context}
        
        Recent Story:
        {story_context}
        
        Player Action: "{player_action}"
        Action Analysis: {action_analysis.get('intent', 'unclear intent')}
        Outcome: {selected_outcome.get('description', 'uncertain result')}
        
        Current Situation:
        - Location: {game_session.world_state.current_location}
        - Time: {game_session.world_state.time_of_day}
        - Weather: {game_session.world_state.weather}
        - NPCs Present: {game_session.world_state.npcs_present}
        - Character Health: {game_session.character.health}/{game_session.character.max_health}
        
        Generate a response that:
        1. Acknowledges the player's action
        2. Describes what happens as a result
        3. Sets up the next moment in the adventure
        4. Maintains the series' tone and style
        5. Includes sensory details (sight, sound, smell, etc.)
        6. Advances the narrative meaningfully
        
        Write a compelling 2-3 paragraph response that immerses the player in the world.
        Focus on showing rather than telling, and maintain appropriate pacing.
        """
        
        system_instruction = f"""You are an expert AI Game Master running an adventure based on {lorebook.series_metadata.title if lorebook else 'a fantasy world'}.
        Create immersive, engaging responses that make players feel like they're truly in the world.
        Match the tone and style of the source material while keeping the story moving forward.
        Be descriptive but concise, dramatic but not overwrought."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.8,
            max_output_tokens=1000
        )
        
        return response
    
    async def consistency_check_flow(self, 
                                   generated_response: str,
                                   game_session: GameSession,
                                   lorebook: Optional[Lorebook] = None) -> Dict[str, Any]:
        """Flow: Validate response against lorebook and game state"""
        
        world_facts = ""
        if lorebook:
            world_facts = f"""
            Setting Rules: {lorebook.series_metadata.setting}
            Power System: {lorebook.series_metadata.power_system}
            Character Names: {[c.name for c in lorebook.characters[:5]]}
            Tone: {lorebook.series_metadata.tone}
            """
        
        prompt = f"""
        Check this AI GM response for consistency with the established world and story.
        
        World Facts:
        {world_facts}
        
        Current Game State:
        - Location: {game_session.world_state.current_location}
        - Character: {game_session.character.name} (Level {game_session.character.level})
        - Recent Events: {[entry.text for entry in game_session.story[-2:]] if game_session.story else []}
        
        Generated Response: "{generated_response}"
        
        Analyze consistency in JSON format:
        {{
            "consistency_score": 0.95,
            "issues_found": ["list any inconsistencies"],
            "factual_errors": ["incorrect information"],
            "tone_match": "matches/partially_matches/doesn't_match",
            "character_behavior": "accurate/questionable/wrong",
            "world_logic": "consistent/minor_issues/major_problems",
            "narrative_flow": "smooth/adequate/jarring",
            "recommendations": ["suggested improvements"],
            "approval_status": "approved/needs_revision/rejected"
        }}
        """
        
        system_instruction = """You are a quality assurance expert for interactive storytelling.
        Identify inconsistencies, errors, and areas for improvement in AI-generated content.
        Be thorough but fair in your analysis.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse consistency check JSON: {response}")
            return {
                "consistency_score": 0.7,
                "issues_found": [],
                "approval_status": "approved"
            }
    
    async def execute_full_turn(self, 
                              player_action: str,
                              game_session: GameSession,
                              lorebook: Optional[Lorebook] = None) -> Dict[str, Any]:
        """Execute complete turn: interpret action -> update state -> generate response -> check consistency"""
        
        try:
            # Step 1: Interpret player action
            action_analysis = await self.action_interpretation_flow(player_action, game_session, lorebook)
            
            # Step 2: Update game state
            updated_session = await self.state_update_flow(action_analysis, game_session)
            
            # Step 3: Generate GM response
            gm_response = await self.response_generation_flow(player_action, action_analysis, updated_session, lorebook)
            
            # Step 4: Check consistency
            consistency_check = await self.consistency_check_flow(gm_response, updated_session, lorebook)
            
            # Step 5: Create story entry
            action_entry = StoryEntry(type=ActionType.ACTION, text=player_action)
            response_entry = StoryEntry(type=ActionType.NARRATION, text=gm_response)
            
            updated_session.story.extend([action_entry, response_entry])
            
            return {
                "success": True,
                "updated_session": updated_session,
                "gm_response": gm_response,
                "action_analysis": action_analysis,
                "consistency_check": consistency_check
            }
            
        except Exception as e:
            logger.error(f"Error executing turn: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "fallback_response": "Something unexpected happened. Please try a different action."
            }

# Global flow instance
realtime_gameplay_flow = RealtimeGameplayFlow()