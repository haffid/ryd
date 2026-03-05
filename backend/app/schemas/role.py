from typing import Optional, List

from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    is_system: bool

    class Config:
        from_attributes = True


class PermissionResponse(BaseModel):
    id: int
    module: str
    action: str
    description: Optional[str]

    class Config:
        from_attributes = True
