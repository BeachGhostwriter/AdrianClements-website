# CORE v7 Risk Management Platform

Enterprise web application for the CORE© (Continuous Opportunity and Risk Dynamics Engine) framework.

## Architecture

```
core-risk-platform/
├── frontend/          Next.js 14 + TypeScript + Tailwind CSS
├── backend/           Node.js + Express + Prisma ORM
├── packages/
│   ├── core-engine/   TTS & OTS base calculations (CORE white paper)
│   ├── radar-engine/  Early warning EW-TTS (RADAR white paper)
│   ├── forge-engine/  Bounded R-TTS & Resilience (FORGE white paper)
│   └── shared-types/  Shared TypeScript interfaces
└── docs/              Architecture and formula documentation
```

## Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET
cp frontend/.env.local.example frontend/.env.local
```

### 3. Set up database
```bash
npm run db:migrate      # Run Prisma migrations
```

### 4. Import Excel data
```bash
# Copy your Excel file:
cp /path/to/CORE_v7_Integrated.xlsx backend/data/

npm run import:excel    # Seeds DB from Excel
```

### 5. Start development servers
```bash
npm run dev             # Starts both frontend (3000) and backend (3001)
```

Open http://localhost:3000 and log in with the admin credentials from your .env.

---

## Access Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access — all BUs, all data, admin pages |
| **DIVISION_HEAD** | Scoped to assigned business units |
| **RISK_OWNER** | Own risks only within assigned BUs |
| **VIEWER** | Read-only across assigned BUs |

---

## Mathematical Engines

### CORE Engine (`packages/core-engine`)
Base TTS formula from CORE white paper Section 3:
```
TTS(t) = {[L(t) × I(t) × V(t) × (1 + A × exp(α·t))] / √(1−(v/v_max)²)} × [1+β×(ψ/ψ_c)^γ]
```

### RADAR Engine (`packages/radar-engine`)
Early Warning TTS from RADAR white paper Section 4:
```
EW-TTS(t) = ⟨TTS_ensemble(t)⟩ × Coherence_Factor × Phase_Proximity
```
- Monte Carlo: N=500 simulations with Palmer noise
- Coherence Factor: risk cascade synchronisation
- Phase Proximity: Gaussian decay from critical threshold

### FORGE Engine (`packages/forge-engine`)
Bounded R-TTS from FORGE white paper Section 3:
```
R-TTS = [L(t) × I(t) × log₂(1+V) × (1+A×min(exp(αt),20))]
        / √(1−min(v/v_m,0.95)²) × [1+β×σ((ψ−ψ_c)/δ)]
```
- Bounded velocity, capped amplification, soft-capped Lorentz
- Sigmoid criticality for smooth resource escalation
- Resilience Index (RI) with 4 components
- Backcasting milestones

---

## Build Phases

- **Phase 1 (complete):** Scaffolding, schema, engine packages, auth, import
- **Phase 2:** Full RADAR/FORGE/Opportunities UI, charts, forms
- **Phase 3:** CCORD conformal diagrams, Monte Carlo visualisation, aggregation
- **Phase 4:** Admin layer — BU management, user profiles, audit log

## VS Code

Recommended extensions are in `.vscode/extensions.json`.
Use `Ctrl+Shift+P` → "Tasks: Run Task" → "Dev: Start All" to launch.
