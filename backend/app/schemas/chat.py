from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.message import MessageResponse


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    provider: Optional[str] = "gemini"
    model: Optional[str] = "gemini-2.5-flash"
    document_ids: Optional[List[str]] = None
    temperature: Optional[float] = 0.7
    use_memory: Optional[bool] = True
    use_tools: Optional[bool] = True


class ChatResponse(BaseModel):
    message: MessageResponse
    conversation_id: str
    sources: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[Dict[str, Any]]] = None


class RegenerateRequest(BaseModel):
    conversation_id: str
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    use_memory: Optional[bool] = True
    use_tools: Optional[bool] = True
