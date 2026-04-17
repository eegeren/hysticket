import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .db import Base
from .enums import AuthorRole, Category, CloseCode, Impact, Priority, Status


class Store(Base):
    __tablename__ = "stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    pin_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    devices = relationship("Device", back_populates="store", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="store", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    serial = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store = relationship("Store", back_populates="devices")
    tickets = relationship("Ticket", back_populates="device")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    requester_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(Category), nullable=False)
    impact = Column(Enum(Impact), nullable=False)
    priority = Column(Enum(Priority), nullable=False)
    status = Column(Enum(Status), nullable=False, default=Status.OPEN)
    assigned_to = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    close_code = Column(Enum(CloseCode), nullable=True)
    resolution_note = Column(Text, nullable=True)

    store = relationship("Store", back_populates="tickets")
    device = relationship("Device", back_populates="tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    author_role = Column(Enum(AuthorRole), nullable=False)
    author_name = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ticket = relationship("Ticket", back_populates="comments")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    uploader_role = Column(Enum(AuthorRole), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(255), nullable=False)
    size = Column(Integer, nullable=False)
    url = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ticket = relationship("Ticket", back_populates="attachments")
