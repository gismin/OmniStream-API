# OmniStream-API — API Testing Guide

## 1. Start the Server

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Server runs at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

---

## 2. System Endpoints

### GET /health — Liveness check

**Request:**
```bash
curl http://localhost:8000/health
```

**Expected response (200):**
```json
{
  "status": "ok",
  "service": "OmniStream-API"
}
```

---

### GET / — Root info

**Request:**
```bash
curl http://localhost:8000/
```

**Expected response (200):**
```json
{
  "service": "OmniStream-API",
  "version": "1.0.0",
  "docs": "/docs",
  "modules": ["/exec", "/iot", "/procurement"]
}
```

---

## 3. /exec — Executive Workflow Endpoints

### TC-E01: Create a workflow (Draft)

**Request:**
```bash
curl -X POST http://localhost:8000/exec/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q3 Budget Review",
    "description": "Review and finalize Q3 budget allocation",
    "owner": "alice@company.com"
  }'
```

**Expected response (201):**
```json
{
  "id": 1,
  "title": "Q3 Budget Review",
  "description": "Review and finalize Q3 budget allocation",
  "owner": "alice@company.com",
  "status": "draft",
  "created_at": "2026-04-20T10:00:00",
  "updated_at": "2026-04-20T10:00:00"
}
```
**Verify:** `status` is always `"draft"` on creation regardless of any input.

---

### TC-E02: List all workflows

**Request:**
```bash
curl http://localhost:8000/exec/
```

**Expected response (200):** Array of workflow objects, newest first.

---

### TC-E03: Get a single workflow

**Request:**
```bash
curl http://localhost:8000/exec/1
```

**Expected response (200):** Single workflow object.

**Error case — non-existent ID:**
```bash
curl http://localhost:8000/exec/999
```
**Expected (404):**
```json
{ "detail": "Workflow 999 not found" }
```

---

### TC-E04: Update a workflow

**Request:**
```bash
curl -X PUT http://localhost:8000/exec/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q3 Budget Review — Final",
    "owner": "bob@company.com"
  }'
```

**Expected response (200):** Updated workflow with new `updated_at` timestamp.

---

### TC-E05: Valid status transition — Draft → Review

**Request:**
```bash
curl -X PATCH http://localhost:8000/exec/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "review" }'
```

**Expected response (200):** Workflow with `"status": "review"`.

---

### TC-E06: Valid status transition — Review → Approved

**Request:**
```bash
curl -X PATCH http://localhost:8000/exec/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'
```

**Expected response (200):** Workflow with `"status": "approved"`.

---

### TC-E07: Invalid transition — Approved → Draft (blocked)

**Request:**
```bash
curl -X PATCH http://localhost:8000/exec/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "draft" }'
```

**Expected response (400):**
```json
{
  "detail": "Cannot transition from 'approved' to 'draft'. Allowed transitions: none (terminal state)"
}
```
**Verify:** Terminal states (approved, rejected) cannot be reversed.

---

### TC-E08: Invalid transition — Draft → Approved (skip review)

**Request:**
```bash
# First create a fresh workflow
curl -X POST http://localhost:8000/exec/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Skip Test", "owner": "test@co.com"}'

# Then try to jump straight to approved
curl -X PATCH http://localhost:8000/exec/2/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'
```

**Expected response (400):**
```json
{
  "detail": "Cannot transition from 'draft' to 'approved'. Allowed transitions: ['review']"
}
```

---

### TC-E09: Delete a workflow

**Request:**
```bash
curl -X DELETE http://localhost:8000/exec/2
```

**Expected response:** `204 No Content` (empty body).

---

## 4. /iot — Telemetry Endpoints

### TC-I01: Ingest a Normal reading

**Request:**
```bash
curl -X POST http://localhost:8000/iot/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "machine-001",
    "device_name": "Pump Station A",
    "temperature": 65.0,
    "pressure": 70.0,
    "vibration": 3.0
  }'
```

