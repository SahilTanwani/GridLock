from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class CameraBase(BaseModel):
    id: str
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    status: str = "ACTIVE"

class CameraCreate(CameraBase):
    pass

class CameraRead(CameraBase):
    model_config = ConfigDict(from_attributes=True)


class ViolationBase(BaseModel):
    violation_type: str
    plate_number: Optional[str] = None
    camera_id: Optional[str] = None
    confidence: Optional[float] = None
    bbox: Optional[Dict[str, Any]] = None
    evidence_path: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = Field(default=None, alias="metadata")
    status: str = "PENDING"
    fine_amount: Optional[int] = None

class ViolationCreate(ViolationBase):
    pass

class ViolationUpdate(BaseModel):
    status: Optional[str] = None
    reviewed_by: Optional[str] = None
    fine_amount: Optional[int] = None

class ViolationRead(ViolationBase):
    id: UUID
    timestamp: datetime
    reviewed_by: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
