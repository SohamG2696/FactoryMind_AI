# FactoryMind AI — Implementation Status

> Snapshot of what is actually built and working, as of the latest commit.
> Everything listed here has code paths that run end-to-end; unbuilt ideas
> live in the `Roadmap` section at the bottom.

## 1. Architecture at a glance

```
┌────────────────────────────────────────────────────────────────┐
│                     factorymind-next  (Next.js 16)             │
│                                                                │
│   Pages ─┬─  /                       (landing)                 │
│          ├─  /dashboard              (role-based SPA)          │
│          ├─  /simulation             (live factory sim)        │
│          └─  /manpower               (workforce allocation)    │
│                                                                │
│   Server routes  ── /api/users /api/seed /api/manpower         │
│                     /api/inbox /api/agent /api/chat            │
│                     /api/predict /api/health                   │
└──────────────┬────────────────────────────────┬────────────────┘
               │                                │
               ▼                                ▼
     ┌────────────────────┐         ┌────────────────────────┐
     │   MongoDB Atlas    │         │  ml_models  (Python)   │
     │  factorymind DB    │         │  FastAPI :8000         │
     │                    │         │                        │
     │  users             │         │  best_pm_model.pkl     │
     │  machines          │         │    (LightGBM · PM)     │
     │  inbox_messages    │         │  factory_model.pkl     │
     │  agent_reports     │         │    (Random Forest · Op │
     └────────────────────┘         │     Status)            │
                                    │  cli_predict.py fallback│
                                    └────────────────────────┘
```

**Stack:** Next.js 16 · React 19 · TypeScript 5 · MongoDB 6/Atlas · Python 3
· FastAPI · scikit-learn · LightGBM · Chart.js · FontAwesome · Groq API (optional)

**Themes:** UralMebel-inspired warm palette (`#F0EBE0` cream · `#FF5A1F`
orange · muted forest/amber/rust status colors) applied globally via CSS
variables at `:root`.

---

## 2. Pages that exist

### `/` — Landing
- Hero, ML model showcase, agent architecture callout
- Sign-in gateway into `/dashboard`

### `/dashboard`
- Role-based single-page dashboard, driven by an `activeSection` index
  (0–10) that swaps in the correct view component
- Sidebar with 13 items (11 numbered sections + 2 route links)
- Persistent top nav with search, live SCADA ticker, wall-clock,
  🔔 notification bell (supervisor only), profile dropdown with
  password-gated role switcher
- White-flash entry animation + PageView fade transitions

**Section list (from `Sidebar.tsx` → `navItems`):**

| # | Label | Min role | Contents |
|---|---|---|---|
| 01 | Dashboard | USER | `HeroSection` + `KpiSection` + `OverviewSection` + `ProductionFlow` |
| 02 | Digital Twin | USER | `DigitalTwin` (schematic factory map + live sensor panel) |
| 03 | AI Agent | SUPERVISOR | `AiSection` + `AgentsSection` + `DecisionSummary` + `ChatSection` |
| 04 | ML Workbench | ADMIN | `MlWorkbench` (real-time ML prediction console) |
| 05 | Machines | USER | `DigitalTwin` + `MaintenanceSection` |
| 06 | Analytics | SUPERVISOR | `KpiSection` + `AnalyticsSection` |
| 07 | Maintenance | USER | `MaintenanceSection` + `DecisionSummary` |
| 08 | Alerts | USER | `AlertsSection` |
| 09 | Reports | SUPERVISOR | `OverviewSection` + `AnalyticsSection` |
| 10 | Users & Access | ADMIN | `UsersPage` (personnel & clearance CRUD) |
| 11 | Settings | ADMIN | `SettingsPage` |
| 12 | Live Simulation | USER | Routes to `/simulation` |
| 13 | Manpower | USER | Routes to `/manpower` |

Sections not permitted for the current role render an `AccessRestrictedView`
with an "Authenticate as …" prompt that opens `AuthModal`.

### `/simulation`
- Full-page live factory simulation, own top bar
- Hero banner with tick counter + play/pause/1×/2×/5×/reset/surge controls
  + a live **simulated wall-clock** (30 sim-seconds per real tick)
- **4-card KPI mini-strip** (OEE · Total Produced · Active AGVs · Avg Health)
  with mini line/bar charts and honest deltas (no fake seed values)
