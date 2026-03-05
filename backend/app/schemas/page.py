from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from ..models.page import PageType, PageVisibility


class PageCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = "article"
    parent_id: Optional[int] = None
    page_type: PageType = PageType.dashboard
    visibility: PageVisibility = PageVisibility.draft
    powerbi_url: Optional[str] = None
    order_index: int = 0
    role_ids: List[int] = []


class PageUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    page_type: Optional[PageType] = None
    visibility: Optional[PageVisibility] = None
    powerbi_url: Optional[str] = None
    order_index: Optional[int] = None
    role_ids: Optional[List[int]] = None


class PageResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    parent_id: Optional[int]
    page_type: PageType
    visibility: PageVisibility
    powerbi_url: Optional[str]
    order_index: int
    created_at: datetime
    children: List["PageResponse"] = []
    role_ids: List[int] = []

    class Config:
        from_attributes = True


PageResponse.model_rebuild()


class PageReorder(BaseModel):
    page_id: int
    parent_id: Optional[int]
    order_index: int


class PageReorderBatch(BaseModel):
    items: List[PageReorder]
