# NovaBank — Test Runner Guide

Complete reference for running, extending, and diagnosing every test suite
in the project. Read this first whenever you set up on a new machine.

---

## Prerequisites

| Tool | Minimum Version | Install Command |
|------|----------------|----------------|
| Node.js | 18.x | https://nodejs.org |
| npm | 8.x | Bundled with Node.js |
| Git | 2.x | https://git-scm.com |

No Docker, no Redis, no `.env` file required — NovaBank uses SQLite locally
and ships with hardcoded seed credentials for development and testing.

---

## Quick Start

After cloning the repo, run:

```bash
# Install all dependencies
cd backend  && npm install
cd ../frontend && npm install
cd ..

# 1. Validate your environment (no servers needed)
npm run test:infra:system
npm run test:infra:env
npm run test:infra:consistency

# 2. Run the automated suites (no servers needed)
cd backend  && npm test       # 136 tests
cd ../frontend && npm test    # 212 tests
cd ..  && npm run test:infra  # 25 infrastructure checks

# 3. (Optional) Start live servers then run browser E2E
cd backend  && npm run dev    # http://localhost:3000
cd frontend && npm run dev    # http://localhost:5174
npm run test:e2e              # Playwright browser tests
```

### Convenience Shortcuts (run from project root)

| Script | What it does |
|--------|-------------|
| `npm run test:all` | All 18 stages end-to-end |
| `npm run test:all:stop` | All stages; abort on the first failure |
| `npm run test:all:skip-infra` | Stages 10–17 only (no infra pre-flights) |
| `npm run test:all:quick` | Stages 10–17 (no infra, no browser) |

---

## Full Stage Map

| # | Group | Stage Name |
|---|-------|-----------|
| 1 | Infrastructure | System Requirements |
| 2 | Infrastructure | Environment Config |
| 3 | Infrastructure | Docker Services |
| 4 | Infrastructure | Port Connectivity |
| 5 | Infrastructure | Database Connectivity |
| 6 | Infrastructure | Cache / Redis |
| 7 | Infrastructure | API Health |
| 8 | Infrastructure | Frontend Dev Server |
| 9 | Infrastructure | Cross-Service Consistency |
| 10 | Backend | Unit Tests |
| 11 | Backend | Smoke Tests |
| 12 | Backend | Integration (RealDB) |
| 13 | Backend | E2E API (Full Journey) |
| 14 | Frontend | Unit Tests (Utils) |
| 15 | Frontend | Component Tests |
| 16 | Frontend | Page Tests |
| 17 | Frontend | Context Tests |
| 18 | Browser E2E | Playwright Browser Tests |

---

## Run Specific Stages

```bash
# Only infra checks
node AutomationTests/run-all-tests.js --stages 1,2,3,4,5,6,7,8,9

# Only backend tests
node AutomationTests/run-all-tests.js --stages 10,11,12,13

# Only frontend tests
node AutomationTests/run-all-tests.js --stages 14,15,16,17

# Only Playwright (requires live servers)
node AutomationTests/run-all-tests.js --stages 18

# Critical path with stop-on-failure
node AutomationTests/run-all-tests.js --stages 1,2,10,12,14 --stop-on-failure
```

---

## Run by Category

### Infrastructure

```bash
# All infra at once (from project root)
npm run test:infra

# Individual checks (from project root)
npm run test:infra:system        # Node/npm versions, config files exist, node_modules present
npm run test:infra:env           # package.json files valid, jest/vitest configs present
npm run test:infra:docker        # Docker daemon check (graceful skip — not required)
npm run test:infra:ports         # TCP connectivity to backend:3000 and frontend:5174
npm run test:infra:db            # SQLite file exists, readable, all 6 tables present
npm run test:infra:redis         # Redis check (graceful skip — not required for NovaBank)
npm run test:infra:api           # GET /api/health returns { status: "ok" }
npm run test:infra:frontend      # Vite dev server returns HTTP 200
npm run test:infra:consistency   # Ports consistent across vite.config.js, playwright.config.js, backend
```

### Backend

