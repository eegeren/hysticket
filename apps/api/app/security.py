from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from .config import settings
from .enums import UserRole

# Simplified hashing (auth not used anymore); store plain text for now to avoid bcrypt backend issues
oauth2_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    return password


def create_access_token(data: Dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.jwt_expires_days))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def require_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")
    return credentials.credentials


def ensure_role(payload: Dict[str, Any], role: UserRole):
    if payload.get("role") != role.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
