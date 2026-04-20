# OmniStream-API — UI/UX Design Specification

## 1. Design Philosophy

- **Operational clarity** — status must be readable at a glance, no hunting
- **Data density** — show the right amount of information without overwhelming
- **Consistent patterns** — same interaction model across all three modules
- **Dark-friendly** — works well in both light and dark environments (ops dashboards often run 24/7)

---

## 2. Global Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                             │
│  [≡] OmniStream        [module title]          [user] [logout]      │
├────────────┬────────────────────────────────────────────────────────┤
│            │                                                        │
│  SIDEBAR   │  MAIN CONTENT AREA                                     │
│            │                                                        │
│  ◉ Exec    │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  ○ IoT     │  │  STAT    │ │  STAT    │ │  STAT    │  ← KPI cards  │
│  ○ Procure │  │  CARD    │ │  CARD    │ │  CARD    │              │
│            │  └──────────┘ └──────────┘ └──────────┘              │
│            │                                                        │
│            │  ┌──────────────────────────────────────────────────┐ │
│            │  │  DATA TABLE / PANEL                              │ │
│            │  │  [search] [filter] [+ New]                       │ │
│            │  │  ─────────────────────────────────────────────── │ │
│            │  │  row  row  row  row  row                         │ │
│            │  └──────────────────────────────────────────────────┘ │
│            │                                                        │
└────────────┴────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Sidebar: `w-56` (224px), fixed, never scrolls
- Topbar: `h-14` (56px), sticky
- Main area: fills remaining space, scrollable

---

## 3. Color System

Every status maps to a consistent color triple (background / text / border):

| Status | Meaning | Tailwind Classes | Hex Preview |
|--------|---------|-----------------|-------------|
| **Normal** | All sensors healthy | `bg-green-100 text-green-800 border-green-300` | 🟢 |
| **Warning** | At least one sensor elevated | `bg-yellow-100 text-yellow-800 border-yellow-300` | 🟡 |
| **Critical** | Sensor at dangerous level | `bg-red-100 text-red-800 border-red-300` | 🔴 |
| **Draft** | Workflow not yet submitted | `bg-gray-100 text-gray-600 border-gray-300` | ⚪ |
| **Review** | Workflow under evaluation | `bg-yellow-100 text-yellow-800 border-yellow-300` | 🟡 |
| **Approved** | Workflow or request approved | `bg-green-100 text-green-800 border-green-300` | 🟢 |
| **Rejected** | Workflow or request rejected | `bg-red-100 text-red-800 border-red-300` | 🔴 |
| **Pending** | Procurement awaiting action | `bg-blue-100 text-blue-800 border-blue-300` | 🔵 |
| **CEO Flag** | Requires CEO sign-off | `bg-orange-100 text-orange-800 border-orange-300` | 🟠 |

---

## 4. Component Library

### 4.1 StatusBadge

Reusable pill badge for all status values.

```
┌────────────┐
│ ● Approved │   ← dot + label, pill shape
└────────────┘
```

**Props:** `status: string`
**Variants:** normal | warning | critical | draft | review | approved | rejected | pending | ceo_flag

---

### 4.2 KPI Stat Card

Summary metric displayed at the top of each module.

```
┌─────────────────────┐
│  Total Workflows    │
│                     │
│       24            │  ← large number
│                     │
│  ↑ 3 this week      │  ← trend line (optional)
└─────────────────────┘
```

**Props:** `title`, `value`, `trend` (optional), `color` (optional accent)

---

### 4.3 Data Table

Standard table used in all three modules.

```
┌──────┬──────────────────┬──────────┬──────────┬───────────┐
│  ID  │  Title           │  Owner   │  Status  │  Actions  │
├──────┼──────────────────┼──────────┼──────────┼───────────┤
│  1   │  Q3 Budget Rev.. │  alice   │ ●Review  │ [Edit][▼] │
│  2   │  Headcount Plan  │  bob     │ ●Draft   │ [Edit][▼] │
└──────┴──────────────────┴──────────┴──────────┴───────────┘
```

**Features:**
- Sortable columns (click header)
- StatusBadge in status column
- Row hover highlight
- Truncate long text with tooltip
- Pagination (10 rows per page)

---

### 4.4 Modal — Create / Edit Form

Slides in from the right (drawer pattern) or centers as a dialog.

```
┌────────────────────────────────────────────┐
│  New Workflow                          [×] │
├────────────────────────────────────────────┤
│  Title *                                   │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Owner *                                   │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Description                               │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│            [Cancel]  [Create Workflow]      │
└────────────────────────────────────────────┘
```

