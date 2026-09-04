from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    created_at: datetime


class DocumentDetailResponse(DocumentResponse):
    pass
