import re
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.memory import Memory


SENSITIVE_PATTERNS = [
    r"password", r"secret", r"api[_\-\s]?key", r"token", r"credit[_\-\s]?card",
    r"cvv", r"ssn", r"social[_\-\s]?security", r"bearer", r"\b\d{16}\b"
]


class MemoryService:
    @staticmethod
    def is_sensitive(text: str) -> bool:
        """Check if text likely contains sensitive secrets or credentials."""
        for pattern in SENSITIVE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    @staticmethod
    def get_user_memories(db: Session, user_id: str) -> List[Memory]:
        """Fetch all stored memories for a user."""
        return db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).all()

    @staticmethod
    def add_memory(db: Session, user_id: str, key: str, value: str) -> Optional[Memory]:
        """Add or update a memory item."""
        if MemoryService.is_sensitive(key) or MemoryService.is_sensitive(value):
            return None

        # Check existing key for user
        existing = db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.key == key.strip()
        ).first()

        if existing:
            existing.value = value.strip()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            mem = Memory(
                user_id=user_id,
                key=key.strip(),
                value=value.strip()
            )
            db.add(mem)
            db.commit()
            db.refresh(mem)
            return mem

    @staticmethod
    def delete_memory(db: Session, user_id: str, memory_id: str) -> bool:
        """Delete a specific memory by ID."""
        mem = db.query(Memory).filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        ).first()
        if mem:
            db.delete(mem)
            db.commit()
            return True
        return False

    @staticmethod
    def clear_all_memories(db: Session, user_id: str) -> int:
        """Delete all memories for a user."""
        deleted = db.query(Memory).filter(Memory.user_id == user_id).delete()
        db.commit()
        return deleted

    @staticmethod
    def extract_implicit_memory(user_message: str) -> Optional[Tuple[str, str]]:
        """
        Detect simple preference statements to auto-remember non-sensitive preferences.
        E.g. 'I prefer TypeScript over JavaScript' -> ('Coding Preference', 'Prefers TypeScript over JavaScript')
        """
        msg = user_message.strip()
        if MemoryService.is_sensitive(msg):
            return None

        # Preference patterns
        m = re.search(r"^(?:please remember that|remember that|note that)\s+(.+)$", msg, re.IGNORECASE)
        if m:
            fact = m.group(1).strip()
            return ("User Note", fact)

        m = re.search(r"^i (?:prefer|always use|mostly code in|work with)\s+(.+)$", msg, re.IGNORECASE)
        if m:
            pref = m.group(1).strip()
            return ("Preference", f"Prefers {pref}")

        m = re.search(r"^my name is\s+([A-Za-z\s]+)$", msg, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            return ("User Name", name)

        return None

    @staticmethod
    def format_memory_for_prompt(memories: List[Memory]) -> str:
        """Format memories into a clean markdown prompt block."""
        if not memories:
            return ""

        lines = ["### User Preferences & Long-Term Memory:"]
        for m in memories:
            lines.append(f"- **{m.key}**: {m.value}")
        return "\n".join(lines)


memory_service = MemoryService()
