# FactoryMind AI 🏭⚡

> **Next-Generation Industrial Intelligence & Autonomous Operations Platform**  
> Real-time Digital Twin, 3-Tier Predictive Maintenance (ML), Autonomous Coordinator Agent, and Live SCADA Simulation.

---

## 📌 Executive Summary

**FactoryMind AI** is an Industry 4.0 manufacturing intelligence platform built to eliminate unexpected machine downtime and automate shop-floor coordination. By fusing continuous SCADA telemetry, high-fidelity digital twin modeling, multi-model predictive maintenance (LightGBM & Random Forest), and an autonomous supervisor loop, FactoryMind AI delivers real-time operational transparency and proactive floor intervention.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     factorymind-next  (Next.js 16)                    │
│                                                                        │
│   Routes ──┬─  /                       (Landing & Showcase)            │
│            ├─  /dashboard              (Role-Gated 11-Section SPA)     │
│            ├─  /simulation             (Live 2D SCADA Plant Sim)       │
│            └─  /manpower               (Live Workforce Allocation)     │
│                                                                        │
│   APIs   ──┬─  /api/health             /api/seed          /api/users   │
│            ├─  /api/manpower           /api/inbox         /api/agent   │
│            └─  /api/predict            /api/chat                       │
└──────────────┬────────────────────────────────┬────────────────────────┘
               │                                │
               ▼                                ▼
     ┌────────────────────┐          ┌────────────────────────┐
     │   MongoDB Atlas    │          │  ml_models  (Python)   │
     │  factorymind DB    │          │  FastAPI :8000         │
     │                    │          │                        │
     │  • users & RBAC    │          │  • best_pm_model.pkl   │
     │  • machines        │          │    (LightGBM · PM)     │
     │  • inbox_messages  │          │  • factory_model.pkl   │
     │  • agent_reports   │          │    (Random Forest)     │
     └────────────────────┘          │  • cli_predict fallback│
                                     └────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🏭 Interactive Plant Floor Simulation (`/simulation`)
- **Real-Time Physics Engine:** Deterministic multi-machine dynamics tracking RPM, temperature, vibration, load, tool wear accumulation, and health degradation.
- **Dynamic 2D Plant Floor SVG:** Top-down visual layout rendering warehouse racks, CNC mills, robotic transfer arms, hydraulic presses, and outfeed conveyors with material flow paths.
- **Kinematic AGVs:** 3 automated guided vehicles (AGVs) navigating station routes with smooth spline-interpolated motion and live task indicators.
- **Telemetry & SCADA Log:** Real-time event feed with categorical filtering (Machines, AGVs, Material Flow, Alerts) and instantaneous bottleneck detection.
- **Fault Injection Suite:** On-demand induction of thermal runaway, tool wear acceleration, and electrical power surges.

### 2. 🤖 Autonomous Coordinator Agent & Supervisor Inbox
- **Autonomous Watchdog Loop:** Polls factory snapshots (`/api/agent`) every 6 seconds to evaluate anomaly signatures and enforce proactive interventions.
- **Targeted Action Dispatch:** Automatically issues `dispatch_maintenance` downtime routines and routes high-priority task alerts directly to the responsible shift supervisor.
- **Supervisor Notification Drawer:** Slide-out inbox accessible via the top-bar notification bell (with unread counters) for supervisors to inspect, acknowledge, and resolve floor incidents.

### 3. 👥 Intelligent Workforce & Manpower Allocation (`/manpower`)
- **Shift Matrix Grid:** Real-time machine-to-operator roster covering Shifts A, B, and C, with active shift detection based on live wall-clock time.
- **Span-of-Control Governance:** Live metrics tracking supervisor load factors, unstaffed critical machinery, and workforce utilization.
- **Rule-Based Allocation Advisor:** Automated recommendations flagging uncovered cells and providing single-click auto-assignment suggestions.

