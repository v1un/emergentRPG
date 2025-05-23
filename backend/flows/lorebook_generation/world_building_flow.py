import json
import logging
from typing import Dict, List, Any, Optional
from utils.gemini_client import gemini_client
from models.scenario_models import SeriesMetadata, Location, WorldSystem

logger = logging.getLogger(__name__)

class WorldBuildingFlow:
    """Genkit-style flow for comprehensive world building"""
    
    async def geography_generation_flow(self, series_metadata: SeriesMetadata) -> List[Location]:
        """Flow: Generate detailed world geography and locations"""
        prompt = f"""
        Based on "{series_metadata.title}" ({series_metadata.type}), generate comprehensive world geography.
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Genre: {series_metadata.genre}
        - Tone: {series_metadata.tone}
        - Power System: {series_metadata.power_system}
        
        Create detailed locations in JSON format:
        {{
            "locations": [
                {{
                    "name": "Location Name",
                    "type": "city/dungeon/forest/mountain/etc",
                    "description": "detailed description",
                    "notable_features": ["unique landmarks", "special properties"],
                    "inhabitants": ["types of beings that live here"],
                    "connected_locations": ["adjacent areas"],
                    "atmosphere": "mood and feeling of the place",
                    "dangers": ["potential threats", "environmental hazards"],
                    "resources": ["available materials", "economic value"],
                    "significance": "importance to the overall world",
                    "secrets": ["hidden aspects", "mysteries"],
                    "accessibility": "how easy it is to reach",
                    "climate": "weather patterns and seasons",
                    "governance": "who rules or manages this place"
                }}
            ]
        }}
        
        Generate 8-12 diverse, interconnected locations that form a cohesive world.
        """
        
        system_instruction = """You are a master world-builder and geography expert.
        Create detailed, immersive locations that feel authentic to the source material.
        Ensure locations are interconnected and support interesting adventures.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            locations = []
            for loc_data in data.get("locations", []):
                location = Location(
                    name=loc_data.get("name", "Unknown Location"),
                    type=loc_data.get("type", "unknown"),
                    description=loc_data.get("description", ""),
                    notable_features=loc_data.get("notable_features", []),
                    inhabitants=loc_data.get("inhabitants", []),
                    connected_locations=loc_data.get("connected_locations", []),
                    atmosphere=loc_data.get("atmosphere", ""),
                    dangers=loc_data.get("dangers", [])
                )
                locations.append(location)
            return locations
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse geography JSON: {response}, Error: {e}")
            return [Location(
                name="Starting Village",
                type="settlement",
                description="A small village where adventures begin",
                notable_features=["village square", "local inn"],
                inhabitants=["villagers", "local merchants"],
                connected_locations=["nearby forest"],
                atmosphere="peaceful and welcoming",
                dangers=["occasional bandits"]
            )]
    
    async def political_systems_flow(self, series_metadata: SeriesMetadata) -> List[WorldSystem]:
        """Flow: Generate political and social systems"""
        prompt = f"""
        Create detailed political and social systems for "{series_metadata.title}".
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Themes: {series_metadata.themes}
        - Genre: {series_metadata.genre}
        - Time Period: {series_metadata.time_period}
        
        Generate political systems in JSON format:
        {{
            "systems": [
                {{
                    "name": "System Name",
                    "type": "political/social/economic/military",
                    "description": "detailed description of how it works",
                    "rules": ["specific laws", "customs", "procedures"],
                    "limitations": ["restrictions", "weaknesses", "conflicts"],
                    "key_figures": ["important leaders", "influential people"],
                    "historical_events": ["founding events", "major changes"],
                    "current_status": "current state and recent developments",
                    "influence_scope": "local/regional/global reach",
                    "power_structure": "hierarchy and organization",
                    "conflicts": ["internal tensions", "external threats"],
                    "alliances": ["allied systems", "cooperative arrangements"],
                    "resources": ["economic base", "military strength"],
                    "ideology": "core beliefs and values"
                }}
            ]
        }}
        
        Create 4-6 interconnected political/social systems.
        """
        
        system_instruction = """You are an expert in political science and social systems.
        Create realistic, complex systems that reflect the source material's themes.
        Ensure systems interact and create potential for conflict and cooperation.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.5,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            systems = []
            for sys_data in data.get("systems", []):
                system = WorldSystem(
                    name=sys_data.get("name", "Unknown System"),
                    type=sys_data.get("type", "political"),
                    description=sys_data.get("description", ""),
                    rules=sys_data.get("rules", []),
                    limitations=sys_data.get("limitations", []),
                    key_figures=sys_data.get("key_figures", []),
                    historical_events=sys_data.get("historical_events", [])
                )
                systems.append(system)
            return systems
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse political systems JSON: {response}, Error: {e}")
            return [WorldSystem(
                name="Local Government",
                type="political",
                description="Basic local governance structure",
                rules=["maintain order", "collect taxes"],
                limitations=["limited resources"],
                key_figures=["village elder"],
                historical_events=["village founding"]
            )]
    
    async def magic_power_systems_flow(self, series_metadata: SeriesMetadata) -> List[WorldSystem]:
        """Flow: Generate magic/power systems and rules"""
        if not series_metadata.power_system:
            return []
            
        prompt = f"""
        Create detailed magic/power systems for "{series_metadata.title}".
        
        Series Context:
        - Power System: {series_metadata.power_system}
        - Setting: {series_metadata.setting}
        - Genre: {series_metadata.genre}
        - Themes: {series_metadata.themes}
        
        Generate power systems in JSON format:
        {{
            "systems": [
                {{
                    "name": "Magic/Power System Name",
                    "type": "magic/supernatural/technological/biological",
                    "description": "how the system works fundamentally",
                    "rules": ["specific mechanics", "usage requirements", "activation methods"],
                    "limitations": ["costs", "restrictions", "side effects", "taboos"],
                    "key_figures": ["masters", "researchers", "governing bodies"],
                    "historical_events": ["discovery", "major incidents", "evolution"],
                    "power_levels": ["novice abilities", "expert abilities", "master abilities"],
                    "classifications": ["different types or schools"],
                    "learning_methods": ["how to acquire abilities"],
                    "detection_methods": ["how to sense or identify power use"],
                    "countermeasures": ["defenses", "nullification methods"],
                    "societal_impact": ["how it affects daily life"],
                    "rarity": "common/uncommon/rare/legendary",
                    "source": "where the power comes from"
                }}
            ]
        }}
        
        Create 2-4 interconnected power systems with clear rules and limitations.
        """
        
        system_instruction = """You are an expert in fantasy/sci-fi power systems and game mechanics.
        Create balanced, interesting systems that enable exciting gameplay.
        Ensure clear rules, limitations, and consequences for power use.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.5,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            systems = []
            for sys_data in data.get("systems", []):
                system = WorldSystem(
                    name=sys_data.get("name", "Unknown Power System"),
                    type=sys_data.get("type", "magic"),
                    description=sys_data.get("description", ""),
                    rules=sys_data.get("rules", []),
                    limitations=sys_data.get("limitations", []),
                    key_figures=sys_data.get("key_figures", []),
                    historical_events=sys_data.get("historical_events", [])
                )
                systems.append(system)
            return systems
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse power systems JSON: {response}, Error: {e}")
            return []
    
    async def cultural_systems_flow(self, series_metadata: SeriesMetadata) -> List[WorldSystem]:
        """Flow: Generate cultural and religious systems"""
        prompt = f"""
        Create detailed cultural and religious systems for "{series_metadata.title}".
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Themes: {series_metadata.themes}
        - Tone: {series_metadata.tone}
        - Time Period: {series_metadata.time_period}
        
        Generate cultural systems in JSON format:
        {{
            "systems": [
                {{
                    "name": "Culture/Religion Name",
                    "type": "religious/cultural/philosophical/traditional",
                    "description": "core beliefs and practices",
                    "rules": ["religious laws", "cultural taboos", "rituals", "customs"],
                    "limitations": ["restrictions on followers", "forbidden practices"],
                    "key_figures": ["religious leaders", "cultural heroes", "prophets"],
                    "historical_events": ["founding myths", "holy wars", "cultural shifts"],
                    "sacred_texts": ["holy books", "oral traditions"],
                    "festivals": ["important celebrations", "religious holidays"],
                    "symbols": ["sacred symbols", "cultural icons"],
                    "afterlife_beliefs": ["death and beyond concepts"],
                    "moral_code": ["ethical guidelines", "virtues and sins"],
                    "conversion": ["how others can join"],
                    "hierarchy": ["religious/cultural structure"],
                    "conflicts": ["opposing beliefs", "internal schisms"]
                }}
            ]
        }}
        
        Create 3-5 diverse cultural/religious systems that shape society.
        """
        
        system_instruction = """You are an expert in comparative religion and cultural anthropology.
        Create rich, authentic cultural systems that feel realistic and meaningful.
        Ensure cultures have both positive and negative aspects for balanced storytelling.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            systems = []
            for sys_data in data.get("systems", []):
                system = WorldSystem(
                    name=sys_data.get("name", "Unknown Culture"),
                    type=sys_data.get("type", "cultural"),
                    description=sys_data.get("description", ""),
                    rules=sys_data.get("rules", []),
                    limitations=sys_data.get("limitations", []),
                    key_figures=sys_data.get("key_figures", []),
                    historical_events=sys_data.get("historical_events", [])
                )
                systems.append(system)
            return systems
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse cultural systems JSON: {response}, Error: {e}")
            return []
    
    async def historical_timeline_flow(self, series_metadata: SeriesMetadata, systems: List[WorldSystem]) -> List[Dict[str, Any]]:
        """Flow: Generate historical timeline and major events"""
        systems_context = "\n".join([f"- {s.name}: {s.description}" for s in systems[:5]])
        
        prompt = f"""
        Create a comprehensive historical timeline for "{series_metadata.title}".
        
        Series Context:
        - Setting: {series_metadata.setting}
        - Themes: {series_metadata.themes}
        - Power System: {series_metadata.power_system}
        
        Existing Systems:
        {systems_context}
        
        Generate timeline in JSON format:
        {{
            "timeline": [
                {{
                    "era_name": "Historical Era Name",
                    "time_period": "approximate dates or relative time",
                    "major_events": ["key historical events"],
                    "key_figures": ["important people from this era"],
                    "technological_level": "tech/magic advancement",
                    "political_situation": "governance and conflicts",
                    "cultural_developments": ["art, religion, philosophy"],
                    "catastrophes": ["wars, disasters, dark periods"],
                    "discoveries": ["new knowledge, places, powers"],
                    "impact_on_present": "how this era affects current times",
                    "lasting_legacy": "what remains from this period",
                    "mysteries": ["unknown aspects", "lost knowledge"]
                }}
            ]
        }}
        
        Create 6-8 distinct historical eras that lead to the current setting.
        """
        
        system_instruction = """You are a master historian and chronicler.
        Create compelling historical narratives that explain the current world state.
        Ensure events are interconnected and have lasting consequences.
        Always respond in valid JSON format."""
        
        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.6,
            max_output_tokens=3000,
            response_format="json"
        )
        
        try:
            data = json.loads(response)
            return data.get("timeline", [])
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse timeline JSON: {response}, Error: {e}")
            return [{
                "era_name": "Ancient Times",
                "time_period": "Long ago",
                "major_events": ["World creation", "First civilizations"],
                "key_figures": ["Legendary heroes"],
                "technological_level": "Basic",
                "political_situation": "Tribal societies",
                "cultural_developments": ["Basic traditions"],
                "catastrophes": ["Natural disasters"],
                "discoveries": ["Agriculture", "Tools"],
                "impact_on_present": "Foundation of current world",
                "lasting_legacy": "Basic knowledge",
                "mysteries": ["Lost origins"]
            }]

# Global flow instance
world_building_flow = WorldBuildingFlow()