from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from ..models.insight import InsightStatus


class InsightCreate(BaseModel):
    title: str
    content: Optional[str] = None
    powerbi_url: Optional[str] = None
    page_id: Optional[int] = None
    category_id: Optional[int] = None
    status: InsightStatus = InsightStatus.draft


class InsightUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    powerbi_url: Optional[str] = None
    page_id: Optional[int] = None
    category_id: Optional[int] = None
    status: Optional[InsightStatus] = None


class InsightResponse(BaseModel):
    id: int
    title: str
    content: Optional[str]
    powerbi_url: Optional[str]
    page_id: Optional[int]
    category_id: Optional[int]
    author_id: int
    author_name: str
    status: InsightStatus
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
