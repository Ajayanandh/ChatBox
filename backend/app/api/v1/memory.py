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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all stored long-term memories for the user."""
    memories = memory_service.get_user_memories(db, current_user.id)
    return [MemoryResponse.model_validate(m) for m in memories]


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_memory(
    mem_in: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add or update a personal memory item."""
    if memory_service.is_sensitive(mem_in.key) or memory_service.is_sensitive(mem_in.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storing sensitive information (passwords, keys, payment details) is not permitted.",
        )

    mem = memory_service.add_memory(db, current_user.id, mem_in.key, mem_in.value)
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not store memory item.",
        )

    return MemoryResponse.model_validate(mem)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a specific memory item by ID."""
    success = memory_service.delete_memory(db, current_user.id, memory_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory item not found",
        )
    return None


@router.delete("", status_code=status.HTTP_200_OK)
def clear_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all long-term memories for the user."""
    count = memory_service.clear_all_memories(db, current_user.id)
    return {"message": f"Successfully cleared {count} memory items", "count": count}
