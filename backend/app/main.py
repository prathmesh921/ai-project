"""
main.py - FastAPI application entrypoint for UEFA Champions League AI Match Outcome Predictor
"""
import os
import sys
from contextlib import asynccontextmanager

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import engine, Base
from .seed_db import init_and_seed_db
from .routes.health import router as health_router
from .routes.teams import router as teams_router
from .routes.matches import router as matches_router
from .routes.h2h import router as h2h_router
from .routes.predict import router as predict_router
from .routes.models_eval import router as models_eval_router
from .routes.fixtures import router as fixtures_router
from .routes.simulate import router as simulate_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and database is seeded
    try:
        init_and_seed_db()
    except Exception as e:
        print(f"[App] Startup DB initialization notice: {e}")
    yield

app = FastAPI(
    title="UEFA Champions League AI Match Outcome Predictor API",
    description="Full-stack Machine Learning API for predicting UEFA Champions League match outcomes, analyzing team statistics, and providing explainable AI insights.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(matches_router, prefix="/api")
app.include_router(h2h_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(models_eval_router, prefix="/api")
app.include_router(fixtures_router, prefix="/api")
app.include_router(simulate_router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "project": "UEFA Champions League AI Match Outcome Predictor",
        "documentation": "/docs",
        "health_check": "/api/health"
    }
