from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MemoryCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1)


class MemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    key: str
    value: str
    created_at: datetime
    updated_at: datetime