- **Factory Floor SVG** — one composed 1200 × 640 illustration:
  - Blueprint grid background
  - Raw-material pallets on the left
  - 6 machine glyphs drawn top-down (warehouse rack · CNC-01 mill · robotic
    arm with safety zone · CNC-07 lathe · hydraulic press · outfeed conveyor)
  - Finished-goods crate stack on the right
  - Solid orange material-flow arrows between cells (with a curved path
    from Robot → CNC-07)
  - Dashed blue AGV route lines
  - 3 AGV forklifts moving between stations with live labels
    ("AGV-02 · Moving to CNC-07")
  - Machine status labels under each cell (name · status text · queue depth)
  - Legend chip · zoom controls · "CURRENT PART · #A784 Motor Mount" badge
- **Live Events SCADA feed** on the right with filter tabs
  (All / Machines / AGVs / Material Flow / Alerts), rich event rows with
  wall-clock timestamps and icons
- **Production Flow strip** at the bottom: 7-step chain (Raw → CNC-01 →
  Robotic Arm → CNC-07 → Press → Conveyor → Finished Goods) with the current
  step highlighted orange, plus 5 meta cells (Current Part · Cycle Time
  with target-progress bar · WIP · Throughput/hr · Bottleneck cell)
- **Coordinator Agent Console** at the very bottom — see § 4

### `/manpower`
- Live workforce grid backed by MongoDB
- Hero banner with **CURRENT SHIFT clock** (auto-detects A/B/C from hour)
- **5-KPI mini-strip:** Total Personnel · On Shift Now · Machines Covered
  (unique) · Supervisor Span (avg machines/sup) · Shift Progress (% through
  current shift, with a progress bar)
- **Machine × Shift allocation table:** rows = machines, columns =
  supervisor + Shift A / B / C, cells = operator chips with avatars; the
  current-shift column is highlighted with a "NOW" pill
- **AI Recommendations panel** (rule-based, grounded in real DB state):
  - Flags machines with no operator on the current shift (`Auto Assign`
    button next to each)
  - Flags supervisors whose span-of-control exceeds guideline (> 2 cells)
  - Shows positive confirmation when everything is covered
- **Supervisor cards grid** — one card per supervisor with avatar, title,
  department, machine-load badge (LOW/MED/HIGH), owned-machine pills,
  direct-reports count, active-this-shift count
- **Refresh** and **Seed DB** buttons (Seed DB is idempotent)

---

## 3. Simulation engine (`hooks/useFactorySim.ts`)

### State shape
```ts
SimState {
  running, speed, tick, startTs, simSecondsPerTick
  machines: MachineState[]           // 6 cells
  agvs: AGV[]                        // 3 forklifts
  events: SimEvent[]                 // categorized log
  totalProduced, producedDelta, totalDowntime
  oee, activeAlerts, wip, throughputPerHour, bottleneckId
  currentPart, partCounter, cycleTargetMin
  kpiHistory: { oee, produced, wip, health }
}
```

### Machine physics (per tick)
Each machine evolves:

| Field | Dynamics |
|---|---|
| `load` | smoothed toward `queue / capacity` |
| `rpm` | ramps to `targetRpm × (1 – wear/220) × (0.65 + load·0.5)` + noise |
| `temperature` | tracks `ambient + 20 + load·45 + wear·0.35` with runaway above 88 °C |
| `vibration` | `0.35 + wear·0.035 + load·0.9 + thermal_bump + noise` |
| `toolWear` | accumulates with load; faster if hot |
| `health` | 100 − wear·0.45 − max(0, T−70)·1.3 − max(0, vib−2)·5 (smoothed) |
| `status` | derived → healthy / warning / critical / downtime |

**Auto-downtime:** if a cell stays critical and health drops < 25,
downtime is auto-scheduled for 24 ticks. During downtime the machine
cools, wear resets, and health rebuilds; on completion an OK event fires.

### AGVs
3 forklifts (AGV-01 warehouse↔CNC-01, AGV-02 robot↔CNC-07, AGV-03
conveyor↔finished-goods). Each has `progress` 0..1 along the current leg;
on arrival flips direction. Position is lerped between station coordinates
with a slight mid-leg y-bump for a curved feel.

### Parts & flow
- Each cell consumes from own queue at rate ∝ health, feeds the next
- Finished parts increment a global `#A780`, `#A781`, … counter and
  drop into finished goods
- `currentStepIndex` on the visible part advances every ~40 ticks so the
  Production Flow strip animates

### Sim clock
`startTs = 2026-10-10T14:00:00`, `simSecondsPerTick = 30`. So 1 real
minute ≈ 30 sim-minutes — comfortable for a demo.

