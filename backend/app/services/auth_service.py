from sqlalchemy.orm import Session

from ..core.security import verify_password, create_access_token, create_refresh_token
from ..models.permission import RolePermission, UserPermission
from ..models.user import User


def authenticate_user(db: Session, username_or_email: str, password: str) -> User | None:
    user = (
        db.query(User)
        .filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        )
        .first()
    )
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def get_user_permissions(db: Session, user: User) -> list[str]:
    role_perms = (
        db.query(RolePermission)
        .filter(RolePermission.role_id == user.role_id)
        .join(RolePermission.permission)
        .all()
    )
    perms = set(f"{rp.permission.module}:{rp.permission.action}" for rp in role_perms)

    user_perms = (
        db.query(UserPermission)
        .filter(UserPermission.user_id == user.id)
        .join(UserPermission.permission)
        .all()
    )
    for up in user_perms:
        perm_str = f"{up.permission.module}:{up.permission.action}"
        if up.granted:
            perms.add(perm_str)
        else:
            perms.discard(perm_str)

    return sorted(perms)


def create_tokens(user: User) -> dict:
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.name}
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