---

### 4.5 Status Transition Dropdown (Exec only)

Inline dropdown on the workflow row to advance status.

```
Current: ● Review
         ┌──────────────┐
         │ → Approved   │
         │ → Rejected   │
         └──────────────┘
```

Only shows valid next states from `ALLOWED_TRANSITIONS`. Terminal states show a lock icon instead.

---

### 4.6 IoT Device Card

Card-per-device view for the IoT panel.

```
┌─────────────────────────────────────┐
│  Pump Station A          ● Critical │
│  machine-001                        │
├─────────────────────────────────────┤
│  🌡 Temperature   95.0°C   ████████ │
│  ⚡ Pressure      98.0 Bar  ███████ │
│  〰 Vibration     9.5 mm/s  ███████ │
├─────────────────────────────────────┤
│  Last updated: 2 minutes ago        │
└─────────────────────────────────────┘
```

Progress bars fill red when critical, yellow when warning, green when normal.

---

### 4.7 CEO Flag Badge

Special inline badge on procurement rows.

```
[🔺 CEO Sign-off Required]
```

Displayed in orange, only appears when `requires_ceo_signoff: true`.

---

### 4.8 Toast Notification

Appears bottom-right on create / update / error actions.

```
                    ┌────────────────────────────┐
                    │ ✓  Workflow created         │  ← green
                    └────────────────────────────┘

                    ┌────────────────────────────┐
                    │ ✕  Failed to connect to API │  ← red
                    └────────────────────────────┘
```

Auto-dismisses after 3 seconds.

---

## 5. Module Screens

### 5.1 Executive Dashboard (`/exec`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Executive Workflows                          [+ New Workflow]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Total      │  │ Draft      │  │ In Review  │  │ Approved │ │
│  │   24       │  │   8        │  │   11       │  │   5      │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search]  [Status ▼]                                        │
│                                                                 │
│  ID   Title              Owner     Status     Updated    Action │
│  ─────────────────────────────────────────────────────────────  │
│  12   Q3 Budget Review   alice     ●Review    2h ago     [···]  │
│  11   Headcount Plan     bob       ●Draft     1d ago     [···]  │
│  10   New Office Fit-out carol     ●Approved  3d ago     [···]  │
│  9    Vendor Evaluation  dave      ●Rejected  5d ago     [···]  │
└─────────────────────────────────────────────────────────────────┘
```

**[···] action menu:** Edit | Change Status | Delete

---

### 5.2 IoT Monitor (`/iot`)

```
┌─────────────────────────────────────────────────────────────────┐
│  IoT Telemetry                               [+ Log Reading]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Devices    │  │ Normal     │  │ Warning    │  │ Critical │ │
│  │   6        │  │   3        │  │   2        │  │   1      │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  [📋 Table View]  [🃏 Card View]  [Device ▼]                    │
│                                                                 │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │ Compressor B ●Critical│  │ Pump Station A ●Warning│         │
│  │ machine-002           │  │ machine-001            │         │
│  │ 🌡 95°C  ████████████ │  │ 🌡 80°C  ████████░░░░ │         │
│  │ ⚡ 98Bar ████████████ │  │ ⚡ 70Bar ███████░░░░░ │         │
│  │ 〰 9.5   ████████████ │  │ 〰 3.0   ████░░░░░░░░ │         │
│  │ 2 min ago             │  │ 5 min ago              │         │
│  └───────────────────────┘  └───────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**View toggle:** Card view (default for quick health scan) / Table view (for history/sorting).

---

### 5.3 Procurement Panel (`/procurement`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Procurement Requests                     [+ New Request]       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Total    │  │ Pending  │  │ Approved │  │ CEO Sign-off  │  │
│  │  18      │  │  7       │  │  9       │  │  3 required   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search]  [Status ▼]  [CEO Flag ▼]                          │
│                                                                 │
│  ID  Title              Dept    Cost         Status    CEO  Act │
│  ──────────────────────────────────────────────────────────────│
│  5   CNC Milling Mach.  Ops   $125,000.00  ●Pending  🔺  [···] │
│  4   Server Upgrade     IT     $78,000.00  ●Pending  🔺  [···] │
│  3   Office Chairs      HR     $12,000.00  ●Approved  -  [···] │
│  2   Forklift Repair    Ops    $8,500.00   ●Rejected  -  [···] │
└─────────────────────────────────────────────────────────────────┘
```

🔺 = CEO sign-off required badge, shown only on flagged rows.
**[···] action menu:** View | Approve | Reject | Delete

---

## 6. User Flows

### 6.1 Create a New Workflow

```
User clicks [+ New Workflow]
     │
     ▼