### User-triggered mutators
- `play` / `pause` / `setSpeed(1|2|5)` / `reset`
- `injectFault(id, "wear" | "thermal" | "surge")` — surge affects all
- `dispatchMaintenance(id)` — schedules a 20-tick downtime cycle

---

## 4. Coordinator Agent

An **autonomous rule-based supervisor** loop that observes the sim,
decides on actions, mutates the sim, and writes routed messages to
MongoDB.

**Server route:** `POST /api/agent`
- Body: `{ snapshot }` where snapshot is a client-built plant summary
- Reads supervisors + their `assignedMachines` from Mongo
- Rule engine (`decide()` in `app/api/agent/route.ts`):
  1. If a machine is `critical` and `health < 55` → issue
     `dispatch_maintenance` and address to that machine's supervisor
  2. If `toolWear > 75` and machine is up → advisory alert
  3. If a non-warehouse cell has queue ≥ 18 → capacity alert
  4. If plant OEE < 0.7 → bottleneck alert against the identified cell
  5. Otherwise → note "all cells within nominal envelope"
- Fans out inbox writes via `writeInbox()` for every action that has a
  `targetSupervisorId`

**Client hook:** `hooks/useCoordinatorAgent.ts`
- Runs every 6 seconds while enabled
- POSTs the current plant snapshot
- Applies mutating tool calls locally (currently
  `dispatch_maintenance` → `dispatchMaintenance(machineId)` on the sim)
- Keeps last 30 decisions for the console

**UI:** `components/AgentConsole.tsx` (bottom of `/simulation`)
- On/off toggle with visible dot state (green live · orange busy · gray off)
- Stats bar: Ticks · Actions · Live/Off status
- Timeline of decisions with `THOUGHT` lines and `TOOL` action cards
  (color-coded per tool), including a "outcome" line noting the sim
  mutation and inbox write

**Tools currently implemented:**

| Tool | Effect |
|---|---|
| `dispatch_maintenance` | Sim: queues downtime · DB: writes `task` inbox message to the machine's supervisor |
| `raise_operator_alert` | DB only: writes `alert` inbox message with severity |
| `note` | Records reasoning without action |

**Brain:** rule-based (deterministic, no key required). Groq brain
(`llama-3.3-70b-versatile` tool-calling) can be dropped into the same
route contract when `GROQ_API_KEY` is set — not yet wired.

---

## 5. Supervisor Inbox

**Collection:** `inbox_messages` in MongoDB
```ts
{ id, supervisorId, from, fromName, type: "alert"|"report"|"task",
  severity: "info"|"warn"|"crit", machineCode?, title, body,
  createdAt, read, resolvedAt? }
```

**API:** `/api/inbox`
- `GET  ?supervisorId=xxx[&unread=1]` — list + `unreadCount`
- `POST` — create a message
- `PATCH` — `{ id, read?, resolved? }`
- `DELETE ?id=xxx`

**Client hook:** `hooks/useInbox.ts` — polls every 8 s, exposes
`markRead` / `markAllRead` / `resolve` / `remove`

**UI:** `components/InboxDrawer.tsx` — slide-out drawer with:
- Unread / Critical / Total summary
- Message rows: severity pill (INFO/WARN/CRIT), machine chip, timeAgo,
  body, action buttons (Mark read · Resolve · Delete)
- Empty state when the agent has nothing to report

**Bell integration:** `components/DashboardNav.tsx` renders a 🔔 button
with a badge showing the current supervisor's unread count. Clicking
opens `<InboxDrawer>` mounted in `DashboardClient.tsx`. Visible only
when the active role is SUPERVISOR.

---

## 6. Authentication & RBAC

`context/AuthContext.tsx` provides:

- **3 roles** — `ADMIN`, `SUPERVISOR`, `USER` with `ROLE_PERMISSIONS`:
  - `allowedSections: number[]` — which dashboard sections
  - `canManageUsers`, `canEditSettings`, `canTrainModels`, `canOverrideSafety`

- **User account shape** — id, name, email, role, title, avatar,
  department, status, machinesManaged, `fixedClearance` (protects the
  4 admin + 4 supervisor slots from deletion), `password`, plus for
  operators: `assignedMachine`, `shift`, `supervisorId`

- **Hydration order:**
  1. Fetch `/api/users` (Mongo) first
  2. If API is reachable and non-empty → use DB list
  3. Otherwise fall back to hardcoded `INITIAL_USERS` (never breaks the
     UI even if Mongo is down)
  4. Restore `savedUser` from `localStorage`, re-look up from live source

