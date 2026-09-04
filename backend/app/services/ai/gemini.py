import os
from typing import AsyncGenerator, Dict, Any, List, Optional
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from app.core.config import settings
from app.services.ai.base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "gemini"

    def _normalize_model_name(self, model: str) -> str:
        """Ensure standard Gemini model identifier."""
        if not model:
            return "gemini-1.5-flash"
        m = model.lower()
        if "2.5" in m:
            return "gemini-2.5-flash"
        elif "2.0" in m:
            return "gemini-2.0-flash"
        elif "1.5-pro" in m or "pro" in m:
            return "gemini-1.5-pro"
        elif "1.5-flash" in m or "flash" in m:
            return "gemini-1.5-flash"
        return model

    def _format_history(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Format OpenAI-style messages list for Gemini SDK."""
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                contents.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [content]})
            # System messages are handled via GenerativeModel(system_instruction)
        return contents

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-2.5-flash",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            yield {
                "type": "error",
                "error": "Gemini API Key is not configured. Please set GEMINI_API_KEY in your .env file or Settings."
            }
            return

        genai.configure(api_key=api_key)
        normalized_model = self._normalize_model_name(model)

        generation_config = genai.types.GenerationConfig(
            temperature=max(0.0, min(2.0, temperature)),
        )

        try:
            gemini_model = genai.GenerativeModel(
                model_name=normalized_model,
                generation_config=generation_config,
                system_instruction=system_prompt,
            )

            contents = self._format_history(messages)
            if not contents:
                yield {"type": "error", "error": "No messages provided."}
                return

            response = await gemini_model.generate_content_async(
                contents=contents,
                stream=True,
            )

            full_text = ""
            async for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield {
                        "type": "content",
                        "content": chunk.text,
                    }

            yield {
                "type": "done",
                "full_content": full_text,
            }

        except GoogleAPIError as e:
            yield {"type": "error", "error": f"Gemini API Error: {str(e)}"}
        except Exception as e:
            yield {"type": "error", "error": f"Gemini Error: {str(e)}"}

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-2.5-flash",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("Gemini API Key is not configured.")

        genai.configure(api_key=api_key)
        normalized_model = self._normalize_model_name(model)

        generation_config = genai.types.GenerationConfig(
            temperature=max(0.0, min(2.0, temperature)),
        )

        gemini_model = genai.GenerativeModel(
            model_name=normalized_model,
            generation_config=generation_config,
            system_instruction=system_prompt,
        )

        contents = self._format_history(messages)
        response = await gemini_model.generate_content_async(
            contents=contents,
            stream=False,
        )

        return {
            "content": response.text,
            "provider": "gemini",
            "model": normalized_model,
        }