**Expected response (201):**
```json
{
  "id": 1,
  "device_id": "machine-001",
  "device_name": "Pump Station A",
  "temperature": 65.0,
  "pressure": 70.0,
  "vibration": 3.0,
  "status": "normal",
  "timestamp": "2026-04-20T10:05:00"
}
```
**Verify:** All sensors below warning thresholds → `"status": "normal"`.

---

### TC-I02: Ingest a Warning reading (temperature at threshold)

**Request:**
```bash
curl -X POST http://localhost:8000/iot/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "machine-001",
    "device_name": "Pump Station A",
    "temperature": 80.0,
    "pressure": 70.0,
    "vibration": 3.0
  }'
```

**Expected response (201):** `"status": "warning"`
**Verify:** `temperature >= 75` triggers warning even if pressure and vibration are normal.

---

### TC-I03: Ingest a Critical reading

**Request:**
```bash
curl -X POST http://localhost:8000/iot/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "machine-002",
    "device_name": "Compressor B",
    "temperature": 95.0,
    "pressure": 98.0,
    "vibration": 9.5
  }'
```

**Expected response (201):** `"status": "critical"`
**Verify:** Any sensor at or above critical threshold → `"status": "critical"`.

---

### TC-I04: Status computed server-side (client cannot override)

Notice there is **no** `status` field in the POST body — the server always computes it.
Sending an extra `"status"` field is silently ignored by Pydantic (extra fields are stripped).

---

### TC-I05: List all readings

**Request:**
```bash
curl http://localhost:8000/iot/
```

**Expected response (200):** Array of readings, newest first.

---

### TC-I06: Get device history

**Request:**
```bash
curl http://localhost:8000/iot/device/machine-001
```

**Expected response (200):** All readings for `machine-001`, newest first.

**Error case — unknown device:**
```bash
curl http://localhost:8000/iot/device/does-not-exist
```
**Expected (404):**
```json
{ "detail": "No readings found for device 'does-not-exist'" }
```

---

### TC-I07: Delete a reading

**Request:**
```bash
curl -X DELETE http://localhost:8000/iot/1
```

**Expected response:** `204 No Content`.

---

## 5. /procurement — CapEx Endpoints

### TC-P01: Submit a request BELOW the CEO threshold

**Request:**
```bash
curl -X POST http://localhost:8000/procurement/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Office Chairs",
    "description": "Ergonomic chairs for engineering floor",
    "requester": "hr@company.com",
    "department": "HR",
    "cost": 12000.00
  }'
```

**Expected response (201):**
```json
{
  "id": 1,
  "title": "Office Chairs",
  "requester": "hr@company.com",
  "department": "HR",
  "cost": 12000.0,
  "status": "pending",
  "requires_ceo_signoff": false,
  "created_at": "2026-04-20T10:10:00",
  "updated_at": "2026-04-20T10:10:00"
}
```
**Verify:** `cost (12,000) ≤ 50,000` → `requires_ceo_signoff: false`.

---

### TC-P02: ★ CEO Auto-Flag — Submit request ABOVE threshold

**Request:**
```bash
curl -X POST http://localhost:8000/procurement/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CNC Milling Machine",
    "description": "Industrial CNC machine for production line upgrade",
    "requester": "ops@company.com",
    "department": "Operations",
    "cost": 125000.00
  }'
```

**Expected response (201):**
```json
{
  "id": 2,
  "title": "CNC Milling Machine",
  "requester": "ops@company.com",
  "department": "Operations",
  "cost": 125000.0,
  "status": "pending",
  "requires_ceo_signoff": true,
  "created_at": "2026-04-20T10:11:00",
  "updated_at": "2026-04-20T10:11:00"
}
```
**Verify:** `cost (125,000) > 50,000` → `requires_ceo_signoff: true`. ★ This is the core business rule.

---

### TC-P03: ★ CEO Flag — Exact boundary (cost = 50,000)

**Request:**
```bash
curl -X POST http://localhost:8000/procurement/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Boundary Test",
    "requester": "test@co.com",
    "department": "Test",
    "cost": 50000.00
  }'
```

**Expected response (201):** `requires_ceo_signoff: false`
**Verify:** The rule is `cost > 50,000` (strictly greater than), so exactly 50,000 does NOT trigger the flag.

