# OmniStream-API — Architecture Documentation

## 1. System Overview

OmniStream-API is a **modular monolith** — a single FastAPI process that hosts three independent
business domains (exec, iot, procurement), each with its own models, schemas, and router.
The backend exposes a REST API consumed by the React frontend, and will expose a WebSocket
endpoint for real-time IoT streaming (Phase 7).

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              React + Tailwind CSS Dashboard                 │   │
│   │   Sidebar: Exec | IoT | Procurement                         │   │
│   │   HTTP (Axios/Fetch)          WebSocket (Phase 7)           │   │
│   └──────────────────┬──────────────────────┬───────────────────┘   │
└──────────────────────┼──────────────────────┼───────────────────────┘
                       │ REST (HTTP/JSON)      │ WS
                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FASTAPI APPLICATION                          │
│                        backend/app/main.py                          │
│                                                                     │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│   │  CORS        │   │  Startup     │   │  OpenAPI /docs       │   │
│   │  Middleware  │   │  create_all()│   │  /redoc              │   │
│   └──────────────┘   └──────────────┘   └──────────────────────┘   │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                      ROUTER LAYER                            │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │  │
│   │  │ exec_router │  │ iot_router  │  │ procurement_router   │ │  │
│   │  │ /exec       │  │ /iot        │  │ /procurement         │ │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘ │  │
│   └─────────┼────────────────┼─────────────────────┼────────────┘  │
│             │                │                     │               │
│   ┌─────────▼────────────────▼─────────────────────▼────────────┐  │
│   │                      SCHEMA LAYER (Pydantic v2)              │  │
│   │   exec_schema    │   iot_schema    │   procurement_schema    │  │
│   │   Validate In    │   Validate In   │   Validate In           │  │
│   │   Serialize Out  │   Serialize Out │   Serialize Out         │  │
│   └─────────┬────────────────┬─────────────────────┬────────────┘  │
│             │                │                     │               │
│   ┌─────────▼────────────────▼─────────────────────▼────────────┐  │
│   │                      MODEL LAYER (SQLAlchemy ORM)            │  │
│   │   ExecWorkflow   │   IoTReading    │   ProcurementRequest    │  │
│   └─────────┬────────────────┬─────────────────────┬────────────┘  │
└─────────────┼────────────────┼─────────────────────┼───────────────┘
              │                │                     │
              ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                              │
│                       backend/app/database.py                       │
│                                                                     │
│   SQLite (dev)  ←──── DATABASE_URL env var ────►  PostgreSQL (prod) │
│   omnistream.db                                   pg://...          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Responsibilities

### Entry Point

| File | Responsibility |
|------|---------------|
| `backend/app/main.py` | Creates the FastAPI app instance. Registers all routers. Applies CORS middleware. Runs `Base.metadata.create_all()` on startup to initialize tables. Exposes `/health` and `/` system endpoints. |
| `backend/app/database.py` | Creates the SQLAlchemy engine from `DATABASE_URL`. Defines `SessionLocal` (session factory). Exposes `get_db()` — a FastAPI dependency that opens a DB session per request and closes it after. Defines `Base` (the declarative base all models inherit from). |

### Models — `backend/app/models/`

| File | Table | Responsibility |
|------|-------|---------------|
| `exec_model.py` | `exec_workflows` | Defines `ExecWorkflow` ORM model and `ExecStatus` enum (draft/review/approved/rejected). |
| `iot_model.py` | `iot_readings` | Defines `IoTReading` ORM model and `IoTStatus` enum (normal/warning/critical). Indexed on `device_id` and `timestamp` for query performance. |
| `procurement_model.py` | `procurement_requests` | Defines `ProcurementRequest` ORM model and `ProcurementStatus` enum. Holds `CEO_SIGNOFF_THRESHOLD = 50_000` constant. |

### Schemas — `backend/app/schemas/`

| File | Responsibility |
|------|---------------|
| `exec_schema.py` | `ExecWorkflowCreate` (input), `ExecWorkflowUpdate` (partial update), `ExecWorkflowResponse` (output), `ExecStatusUpdate` (PATCH body). |
| `iot_schema.py` | `IoTReadingCreate` (input), `IoTReadingResponse` (output). Defines sensor threshold constants used by the router. |
| `procurement_schema.py` | `ProcurementRequestCreate`, `ProcurementRequestUpdate`, `ProcurementRequestResponse`, `ProcurementStatusUpdate`. |

### Routers — `backend/app/routers/`

| File | Prefix | Key Business Logic |
|------|--------|--------------------|
| `exec_router.py` | `/exec` | Enforces status state machine via `ALLOWED_TRANSITIONS` dict. Rejects invalid transitions with descriptive 400 errors. |
| `iot_router.py` | `/iot` | `_compute_status()` derives Normal/Warning/Critical from sensor values on every ingest — clients cannot set status directly. |
| `procurement_router.py` | `/procurement` | Auto-sets `requires_ceo_signoff = True` when `cost > 50,000`. Recalculates the flag if cost is updated via PUT. |

---

## 4. Request Lifecycle

Every API call follows this path:

