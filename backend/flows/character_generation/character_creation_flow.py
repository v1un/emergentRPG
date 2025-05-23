import json
import logging
from typing import Dict, List, Any, Optional
from utils.gemini_client import gemini_client
from models.game_models import Character, CharacterStats, InventoryItem
from models.scenario_models import Lorebook

logger = logging.getLogger(__name__)

class CharacterCreationFlow:
    """Genkit-style flow for creating player characters from existing series"""
    
    async def personality_extraction_flow(self, 
                                        character_name: str, 
                                        lorebook: Lorebook) -> Dict[str, Any]:
        """Flow: Extract personality traits from source character"""
        
        # Find character in lorebook
        source_char = None
        for char in lorebook.characters:
            if char.name.lower() == character_name.lower():
                source_char = char
                break
        
        if not source_char:
            return {"error": "Character not found in lorebook"}
        
        prompt = f"""
        Analyze the personality of {character_name} from {lorebook.series_metadata.title} for game adaptation.
        
        Source Character Information:
        - Role: {source_char.role}
        - Description: {source_char.description}
        - Personality: {source_char.personality}
        - Background: {source_char.background}
        - Goals: {source_char.goals}
        - Speech Patterns: {source_char.speech_patterns}
        
        Extract game-relevant personality traits in JSON format:
        {{
            "core_personality": {{
                "dominant_traits": ["primary personality characteristics"],
                "secondary_traits": ["supporting characteristics"],
                "flaws": ["character weaknesses and quirks"],
                "virtues": ["character strengths and positive qualities"],
                "motivations": ["what drives this character"],
                "fears": ["what they're afraid of or avoid"]
            }},
            "behavioral_patterns": {{
                "combat_approach": "how they handle conflicts",
                "social_style": "how they interact with others",
                "decision_making": "how they make choices",
                "stress_response": "how they react under pressure",
                "learning_style": "how they acquire new skills",
                "leadership_style": "how they lead or follow"
            }},
            "roleplay_guidelines": {{
                "speech_style": "how they typically speak",
                "mannerisms": ["physical habits and quirks"],
                "values": ["what they believe in"],
                "taboos": ["what they won't do"],
                "relationships": "how they typically relate to others",
                "growth_areas": ["potential character development"]
            }},
            "game_mechanics": {{
                "preferred_stats": ["which attributes they'd favor"],
                "skill_affinities": ["natural talents"],
                "class_suggestions": ["suitable character classes"],
                "equipment_preferences": ["types of gear they'd use"]
            }}
        }}
        """
        
        system_instruction = """You are an expert in character psychology and game design.
        Analyze characters for authentic personality translation into interactive gameplay.
        Focus on traits that will create interesting roleplay opportunities.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.5,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse personality extraction JSON: {response}")
            return {"error": "Failed to extract personality"}
    
    async def ability_mapping_flow(self, 
                                 character_name: str, 
                                 lorebook: Lorebook) -> Dict[str, Any]:
        """Flow: Convert series abilities to game mechanics"""
        
        source_char = None
        for char in lorebook.characters:
            if char.name.lower() == character_name.lower():
                source_char = char
                break
        
        if not source_char:
            return {"error": "Character not found"}
        
        power_system = lorebook.series_metadata.power_system or "No special powers"
        
        prompt = f"""
        Convert {character_name}'s abilities from {lorebook.series_metadata.title} into game mechanics.
        
        Character Abilities: {source_char.abilities}
        Series Power System: {power_system}
        Character Background: {source_char.background}
        
        Create game mechanic translations in JSON format:
        {{
            "attribute_scores": {{
                "strength": 12,
                "dexterity": 10,
                "intelligence": 14,
                "constitution": 13,
                "wisdom": 11,
                "charisma": 9
            }},
            "special_abilities": [
                {{
                    "name": "Ability Name",
                    "description": "what it does in game terms",
                    "type": "active/passive/triggered",
                    "cost": "mana/stamina/cooldown cost",
                    "requirements": ["prerequisites to use"],
                    "effects": ["mechanical effects"],
                    "scaling": "how it improves with level",
                    "limitations": ["restrictions on use"]
                }}
            ],
            "skill_proficiencies": [
                {{
                    "skill_name": "Combat/Social/Mental/Physical skill",
                    "proficiency_level": "novice/competent/expert/master",
                    "explanation": "why they have this skill"
                }}
            ],
            "starting_equipment": [
                {{
                    "item_name": "Equipment Name",
                    "type": "weapon/armor/tool/accessory",
                    "description": "item description",
                    "special_properties": ["unique aspects"],
                    "significance": "why this character has it"
                }}
            ],
            "class_recommendations": [
                {{
                    "class_name": "Suggested Class",
                    "fit_percentage": 0.85,
                    "explanation": "why this class suits the character",
                    "required_adaptations": ["changes needed"]
                }}
            ],
            "character_quirks": [
                {{
                    "quirk_name": "Gameplay Quirk",
                    "description": "how it affects gameplay",
                    "mechanical_effect": "game rule modification",
                    "roleplay_aspect": "how it enhances roleplay"
                }}
            ]
        }}
        
        Balance abilities to be powerful but not game-breaking.
        """
        
        system_instruction = """You are an expert game designer specializing in character balance and mechanics.
        Create faithful but balanced translations of fictional abilities into game mechanics.
        Ensure abilities are fun to use while maintaining game balance.
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
            logger.error(f"Failed to parse ability mapping JSON: {response}")
            return {"error": "Failed to map abilities"}
    
    async def background_adaptation_flow(self, 
                                       character_name: str, 
                                       lorebook: Lorebook,
                                       scenario_context: str) -> Dict[str, Any]:
        """Flow: Adapt character history to game context"""
        
        source_char = None
        for char in lorebook.characters:
            if char.name.lower() == character_name.lower():
                source_char = char
                break
        
        if not source_char:
            return {"error": "Character not found"}
        
        prompt = f"""
        Adapt {character_name}'s background for an interactive game scenario.
        
        Original Background: {source_char.background}
        Character Goals: {source_char.goals}
        Series Setting: {lorebook.series_metadata.setting}
        Scenario Context: {scenario_context}
        
        Create adapted background in JSON format:
        {{
            "adapted_background": {{
                "early_life": "childhood and formative experiences",
                "key_events": ["major life events that shaped them"],
                "relationships": "important people in their past",
                "skills_acquired": "how they learned their abilities",
                "motivations": "what drives them in this scenario",
                "secrets": "hidden aspects of their past",
                "current_situation": "how they ended up in this scenario"
            }},
            "starting_connections": [
                {{
                    "connection_type": "ally/enemy/neutral/family/mentor",
                    "character_name": "name of connected character",
                    "relationship_description": "nature of the relationship",
                    "current_status": "where things stand now",
                    "potential_hooks": ["story opportunities this creates"]
                }}
            ],
            "personal_quests": [
                {{
                    "quest_name": "Personal Goal",
                    "description": "what they want to accomplish",
                    "difficulty": "easy/medium/hard/epic",
                    "timeline": "when they hope to achieve this",
                    "obstacles": ["what stands in their way"],
                    "rewards": ["what success would mean"]
                }}
            ],
            "reputation": {{
                "known_for": "what people know about them",
                "rumors": ["things people say (true or false)"],
                "first_impression": "how strangers typically react",
                "allies": ["who supports them"],
                "enemies": ["who opposes them"]
            }},
            "resources": {{
                "wealth": "financial situation",
                "properties": ["homes, hideouts, etc."],
                "contacts": ["useful people they know"],
                "favors_owed": ["who owes them"],
                "debts": ["what they owe others"]
            }}
        }}
        """
        
        system_instruction = """You are an expert in character development and narrative integration.
        Adapt character backgrounds to create rich gameplay opportunities while staying true to source material.
        Focus on elements that will create interesting story hooks and player choices.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse background adaptation JSON: {response}")
            return {"error": "Failed to adapt background"}
    
    async def create_character_from_series(self, 
                                         character_name: str, 
                                         lorebook: Lorebook,
                                         scenario_context: str = "") -> Character:
        """Complete flow: Create a playable character based on series character"""
        
        try:
            # Extract personality
            personality_data = await self.personality_extraction_flow(character_name, lorebook)
            if "error" in personality_data:
                raise ValueError(f"Character '{character_name}' not found in lorebook")
            
            # Map abilities to game mechanics
            abilities_data = await self.ability_mapping_flow(character_name, lorebook)
            if "error" in abilities_data:
                raise ValueError("Failed to map character abilities")
            
            # Adapt background
            background_data = await self.background_adaptation_flow(character_name, lorebook, scenario_context)
            if "error" in background_data:
                raise ValueError("Failed to adapt character background")
            
            # Create character stats
            attr_scores = abilities_data.get("attribute_scores", {})
            stats = CharacterStats(
                strength=attr_scores.get("strength", 10),
                dexterity=attr_scores.get("dexterity", 10),
                intelligence=attr_scores.get("intelligence", 10),
                constitution=attr_scores.get("constitution", 10),
                wisdom=attr_scores.get("wisdom", 10),
                charisma=attr_scores.get("charisma", 10)
            )
            
            # Create starting character
            character = Character(
                name=character_name,
                level=1,
                health=100 + (stats.constitution - 10) * 5,
                max_health=100 + (stats.constitution - 10) * 5,
                mana=50 + (stats.intelligence - 10) * 3,
                max_mana=50 + (stats.intelligence - 10) * 3,
                experience=0,
                stats=stats,
                class_name=abilities_data.get("class_recommendations", [{}])[0].get("class_name", "Adventurer"),
                background=background_data.get("adapted_background", {}).get("current_situation", "Unknown background")
            )
            
            return character
            
        except Exception as e:
            logger.error(f"Error creating character from series: {str(e)}")
            # Return default character
            return Character(
                name=character_name,
                level=1,
                health=100,
                max_health=100,
                mana=50,
                max_mana=50,
                experience=0,
                stats=CharacterStats(),
                class_name="Adventurer",
                background="A mysterious adventurer with unknown origins"
            )

# Global flow instance
character_creation_flow = CharacterCreationFlow()