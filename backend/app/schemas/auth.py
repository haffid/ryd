from pydantic import BaseModel
from typing import List


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserMe(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    role_id: int
    permissions: List[str]
    is_active: bool

    class Config:
        from_attributes = True
