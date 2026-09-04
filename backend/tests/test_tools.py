import pytest
from app.services.tools.calculator import CalculatorTool
from app.services.tools.registry import tool_registry


@pytest.mark.asyncio
async def test_calculator_tool_arithmetic():
    calc = CalculatorTool()
    res = await calc.execute(expression="25 * 4 + 10 / 2")
    assert res["success"] is True
    assert res["result"] == 105.0


@pytest.mark.asyncio
async def test_calculator_tool_advanced_functions():
    calc = CalculatorTool()
    res = await calc.execute(expression="sqrt(144) + sin(0) + abs(-50)")
    assert res["success"] is True
    assert res["result"] == 62.0


@pytest.mark.asyncio
async def test_calculator_division_by_zero():
    calc = CalculatorTool()
    res = await calc.execute(expression="10 / 0")
    assert res["success"] is False
    assert "Division by zero" in res["error"]


@pytest.mark.asyncio
async def test_tool_registry():
    tools = tool_registry.list_tools()
    assert len(tools) >= 1
    assert any(t.name == "calculator" for t in tools)

    schema = tool_registry.get_openai_tools()
    assert len(schema) >= 1
    assert schema[0]["function"]["name"] == "calculator"
