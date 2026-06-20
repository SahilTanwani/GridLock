from fastapi import FastAPI
import asyncio

# Create the FastAPI application instance
app = FastAPI(
    title="Traffic Violation System API",
    description="API for automated traffic violation detection using YOLOv8 and EasyOCR",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    """Health check endpoint for Cloud Run / Load Balancers."""
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"message": "Traffic Violation System API is running"}

# In the future, include routers here:
# from app.api.endpoints import my_router
# app.include_router(my_router, prefix="/api")
