from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    page_id: Optional[int] = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_name: str
    original_name: Optional[str]
    file_size: Optional[int]
    file_url: str          # Computed absolute URL to the PDF
    page_id: Optional[int]
    page_name: Optional[str]
    uploaded_by_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
