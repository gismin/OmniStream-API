"""
OmniStream-API — FastAPI application entry point.
Registers all routers, creates tables, and seeds default users on startup.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.routers import exec_router, iot_router, procurement_router, auth_router

import app.models.exec_model          # noqa: F401
import app.models.iot_model           # noqa: F401
import app.models.procurement_model   # noqa: F401
import app.models.user_model          # noqa: F401

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
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(exec_router.router)
app.include_router(iot_router.router)
app.include_router(procurement_router.router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_users()


def _seed_users():
    """Create default users if they don't exist yet."""
    from app.models.user_model import User, UserRole
    from app.auth.jwt import hash_password

    defaults = [
        {"username": "admin",     "password": "admin123",     "role": UserRole.admin},
        {"username": "operator",  "password": "operator123",  "role": UserRole.operator},
        {"username": "executive", "password": "executive123", "role": UserRole.executive},
    ]
    db = SessionLocal()
    try:
        for u in defaults:
            if not db.query(User).filter(User.username == u["username"]).first():
                db.add(User(
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                ))
        db.commit()
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "OmniStream-API"}


@app.get("/", tags=["System"])
def root():
    return {
        "service": "OmniStream-API",
        "version": "1.0.0",
        "docs": "/docs",
        "modules": ["/auth", "/exec", "/iot", "/procurement"],
    }
