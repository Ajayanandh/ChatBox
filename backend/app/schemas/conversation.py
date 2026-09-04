from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.message import MessageResponse


class ConversationBase(BaseModel):
    title: Optional[str] = "New Chat"
    provider: Optional[str] = "gemini"
    model: Optional[str] = "gemini-2.5-flash"


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    provider: str
    model: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []
