from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..dependencies import get_current_admin
from ..db import get_db
from ..models import Device, Store

router = APIRouter(prefix="/admin", tags=["devices"])

public_router = APIRouter(prefix="/stores", tags=["devices"])

@router.get("/stores/{store_id}/devices", response_model=list[schemas.DeviceOut])
def list_devices(store_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return db.query(Device).filter(Device.store_id == store_id).order_by(Device.created_at.desc()).all()


@router.post("/stores/{store_id}/devices", response_model=schemas.DeviceOut, status_code=status.HTTP_201_CREATED)
def create_device(store_id: str, payload: schemas.DeviceCreate, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    device = Device(store_id=store_id, label=payload.label, type=payload.type, serial=payload.serial)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.patch("/devices/{device_id}", response_model=schemas.DeviceOut)
def update_device(device_id: str, payload: schemas.DeviceUpdate, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    if payload.label is not None:
        device.label = payload.label
    if payload.type is not None:
        device.type = payload.type
    if payload.serial is not None:
        device.serial = payload.serial
    db.commit()
    db.refresh(device)
    return device


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: str, db: Session = Depends(get_db), _: dict = Depends(get_current_admin)):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    db.delete(device)
    db.commit()
    return None


@public_router.get("/{store_id}/devices", response_model=list[schemas.DeviceOut])
def list_store_devices(store_id: str, db: Session = Depends(get_db)):
    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return db.query(Device).filter(Device.store_id == store_id).order_by(Device.created_at.desc()).all()
