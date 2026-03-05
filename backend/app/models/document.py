from sqlalchemy import Column, Integer, String, Text, BigInteger, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from ..core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=False, unique=True)   # UUID-based stored name
    original_name = Column(String(255), nullable=True)             # Original upload filename
    file_size = Column(BigInteger, nullable=True)                   # bytes
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="SET NULL"), nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    page = relationship("Page")
    uploaded_by = relationship("User")
