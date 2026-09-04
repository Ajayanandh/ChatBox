from typing import Dict, List, Any, Optional
from app.services.tools.base import BaseTool
from app.services.tools.calculator import CalculatorTool


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self.register(CalculatorTool())

    def register(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[BaseTool]:
        return list(self._tools.values())

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_openai_schema() for tool in self._tools.values()]

    def get_gemini_tools(self) -> List[Dict[str, Any]]:
        return [tool.to_gemini_schema() for tool in self._tools.values()]

    async def execute(self, name: str, arguments: Dict[str, Any]) -> Any:
        tool = self.get_tool(name)
        if not tool:
            return {"error": f"Tool '{name}' not found", "success": False}
        try:
            return await tool.execute(**arguments)
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}", "success": False}


tool_registry = ToolRegistry()
