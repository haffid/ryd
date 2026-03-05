import enum

from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, func, Enum
from sqlalchemy.orm import relationship

from ..core.database import Base


class InsightStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)
    powerbi_url = Column(Text, nullable=True)
    page_id = Column(Integer, ForeignKey("pages.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(InsightStatus), default=InsightStatus.draft)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    page = relationship("Page")
    category = relationship("Category", back_populates="insights")
    author = relationship("User")
