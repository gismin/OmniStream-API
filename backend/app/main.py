"""
OmniStream-API — FastAPI application entry point.
Registers all module routers and creates database tables on startup.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import exec_router, iot_router, procurement_router

# Import models so SQLAlchemy registers them before create_all
import app.models.exec_model          # noqa: F401
import app.models.iot_model           # noqa: F401
import app.models.procurement_model   # noqa: F401

app = FastAPI(
    title="OmniStream-API",
    description=(
        "Production-grade modular backend for executive workflow tracking, "
        "IoT telemetry monitoring, and CapEx procurement management."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(exec_router.router)
app.include_router(iot_router.router)
app.include_router(procurement_router.router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def create_tables():
    """Create all database tables if they don't exist yet."""
    Base.metadata.create_all(bind=engine)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    """Liveness probe — returns 200 when the service is running."""
    return {"status": "ok", "service": "OmniStream-API"}


@app.get("/", tags=["System"])
def root():
    return {
        "service": "OmniStream-API",
        "version": "1.0.0",
        "docs": "/docs",
        "modules": ["/exec", "/iot", "/procurement"],
    }