- **Password scheme (demo only):** `FirstName@123`. Enforced through
  `AuthModal` when switching roles or accounts.

- **CRUD:** `addUser`, `updateUserRole`, `toggleUserStatus`, `deleteUser`
  — with `fixedClearance` protection.

---

## 7. MongoDB

**Connection singleton:** `lib/mongo.ts`
- Cached on `globalThis` under `NODE_ENV === "development"` so `next dev`
  hot-reload doesn't leak connections
- `getDb()` / `getClient()` helpers
- Named `COLLECTIONS` const (users, operators, machineAssignments, inbox,
  agentReports) — typos become compile errors

**Env:** `factorymind-next/.env.local` (git-ignored)
```
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.<host>/?appName=Cluster0"
MONGODB_DB="factorymind"
# GROQ_API_KEY=gsk_...   (optional)
```
⚠️ The password originally shared in chat has been compromised — rotate
it in Atlas → Database Access before any real use.

**Seed data:** `lib/seedData.ts`
- 4 Admins (fixedClearance)
- 4 Supervisors with `assignedMachines`, `shift`, fixedClearance
- 8 Operators with `assignedMachine`, `shift`, `supervisorId`
- 6-entry machine registry

**Seed route:** `POST /api/seed` — idempotent, drops + reinserts users
and machines, ensures indexes on users(id, email, role), inbox
(supervisorId+createdAt, read), agent_reports(generatedAt).

**Supervisor ↔ machine ownership as seeded:**

| Supervisor | Owns | Shift |
|---|---|---|
| Marcus Vance | CELL-01, CELL-04 | A |
| Priya Sharma | CELL-03 | B |
| David Miller | CELL-02, CELL-05 | A |
| Amara Patel | CELL-06 | C |

---

## 8. API surface

All server routes live under `factorymind-next/app/api/*/route.ts`.

| Route | Methods | Purpose |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/seed` | GET / POST | Check seed status · Reseed |
| `/api/users` | GET / POST / PUT / DELETE | User CRUD (respects `fixedClearance`) |
| `/api/manpower` | GET / PUT | One-shot supervisors + operators + machines fetch · reassignment |
| `/api/inbox` | GET / POST / PATCH / DELETE | Supervisor inbox |
| `/api/agent` | POST | Coordinator Agent tick — decides + fans out inbox writes |
| `/api/chat` | POST | Groq-backed maintenance advisor (`openai/gpt-oss-20b` via Groq); falls back to a static help message when `GROQ_API_KEY` is missing |
| `/api/predict` | POST | ML prediction pipeline (3-tier fallback: FastAPI → Python CLI → calibrated analytical) |

---

## 9. Python ML service (`ml_models/`)

- `ml_service.py` — FastAPI app on port `8000`
  - `GET /` · `GET /health` — status with model metadata
  - `POST /predict/chained` — runs both models (PM binary + factory status)
  - `POST /predict/pm` · `POST /predict/factory` — single-model endpoints
- `cli_predict.py` — CLI fallback callable by Next.js when FastAPI is down
- `best_pm_model.pkl` — **LightGBM Binary Classifier** (400 trees, 12
  features) — predictive maintenance (will it fail?)
- `factory_model.pkl` — **Random Forest Classifier** (100 trees, 16
  features, 3 classes) — operational status (OPTIMAL / WARNING / CRITICAL)

**Fallback chain in `/api/predict`:**
1. Try `POST http://127.0.0.1:8000/predict/chained` (2 s timeout)
2. If down, exec `python cli_predict.py` with a base64 payload (10 s
   timeout)
3. If Python is also missing, use a **calibrated analytical estimator**
   that mimics the LightGBM heuristics — the UI never breaks

---

## 10. Component & hook inventory

**Hooks** (`hooks/`)
- `useClock.ts` — wall-clock ticker for the top nav
- `useSensorData.ts` — mocked live sensor feed for the Digital Twin schematic
- `useNotifications.ts` — browser-notification permission + emit helpers
- `useFactorySim.ts` — the sim engine (see § 3)
- `useCoordinatorAgent.ts` — polls `/api/agent` (see § 4)
- `useInbox.ts` — polls `/api/inbox` (see § 5)

**Components** (`components/`)
- Layout: `Sidebar`, `DashboardNav`, `DashboardFooter`, `FactoryMindLogo`,
  `AuthModal`
