import pytest
from app.services.tools.calculator import CalculatorTool
from app.services.tools.registry import tool_registry


@pytest.mark.asyncio
async def test_calculator_basic_arithmetic():
    calc = CalculatorTool()
    res = await calc.execute("2 + 2")
    assert res["success"] is True
    assert res["result"] == 4

    res2 = await calc.execute("10 * (5 - 2)")
    assert res2["result"] == 30

    res3 = await calc.execute("2 ** 8")
    assert res3["result"] == 256


@pytest.mark.asyncio
async def test_calculator_math_functions():
    calc = CalculatorTool()
    res = await calc.execute("sqrt(144)")
    assert res["result"] == 12.0

    res2 = await calc.execute("round(3.14159, 2)")
    assert res2["result"] == 3.14


@pytest.mark.asyncio
async def test_calculator_division_by_zero():
    calc = CalculatorTool()
    res = await calc.execute("10 / 0")
    assert res["success"] is False
    assert "division by zero" in res["error"].lower()


@pytest.mark.asyncio
async def test_calculator_safety():
    calc = CalculatorTool()
    # Attempts to run arbitrary code should be blocked safely
    res = await calc.execute("__import__('os').system('echo hi')")
    assert res["success"] is False


@pytest.mark.asyncio
async def test_tool_registry():
    tools = tool_registry.list_tools()
    tool_names = [t.name for t in tools]
    assert "calculator" in tool_names

    calc = tool_registry.get_tool("calculator")
    assert calc is not None

    res = await tool_registry.execute("calculator", {"expression": "5 * 5"})
    assert res["success"] is True
    assert res["result"] == 25
