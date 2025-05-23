import json
import logging
from typing import Any, Dict, List, Optional

from models.scenario_models import SeriesMetadata, SeriesType
from utils.gemini_client import gemini_client

logger = logging.getLogger(__name__)


class SeriesAnalysisFlow:
    """Genkit-style flow for comprehensive series analysis"""

    async def series_identification_flow(
        self, series_title: str, series_type: str
    ) -> Dict[str, Any]:
        """Flow: Identify and validate series information"""
        prompt = f"""
        Identify and validate information about the {series_type} titled "{series_title}".
        
        Provide comprehensive details in JSON format:
        {{
            "canonical_title": "official title",
            "alternative_titles": ["list of alternative names"],
            "creator": "author/creator name",
            "publication_year": "year",
            "status": "completed/ongoing/cancelled",
            "volumes_episodes": "number of volumes/episodes",
            "popularity_score": 0.85,
            "is_mainstream": true,
            "source_reliability": 0.9
        }}
        
        Be accurate and include reliability scores for the information provided.
        """

        system_instruction = """You are a comprehensive media database expert. 
        Provide accurate identification and validation of series information.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse identification JSON: {response}")
            return {
                "canonical_title": series_title,
                "alternative_titles": [],
                "creator": "Unknown",
                "publication_year": "Unknown",
                "status": "unknown",
                "volumes_episodes": "Unknown",
                "popularity_score": 0.5,
                "is_mainstream": False,
                "source_reliability": 0.1,
            }

    async def metadata_enrichment_flow(
        self, series_title: str, series_type: str
    ) -> SeriesMetadata:
        """Flow: Extract comprehensive metadata"""
        prompt = f"""
        Analyze "{series_title}" ({series_type}) and extract comprehensive metadata.
        
        Provide detailed analysis in JSON format:
        {{
            "title": "{series_title}",
            "type": "{series_type}",
            "genre": ["primary genres - be specific"],
            "themes": ["major themes and motifs"],
            "setting": "detailed world/universe description",
            "tone": "overall emotional tone and atmosphere",
            "power_system": "detailed description of any supernatural/special abilities",
            "time_period": "historical period or futuristic setting",
            "target_audience": "demographic",
            "complexity_level": "simple/moderate/complex",
            "world_scale": "local/regional/global/cosmic",
            "technology_level": "medieval/modern/futuristic/mixed",
            "magic_prevalence": "none/rare/common/dominant",
            "political_structure": "governance and social systems",
            "economic_system": "how the world economy works",
            "cultural_elements": ["unique cultural aspects"],
            "source_urls": ["reliable reference URLs if available"],
            "confidence_score": 0.95
        }}
        """

        system_instruction = """You are an expert media analyst specializing in world-building and narrative structure.
        Provide comprehensive, accurate analysis focusing on elements useful for game scenario generation.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            response_format="json",
        )

        try:
            data = json.loads(response)
            return SeriesMetadata(
                title=data.get("title", series_title),
                type=SeriesType(series_type.lower()),
                genre=data.get("genre", []),
                themes=data.get("themes", []),
                setting=data.get("setting", ""),
                tone=data.get("tone", ""),
                power_system=data.get("power_system"),
                time_period=data.get("time_period"),
                source_urls=data.get("source_urls", []),
                confidence_score=data.get("confidence_score", 0.5),
            )
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse metadata JSON: {response}, Error: {e}")
            return SeriesMetadata(
                title=series_title,
                type=SeriesType(series_type.lower()),
                genre=["unknown"],
                themes=["adventure"],
                setting="Unknown setting",
                tone="neutral",
                confidence_score=0.1,
            )

    async def canonical_source_validation_flow(
        self, series_metadata: SeriesMetadata
    ) -> Dict[str, Any]:
        """Flow: Validate information against canonical sources"""
        prompt = f"""
        Validate the accuracy of this series information for "{series_metadata.title}":
        
        Current Data:
        - Genre: {series_metadata.genre}
        - Setting: {series_metadata.setting}
        - Tone: {series_metadata.tone}
        - Power System: {series_metadata.power_system}
        - Themes: {series_metadata.themes}
        
        Provide validation results in JSON format:
        {{
            "accuracy_score": 0.95,
            "validated_elements": ["list of confirmed accurate elements"],
            "questionable_elements": ["list of potentially inaccurate elements"],
            "corrections": {{"element": "corrected_value"}},
            "additional_context": "any important missing information",
            "source_quality": "assessment of information reliability",
            "recommendation": "use/modify/regenerate"
        }}
        """

        system_instruction = """You are a fact-checking expert for media information.
        Validate accuracy and provide corrections where necessary.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse validation JSON: {response}")
            return {
                "accuracy_score": 0.5,
                "validated_elements": [],
                "questionable_elements": ["all elements need verification"],
                "corrections": {},
                "additional_context": "Unable to validate information",
                "source_quality": "unknown",
                "recommendation": "regenerate",
            }

    async def knowledge_graph_creation_flow(
        self, series_metadata: SeriesMetadata
    ) -> Dict[str, Any]:
        """Flow: Create relationship mappings between series elements"""
        prompt = f"""
        Create a knowledge graph for "{series_metadata.title}" showing relationships between key elements.
        
        Based on the series information:
        - Setting: {series_metadata.setting}
        - Genre: {series_metadata.genre}
        - Themes: {series_metadata.themes}
        - Power System: {series_metadata.power_system}
        
        Create relationship mappings in JSON format:
        {{
            "core_concepts": ["main concepts in the series"],
            "concept_relationships": [
                {{"concept_a": "concept1", "relationship": "relates_to", "concept_b": "concept2"}},
                {{"concept_a": "concept2", "relationship": "enables", "concept_b": "concept3"}}
            ],
            "hierarchy": {{
                "world": ["major world elements"],
                "societies": ["social groups and organizations"],
                "individuals": ["key character types"],
                "systems": ["power/magic/political systems"]
            }},
            "influence_map": {{
                "setting_influences": ["how setting affects story"],
                "power_influences": ["how powers affect world"],
                "theme_influences": ["how themes manifest"]
            }},
            "narrative_weight": {{
                "primary_elements": ["most important story elements"],
                "secondary_elements": ["supporting elements"],
                "background_elements": ["atmospheric elements"]
            }}
        }}
        """

        system_instruction = """You are an expert in narrative structure and world-building analysis.
        Create comprehensive relationship mappings that will help in scenario generation.
        Always respond in valid JSON format."""

        response = await gemini_client.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.4,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse knowledge graph JSON: {response}")
            return {
                "core_concepts": ["adventure", "conflict", "growth"],
                "concept_relationships": [],
                "hierarchy": {
                    "world": ["unknown world"],
                    "societies": ["unknown society"],
                    "individuals": ["protagonist", "antagonist"],
                    "systems": ["unknown system"],
                },
                "influence_map": {
                    "setting_influences": ["unknown"],
                    "power_influences": ["unknown"],
                    "theme_influences": ["unknown"],
                },
                "narrative_weight": {
                    "primary_elements": ["main story"],
                    "secondary_elements": ["subplots"],
                    "background_elements": ["world details"],
                },
            }


# Global flow instance
series_analysis_flow = SeriesAnalysisFlow()
