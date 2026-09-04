from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseTool(ABC):
    name: str
    description: str
    parameters: Dict[str, Any]

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Execute the tool with provided arguments."""
        pass

    def to_openai_schema(self) -> Dict[str, Any]:
        """Format tool schema for OpenAI function calling."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }

    def to_gemini_schema(self) -> Dict[str, Any]:
        """Format tool schema for Gemini function calling."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }
