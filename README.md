# OmniStream-API

A production-ready FastAPI + React full-stack system for strategic operations management.

## Modules

- `/exec` — Strategic workflow tracking (Draft → Review → Approved)
- `/iot` — Machine telemetry monitoring (Normal / Warning / Critical)
- `/procurement` — CapEx request management (CEO auto-flag if cost > $50,000)

## Build Progress

- [x] Phase 0 — Project Understanding
- [x] Phase 1 — Backend Generation
- [x] Phase 2 — Architecture Understanding
- [x] Phase 3 — API Testing
- [x] Phase 4 — UI/UX Design
- [x] Phase 5 — Frontend Development
- [ ] Phase 6 — Backend Integration
- [ ] Phase 7 — Advanced Features
- [ ] Phase 8 — Deployment

## Stack

FastAPI · SQLAlchemy · SQLite/PostgreSQL · React · Tailwind CSS · JWT · WebSockets · Docker

## Folder Structure

```
OmniStream-API/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── exec_model.py
│   │   │   ├── iot_model.py
│   │   │   └── procurement_model.py
│   │   ├── schemas/
│   │   │   ├── exec_schema.py
│   │   │   ├── iot_schema.py
│   │   │   └── procurement_schema.py
│   │   └── routers/
│   │       ├── exec_router.py
│   │       ├── iot_router.py
│   │       └── procurement_router.py
│   └── requirements.txt
├── frontend/
│   └── (React app — Phase 5)
├── docker/
│   └── (Docker config — Phase 8)
├── .env.example
└── README.md
```

## Module Logic

| Module | Status Flow | Special Logic |
|--------|------------|---------------|
| `/exec` | Draft → Review → Approved | Workflow state machine |
| `/iot` | Normal / Warning / Critical | Real-time telemetry via WebSocket |
| `/procurement` | Pending → Approved / Rejected | Auto-flag `requires_ceo_signoff` if `cost > 50000` |

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (Phase 5+)
cd frontend
npm install
npm run dev
```

## License

MIT
