from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.page import Page, PageRole
from ..models.role import Role
from ..models.user import User
from ..schemas.page import PageCreate, PageReorderBatch, PageResponse, PageUpdate
from .deps import require_permission

router = APIRouter(prefix="/pages", tags=["pages"])


def _build(page: Page) -> PageResponse:
    return PageResponse(
        id=page.id,
        name=page.name,
        slug=page.slug,
        icon=page.icon or "article",
        parent_id=page.parent_id,
        page_type=page.page_type,
        visibility=page.visibility,
        powerbi_url=page.powerbi_url,
        order_index=page.order_index,
        created_at=page.created_at,
        children=[_build(c) for c in page.children],
        role_ids=[pr.role_id for pr in page.page_roles],
    )


@router.get("/", response_model=List[PageResponse])
def list_pages(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "read")),
):
    roots = (
        db.query(Page)
        .filter(Page.parent_id == None)  # noqa: E711
        .order_by(Page.order_index)
        .all()
    )
    return [_build(p) for p in roots]


@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def create_page(
    body: PageCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    if db.query(Page).filter(Page.slug == body.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya existe")

    page = Page(
        name=body.name,
        slug=body.slug,
        icon=body.icon,
        parent_id=body.parent_id,
        page_type=body.page_type,
        visibility=body.visibility,
        powerbi_url=body.powerbi_url,
        order_index=body.order_index,
    )
    db.add(page)
    db.flush()

    for role_id in body.role_ids:
        if db.get(Role, role_id):
            db.add(PageRole(page_id=page.id, role_id=role_id))

    db.commit()
    db.refresh(page)
    return _build(page)


@router.get("/{page_id}", response_model=PageResponse)
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "read")),
):
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Pagina no encontrada")
    return _build(page)


@router.patch("/{page_id}", response_model=PageResponse)
def update_page(
    page_id: int,
    body: PageUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Pagina no encontrada")

    if body.slug is not None:
        if db.query(Page).filter(Page.slug == body.slug, Page.id != page_id).first():
            raise HTTPException(status_code=400, detail="El slug ya existe")
        page.slug = body.slug
    if body.name is not None:
        page.name = body.name
    if body.icon is not None:
        page.icon = body.icon
    if "parent_id" in (body.model_fields_set or set()):
        page.parent_id = body.parent_id
    if body.page_type is not None:
        page.page_type = body.page_type
    if body.visibility is not None:
        page.visibility = body.visibility
    if "powerbi_url" in (body.model_fields_set or set()):
        page.powerbi_url = body.powerbi_url
    if body.order_index is not None:
        page.order_index = body.order_index

    if body.role_ids is not None:
        for pr in list(page.page_roles):
            db.delete(pr)
        db.flush()
        for role_id in body.role_ids:
            if db.get(Role, role_id):
                db.add(PageRole(page_id=page.id, role_id=role_id))

    db.commit()
    db.refresh(page)
    return _build(page)


@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Pagina no encontrada")
    db.delete(page)
    db.commit()


@router.post("/reorder", status_code=status.HTTP_200_OK)
def reorder_pages(
    body: PageReorderBatch,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("pages", "write")),
):
    for item in body.items:
        page = db.get(Page, item.page_id)
        if page:
            page.parent_id = item.parent_id
            page.order_index = item.order_index
    db.commit()
    return {"status": "ok"}
