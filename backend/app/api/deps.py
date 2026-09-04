from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import CredentialsException
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer token and retrieve current authenticated user."""
    if not auth_header:
        raise CredentialsException(detail="Authentication token is required")

    token = auth_header.credentials
    user_id = decode_access_token(token)
    if not user_id:
        raise CredentialsException(detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise CredentialsException(detail="User no longer exists")

    return user