---

### TC-P04: ★ CEO Flag — Recalculated on cost update

**Request:**
```bash
# Update the "Office Chairs" (id=1, cost was 12,000) to exceed the threshold
curl -X PUT http://localhost:8000/procurement/1 \
  -H "Content-Type: application/json" \
  -d '{ "cost": 75000.00 }'
```

**Expected response (200):**
```json
{
  "id": 1,
  "cost": 75000.0,
  "requires_ceo_signoff": true,
  ...
}
```
**Verify:** Flag recalculates automatically on cost update.

---

### TC-P05: List all requests

**Request:**
```bash
curl http://localhost:8000/procurement/
```

**Expected response (200):** Array of requests, newest first.

---

### TC-P06: Approve a pending request

**Request:**
```bash
curl -X PATCH http://localhost:8000/procurement/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'
```

**Expected response (200):** Request with `"status": "approved"`.

---

### TC-P07: Reject a pending request

**Request:**
```bash
curl -X PATCH http://localhost:8000/procurement/2/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "rejected" }'
```

**Expected response (200):** Request with `"status": "rejected"`.

---

### TC-P08: Cannot action an already-actioned request

**Request:**
```bash
# Try to approve request 1 again (already approved in TC-P06)
curl -X PATCH http://localhost:8000/procurement/1/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'
```

**Expected response (400):**
```json
{
  "detail": "Request is already 'approved'. Only pending requests can be actioned."
}
```

---

### TC-P09: Validation — cost must be positive

**Request:**
```bash
curl -X POST http://localhost:8000/procurement/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bad Request",
    "requester": "x@co.com",
    "department": "X",
    "cost": -500
  }'
```

**Expected response (422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "type": "greater_than",
      "loc": ["body", "cost"],
      "msg": "Input should be greater than 0"
    }
  ]
}
```

---

### TC-P10: Delete a request

**Request:**
```bash
curl -X DELETE http://localhost:8000/procurement/3
```

**Expected response:** `204 No Content`.

---

## 6. Full Test Run Checklist

Run through these in order after starting the server:

| # | Test | Endpoint | Key Assertion |
|---|------|----------|---------------|
| 1 | Health check | `GET /health` | `status: ok` |
| 2 | Create workflow | `POST /exec/` | `status: draft` |
| 3 | Draft → Review | `PATCH /exec/1/status` | `status: review` |
| 4 | Review → Approved | `PATCH /exec/1/status` | `status: approved` |
| 5 | Block approved → draft | `PATCH /exec/1/status` | `400` error |
| 6 | Block draft → approved | `PATCH /exec/2/status` | `400` error |
| 7 | Ingest normal IoT | `POST /iot/` | `status: normal` |
| 8 | Ingest warning IoT | `POST /iot/` | `status: warning` |
| 9 | Ingest critical IoT | `POST /iot/` | `status: critical` |
| 10 | Device history | `GET /iot/device/machine-001` | returns array |
| 11 | Low-cost procurement | `POST /procurement/` cost=12000 | `ceo_signoff: false` |
| 12 | ★ High-cost procurement | `POST /procurement/` cost=125000 | `ceo_signoff: true` |
| 13 | ★ Boundary test | `POST /procurement/` cost=50000 | `ceo_signoff: false` |
| 14 | ★ Cost update recalc | `PUT /procurement/1` cost=75000 | `ceo_signoff: true` |
| 15 | Approve request | `PATCH /procurement/1/status` | `status: approved` |
| 16 | Block re-approval | `PATCH /procurement/1/status` | `400` error |
| 17 | Negative cost | `POST /procurement/` cost=-500 | `422` error |

---

## 7. Using Swagger UI (Recommended)

Instead of curl, you can run all tests interactively:

1. Start server: `uvicorn app.main:app --reload`
2. Open `http://localhost:8000/docs`
3. Click any endpoint → **Try it out** → fill in the body → **Execute**
4. Response body, status code, and headers are shown inline

The Swagger UI is automatically generated from the Pydantic schemas and FastAPI route definitions — no extra configuration needed.
