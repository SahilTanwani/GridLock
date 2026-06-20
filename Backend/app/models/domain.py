import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(30), primary_key=True, index=True)
    name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(200))
    status = Column(String(20), default="ACTIVE")


class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    violation_type = Column(String(50), nullable=False, index=True)
    plate_number = Column(String(20), index=True)
    camera_id = Column(String(30), ForeignKey("cameras.id"), index=True)
    confidence = Column(Float)
    bbox = Column(JSONB)
    evidence_path = Column(Text)
    
    # Mapped to "metadata" in DB, but named "meta_data" in Python to avoid conflict with Base.metadata
    meta_data = Column("metadata", JSONB) 
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    status = Column(String(20), default="PENDING")
    reviewed_by = Column(String(50))
    fine_amount = Column(Integer)
