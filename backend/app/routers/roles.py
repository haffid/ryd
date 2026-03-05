from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.permission import Permission, RolePermission
from ..models.role import Role
from ..models.user import User
from ..schemas.role import PermissionResponse, RoleCreate, RoleResponse, RoleUpdate
from .deps import require_permission

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/", response_model=List[RoleResponse])
def list_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "read")),
):
    return db.query(Role).all()


@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "read")),
):
    return db.query(Permission).order_by(Permission.module, Permission.action).all()


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    body: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "write")),
):
    if db.query(Role).filter(Role.name == body.name).first():
        raise HTTPException(status_code=400, detail="El nombre de rol ya existe")

    role = Role(
        name=body.name,
        display_name=body.display_name,
        description=body.description,
        is_system=False,
    )
    db.add(role)
    db.flush()

    for perm_id in body.permission_ids:
        if db.get(Permission, perm_id):
            db.add(RolePermission(role_id=role.id, permission_id=perm_id))

    db.commit()
    db.refresh(role)
    return role


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "write")),
):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    if body.display_name is not None:
        role.display_name = body.display_name
    if body.description is not None:
        role.description = body.description

    if body.permission_ids is not None:
        for rp in list(role.role_permissions):
            db.delete(rp)
        db.flush()
        for perm_id in body.permission_ids:
            if db.get(Permission, perm_id):
                db.add(RolePermission(role_id=role.id, permission_id=perm_id))

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "write")),
):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    if role.is_system:
        raise HTTPException(status_code=400, detail="No puede eliminar un rol del sistema")
    db.delete(role)
    db.commit()
