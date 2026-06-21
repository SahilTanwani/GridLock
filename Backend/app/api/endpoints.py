from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.models.domain import Violation, Camera
from app.models.schemas import ViolationRead, CameraRead
from app.services.gcp_storage import upload_evidence_image
from uuid import uuid4
from datetime import datetime
import asyncio

router = APIRouter()

# Mock data for demonstration and fallback
MOCK_VIOLATIONS = [
    {
        "id": uuid4(),
        "violation_type": "RED_LIGHT",
        "plate_number": "ABC-1234",
        "camera_id": "CAM-01",
        "confidence": 0.98,
        "timestamp": datetime.now(),
        "status": "PENDING"
    },
    {
        "id": uuid4(),
        "violation_type": "WRONG_WAY",
        "plate_number": "XYZ-5678",
        "camera_id": "CAM-02",
        "confidence": 0.92,
        "timestamp": datetime.now(),
        "status": "REVIEWED"
    }
]

@router.get("/violations", response_model=List[ViolationRead])
async def get_violations(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Violation).order_by(Violation.timestamp.desc()).limit(20))
        violations = result.scalars().all()
        if violations:
            return violations
    except Exception as e:
        print(f"Database query failed, falling back to mock data: {e}")
    return MOCK_VIOLATIONS

@router.get("/cameras", response_model=List[CameraRead])
async def get_cameras(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Camera))
        cameras = result.scalars().all()
        if cameras:
            return cameras
    except Exception as e:
        print(f"Database query failed, falling back to mock data: {e}")
    return [
        {"id": "CAM-01", "name": "North Intersection", "status": "ACTIVE"},
        {"id": "CAM-02", "name": "South Highway", "status": "ACTIVE"}
    ]

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    try:
        # Count total violations
        total_result = await db.execute(select(func.count(Violation.id)))
        total_violations = total_result.scalar() or 0
        
        # Count active cameras
        active_cameras_result = await db.execute(select(func.count(Camera.id)).where(Camera.status == "ACTIVE"))
        active_cameras = active_cameras_result.scalar() or 0
        
        # Count pending reviews
        pending_result = await db.execute(select(func.count(Violation.id)).where(Violation.status == "PENDING"))
        pending_reviews = pending_result.scalar() or 0
        
        # If there are records in the database, return them
        if total_violations > 0 or active_cameras > 0:
            return {
                "total_violations": total_violations,
                "active_cameras": active_cameras,
                "pending_reviews": pending_reviews
            }
    except Exception as e:
        print(f"Database stats query failed, falling back to mock stats: {e}")
    
    return {
        "total_violations": 1248,
        "active_cameras": 12,
        "pending_reviews": 43
    }

@router.post("/v1/detect")
async def detect_violation(file: UploadFile = File(...), camera_id: str = "CAM-01", db: AsyncSession = Depends(get_db)):
    """
    Simulate traffic image upload and YOLO inference.
    In a real system, this processes the file through YOLOv8.
    """
    try:
        # Save or process the uploaded file here using EasyOCR/YOLOv8
        filename = file.filename
        content = await file.read()
        
        # Upload the raw evidence to GCP and get a signed URL
        gcp_evidence_url = await upload_evidence_image(
            file_bytes=content,
            object_name=f"uploads/{filename}",
            content_type=file.content_type
        )
        
        # Simulated analysis logic...
        await asyncio.sleep(2) # Simulate inference delay
        
        simulated_violations = [
            {
                "id": str(uuid4()),
                "violation_type": "HELMET_NON_COMPLIANCE",
                "plate_number": "MH12AB1234",
                "camera_id": camera_id,
                "confidence": 0.94,
                "timestamp": datetime.now().isoformat(),
                "status": "PENDING",
                "fine_amount": 1000
            }
        ]
        
        # If it's a video, add more violations
        if "video" in file.content_type:
             simulated_violations.append({
                "id": str(uuid4()),
                "violation_type": "TRIPLE_RIDING",
                "plate_number": "KA05MN4321",
                "camera_id": camera_id,
                "confidence": 0.88,
                "timestamp": datetime.now().isoformat(),
                "status": "PENDING",
                "fine_amount": 1000
            })
            
        return {
            "violations": simulated_violations,
            "summary": {
                "total_detected": len(simulated_violations),
                "high_confidence_count": sum(1 for v in simulated_violations if v["confidence"] > 0.9),
                "estimated_fines": sum(v["fine_amount"] for v in simulated_violations)
            },
            "gcp_url": gcp_evidence_url
        }
    except Exception as e:
        print(f"Error during detection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during detection")

