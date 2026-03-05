from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.insight import Insight, InsightStatus
from ..models.user import User
from ..schemas.insight import InsightCreate, InsightResponse, InsightUpdate
from .deps import require_permission

router = APIRouter(prefix="/insights", tags=["insights"])


def _build(insight: Insight) -> InsightResponse:
    return InsightResponse(
        id=insight.id,
        title=insight.title,
        content=insight.content,
        powerbi_url=insight.powerbi_url,
        page_id=insight.page_id,
        category_id=insight.category_id,
        author_id=insight.author_id,
        author_name=insight.author.full_name,
        status=insight.status,
        published_at=insight.published_at,
        created_at=insight.created_at,
        updated_at=insight.updated_at,
    )


@router.get("/", response_model=List[InsightResponse])
def list_insights(
    category_id: Optional[int] = Query(None),
    filter_status: Optional[InsightStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("insights", "read")),
):
    q = db.query(Insight)
    if category_id is not None:
        q = q.filter(Insight.category_id == category_id)
    if filter_status is not None:
        q = q.filter(Insight.status == filter_status)
    insights = q.order_by(Insight.created_at.desc()).offset(skip).limit(limit).all()
    return [_build(i) for i in insights]


@router.post("/", response_model=InsightResponse, status_code=status.HTTP_201_CREATED)
def create_insight(
    body: InsightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("insights", "write")),
):
    published_at = None
    if body.status == InsightStatus.published:
        published_at = datetime.now(timezone.utc)

    insight = Insight(
        title=body.title,
        content=body.content,
        powerbi_url=body.powerbi_url,
        page_id=body.page_id,
        category_id=body.category_id,
        author_id=current_user.id,
        status=body.status,
        published_at=published_at,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return _build(insight)


@router.get("/{insight_id}", response_model=InsightResponse)
def get_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("insights", "read")),
):
    insight = db.get(Insight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight no encontrado")
    return _build(insight)


@router.patch("/{insight_id}", response_model=InsightResponse)
def update_insight(
    insight_id: int,
    body: InsightUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("insights", "write")),
):
    insight = db.get(Insight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight no encontrado")

    if body.title is not None:
        insight.title = body.title
    if body.content is not None:
        insight.content = body.content
    if body.powerbi_url is not None:
        insight.powerbi_url = body.powerbi_url
    if body.page_id is not None:
        insight.page_id = body.page_id
    if body.category_id is not None:
        insight.category_id = body.category_id
    if body.status is not None:
        if body.status == InsightStatus.published and insight.status != InsightStatus.published:
            insight.published_at = datetime.now(timezone.utc)
        insight.status = body.status

    db.commit()
    db.refresh(insight)
    return _build(insight)


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_insight(
    insight_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("insights", "write")),
):
    insight = db.get(Insight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight no encontrado")
    db.delete(insight)
    db.commit()
