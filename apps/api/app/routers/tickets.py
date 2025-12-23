from datetime import datetime

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import schemas
from ..db import get_db
from ..enums import AuthorRole, Category, Impact, Priority, Status
from ..models import Attachment, Comment, Device, Store, Ticket
from ..storage import get_storage

router = APIRouter(tags=["tickets"])

PRIORITY_MAP = {
    Impact.SALES_STOPPED: Priority.P1,
    Impact.PARTIAL: Priority.P2,
    Impact.INFO: Priority.P3,
}


def optional_admin(x_admin_password: str | None = Header(default=None)):
    from ..config import settings

    if x_admin_password and x_admin_password == settings.admin_password:
        return True
    return False


def require_admin(x_admin_password: str | None = Header(default=None)):
    if not optional_admin(x_admin_password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin password required")
    return True


@router.post("/tickets", response_model=schemas.TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: schemas.TicketCreate, db: Session = Depends(get_db)):
    store = db.get(Store, payload.store_id)
    if not store or not store.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid store")
    if payload.device_id:
        device = db.get(Device, payload.device_id)
        if not device or str(device.store_id) != str(payload.store_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid device")
    priority = PRIORITY_MAP.get(payload.impact, Priority.P3)
    ticket = Ticket(
        store_id=payload.store_id,
        device_id=payload.device_id,
        requester_name=payload.requester_name,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        impact=payload.impact,
        priority=priority,
        status=Status.OPEN,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/tickets", response_model=list[schemas.TicketOut])
def list_tickets(
    store_id: str | None = None,
    category: Category | None = None,
    status_filter: Status | None = None,
    priority: Priority | None = None,
    impact: Impact | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
):
    if not store_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="store_id is required")
    query = db.query(Ticket)
    if store_id:
        query = query.filter(Ticket.store_id == store_id)
    if category:
        query = query.filter(Ticket.category == category)
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if impact:
        query = query.filter(Ticket.impact == impact)
    if start_date:
        query = query.filter(Ticket.created_at >= start_date)
    if end_date:
        query = query.filter(Ticket.created_at <= end_date)
    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/admin/tickets", response_model=list[schemas.TicketOut])
def list_tickets_admin(
    store_id: str | None = None,
    category: Category | None = None,
    status_filter: Status | None = None,
    priority: Priority | None = None,
    impact: Impact | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    query = db.query(Ticket)
    if store_id:
        query = query.filter(Ticket.store_id == store_id)
    if category:
        query = query.filter(Ticket.category == category)
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if impact:
        query = query.filter(Ticket.impact == impact)
    if start_date:
        query = query.filter(Ticket.created_at >= start_date)
    if end_date:
        query = query.filter(Ticket.created_at <= end_date)
    return query.order_by(Ticket.created_at.desc()).all()


@router.get("/tickets/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(ticket_id: str, store_id: str | None = None, db: Session = Depends(get_db), admin_ok: bool = Depends(optional_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if not admin_ok:
        if not store_id or str(ticket.store_id) != store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return ticket


@router.patch("/admin/tickets/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket_admin(ticket_id: str, payload: schemas.TicketUpdateAdmin, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    # If only assignment is made, mark as in progress to surface acceptance to requester
    if payload.status is None and payload.assigned_to and ticket.status == Status.OPEN:
        ticket.status = Status.IN_PROGRESS
    if payload.status is not None:
        ticket.status = payload.status
        if payload.status == Status.CLOSED:
            ticket.closed_at = datetime.utcnow()
    if payload.priority is not None:
        ticket.priority = payload.priority
    if payload.assigned_to is not None:
        ticket.assigned_to = payload.assigned_to
    if payload.close_code is not None:
        ticket.close_code = payload.close_code
    if payload.resolution_note is not None:
        ticket.resolution_note = payload.resolution_note
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/tickets/{ticket_id}/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(ticket_id: str, payload: schemas.CommentCreate, store_id: str | None = None, db: Session = Depends(get_db), admin_ok: bool = Depends(optional_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if not admin_ok:
        if not store_id or str(ticket.store_id) != store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    comment = Comment(ticket_id=ticket_id, author_role=AuthorRole.STORE, author_name=payload.author_name, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.post("/tickets/{ticket_id}/attachments", response_model=schemas.AttachmentOut, status_code=status.HTTP_201_CREATED)
def upload_attachment(ticket_id: str, file: UploadFile = File(...), store_id: str | None = None, db: Session = Depends(get_db), admin_ok: bool = Depends(optional_admin)):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if not admin_ok:
        if not store_id or str(ticket.store_id) != store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    author_role = AuthorRole.ADMIN if admin_ok else AuthorRole.STORE
    storage = get_storage()
    saved_name, url, size = storage.save(file)
    attachment = Attachment(
        ticket_id=ticket_id,
        uploader_role=author_role,
        file_name=saved_name,
        mime_type=file.content_type or "application/octet-stream",
        size=size,
        url=url,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment
