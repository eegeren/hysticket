import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..db import get_db
from ..models import Store
from ..security import get_password_hash

router = APIRouter(prefix="/admin/stores", tags=["stores"])


@router.get("", response_model=list[schemas.StoreOut])
def list_stores(db: Session = Depends(get_db)):
    return db.query(Store).order_by(Store.created_at.desc()).all()


@router.post("", response_model=schemas.StoreOut, status_code=status.HTTP_201_CREATED)
def create_store(payload: schemas.StoreCreate, db: Session = Depends(get_db)):
    existing = db.query(Store).filter(Store.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Store code already exists")
    hashed_pin = get_password_hash(payload.pin)
    store = Store(name=payload.name, code=payload.code, pin_hash=hashed_pin, is_active=payload.is_active)
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.patch("/{store_id}", response_model=schemas.StoreOut)
def update_store(store_id: str, payload: schemas.StoreUpdate, db: Session = Depends(get_db)):
    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    if payload.name is not None:
        store.name = payload.name
    if payload.is_active is not None:
        store.is_active = payload.is_active
    db.commit()
    db.refresh(store)
    return store


@router.post("/{store_id}/reset-pin", response_model=schemas.PinResetResponse)
def reset_pin(store_id: str, db: Session = Depends(get_db)):
    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    new_pin = str(secrets.randbelow(899999) + 100000)
    store.pin_hash = get_password_hash(new_pin)
    db.commit()
    return schemas.PinResetResponse(pin=new_pin)
