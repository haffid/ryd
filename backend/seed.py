"""
Seed script — ejecutar una sola vez para poblar la base de datos con:
  - Permisos granulares por módulo/acción
  - Roles del sistema: admin, editor, viewer
  - Usuario administrador por defecto
  - Categorías de activos inmobiliarios
  - Páginas de ejemplo con jerarquía

Uso:
    cd portal-inmobiliario/backend
    python seed.py
"""

import sys
import os

sys.path.append(os.path.dirname(__file__))

from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.core.security import get_password_hash
from app.models import (
    Role,
    User,
    Permission,
    RolePermission,
    Page,
    Category,
    PageRole,
)
from app.models.page import PageType, PageVisibility


# ---------------------------------------------------------------------------
# Definiciones de datos
# ---------------------------------------------------------------------------

PERMISSIONS = [
    # module, action, description
    ("users", "read", "Ver lista y detalle de usuarios"),
    ("users", "write", "Crear y editar usuarios"),
    ("users", "delete", "Eliminar usuarios"),
    ("roles", "read", "Ver roles y permisos"),
    ("roles", "write", "Crear y editar roles"),
    ("roles", "delete", "Eliminar roles"),
    ("pages", "read", "Ver páginas del portal"),
    ("pages", "write", "Crear y editar páginas"),
    ("pages", "delete", "Eliminar páginas"),
    ("insights", "read", "Ver entradas/insights"),
    ("insights", "write", "Crear y editar entradas"),
    ("insights", "delete", "Eliminar entradas"),
    ("categories", "read", "Ver categorías"),
    ("categories", "write", "Crear y editar categorías"),
    ("dashboard", "read", "Acceder al dashboard principal"),
]

ROLES = [
    {
        "name": "admin",
        "display_name": "Administrador",
        "description": "Acceso total al sistema — gestión de usuarios, roles, estructura y contenido",
        "is_system": True,
        "permissions": "all",
    },
    {
        "name": "editor",
        "display_name": "Editor",
        "description": "Igual que Admin pero sin módulo de usuarios",
        "is_system": True,
        "permissions": [
            ("roles", "read"),
            ("pages", "read"), ("pages", "write"), ("pages", "delete"),
            ("insights", "read"), ("insights", "write"), ("insights", "delete"),
            ("categories", "read"), ("categories", "write"),
            ("dashboard", "read"),
        ],
    },
    {
        "name": "viewer",
        "display_name": "Visualizador",
        "description": "Solo lectura — navega y visualiza contenido publicado",
        "is_system": True,
        "permissions": [
            ("dashboard", "read"),
            ("pages", "read"),
            ("insights", "read"),
            ("categories", "read"),
        ],
    },
]

CATEGORIES = [
    ("Vivienda Vertical", "vivienda-vertical", "Proyectos residenciales de alta densidad"),
    ("Industrial", "industrial", "Parques y naves industriales"),
    ("Oficinas", "oficinas", "Espacios corporativos clase A y A+"),
    ("Proyecciones", "proyecciones", "Análisis y proyecciones de mercado"),
]

