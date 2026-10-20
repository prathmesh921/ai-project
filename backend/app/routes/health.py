"""
health.py - API health check endpoint
"""
from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UEFA Champions League Match Outcome Predictor API",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "SQLite Connected",
        "models_loaded": True
    }
