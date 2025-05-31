import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from google.generativeai.types import HarmBlockThreshold, HarmCategory

from config.settings import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.ai.google_api_key)
        self.model_name = settings.ai.gemini_model
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        )

    async def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_output_tokens: int = 2048,
        response_format: str = "text",
    ) -> str:
        """Generate text using Gemini model"""
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                candidate_count=1,
                stop_sequences=None,
            )

            if system_instruction:
                full_prompt = f"System: {system_instruction}\n\nUser: {prompt}"
            else:
                full_prompt = prompt

            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt,
                generation_config=generation_config,
            )

            if response.candidates and response.candidates[0].content:
                result_text = response.candidates[0].content.parts[0].text

                if response_format == "json":
                    try:
                        # Try to extract JSON from the response
                        start_idx = result_text.find("{")
                        end_idx = result_text.rfind("}") + 1
                        if start_idx != -1 and end_idx != 0:
                            json_str = result_text[start_idx:end_idx]
                            json.loads(json_str)  # Validate JSON
                            return json_str
                        else:
                            logger.warning("No valid JSON found in response")
                            return result_text
                    except json.JSONDecodeError:
                        logger.warning("Invalid JSON in response, returning raw text")
                        return result_text

                return result_text
            else:
                logger.error("No content in Gemini response")
                return (
                    "I apologize, but I couldn't generate a response. Please try again."
                )

        except Exception as e:
            logger.error(f"Error generating text with Gemini: {str(e)}")
            return f"Error: {str(e)}"

    async def analyze_series(
        self, series_title: str, series_type: str
    ) -> Dict[str, Any]:
        """Analyze a series and extract key information"""
        prompt = f"""
        Analyze the {series_type} "{series_title}" and provide detailed information in JSON format.
        
        Extract the following information:
        {{
            "title": "{series_title}",
            "type": "{series_type}",
            "genre": ["list of genres"],
            "themes": ["list of main themes"],
            "setting": "description of the world/setting",
            "tone": "overall tone (dark, light, comedic, serious, etc.)",
            "power_system": "description of any supernatural abilities or magic system",
            "time_period": "historical period or era",
            "confidence_score": 0.95
        }}
        
        Be as accurate and detailed as possible. If you're not certain about some information, include it but lower the confidence score accordingly.
        """

        system_instruction = """You are an expert in anime, manga, games, novels, and other media. 
        Provide accurate, detailed analysis of series information. 
        Always respond with valid JSON format."""

        response = await self.generate_text(
            prompt,
            system_instruction=system_instruction,
            temperature=0.3,
            response_format="json",
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse series analysis JSON: {response}")
            return {
                "title": series_title,
                "type": series_type,
                "genre": ["unknown"],
                "themes": ["adventure"],
                "setting": "Unknown setting",
                "tone": "neutral",
                "power_system": None,
                "time_period": None,
                "confidence_score": 0.1,
            }


# Global client instance
gemini_client = GeminiClient()