- Dashboard sections: `HeroSection`, `KpiSection`, `OverviewSection`,
  `ProductionFlow`, `DigitalTwin`, `AiSection`, `AgentsSection`,
  `DecisionSummary`, `ChatSection`, `AnalyticsSection`, `MaintenanceSection`,
  `AlertsSection`, `MlWorkbench`, `UsersPage`, `SettingsPage`
- Simulation: `FactorySimulation` (page container), `FactoryFloorSVG`
  (composed floor illustration), `MachineSVGs` (5 individual machine
  glyphs used in the inspector modal), `ProductionFlowStrip`
- Agent + inbox: `AgentConsole`, `InboxDrawer`
- Effects: `ElectricBorder.jsx` (+ CSS)

---

## 11. Theming

All colors defined as CSS variables in `app/globals.css` under `:root`.
Changing them cascades through the entire app.

```css
--bg-main: #F0EBE0;       /* warm cream canvas */
--bg-card: #FBF7F0;       /* off-white surface */
--text-main: #0F0F0E;     /* near-black ink */
--primary: #FF5A1F;       /* UralMebel orange */
--success: #3F7A5F;       /* forest */
--warning: #C87D1F;       /* amber */
--danger:  #B23A3A;       /* rust */
--info:    #4A6D8C;       /* dusty blue */
```

- Component inline styles use `var(--*)` references so a palette swap is
  a single-file edit
- Reserved hardcoded darks in a few components were bulk-migrated
  to warm equivalents via a targeted `sed` pass
- Sim + Manpower pages further scope small tweaks under
  `.sim-page-wrapper` (topbar background, backdrop opacity, log-row text
  colors) to sit correctly on the cream ground

---

## 12. Running the stack locally

```bash
# 1. MongoDB env
#    factorymind-next/.env.local  — set MONGODB_URI and MONGODB_DB

# 2. Frontend + all API routes
cd factorymind-next
npm install
npm run dev                          # http://localhost:3000

# 3. Seed the DB once (idempotent — safe to re-run)
curl -X POST http://localhost:3000/api/seed

# 4. (Optional) start the Python ML service so /api/predict hits real models
cd ../ml_models
pip install -r requirements.txt
python ml_service.py                 # http://127.0.0.1:8000
```

Verify:
- `http://localhost:3000/dashboard` — sign in as Marcus
  (`shift.vance@factorymind.ai` / `Marcus@123`), 🔔 bell appears
- `http://localhost:3000/simulation` — sim ticks, agent runs every 6 s,
  Surge/Heat/Wear buttons trigger agent action → routed inbox message
- `http://localhost:3000/manpower` — table + KPI strip + AI
  recommendations all live from Mongo
- `http://127.0.0.1:8000/health` — reports both `.pkl` models loaded

---

## 13. Sidebar quick-map

```
01 Dashboard       ── HUD   ── /dashboard#0
02 Digital Twin    ── TWIN  ── /dashboard#1
03 AI Agent        ── AGENT ── /dashboard#2
04 ML Workbench    ── ML    ── /dashboard#3
05 Machines        ── CELLS ── /dashboard#4
06 Analytics       ── DATA  ── /dashboard#5
07 Maintenance     ── PLAN  ── /dashboard#6
08 Alerts          ── SCADA ── /dashboard#7
09 Reports         ── DOCS  ── /dashboard#8
10 Users & Access  ── RBAC  ── /dashboard#9
11 Settings        ── CONF  ── /dashboard#10
12 Live Simulation ── NEW   ── /simulation
13 Manpower        ── DB    ── /manpower
```

---

## 14. Roadmap (not yet built)

Deliberately deferred, but the plumbing is ready:

- **Groq brain for Coordinator Agent** — the `/api/agent` route is
  structured to swap in `llama-3.3-70b-versatile` tool-calling behind a
  `GROQ_API_KEY` check; ~40 extra lines
- **Drag-and-drop operator reassignment** on the manpower grid (the PUT
  API `/api/manpower` already exists; UI is read-only)
- **Auto-escalation** — `crit` messages unread for > N minutes copy to
  the ADMIN inbox
- **Assignment history log** — `assignment_changes` collection for audit
- **Real authentication** — replace the demo `Name@123` scheme with
  NextAuth (Google + credentials)
- **Additional agent tools** — `redirect_agv`, `throttle_upstream`,
  `schedule_shift_change`
- **Chat-driven ops copilot** — the existing floating chat FAB reworked
  to answer questions grounded in live sim state
