# OmniStream-API — Project Scope (Phase 0)

## 1. Project Overview

OmniStream-API is a modular, production-grade backend built with FastAPI and a React dashboard frontend. It serves three operational domains within a company: executive workflow management, IoT machine monitoring, and capital expenditure procurement tracking.

---

## 2. Modules

### 2.1 `/exec` — Executive Workflow Tracker

**Purpose:** Track and manage strategic work items through a defined approval pipeline.

**Status machine:**
```
Draft ──► Review ──► Approved
                └──► Rejected (optional extension)
```

**Key fields:** title, description, owner, status, created_at, updated_at

**Endpoints (CRUD + status transition):**
- `GET /exec/` — list all workflows
- `POST /exec/` — create new workflow (starts as Draft)
- `GET /exec/{id}` — get single workflow
- `PUT /exec/{id}` — update workflow
- `PATCH /exec/{id}/status` — transition status
- `DELETE /exec/{id}` — delete workflow

---

### 2.2 `/iot` — IoT Telemetry Monitor

**Purpose:** Ingest and query machine sensor data. Flag anomalies.

**Status logic:**
```
temperature / pressure / vibration reading
    < threshold_warn  → Normal
    < threshold_crit  → Warning
    ≥ threshold_crit  → Critical
```

**Key fields:** device_id, device_name, temperature, pressure, vibration, status, timestamp

**Endpoints:**
- `GET /iot/` — list all device readings
- `POST /iot/` — ingest new telemetry record
- `GET /iot/{id}` — get single record
- `GET /iot/device/{device_id}` — get history for a device
- `DELETE /iot/{id}` — delete record
- `WS /iot/ws` — WebSocket stream (Phase 7)

---

### 2.3 `/procurement` — CapEx Request Management

**Purpose:** Manage capital expenditure requests. Auto-escalate large purchases.

**CEO auto-flag rule:**
```
if cost > 50,000 → requires_ceo_signoff = True
```

**Status flow:**
```
Pending ──► Approved
        └──► Rejected
```

**Key fields:** title, description, requester, cost, department, status, requires_ceo_signoff, created_at

**Endpoints:**
- `GET /procurement/` — list all requests
- `POST /procurement/` — submit new request (auto-flags if cost > 50k)
- `GET /procurement/{id}` — get single request
- `PUT /procurement/{id}` — update request
- `PATCH /procurement/{id}/status` — approve / reject
- `DELETE /procurement/{id}` — delete request

---

## 3. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend framework | FastAPI | Async, OpenAPI auto-docs |
| ORM | SQLAlchemy | Declarative models |
| DB (dev) | SQLite | File-based, zero config |
| DB (prod) | PostgreSQL | Via same SQLAlchemy URL |
| Validation | Pydantic v2 | Schema layer |
| Auth | JWT (python-jose) | Access + Refresh tokens |
| RBAC | Custom dependency | admin / operator / executive |
| Realtime | WebSockets | FastAPI native |
| Frontend | React + Vite | SPA |
| Styling | Tailwind CSS | Utility-first |
| HTTP client | Axios | Frontend ↔ Backend |
| Containerization | Docker + docker-compose | Backend + Frontend + DB |
| WSGI/ASGI server | Uvicorn + Gunicorn | Production serving |

---

## 4. Roles & Permissions

| Role | `/exec` | `/iot` | `/procurement` |
|------|---------|--------|----------------|
| `admin` | Full CRUD | Full CRUD | Full CRUD |
| `operator` | Read + Write | Read + Write | Read only |
| `executive` | Read only | Read only | Approve / Reject |

---

## 5. Non-Functional Requirements

- All endpoints return consistent JSON envelopes
- Errors return structured `{"detail": "..."}` responses
- Auto-generated OpenAPI docs at `/docs` (Swagger) and `/redoc`
- Health check endpoint at `GET /health`
- CORS configured for local dev and production origins
- Environment variables via `.env` (never hardcoded secrets)

---

## 6. Build Phases

| Phase | Description |
|-------|-------------|
| 0 | Project scope (this document) |
| 1 | Full FastAPI backend — models, schemas, routers |
| 2 | Architecture documentation |
| 3 | API testing documentation + endpoint verification |
| 4 | UI/UX design specification |
| 5 | React + Tailwind frontend |
| 6 | Frontend ↔ Backend REST integration |
| 7 | WebSockets + JWT auth + RBAC |
| 8 | Docker + docker-compose + deployment guide |