```bash
# All backend at once (from backend/ directory)
cd backend

npm test                   # All 136 tests (unit + smoke + integration + e2e)
npm run test:unit          # Route unit tests with in-memory SQLite (13 suites)
npm run test:smoke         # API smoke tests against seeded in-memory DB
npm run test:integration   # RealDB integration journey (register → transfer → bills → FD → profile)
npm run test:e2e           # 21-step full API journey (register → CSV export)
```

### Frontend

```bash
# All frontend at once (from frontend/ directory)
cd frontend

npm test                   # All 212 tests (utils + components + pages + context)
npm run test:unit          # Pure utility functions (format.js, finance.js)
npm run test:components    # UI component tests (Badge, Button, Card, Input, Layout, Modal…)
npm run test:pages         # Page-level integration tests (Dashboard, Transfer, Bills…)
npm run test:context       # React context tests (AuthContext, ThemeContext)
npm run test:watch         # Interactive watch mode
npm run test:coverage      # Coverage report with V8
```

### Browser E2E (Playwright — requires live servers)

```bash
# Start servers first
cd backend  && npm run dev    # must be on http://localhost:3000
cd frontend && npm run dev    # must be on http://localhost:5174

# Then run from project root
npm run test:e2e              # All Playwright specs (headless)
npm run test:e2e:headed       # Headed mode (watch the browser)
npm run test:e2e:chrome       # Chromium project only
npx playwright test --ui      # Interactive Playwright UI
npx playwright test --show-report   # Open last HTML report
```

---

## Combining Flags

```bash
# Quick CI check — skip infra and browser, stop on first failure
node AutomationTests/run-all-tests.js --skip-infra --skip-browser --stop-on-failure

# Smoke test just the backend after a code change
node AutomationTests/run-all-tests.js --stages 10,11 --stop-on-failure

# New-machine setup: verify environment then run backend unit tests
node AutomationTests/run-all-tests.js --stages 1,2,9,10 --stop-on-failure
```

---

## AutomationTests/ Folder Structure

```
AutomationTests/
├── run-all-tests.js          Master runner (Node.js ESM)
├── TestRunner.md             This file
│
├── helpers/
│   └── backend-setup.js     Re-exports backend/tests/setup.js (createTestDb, createTestApp…)
│
├── backend/
│   ├── unit/                Route + middleware + helper unit tests (13 files)
│   │   ├── account-routes.test.js
│   │   ├── admin-routes.test.js
│   │   ├── auth-middleware.test.js
│   │   ├── auth-routes.test.js
│   │   ├── bills-routes.test.js
│   │   ├── fixed-deposits-routes.test.js
│   │   ├── health.test.js
│   │   ├── helpers.test.js
│   │   ├── notifications-routes.test.js
│   │   ├── payees-routes.test.js
│   │   ├── rate-limiter.test.js
│   │   ├── transactions-routes.test.js
│   │   └── transfers-routes.test.js
│   ├── smoke/
│   │   └── api-smoke.test.js
│   ├── integration/
│   │   └── realdb-journey.test.js   10-step register → transfer → bills → FD → profile
│   └── e2e/
│       └── api-e2e-sequence.test.js  21-step full API journey
│
├── frontend/
│   ├── setup.js             Vitest global setup (jest-dom, matchMedia, localStorage mocks)
│   ├── utils/
│   │   ├── finance.test.js  calculateDaysUntilDue, validateTransferAmount, FD returns…
│   │   └── format.test.js   formatBalance, formatDate, formatTime, formatMemberSince
│   ├── components/          UI component tests (9 files)
│   │   ├── Badge.test.jsx
│   │   ├── Button.test.jsx
│   │   ├── Card.test.jsx
│   │   ├── Input.test.jsx
│   │   ├── Layout.test.jsx
│   │   ├── Modal.test.jsx
│   │   ├── Select.test.jsx
│   │   ├── Sidebar.test.jsx
│   │   └── SpendingChart.test.jsx
│   ├── pages/               Page-level integration tests (10 files)
│   │   ├── Bills.test.jsx
│   │   ├── Dashboard.test.jsx
│   │   ├── FixedDeposits.test.jsx
│   │   ├── Login.test.jsx
│   │   ├── Payees.test.jsx
│   │   ├── Profile.test.jsx
│   │   ├── Register.test.jsx
│   │   ├── Transactions.test.jsx
│   │   └── Transfer.test.jsx
│   └── context/
│       ├── AuthContext.test.jsx
│       └── ThemeContext.test.jsx
│
├── e2e-browser/             Playwright browser specs (require live servers)
│   ├── helpers.js
│   ├── auth.spec.js
│   ├── dashboard.spec.js
│   ├── navigation.spec.js
│   └── smoke.spec.js
│
└── infra/
    ├── vitest.config.js     Node environment, 8 s timeout
    └── preflight.test.js    9 describe blocks, 25 checks
```