Modal opens with empty form
     │
     ▼
User fills: Title, Owner, Description (optional)
     │
     ▼
User clicks [Create Workflow]
     │
     ├─ Validation error → highlight field, show error text
     │
     └─ Success → modal closes, table refreshes, toast "✓ Workflow created"
                  New row appears at top with status ● Draft
```

### 6.2 Advance a Workflow Status

```
User clicks [···] on a workflow row → "Change Status"
     │
     ▼
Dropdown shows only valid next states
  (draft → Review only)
  (review → Approved | Rejected)
  (approved/rejected → greyed out "Terminal")
     │
     ▼
User selects next state
     │
     ├─ API error → toast "✕ Transition failed"
     │
     └─ Success → StatusBadge updates in-place, toast "✓ Status updated"
```

### 6.3 Ingest an IoT Reading

```
User clicks [+ Log Reading]
     │
     ▼
Modal opens: Device ID, Device Name, Temperature, Pressure, Vibration
     │
     ▼
User submits
     │
     ▼
Server computes status automatically
     │
     ├─ status = critical → new card appears with red border + alert tone
     ├─ status = warning  → new card appears with yellow border
     └─ status = normal   → new card appears with green border
     
Toast: "✓ Reading logged — Status: Critical" (with colored dot)
```

### 6.4 Submit a Procurement Request

```
User clicks [+ New Request]
     │
     ▼
Modal opens: Title, Description, Requester, Department, Cost
     │
     ▼
User enters cost
     │
     ▼ (client-side preview hint)
If cost > 50,000:
  Show inline hint: "⚠ This request will require CEO sign-off"
     │
     ▼
User submits → API creates request
     │
     ├─ requires_ceo_signoff: true  → row appears with 🔺 badge
     └─ requires_ceo_signoff: false → row appears without badge

Toast: "✓ Request submitted"
```

### 6.5 Approve / Reject a Procurement Request

```
User clicks [···] → "Approve" or "Reject"
     │
     ▼
Confirmation dialog: "Approve this request for $125,000?"
     │
     ▼
User confirms
     │
     ├─ Success → StatusBadge changes to ● Approved / ● Rejected
     │            Action menu no longer shows Approve/Reject (terminal)
     └─ Error   → toast "✕ Could not update request"
```

---

## 7. Responsive Behavior

| Breakpoint | Layout Change |
|-----------|--------------|
| `lg` (≥1024px) | Full sidebar + main content (default) |
| `md` (768–1023px) | Sidebar collapses to icon-only strip |
| `sm` (<768px) | Sidebar hidden, hamburger menu opens drawer |

---

## 8. React Component Tree

```
App
├── Layout
│   ├── Topbar
│   │   ├── HamburgerButton (mobile)
│   │   ├── PageTitle
│   │   └── UserMenu
│   ├── Sidebar
│   │   └── NavItem × 3  (Exec, IoT, Procurement)
│   └── MainContent
│       ├── ExecPage
│       │   ├── StatCardRow
│       │   │   └── StatCard × 4
│       │   ├── WorkflowTable
│       │   │   ├── TableFilters
│       │   │   └── TableRow → StatusBadge + ActionMenu
│       │   └── WorkflowModal (create/edit)
│       ├── IoTPage
│       │   ├── StatCardRow
│       │   │   └── StatCard × 4
│       │   ├── ViewToggle (Card | Table)
│       │   ├── DeviceCardGrid
│       │   │   └── DeviceCard → StatusBadge + SensorBar × 3
│       │   └── IoTModal (log reading)
│       └── ProcurementPage
│           ├── StatCardRow
│           │   └── StatCard × 4
│           ├── ProcurementTable
│           │   ├── TableFilters
│           │   └── TableRow → StatusBadge + CeoFlagBadge + ActionMenu
│           └── ProcurementModal (create/edit)
│
├── StatusBadge          (shared)
├── StatCard             (shared)
├── ActionMenu           (shared)
├── ConfirmDialog        (shared)
└── ToastNotification    (shared)
```

---

## 9. Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Routing | React Router v6 | Standard, file-based routes |
| State | React `useState` + `useEffect` | No Redux needed at this scale |
| HTTP | Axios | Interceptors for auth headers (Phase 7) |
| Styling | Tailwind CSS | Utility-first, no CSS files |
| Icons | Heroicons (React) | Consistent with Tailwind ecosystem |
| Toasts | react-hot-toast | Minimal, easy API |
| Build | Vite | Fast HMR, ESM-native |
