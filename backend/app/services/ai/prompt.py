from typing import List, Dict, Any, Optional
from app.models.memory import Memory


DEFAULT_SYSTEM_PROMPT = """You are a brilliant, highly capable, and helpful personal AI assistant.

Core Principles:
1. Answer clearly, accurately, concisely, and thoughtfully.
2. Provide exceptional assistance with programming, debugging, architecture, algorithms, and technical concepts.
3. When providing code, write clean, robust, well-structured code with appropriate comments and specify language syntax.
4. When documents or files are provided in the context, analyze them thoroughly and cite specific details accurately.
5. Respect and incorporate user preferences and long-term memory when relevant to provide personalized answers.
6. Never fabricate facts, APIs, or citations. If you do not know or are uncertain, state it clearly.
7. Use the tools available when exact math, computation, or specific tools are needed.
"""


def build_system_prompt(
    memories: Optional[List[Memory]] = None,
    retrieved_context: Optional[List[Dict[str, Any]]] = None,
    custom_instructions: Optional[str] = None,
) -> str:
    """Compose the full system instruction with memory and RAG context."""
    sections = [custom_instructions or DEFAULT_SYSTEM_PROMPT]

    # Append long-term memory
    if memories:
        sections.append("\n" + "=" * 40)
        sections.append("### User Memory & Preferences:")
        for m in memories:
            sections.append(f"- **{m.key}**: {m.value}")

    # Append RAG document context
    if retrieved_context:
        sections.append("\n" + "=" * 40)
        sections.append("### Relevant Document Context (RAG):")
        sections.append("Use the following excerpt(s) from user-uploaded documents to answer accurately. Cite the source filename when referencing them:")
        for idx, item in enumerate(retrieved_context, 1):
            filename = item.get("metadata", {}).get("filename", "Unknown Document")
            score = item.get("score", 0.0)
            content = item.get("content", "").strip()
            sections.append(f"\n[Source {idx}: {filename} (relevance: {score:.2f})]\n{content}")

    return "\n".join(sections)