### 4. 🧠 Resilient 3-Tier ML Inference Pipeline
- **Predictive Maintenance Model:** LightGBM Binary Classifier (400 trees, 12 features) predicting imminent failure probabilities.
- **Operational Status Model:** Random Forest Multi-class Classifier (100 trees, 16 features) evaluating machine health state (`OPTIMAL`, `WARNING`, `CRITICAL`).
- **High-Availability Fallback Architecture:**
  1. Primary: High-speed async FastAPI microservice (`http://127.0.0.1:8000/predict/chained`).
  2. Secondary: Subprocess execution via `cli_predict.py` with base64 payload serialization.
  3. Tertiary: Internal analytical estimator mimicking trained decision boundaries so the UI remains 100% operational in disconnected environments.

### 5. 🔐 Role-Based Access Control (RBAC) & 11-Section Unified Dashboard
- **Granular Permissions:** 3 access tiers (`ADMIN`, `SUPERVISOR`, `USER`) gating critical views, ML workbench training, and user management.
- **11 Curated Modules:**
  - `01 Dashboard` — Real-time telemetry HUD, OEE overview, production velocity.
  - `02 Digital Twin` — Sensor schematic and real-time machine telemetry monitoring.
  - `03 AI Agent` — Coordinator Agent logs, reasoning traces, and conversational interface.
  - `04 ML Workbench` — Manual feature payload testing and live inference verification.
  - `05 Machines` — Fleet health status and cell drilldowns.
  - `06 Analytics` — Historical performance trends, uptime metrics, and distribution charts.
  - `07 Maintenance` — Predictive schedules, work orders, and maintenance logs.
  - `08 Alerts` — High-severity anomaly feed and alarm management.
  - `09 Reports` — Production and operational summary exports.
  - `10 Users & Access` — User management and security clearances.
  - `11 Settings` — Factory thresholds and operational parameters.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org), [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org) |
