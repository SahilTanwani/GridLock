from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

# Create the FastAPI application instance
app = FastAPI(
    title="Traffic Violation System API",
    description="API for automated traffic violation detection using YOLOv8 and EasyOCR",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint for Cloud Run / Load Balancers."""
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"message": "Traffic Violation System API is running"}

# Include the API router
app.include_router(api_router, prefix="/api")

