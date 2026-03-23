from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.database import engine
from .models import (  # noqa: F401 — import all models so SQLAlchemy registers them
    Role,
    User,
    Permission,
    RolePermission,
    UserPermission,
    Page,
    PageRole,
    Category,
    Insight,
    Document,
)
from .core.database import Base
from .routers import auth, categories, documents, insights, pages, roles, users, banguat

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portal Inmobiliario API",
    description="API corporativa para el portal de desarrolladora inmobiliaria",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded PDFs as static files at /uploads/{filename}
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=_PREFIX)
app.include_router(users.router, prefix=_PREFIX)
app.include_router(roles.router, prefix=_PREFIX)
app.include_router(pages.router, prefix=_PREFIX)
app.include_router(insights.router, prefix=_PREFIX)
app.include_router(categories.router, prefix=_PREFIX)
app.include_router(documents.router, prefix=_PREFIX)
app.include_router(banguat.router, prefix=_PREFIX)


@app.get("/api/v1/health", tags=["health"])
def health():
    return {"status": "ok", "service": "Portal Inmobiliario API"}