| **Styling & Design** | Vanilla CSS Design Tokens, FontAwesome 7, UralMebel-inspired warm palette (`#F0EBE0`, `#FF5A1F`) |
| **Data Visualization** | [Chart.js 4](https://www.chartjs.org), [react-chartjs-2](https://react-chartjs-2.js.org), Custom SVG Floor Plan |
| **Database & Persistence** | [MongoDB Atlas](https://www.mongodb.com/atlas) (Official Node.js SDK v7) |
| **Machine Learning Backend** | Python 3.10+, [FastAPI](https://fastapi.tiangolo.com), [LightGBM](https://lightgbm.readthedocs.io), [scikit-learn](https://scikit-learn.org), Joblib, Pydantic |
| **LLM & AI Assistant** | Optional Groq API integration (`llama-3.3-70b-versatile` / `openai/gpt-oss-20b`) with deterministic rule-engine fallback |

---

## 📂 Repository Structure

```
.
├── IMPLEMENTATION.md         # Deep-dive architecture & implementation notes
├── README.md                 # Project root documentation
├── factorymind-next/         # Next.js 16 Web Application
│   ├── app/                  # Next.js App Router (pages & API routes)
│   │   ├── api/              # Serverless API routes (agent, inbox, predict, etc.)
│   │   ├── dashboard/        # Role-based 11-section SPA
│   │   ├── simulation/       # Live 2D Factory SCADA simulation
│   │   ├── manpower/         # Live Workforce & shift allocation
│   │   └── page.tsx          # Landing page
│   ├── components/           # UI Components, SVG floorplans, drawers, modals
│   ├── context/              # React Context providers (AuthContext, RBAC)
│   ├── hooks/                # Custom hooks (useFactorySim, useCoordinatorAgent, useInbox)
│   ├── lib/                  # MongoDB client singleton, seed data, ML bridge
│   └── public/               # Static assets & icons
└── ml_models/                # Python ML Microservice
    ├── best_pm_model.pkl     # Pre-trained LightGBM predictive maintenance model
    ├── factory_model.pkl     # Pre-trained Random Forest operational status model
    ├── ml_service.py         # FastAPI REST service (:8000)
    ├── cli_predict.py        # Standalone CLI prediction fallback script
    └── requirements.txt      # Python package dependencies
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or higher
- **Python**: v3.10 or higher
- **MongoDB Atlas** connection string (or local MongoDB v6+)

---

### Step 1: Configure Environment Variables

Create `.env.local` inside `factorymind-next/`:

```bash
# factorymind-next/.env.local
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="factorymind"

# Optional: Groq API Key for enhanced AI chat assistant
GROQ_API_KEY="gsk_..."
```

---

### Step 2: Launch the Next.js Frontend & API

```bash
cd factorymind-next
npm install
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

### Step 3: Seed Database (One-time Setup)

Initialize default users, machine assignments, and indexes:

```bash
# In a separate terminal:
curl -X POST http://localhost:3000/api/seed
```

*(Alternatively, click the **"Seed Database"** button on the `/manpower` page).*

---

### Step 4: (Optional) Launch Python ML Microservice

To enable real-time inference via FastAPI:

```bash
cd ml_models
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python ml_service.py
```

The ML service will start on `http://127.0.0.1:8000`.  
Verify health: `http://127.0.0.1:8000/health`.

> **Note:** If the Python microservice is not running, the application seamlessly falls back to the CLI script or local analytical estimator without interrupting the user experience.

---

## 🔑 Demo Access Credentials

The demo seed includes preconfigured accounts for quick testing:

| Role | Name | Email | Password | Assigned Cells / Shift |
|---|---|---|---|---|
| **SUPERVISOR** | Marcus Vance | `shift.vance@factorymind.ai` | `Marcus@123` | CELL-01, CELL-04 (Shift A) |
| **SUPERVISOR** | Priya Sharma | `priya.s@factorymind.ai` | `Priya@123` | CELL-03 (Shift B) |
| **SUPERVISOR** | David Miller | `d.miller@factorymind.ai` | `David@123` | CELL-02, CELL-05 (Shift A) |
| **SUPERVISOR** | Amara Patel | `amara.p@factorymind.ai` | `Amara@123` | CELL-06 (Shift C) |
| **ADMIN** | Elena Rostova | `elena.r@factorymind.ai` | `Elena@123` | Plant-wide Access |
| **USER** | Shop Floor Guest | *(Default session)* | — | Operator View |

---

## 📡 API Endpoint Summary

| Route | Methods | Description |
|---|---|---|
| `/api/health` | `GET` | Health check endpoint |
| `/api/seed` | `GET`, `POST` | Check database seed status / Idempotent database reseeding |
| `/api/users` | `GET`, `POST`, `PUT`, `DELETE` | User CRUD with fixed-clearance safety guardrails |
| `/api/manpower` | `GET`, `PUT` | Bulk fetch and update supervisor & operator shift allocations |
| `/api/inbox` | `GET`, `POST`, `PATCH`, `DELETE` | Supervisor notification drawer CRUD and unread counts |
| `/api/agent` | `POST` | Coordinator Agent tick evaluation and alert routing |
| `/api/predict` | `POST` | Predictive Maintenance ML inference (3-tier fallback) |
| `/api/chat` | `POST` | AI Maintenance Advisor (Groq LLM / deterministic fallback) |

---

## 🎨 Design System & Theming

FactoryMind AI uses a cohesive, industrial-grade warm palette inspired by UralMebel:

```css
:root {
  --bg-main:   #F0EBE0;  /* Warm cream canvas */
  --bg-card:   #FBF7F0;  /* Soft off-white surface */
  --text-main: #0F0F0E;  /* Industrial near-black typography */
  --primary:   #FF5A1F;  /* Safety orange accent */
  --success:   #3F7A5F;  /* Forest green (nominal) */
  --warning:   #C87D1F;  /* Amber (advisory) */
  --danger:    #B23A3A;  /* Rust red (critical) */
  --info:      #4A6D8C;  /* Dusty blue (telemetry/AGV) */
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