```
Client Request
     │
     ▼
FastAPI receives HTTP request
     │
     ▼
CORS Middleware
  └─ Checks Origin header against ALLOWED_ORIGINS
  └─ Adds Access-Control headers to response
     │
     ▼
Router matches path + method
  e.g. POST /procurement/ → procurement_router.create_request()
     │
     ▼
Pydantic Schema validates request body
  └─ Type coercion, field validation (min_length, gt=0, etc.)
  └─ Returns 422 Unprocessable Entity if validation fails
     │
     ▼
get_db() dependency injects DB session
  └─ Opens SessionLocal()
  └─ Yields session to route handler
  └─ Closes session in finally block after response
     │
     ▼
Route handler executes business logic
  └─ e.g. sets requires_ceo_signoff if cost > 50,000
  └─ Constructs ORM model instance
  └─ db.add() → db.commit() → db.refresh()
     │
     ▼
SQLAlchemy translates ORM calls → SQL
  └─ INSERT / SELECT / UPDATE / DELETE
  └─ Executed against SQLite (dev) or PostgreSQL (prod)
     │
     ▼
ORM instance returned to route handler
     │
     ▼
Pydantic Response Schema serializes ORM → JSON
  └─ model_config = {"from_attributes": True}
     │
     ▼
FastAPI sends HTTP Response (JSON)
     │
     ▼
Client receives response
```

---

## 5. Module Data Flow

### `/exec` — State Machine Flow

```
POST /exec/                    → Creates workflow, status = draft
PATCH /exec/{id}/status        → Transitions status
  draft    ──► review
  review   ──► approved
  review   ──► rejected
  approved ──► (terminal, no further transitions)
  rejected ──► (terminal, no further transitions)
```

### `/iot` — Telemetry Ingest Flow

```
POST /iot/   (device_id, temperature, pressure, vibration)
     │
     ▼
_compute_status(temp, pressure, vibration)
     │
     ├─ any sensor ≥ critical threshold → status = critical
     ├─ any sensor ≥ warning threshold  → status = warning
     └─ all sensors below warning       → status = normal
     │
     ▼
IoTReading saved with computed status
```

Thresholds:

| Sensor | Warning | Critical |
|--------|---------|----------|
| Temperature (°C) | ≥ 75 | ≥ 90 |
| Pressure (Bar) | ≥ 80 | ≥ 95 |
| Vibration (mm/s) | ≥ 5 | ≥ 8 |

### `/procurement` — CEO Auto-Flag Flow

```
POST /procurement/   (cost = X)
     │
     ├─ cost > 50,000 → requires_ceo_signoff = True
     └─ cost ≤ 50,000 → requires_ceo_signoff = False
     │
     ▼
PUT /procurement/{id}   (cost updated)
     │
     └─ CEO flag recalculated automatically
     │
     ▼
PATCH /procurement/{id}/status
     └─ pending → approved | rejected  (only)
```

---

## 6. Database Schema

```sql
-- exec_workflows
CREATE TABLE exec_workflows (
    id          INTEGER PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    owner       VARCHAR(100) NOT NULL,
    status      VARCHAR NOT NULL DEFAULT 'draft',  -- ExecStatus enum
    created_at  DATETIME,
    updated_at  DATETIME
);

-- iot_readings
CREATE TABLE iot_readings (
    id          INTEGER PRIMARY KEY,
    device_id   VARCHAR(100) NOT NULL,   -- indexed
    device_name VARCHAR(255) NOT NULL,
    temperature FLOAT NOT NULL,
    pressure    FLOAT NOT NULL,
    vibration   FLOAT NOT NULL,
    status      VARCHAR NOT NULL,        -- IoTStatus enum
    timestamp   DATETIME                 -- indexed
);

-- procurement_requests
CREATE TABLE procurement_requests (
    id                  INTEGER PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    requester           VARCHAR(100) NOT NULL,
    department          VARCHAR(100) NOT NULL,
    cost                FLOAT NOT NULL,
    status              VARCHAR NOT NULL DEFAULT 'pending',
    requires_ceo_signoff BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          DATETIME,
    updated_at          DATETIME
);
```

---

## 7. Environment Configuration

| Variable | Used By | Default |
|----------|---------|---------|
| `DATABASE_URL` | `database.py` | `sqlite:///./omnistream.db` |
| `ALLOWED_ORIGINS` | `main.py` CORS | `http://localhost:5173,http://localhost:3000` |
| `SECRET_KEY` | JWT (Phase 7) | — |
| `ALGORITHM` | JWT (Phase 7) | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT (Phase 7) | `30` |
| `VITE_API_BASE_URL` | React frontend | `http://localhost:8000` |
| `VITE_WS_BASE_URL` | React frontend (WS) | `ws://localhost:8000` |

---

## 8. Phase 7 Extensions (Preview)

The following will be added without breaking the current architecture:

- **WebSocket endpoint** — `GET /iot/ws` added to `iot_router.py`. A `ConnectionManager` class will broadcast new telemetry to all connected clients.
- **JWT Auth** — A new `auth_router.py` and `dependencies/auth.py` module. A `get_current_user` FastAPI dependency will wrap protected routes.
- **RBAC** — A `dependencies/roles.py` module with `require_role(*roles)` dependency factory injected per-router.
