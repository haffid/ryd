import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.document import Document
from ..models.user import User
from ..schemas.document import DocumentResponse, DocumentUpdate
from .deps import get_current_user, require_permission

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "application/octet-stream"}

router = APIRouter(prefix="/documents", tags=["documents"])


def _build(doc: Document, base_url: str) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        file_name=doc.file_name,
        original_name=doc.original_name,
        file_size=doc.file_size,
        file_url=f"{base_url}uploads/{doc.file_name}",
        page_id=doc.page_id,
        page_name=doc.page.name if doc.page else None,
        uploaded_by_name=doc.uploaded_by.full_name if doc.uploaded_by else None,
        created_at=doc.created_at or datetime.utcnow(),
    )


def _base(request: Request) -> str:
    return str(request.base_url)


# ── List ─────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    request: Request,
    page_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Document)
    if page_id is not None:
        q = q.filter(Document.page_id == page_id)
    docs = q.order_by(Document.created_at.desc()).all()
    base = _base(request)
    return [_build(d, base) for d in docs]


# ── Get by page (convenience) ─────────────────────────────────────────────
@router.get("/by-page/{page_id}", response_model=Optional[DocumentResponse])
def get_document_for_page(
    page_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(Document.page_id == page_id)
        .order_by(Document.created_at.desc())
        .first()
    )
    if not doc:
        return None
    return _build(doc, _base(request))


# ── Get single ────────────────────────────────────────────────────────────
@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return _build(doc, _base(request))


# ── Upload ────────────────────────────────────────────────────────────────
@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    title: str = Form(...),
    description: str = Form(""),
    page_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("pages", "write")),
):
    # Validate PDF
    if file.content_type not in ALLOWED_TYPES and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    # Read & save
    content = await file.read()
    suffix = Path(file.filename).suffix or ".pdf"
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOADS_DIR / unique_name
    file_path.write_bytes(content)

    doc = Document(
        title=title.strip(),
        description=description.strip() or None,
        file_name=unique_name,
        original_name=file.filename,
        file_size=len(content),
        page_id=page_id,
        uploaded_by_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Refresh again after commit to ensure all database-generated fields (like created_at) are present
    doc = db.get(Document, doc.id)
    
    return _build(doc, _base(request))


# ── Update metadata ───────────────────────────────────────────────────────
@router.patch("/{doc_id}", response_model=DocumentResponse)
def update_document(
    doc_id: int,
    payload: DocumentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return _build(doc, _base(request))


# ── Delete ────────────────────────────────────────────────────────────────
@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Remove file from disk
    file_path = UPLOADS_DIR / doc.file_name
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
