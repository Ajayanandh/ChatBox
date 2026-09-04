from typing import Dict, List, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.gemini import GeminiProvider
from app.services.ai.openai import OpenAIProvider


class AIFactory:
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
        }

    def get_provider(self, provider_name: Optional[str] = None) -> BaseAIProvider:
        """Retrieve provider instance by name, with intelligent default."""
        if not provider_name:
            provider_name = "gemini"
        
        name = provider_name.lower().strip()
        if name in self._providers:
            return self._providers[name]
        
        return self._providers.get("gemini") or self._providers["openai"]

    def list_providers(self) -> List[str]:
        return list(self._providers.keys())


ai_factory = AIFactory()
