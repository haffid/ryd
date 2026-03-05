import enum

from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, func, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class PageType(str, enum.Enum):
    dashboard = "dashboard"
    narrative = "narrative"
    external = "external"


class PageVisibility(str, enum.Enum):
    published = "published"
    draft = "draft"
    private = "private"


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    icon = Column(String(100), default="article")
    parent_id = Column(Integer, ForeignKey("pages.id"), nullable=True)
    page_type = Column(Enum(PageType), default=PageType.dashboard)
    visibility = Column(Enum(PageVisibility), default=PageVisibility.draft)
    powerbi_url = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("Page", remote_side=[id], back_populates="children")
    children = relationship(
        "Page", back_populates="parent", order_by="Page.order_index"
    )
    page_roles = relationship(
        "PageRole", back_populates="page", cascade="all, delete-orphan"
    )


class PageRole(Base):
    __tablename__ = "page_roles"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    page = relationship("Page", back_populates="page_roles")
    role = relationship("Role", back_populates="page_roles")
