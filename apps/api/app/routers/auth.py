from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..config import settings
from ..db import get_db
from ..enums import UserRole
from ..models import Store
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/store/login", response_model=schemas.TokenResponse)
def store_login(payload: schemas.StoreLoginRequest, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.code == payload.code).first()
    if not store or not store.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(payload.pin, store.pin_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        {
            "sub": str(store.id),
            "role": UserRole.STORE.value,
            "store_id": str(store.id),
            "store_code": store.code,
        }
    )
    return schemas.TokenResponse(token=token)


@router.post("/admin/login", response_model=schemas.TokenResponse)
def admin_login(payload: schemas.AdminLoginRequest):
    if not verify_password(payload.password, settings.admin_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": "admin", "role": UserRole.ADMIN.value})
    return schemas.TokenResponse(token=token)