---

## What Each Infra Failure Means

| Stage | Common Failure Symptom | Typical Fix |
|-------|----------------------|-------------|
| 1 — System Requirements | "Node.js version too old" | Install Node.js ≥ 18 from https://nodejs.org |
| 1 — System Requirements | "npm version too old" | `npm install -g npm@latest` |
| 1 — System Requirements | "backend node_modules missing" | `cd backend && npm install` |
| 1 — System Requirements | "frontend node_modules missing" | `cd frontend && npm install` |
| 2 — Environment Config | "backend package.json missing or invalid" | Re-clone the repository |
| 2 — Environment Config | "frontend vitest.config.js missing" | Re-clone the repository |
| 2 — Environment Config | "root package.json missing test:infra script" | `npm install` from root |
| 3 — Docker Services | "Docker CLI not available" | Not required — NovaBank uses SQLite |
| 4 — Port Connectivity | "backend port 3000 not open" | `cd backend && npm run dev` |
| 4 — Port Connectivity | "frontend port 5174 not open" | `cd frontend && npm run dev` |
| 5 — Database Connectivity | "SQLite file not found" | `cd backend && node src/db/schema.js` |
| 5 — Database Connectivity | "Table missing from database" | `cd backend && node src/db/schema.js` |
| 6 — Cache / Redis | "Redis not reachable" | Not required — NovaBank uses SQLite only |
| 7 — API Health | "/api/health returned non-200" | `cd backend && npm run dev` |
| 7 — API Health | "/api/auth/register returned 404" | Route not mounted — check backend/src/index.js |
| 8 — Frontend Dev Server | "port 5174 not open" | `cd frontend && npm run dev` |
| 8 — Frontend Dev Server | "HTTP 200 not received" | Check for Vite startup errors in the terminal |
| 9 — Consistency | "playwright baseURL port mismatch" | Update `playwright.config.js` baseURL to port 5174 |
| 9 — Consistency | "vite proxy not referencing port 3000" | Update `proxy.target` in `frontend/vite.config.js` |
| 9 — Consistency | "API client does not reference /api" | Ensure `frontend/src/api/client.js` uses baseURL `/api` |

---

## Recommended Test Order on a Fresh Machine

1. **Install Node.js ≥ 18** from https://nodejs.org
2. **Clone the repository**: `git clone <repo-url> && cd NovaBank`
3. **Install backend dependencies**: `cd backend && npm install`
4. **Install frontend dependencies**: `cd frontend && npm install`
5. **Install root dependencies**: `cd .. && npm install`
6. **Run system requirements check**: `npm run test:infra:system`
   — Fix any failures before continuing.
7. **Run environment config check**: `npm run test:infra:env`
8. **Seed the database**: `cd backend && node src/db/schema.js`
9. **Run backend tests** (no server needed):
   ```bash
   cd backend && npm test
   ```
10. **Run frontend tests** (no server needed):
    ```bash
    cd frontend && npm test
    ```
11. **Run infra static checks** (no server needed):
    ```bash
    cd .. && npm run test:infra:system && npm run test:infra:env && npm run test:infra:consistency
    ```
12. **Start the backend**: `cd backend && npm run dev` (leave running)
13. **Start the frontend**: `cd frontend && npm run dev` (leave running)
14. **Run live infra checks**:
    ```bash
    npm run test:infra:ports && npm run test:infra:db && npm run test:infra:api && npm run test:infra:frontend
    ```
15. **Run the full suite**: `npm run test:all:skip-infra`
    — Skips stages 1–9 (infra); runs all 136 backend + 212 frontend tests.
16. **Run everything**: `npm run test:all`
