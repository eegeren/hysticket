from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .db import get_db
from .enums import UserRole
from .models import Store
from .security import decode_token, ensure_role, oauth2_scheme, require_token


def get_current_admin(credentials=Depends(oauth2_scheme)):
    token = require_token(credentials)
    payload = decode_token(token)
    ensure_role(payload, UserRole.ADMIN)
    return payload


def get_current_store(credentials=Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Store:
    token = require_token(credentials)
    payload = decode_token(token)
    ensure_role(payload, UserRole.STORE)
    store_id = payload.get("store_id")
    if not store_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    store = db.get(Store, store_id)
    if not store or not store.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Store inactive or not found")
    return store
