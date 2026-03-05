from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_id: int
    is_active: bool = True
    permission_ids: List[int] = []


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role_id: int
    role_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
