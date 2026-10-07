# FactoryMind AI — Web Application (`factorymind-next`)

> Next.js 16 frontend and full-stack API server for FactoryMind AI.

For full architectural documentation, system diagrams, and ML service details, see the main [README.md](../README.md) and [IMPLEMENTATION.md](../IMPLEMENTATION.md).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in this directory:
```bash
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="factorymind"

# Optional: Groq API Key for LLM assistant
GROQ_API_KEY="gsk_..."
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Seed MongoDB Database
Initialize default users, machine assignments, and indexes:
```bash
curl -X POST http://localhost:3000/api/seed
```

---

## 🧭 Application Routes

- `/` — Landing Page & Platform Feature Overview
- `/dashboard` — 11-Section Unified Operations Hub (Role-Gated SPA)
- `/simulation` — Live 2D Factory SCADA Simulation with Kinematic AGVs & Coordinator Agent Console
- `/manpower` — Real-Time Workforce, Shift Allocation (A/B/C), and AI Span-of-Control Advisor

---

## 📡 API Endpoints

All API handlers are defined under `app/api/`:
- `GET /api/health` — Health check
- `GET/POST /api/seed` — Seed status check & database re-seeding
- `GET/POST/PUT/DELETE /api/users` — Role-based user administration
- `GET/PUT /api/manpower` — Operator/supervisor allocations
- `GET/POST/PATCH/DELETE /api/inbox` — Supervisor incident inbox
- `POST /api/agent` — Coordinator Agent watchdog tick
- `POST /api/predict` — 3-tier predictive maintenance ML inference
- `POST /api/chat` — AI Maintenance Copilot

---

## 🧪 Available Scripts

- `npm run dev` — Starts Next.js dev server on port 3000
- `npm run build` — Creates production build
- `npm run start` — Runs production server
- `npm run lint` — Runs ESLint checks
