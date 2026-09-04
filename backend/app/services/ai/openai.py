import os
from typing import AsyncGenerator, Dict, Any, List, Optional
from openai import AsyncOpenAI, APIError, AuthenticationError, RateLimitError
from app.core.config import settings
from app.services.ai.base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "openai"

    def _normalize_model_name(self, model: str) -> str:
        """Ensure standard OpenAI model identifier."""
        if not model:
            return "gpt-4o-mini"
        m = model.lower()
        if "gpt-4o-mini" in m:
            return "gpt-4o-mini"
        elif "gpt-4o" in m:
            return "gpt-4o"
        elif "gpt-4" in m:
            return "gpt-4-turbo"
        elif "3.5" in m:
            return "gpt-3.5-turbo"
        return model

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4o-mini",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            yield {
                "type": "error",
                "error": "OpenAI API Key is not configured. Please set OPENAI_API_KEY in your .env file or Settings."
            }
            return

        client = AsyncOpenAI(api_key=api_key)
        normalized_model = self._normalize_model_name(model)

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

        try:
            stream = await client.chat.completions.create(
                model=normalized_model,
                messages=formatted_messages,
                temperature=max(0.0, min(2.0, temperature)),
                stream=True,
            )

            full_text = ""
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta:
                    delta_content = chunk.choices[0].delta.content
                    if delta_content:
                        full_text += delta_content
                        yield {
                            "type": "content",
                            "content": delta_content,
                        }

            yield {
                "type": "done",
                "full_content": full_text,
            }

        except AuthenticationError:
            yield {"type": "error", "error": "Invalid OpenAI API Key. Please verify your credentials."}
        except RateLimitError:
            yield {"type": "error", "error": "OpenAI Rate Limit exceeded. Please try again shortly."}
        except APIError as e:
            yield {"type": "error", "error": f"OpenAI API Error: {str(e)}"}
        except Exception as e:
            yield {"type": "error", "error": f"OpenAI Error: {str(e)}"}

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4o-mini",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("OpenAI API Key is not configured.")

        client = AsyncOpenAI(api_key=api_key)
        normalized_model = self._normalize_model_name(model)

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        for msg in messages:
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

        response = await client.chat.completions.create(
            model=normalized_model,
            messages=formatted_messages,
            temperature=max(0.0, min(2.0, temperature)),
            stream=False,
        )

        content = response.choices[0].message.content or ""
        return {
            "content": content,
            "provider": "openai",
            "model": normalized_model,
        }
