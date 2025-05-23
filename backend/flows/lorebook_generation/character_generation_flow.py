import json
import logging
from typing import Dict, List, Any, Optional
from utils.gemini_client import gemini_client
from models.scenario_models import SeriesMetadata, Character

logger = logging.getLogger(__name__)

class CharacterGenerationFlow:
    """Genkit-style flow for comprehensive character generation"""
    
    async def main_characters_flow(self, series_metadata: SeriesMetadata) -> List[Character]:
        """Flow: Generate detailed main character profiles"""
        prompt = f"""
        Create detailed main character profiles for "{series_metadata.title}".
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Genre: {series_metadata.genre}
        - Themes: {series_metadata.themes}
        - Power System: {series_metadata.power_system}
        - Tone: {series_metadata.tone}
        
        Generate main characters in JSON format:
        {{
            "characters": [
                {{
                    "name": "Character Full Name",
                    "role": "protagonist/antagonist/deuteragonist",
                    "description": "detailed physical and general description",
                    "personality": ["key personality traits", "quirks", "flaws"],
                    "abilities": ["specific powers", "skills", "talents"],
                    "relationships": {{
                        "character_name": "relationship_type",
                        "another_character": "relationship_description"
                    }},
                    "background": "detailed backstory and origins",
                    "goals": ["primary objective", "secondary goals", "hidden desires"],
                    "speech_patterns": ["how they talk", "catchphrases", "speech quirks"],
                    "character_arc": "how they develop throughout the story",
                    "fears": ["what they're afraid of"],
                    "motivations": ["what drives them"],
                    "secrets": ["hidden aspects", "unknown truths"],
                    "equipment": ["signature items", "weapons", "tools"],
                    "reputation": "how others see them",
                    "moral_alignment": "ethical stance and values",
                    "combat_style": "how they fight or solve conflicts",
                    "weaknesses": ["physical limitations", "emotional vulnerabilities"],
                    "playable_potential": "high/medium/low - suitability as player character",
                    "starting_power_level": "beginner/intermediate/advanced",
                    "growth_potential": "how much they can develop as a character"
                }}
            ]
        }}
        
        Create 4-6 main characters with complex, interconnected relationships.
        Ensure at least 2-3 characters have "high" playable_potential for interactive gameplay.
        Focus on characters that would be engaging to play as protagonists in an adventure.
        """
        
        system_instruction = """You are an expert character designer and narrative specialist.
        Create complex, multi-dimensional characters with realistic flaws and growth potential.
        Ensure characters have clear motivations and interesting relationships.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=4000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            characters = []
            for char_data in data.get("characters", []):
                character = Character(
                    name=char_data.get("name", "Unknown Character"),
                    role=char_data.get("role", "supporting"),
                    description=char_data.get("description", ""),
                    personality=char_data.get("personality", []),
                    abilities=char_data.get("abilities", []),
                    relationships=char_data.get("relationships", {}),
                    background=char_data.get("background", ""),
                    goals=char_data.get("goals", []),
                    speech_patterns=char_data.get("speech_patterns", [])
                )
                characters.append(character)
            return characters
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse main characters JSON: {response}, Error: {e}")
            return [Character(
                name="Hero",
                role="protagonist",
                description="A brave adventurer",
                personality=["courageous", "determined"],
                abilities=["swordsmanship"],
                relationships={},
                background="Unknown origins",
                goals=["save the world"],
                speech_patterns=["speaks confidently"]
            )]
    
    async def supporting_cast_flow(self, series_metadata: SeriesMetadata, main_characters: List[Character]) -> List[Character]:
        """Flow: Generate supporting character network"""
        main_chars_context = "\n".join([f"- {c.name}: {c.role}, {c.description}" for c in main_characters[:4]])
        
        prompt = f"""
        Create a network of supporting characters for "{series_metadata.title}".
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Themes: {series_metadata.themes}
        - Tone: {series_metadata.tone}
        
        Main Characters:
        {main_chars_context}
        
        Generate supporting characters in JSON format:
        {{
            "characters": [
                {{
                    "name": "Character Name",
                    "role": "mentor/ally/rival/neutral/authority_figure/comic_relief",
                    "description": "physical and general description",
                    "personality": ["key traits that make them memorable"],
                    "abilities": ["skills and capabilities"],
                    "relationships": {{
                        "main_character_name": "specific relationship dynamic"
                    }},
                    "background": "relevant backstory",
                    "goals": ["what they want to achieve"],
                    "speech_patterns": ["distinctive way of speaking"],
                    "narrative_function": "what role they serve in stories",
                    "availability": "how often they can appear",
                    "location": "where they're usually found",
                    "resources": ["what they can provide to others"],
                    "limitations": ["what they cannot or will not do"],
                    "hooks": ["story hooks they can provide"]
                }}
            ]
        }}
        
        Create 8-12 diverse supporting characters that expand the world.
        """
        
        system_instruction = """You are an expert in ensemble cast creation and narrative support.
        Create memorable supporting characters that enhance main character development.
        Ensure each character serves a clear narrative function and has distinct personality.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=4000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            characters = []
            for char_data in data.get("characters", []):
                character = Character(
                    name=char_data.get("name", "Unknown Character"),
                    role=char_data.get("role", "supporting"),
                    description=char_data.get("description", ""),
                    personality=char_data.get("personality", []),
                    abilities=char_data.get("abilities", []),
                    relationships=char_data.get("relationships", {}),
                    background=char_data.get("background", ""),
                    goals=char_data.get("goals", []),
                    speech_patterns=char_data.get("speech_patterns", [])
                )
                characters.append(character)
            return characters
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse supporting characters JSON: {response}, Error: {e}")
            return []
    
    async def relationship_mapping_flow(self, characters: List[Character]) -> Dict[str, Any]:
        """Flow: Generate complex relationship dynamics"""
        chars_context = "\n".join([f"- {c.name}: {c.role}, {c.personality[:2]}" for c in characters[:10]])
        
        prompt = f"""
        Create detailed relationship mappings between these characters:
        
        {chars_context}
        
        Generate relationship dynamics in JSON format:
        {{
            "relationship_matrix": {{
                "character_a_name": {{
                    "character_b_name": {{
                        "relationship_type": "friend/enemy/rival/family/mentor/romantic/neutral",
                        "relationship_strength": 0.8,
                        "relationship_description": "detailed description of their dynamic",
                        "history": "how they met and past interactions",
                        "current_status": "current state of relationship",
                        "potential_development": "how relationship might evolve",
                        "conflict_sources": ["what causes tension"],
                        "bonding_factors": ["what brings them together"],
                        "interaction_frequency": "how often they interact",
                        "public_vs_private": "how their relationship differs in different contexts"
                    }}
                }}
            }},
            "group_dynamics": [
                {{
                    "group_name": "name of character group/faction",
                    "members": ["character names in this group"],
                    "group_purpose": "why they're together",
                    "internal_dynamics": "how they interact within group",
                    "leadership": "who leads and how",
                    "conflicts": ["internal tensions"],
                    "strengths": ["what makes them effective together"]
                }}
            ],
            "love_triangles": [
                {{
                    "characters": ["three character names"],
                    "dynamic": "description of romantic tension",
                    "complications": ["what makes it complex"]
                }}
            ],
            "rivalries": [
                {{
                    "character_a": "character name",
                    "character_b": "character name",
                    "rivalry_type": "professional/personal/romantic/ideological",
                    "origin": "how the rivalry started",
                    "stakes": "what they're competing for"
                }}
            ]
        }}
        """
        
        system_instruction = """You are an expert in character dynamics and relationship writing.
        Create complex, realistic relationships that generate interesting story possibilities.
        Ensure relationships have both positive and negative aspects for dramatic tension.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse relationship mapping JSON: {response}")
            return {
                "relationship_matrix": {},
                "group_dynamics": [],
                "love_triangles": [],
                "rivalries": []
            }
    
    async def character_progression_flow(self, characters: List[Character], series_metadata: SeriesMetadata) -> Dict[str, Any]:
        """Flow: Generate character development arcs and progression paths"""
        main_chars = [c for c in characters if c.role in ["protagonist", "deuteragonist", "antagonist"]][:4]
        chars_context = "\n".join([f"- {c.name}: {c.goals[:2]}, {c.personality[:2]}" for c in main_chars])
        
        prompt = f"""
        Create character development arcs for "{series_metadata.title}".
        
        Series Themes: {series_metadata.themes}
        Main Characters:
        {chars_context}
        
        Generate progression paths in JSON format:
        {{
            "character_arcs": {{
                "character_name": {{
                    "starting_state": "where they begin emotionally/mentally",
                    "core_flaw": "main weakness they must overcome",
                    "growth_catalyst": "what forces them to change",
                    "development_stages": [
                        "early character state",
                        "crisis point",
                        "growth moment",
                        "final state"
                    ],
                    "skills_progression": {{
                        "combat_abilities": ["novice skill", "intermediate skill", "master skill"],
                        "social_abilities": ["starting social skills", "developed skills"],
                        "special_abilities": ["power growth stages"]
                    }},
                    "relationship_changes": {{
                        "other_character": "how relationship evolves"
                    }},
                    "major_decisions": ["key choices they must make"],
                    "potential_endings": ["possible character conclusions"],
                    "learning_moments": ["key realizations and growth"],
                    "setbacks": ["temporary failures and lessons"],
                    "mentorship": "who guides their development"
                }}
            }},
            "power_scaling": {{
                "beginner_level": "starting abilities for new characters",
                "intermediate_level": "mid-game capabilities",
                "advanced_level": "late-game powers",
                "master_level": "ultimate potential"
            }},
            "character_milestones": [
                {{
                    "milestone_name": "achievement name",
                    "description": "what this represents",
                    "requirements": ["what must be done to achieve this"],
                    "rewards": ["benefits gained"],
                    "character_change": "how this changes the character"
                }}
            ]
        }}
        """
        
        system_instruction = """You are an expert in character development and narrative progression.
        Create meaningful character arcs that reflect the series themes and provide satisfying growth.
        Ensure progression feels earned and has both victories and setbacks.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse character progression JSON: {response}")
            return {
                "character_arcs": {},
                "power_scaling": {
                    "beginner_level": "Basic abilities",
                    "intermediate_level": "Improved skills",
                    "advanced_level": "Strong capabilities",
                    "master_level": "Peak performance"
                },
                "character_milestones": []
            }

# Global flow instance
character_generation_flow = CharacterGenerationFlow()
