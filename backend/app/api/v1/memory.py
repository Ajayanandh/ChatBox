from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryResponse
from app.services.memory.service import memory_service

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.get("", response_model=List[MemoryResponse])
def get_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all long-term memories for the current user."""
    return memory_service.get_user_memories(db, current_user.id)


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    data: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update a long-term memory key-value pair."""
    if memory_service.is_sensitive(data.key) or memory_service.is_sensitive(data.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Memory cannot contain sensitive data (passwords, tokens, credentials, payment info)",
        )

    mem = memory_service.add_memory(
        db=db,
        user_id=current_user.id,
        key=data.key,
        value=data.value,
    )
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to store memory item",
        )
    return mem


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific memory item by ID."""
    deleted = memory_service.delete_memory(db, current_user.id, memory_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory item not found",
        )
    return None


@router.delete("", status_code=status.HTTP_200_OK)
def clear_all_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear all long-term memories for the current user."""
    count = memory_service.clear_all_memories(db, current_user.id)
    return {"message": f"Cleared {count} memory items", "count": count}