PAGES = [
    {
        "name": "Sala de Control",
        "slug": "sala-de-control",
        "icon": "dashboard",
        "page_type": PageType.dashboard,
        "visibility": PageVisibility.published,
        "order_index": 0,
        "children": [
            {
                "name": "Vivienda Vertical",
                "slug": "vivienda-vertical",
                "icon": "apartment",
                "page_type": PageType.dashboard,
                "visibility": PageVisibility.published,
                "order_index": 0,
                "powerbi_url": "",
            },
            {
                "name": "Industrial",
                "slug": "industrial",
                "icon": "factory",
                "page_type": PageType.dashboard,
                "visibility": PageVisibility.published,
                "order_index": 1,
                "powerbi_url": "",
            },
            {
                "name": "Infraestructura",
                "slug": "infraestructura",
                "icon": "construction",
                "page_type": PageType.dashboard,
                "visibility": PageVisibility.draft,
                "order_index": 2,
                "powerbi_url": "",
            },
        ],
    },
    {
        "name": "Reportes Corporativos",
        "slug": "reportes-corporativos",
        "icon": "monitoring",
        "page_type": PageType.dashboard,
        "visibility": PageVisibility.published,
        "order_index": 1,
    },
    {
        "name": "Finanzas",
        "slug": "finanzas",
        "icon": "account_balance",
        "page_type": PageType.dashboard,
        "visibility": PageVisibility.published,
        "order_index": 2,
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_create_permission(db, module: str, action: str, description: str) -> Permission:
    obj = db.query(Permission).filter_by(module=module, action=action).first()
    if not obj:
        obj = Permission(module=module, action=action, description=description)
        db.add(obj)
        db.flush()
    return obj


def _get_or_create_role(db, role_def: dict, perm_map: dict) -> Role:
    role = db.query(Role).filter_by(name=role_def["name"]).first()
    if not role:
        role = Role(
            name=role_def["name"],
            display_name=role_def["display_name"],
            description=role_def["description"],
            is_system=role_def.get("is_system", False),
        )
        db.add(role)
        db.flush()

        allowed_keys = (
            list(perm_map.keys()) if role_def["permissions"] == "all"
            else role_def["permissions"]
        )
        for key in allowed_keys:
            if key in perm_map:
                rp = RolePermission(role_id=role.id, permission_id=perm_map[key].id)
                db.add(rp)
    return role


def _create_page_tree(db, page_def: dict, parent_id=None, all_role_ids=None):
    existing = db.query(Page).filter_by(slug=page_def["slug"]).first()
    if existing:
        return existing

    children = page_def.pop("children", [])
    page = Page(
        parent_id=parent_id,
        **{k: v for k, v in page_def.items()},
    )
    db.add(page)
    db.flush()

    # Grant access to all roles by default on seed pages
    if all_role_ids:
        for rid in all_role_ids:
            db.add(PageRole(page_id=page.id, role_id=rid))

    for child_def in children:
        _create_page_tree(db, child_def, parent_id=page.id, all_role_ids=all_role_ids)

    return page


# ---------------------------------------------------------------------------
# Main seed
# ---------------------------------------------------------------------------

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Iniciando seed...")

        # 1. Permissions
        perm_map: dict[tuple, Permission] = {}
        for module, action, description in PERMISSIONS:
            p = _get_or_create_permission(db, module, action, description)
            perm_map[(module, action)] = p
        db.flush()
        print(f"  [OK] {len(perm_map)} permisos")

        # 2. Roles
        role_map: dict[str, Role] = {}
        for rd in ROLES:
            role = _get_or_create_role(db, rd, perm_map)
            role_map[rd["name"]] = role
        db.flush()
        print(f"  [OK] {len(role_map)} roles")

        # 3. Admin user
        if not db.query(User).filter_by(username="admin").first():
            admin = User(
                username="admin",
                email="admin@portal-inmo.com",
                full_name="Administrador Sistema",
                hashed_password=get_password_hash("Admin1234!"),
                role_id=role_map["admin"].id,
                is_active=True,
            )
            db.add(admin)
            print("  [OK] Usuario admin creado  ->  admin / Admin1234!")
        else:
            print("  [--] Usuario admin ya existe, omitiendo")

        db.flush()

        # 4. Categories
        for name, slug, description in CATEGORIES:
            if not db.query(Category).filter_by(slug=slug).first():
                db.add(Category(name=name, slug=slug, description=description))
        db.flush()
        print(f"  [OK] {len(CATEGORIES)} categorias")

        # 5. Pages
        all_role_ids = [r.id for r in role_map.values()]
        for page_def in PAGES:
            _create_page_tree(db, page_def.copy(), all_role_ids=all_role_ids)
        db.flush()
        print(f"  [OK] Paginas de ejemplo creadas")

        db.commit()
        print("\nSeed completado exitosamente.")
        print("-" * 40)
        print("  URL:       http://localhost:8000")
        print("  Docs:      http://localhost:8000/docs")
        print("  Usuario:   admin")
        print("  Contrasena: Admin1234!")
        print("-" * 40)

    except Exception as exc:
        db.rollback()
        print(f"\nError durante el seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
