import ast
import math
import operator
from typing import Any, Dict
from app.services.tools.base import BaseTool


OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

SAFE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "exp": math.exp,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
}

SAFE_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
    "inf": math.inf,
}


class SafeEvaluator(ast.NodeVisitor):
    def visit_Expression(self, node):
        return self.visit(node.body)

    def visit_Constant(self, node):
        if isinstance(node.value, (int, float, complex)):
            return node.value
        raise ValueError(f"Literal constant of type {type(node.value).__name__} is not allowed")

    def visit_Num(self, node):
        return node.n

    def visit_BinOp(self, node):
        left = self.visit(node.left)
        right = self.visit(node.right)
        op_type = type(node.op)
        if op_type in OPERATORS:
            return OPERATORS[op_type](left, right)
        raise ValueError(f"Operator {op_type.__name__} is not allowed")

    def visit_UnaryOp(self, node):
        operand = self.visit(node.operand)
        op_type = type(node.op)
        if op_type in OPERATORS:
            return OPERATORS[op_type](operand)
        raise ValueError(f"Unary operator {op_type.__name__} is not allowed")

    def visit_Name(self, node):
        if node.id in SAFE_CONSTANTS:
            return SAFE_CONSTANTS[node.id]
        raise ValueError(f"Variable '{node.id}' is not defined or not allowed")

    def visit_Call(self, node):
        if not isinstance(node.func, ast.Name):
            raise ValueError("Only direct function calls are allowed")
        func_name = node.func.id
        if func_name not in SAFE_FUNCTIONS:
            raise ValueError(f"Function '{func_name}' is not allowed or supported")
        args = [self.visit(arg) for arg in node.args]
        return SAFE_FUNCTIONS[func_name](*args)

    def generic_visit(self, node):
        raise ValueError(f"Expression type '{type(node).__name__}' is not allowed")


class CalculatorTool(BaseTool):
    name = "calculator"
    description = (
        "Useful for evaluating mathematical and scientific calculations accurately. "
        "Input should be a valid mathematical expression string (e.g., '24 * 3.5 + sqrt(144)')."
    )
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "The arithmetic or mathematical expression to evaluate.",
            }
        },
        "required": ["expression"],
    }

    async def execute(self, expression: str, **kwargs) -> Any:
        """Safely evaluate arithmetic/mathematical expressions using AST."""
        if not expression or not expression.strip():
            return {"error": "Expression is empty"}

        cleaned = expression.strip().replace("^", "**")
        try:
            tree = ast.parse(cleaned, mode="eval")
            evaluator = SafeEvaluator()
            result = evaluator.visit(tree)
            return {
                "expression": expression,
                "result": result,
                "success": True,
            }
        except ZeroDivisionError:
            return {"error": "Division by zero", "success": False}
        except OverflowError:
            return {"error": "Math result overflowed", "success": False}
        except Exception as e:
            return {"error": f"Invalid expression: {str(e)}", "success": False}
