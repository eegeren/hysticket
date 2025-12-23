from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .enums import AuthorRole, Category, CloseCode, Impact, Priority, Status


class TokenResponse(BaseModel):
    token: str


class StoreLoginRequest(BaseModel):
    code: str
    pin: str


class AdminLoginRequest(BaseModel):
    password: str


class StoreBase(BaseModel):
    name: str
    code: str
    is_active: bool = True


class StoreCreate(StoreBase):
    pin: str = Field(min_length=4, max_length=12)


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class StoreOut(StoreBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PinResetResponse(BaseModel):
    pin: str


class DeviceBase(BaseModel):
    label: str
    type: str
    serial: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    serial: Optional[str] = None


class DeviceOut(DeviceBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketCreate(BaseModel):
    store_id: UUID
    requester_name: str
    title: str
    description: str
    category: Category
    impact: Impact
    device_id: Optional[UUID] = None


class TicketFilter(BaseModel):
    status: Optional[Status] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    store_id: Optional[UUID] = None


class AdminTicketFilter(TicketFilter):
    category: Optional[Category] = None
    priority: Optional[Priority] = None
    impact: Optional[Impact] = None


class TicketUpdateAdmin(BaseModel):
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    assigned_to: Optional[str] = None
    close_code: Optional[CloseCode] = None
    resolution_note: Optional[str] = None


class CommentCreate(BaseModel):
    author_name: str
    body: str


class CommentOut(BaseModel):
    id: UUID
    ticket_id: UUID
    author_role: AuthorRole
    author_name: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttachmentOut(BaseModel):
    id: UUID
    ticket_id: UUID
    uploader_role: AuthorRole
    file_name: str
    mime_type: str
    size: int
    url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketOut(BaseModel):
    id: UUID
    store_id: UUID
    device_id: Optional[UUID]
    requester_name: str
    title: str
    description: str
    category: Category
    impact: Impact
    priority: Priority
    status: Status
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]
    close_code: Optional[CloseCode]
    resolution_note: Optional[str]
    comments: List[CommentOut] = []
    attachments: List[AttachmentOut] = []

    model_config = ConfigDict(from_attributes=True)
