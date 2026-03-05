from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_password_hash
from ..models.permission import Permission, UserPermission
from ..models.role import Role
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, UserUpdate
from .deps import require_permission

router = APIRouter(prefix="/users", tags=["users"])


def _user_resp(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.display_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "read")),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [_user_resp(u) for u in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "write")),
):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="El correo electronico ya existe")
    if not db.get(Role, body.role_id):
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    user = User(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=get_password_hash(body.password),
        role_id=body.role_id,
        is_active=body.is_active,
    )
    db.add(user)
    db.flush()

    for perm_id in body.permission_ids:
        if db.get(Permission, perm_id):
            db.add(UserPermission(user_id=user.id, permission_id=perm_id, granted=True))

    db.commit()
    db.refresh(user)
    return _user_resp(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "read")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _user_resp(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users", "write")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if body.username is not None:
        if db.query(User).filter(User.username == body.username, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
        user.username = body.username

    if body.email is not None:
        if db.query(User).filter(User.email == body.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="El correo electronico ya existe")
        user.email = body.email

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.password is not None:
        user.hashed_password = get_password_hash(body.password)
    if body.role_id is not None:
        if not db.get(Role, body.role_id):
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        user.role_id = body.role_id
    if body.is_active is not None:
        user.is_active = body.is_active

    if body.permission_ids is not None:
        for up in list(user.user_permissions):
            db.delete(up)
        db.flush()
        for perm_id in body.permission_ids:
            if db.get(Permission, perm_id):
                db.add(UserPermission(user_id=user.id, permission_id=perm_id, granted=True))

    db.commit()
    db.refresh(user)
    return _user_resp(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("users", "write")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puede eliminarse a si mismo")
    db.delete(user)
    db.commit()
