# OmniStream-API — Deployment Guide

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────┐
│  Nginx (port 80) │  ← serves React SPA + proxies /api/ and /ws
│  Frontend        │
└────────┬────────┘
         │ proxy
         ▼
┌─────────────────┐
│  Gunicorn +     │  ← port 8000 (internal)
│  Uvicorn Workers│
│  FastAPI Backend│
└────────┬────────┘
         │ SQLAlchemy
         ▼
┌─────────────────┐
│  PostgreSQL 16  │  ← port 5432 (internal only)
│  persistent vol │
└─────────────────┘
```

---

## Option A — Local Development (No Docker)

### Requirements
- Python 3.12
- Node.js 20+

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# Start dev server
uvicorn app.main:app --reload
```
API running at: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard at: `http://localhost:5173`

### Default Users (auto-seeded)
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Full access |
| operator | operator123 | IoT + Exec |
| executive | executive123 | Procurement approval |

---

## Option B — Docker Compose (Recommended for Production)

### Requirements
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2

### Step 1 — Clone the repository
```bash
git clone https://github.com/gismin/OmniStream-API.git
cd OmniStream-API
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```

Edit `.env` and set secure values:
```env
POSTGRES_PASSWORD=your-secure-db-password
SECRET_KEY=your-32-char-minimum-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
```

### Step 3 — Build and start all services
```bash
docker compose up --build -d
```

This starts 3 containers:
| Container | Service | Port |
|-----------|---------|------|
| `omnistream_db` | PostgreSQL 16 | 5432 (internal) |
| `omnistream_backend` | FastAPI + Gunicorn | 8000 |
| `omnistream_frontend` | React + Nginx | 80 |

### Step 4 — Verify everything is running
```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS          PORTS
omnistream_db           Up (healthy)    5432/tcp
omnistream_backend      Up              0.0.0.0:8000->8000/tcp
omnistream_frontend     Up              0.0.0.0:80->80/tcp
```

### Step 5 — Open the dashboard
```
http://localhost
```

API docs:
```
http://localhost:8000/docs
```

---

## Useful Docker Commands

```bash
# View logs from all services
docker compose logs -f

# View logs from backend only
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and delete database volume (WARNING: deletes all data)
docker compose down -v

# Rebuild after code changes
docker compose up --build -d

# Run a command inside the backend container
docker compose exec backend bash

# Check database directly
docker compose exec db psql -U omnistream -d omnistream
```

---

## Updating to a New Version

```bash
git pull origin main
docker compose up --build -d
```

Docker will only rebuild containers that have changed.

---

## Production Checklist

Before going live, complete all of these:

- [ ] Change `SECRET_KEY` to a random 32+ character string
- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Set `ALLOWED_ORIGINS` to your actual domain
- [ ] Put Nginx behind a reverse proxy (Caddy or Nginx Proxy Manager) for HTTPS
- [ ] Enable SSL/TLS certificate (Let's Encrypt via Certbot)
- [ ] Set up database backups (pg_dump on a cron schedule)
- [ ] Remove or password-protect `/docs` and `/redoc` endpoints
- [ ] Change default user passwords via the API after first deploy

### Generate a secure SECRET_KEY
```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# PowerShell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLAlchemy connection string |
| `POSTGRES_DB` | Docker only | PostgreSQL database name |
| `POSTGRES_USER` | Docker only | PostgreSQL username |
| `POSTGRES_PASSWORD` | Docker only | PostgreSQL password |
| `SECRET_KEY` | Yes | JWT signing secret (min 32 chars) |
| `ALGORITHM` | No | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token TTL (default: 30) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Refresh token TTL (default: 7) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `VITE_API_BASE_URL` | Frontend | Backend URL for Axios |
| `VITE_WS_BASE_URL` | Frontend | Backend WebSocket URL |

---

## Troubleshooting

### Backend won't start — "ModuleNotFoundError"
Make sure you're running uvicorn from inside the `backend/` folder.

### "password cannot be longer than 72 bytes"
Your `SECRET_KEY` is being used as a password. Make sure passwords in `_seed_users()` are plain short strings, not the secret key.

### CORS errors in browser
Add your frontend URL to `ALLOWED_ORIGINS` in `.env` and restart the backend.

### WebSocket shows "Disconnected"
Ensure the backend is running and CORS allows the frontend origin. Check browser console for errors.

### Docker: "port already in use"
```bash
# Find what's using port 80
netstat -ano | findstr :80   # Windows
lsof -i :80                  # Mac/Linux
```
