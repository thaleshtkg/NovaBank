# NovaBank - QA Testing Banking Application
## Project Progress Tracker

> **Last Updated:** March 4, 2026
> **Project Status:** Running - All pages wired, servers up

---

## Overview

Full-stack dummy banking application for QA testing teams. React frontend + Node.js/Express backend + SQLite database.

| Layer | Tech | Status |
|-------|------|--------|
| Frontend | React 19 + Vite 7 + TailwindCSS 4 | In Progress |
| Backend | Express 4 + better-sqlite3 | Complete |
| Database | SQLite (auto-seed on startup) | Complete |
| Auth | JWT (jsonwebtoken + bcryptjs) | Complete |
| Validation | Zod (backend) | Complete |

---

## Backend - API Routes

| # | Feature | Route(s) | File | Status |
|---|---------|----------|------|--------|
| 1 | User Registration | `POST /api/auth/register` | `backend/src/routes/auth.js` | ✅ Complete |
| 2 | User Login | `POST /api/auth/login` | `backend/src/routes/auth.js` | ✅ Complete |
| 3 | Account Balance | `GET /api/account/balance` | `backend/src/routes/account.js` | ✅ Complete |
| 4 | Account Profile | `GET/PUT /api/account/profile` | `backend/src/routes/account.js` | ✅ Complete |
| 5 | Payees CRUD | `GET/POST/DELETE /api/payees` | `backend/src/routes/payees.js` | ✅ Complete |
| 6 | Fund Transfer | `POST /api/transfers`, `GET /api/transfers/history` | `backend/src/routes/transfers.js` | ✅ Complete |
| 7 | Transactions | `GET /api/transactions`, `/recent`, `/summary`, `/export` | `backend/src/routes/transactions.js` | ✅ Complete |
| 8 | Bill Payments | `GET /api/bills`, `POST /api/bills/:id/pay` | `backend/src/routes/bills.js` | ✅ Complete |
| 9 | Fixed Deposits | `GET/POST /api/fixed-deposits`, `POST /:id/break` | `backend/src/routes/fixedDeposits.js` | ✅ Complete |
| 10 | Notifications | `GET /api/notifications`, `PUT /read-all` | `backend/src/routes/notifications.js` | ✅ Complete |
| 11 | Admin DB Reset | `POST /api/admin/reset` | `backend/src/routes/admin.js` | ✅ Complete |

### Backend Middleware

| Feature | File | Status |
|---------|------|--------|
| JWT Auth Middleware | `backend/src/middleware/auth.js` | ✅ Complete |
| Rate Limiter (5 transfers/min) | `backend/src/middleware/rateLimiter.js` | ✅ Complete |

### Database

| Feature | File | Status |
|---------|------|--------|
| SQLite Connection | `backend/src/db/connection.js` | ✅ Complete |
| Schema + Seed Data | `backend/src/db/schema.js` | ✅ Complete |
| Seed Users (John/Jane) | `backend/src/db/schema.js` | ✅ Complete |
| Seed Transactions | `backend/src/db/schema.js` | ✅ Complete |
| Seed Payees | `backend/src/db/schema.js` | ✅ Complete |
| Seed Bills | `backend/src/db/schema.js` | ✅ Complete |

---

## Frontend - Core Infrastructure

| # | Feature | File(s) | Status |
|---|---------|---------|--------|
| 1 | Vite + React Setup | `frontend/vite.config.js`, `frontend/main.jsx` | ✅ Complete |
| 2 | TailwindCSS Styling | `frontend/src/index.css` | ✅ Complete |
| 3 | API Client (Axios + JWT) | `frontend/src/api/client.js` | ✅ Complete |
| 4 | Auth Context | `frontend/src/context/AuthContext.jsx` | ✅ Complete |
| 5 | Theme Context (Dark Mode) | `frontend/src/context/ThemeContext.jsx` | ✅ Complete |
| 6 | Router + App Shell | `frontend/src/App.jsx` | ✅ Complete - All pages wired |
| 7 | Vite Proxy (`/api` → backend) | `frontend/vite.config.js` | ✅ Complete |

---

## Frontend - UI Components

| # | Component | File | Status |
|---|-----------|------|--------|
| 1 | Button | `frontend/src/components/ui/Button.jsx` | ✅ Complete |
| 2 | Input | `frontend/src/components/ui/Input.jsx` | ✅ Complete |
| 3 | Card | `frontend/src/components/ui/Card.jsx` | ✅ Complete |
| 4 | Modal | `frontend/src/components/ui/Modal.jsx` | ✅ Complete |
| 5 | Badge | `frontend/src/components/ui/Badge.jsx` | ✅ Complete |
| 6 | Select | `frontend/src/components/ui/Select.jsx` | ✅ Complete |
| 7 | Layout (Sidebar + Header) | `frontend/src/components/Layout.jsx` | ✅ Complete |
| 8 | Sidebar Navigation | `frontend/src/components/Sidebar.jsx` | ✅ Complete |
| 9 | Spending Chart (Recharts) | `frontend/src/components/SpendingChart.jsx` | ✅ Complete |

---

## Frontend - Pages

| # | Page | File | Route | Wired in Router? | Status |
|---|------|------|-------|-------------------|--------|
| 1 | Login | `frontend/src/pages/Login.jsx` | `/login` | ✅ Yes | ✅ Complete |
| 2 | Register | `frontend/src/pages/Register.jsx` | `/register` | ✅ Yes | ✅ Complete |
| 3 | Dashboard | `frontend/src/pages/Dashboard.jsx` | `/dashboard` | ✅ Yes | ✅ Complete |
| 4 | Transfer Money | `frontend/src/pages/Transfer.jsx` | `/transfer` | ✅ Yes | ✅ Complete |
| 5 | Payees | `frontend/src/pages/Payees.jsx` | `/payees` | ✅ Yes | ✅ Complete |
| 6 | Transactions | `frontend/src/pages/Transactions.jsx` | `/transactions` | ✅ Yes | ✅ Complete |
| 7 | Bill Payments | `frontend/src/pages/Bills.jsx` | `/bills` | ✅ Yes | ✅ Complete |
| 8 | Fixed Deposits | `frontend/src/pages/FixedDeposits.jsx` | `/fixed-deposits` | ✅ Yes | ✅ Complete |
| 9 | Profile | `frontend/src/pages/Profile.jsx` | `/profile` | ✅ Yes | ✅ Complete |

---

## Frontend - Page Wiring (Resolved)

All routes in `App.jsx` are now wired to their actual page components. PlaceholderPage has been removed. FixedDeposits and Profile pages were created and connected.

---

## Testing

| # | Test Type | Status |
|---|-----------|--------|
| 1 | Unit Tests | ❌ Not Started |
| 2 | Smoke Tests | ❌ Not Started |
| 3 | E2E Chrome/Playwright Tests | ❌ Not Started |
| 4 | `data-testid` Attributes | ⚠️ Partial - Some pages have them |

---

## QA-Specific Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Test credentials on login page (john@novabank.com / jane@novabank.com) | ✅ Complete |
| 2 | $1,000,000 initial balance for new users | ✅ Complete |
| 3 | $1,000 max transfer limit (server-enforced) | ✅ Complete |
| 4 | Dummy OTP (always "123456") | ✅ Complete |
| 5 | Dark/Light mode toggle | ✅ Complete |
| 6 | Notifications bell with unread count | ✅ Complete |
| 7 | Admin DB reset endpoint (`POST /api/admin/reset`) | ✅ Complete |
| 8 | Rate limiting (5 transfers/min) | ✅ Complete |
| 9 | `data-testid` attributes for automation | ⚠️ Partial |

---

## Documentation & DevOps

| # | Item | Status |
|---|------|--------|
| 1 | README.md | ❌ Not Created |
| 2 | Progress Tracker (this file) | ✅ Created |
| 3 | Git Repository Initialized | ❌ No |

---

## Summary

| Category | Complete | Partial | Not Started | Total |
|----------|----------|---------|-------------|-------|
| Backend API Routes | 11 | 0 | 0 | 11 |
| Backend Middleware | 2 | 0 | 0 | 2 |
| Database | 6 | 0 | 0 | 6 |
| Frontend Infrastructure | 7 | 0 | 0 | 7 |
| Frontend UI Components | 9 | 0 | 0 | 9 |
| Frontend Pages | 9 | 0 | 0 | 9 |
| Testing | 0 | 1 | 3 | 4 |
| Documentation | 1 | 0 | 1 | 2 |
| **Totals** | **45** | **1** | **4** | **50** |

---

## Completed Steps

1. ~~Wire existing pages into App.jsx~~ — Done
2. ~~Build Fixed Deposits page~~ — Done (`frontend/src/pages/FixedDeposits.jsx`)
3. ~~Build Profile page~~ — Done (`frontend/src/pages/Profile.jsx`)
4. ~~Fix App.jsx routing~~ — Done, PlaceholderPage removed

## Next Steps (Priority Order)

1. **Add comprehensive `data-testid` attributes** across all pages for test automation
2. **Write unit tests** for backend API routes
3. **Write smoke tests** for critical flows (login, register, transfer)
4. **Write E2E Playwright/Chrome tests** for full user journeys
5. **Create README.md** with setup instructions, test credentials, and architecture overview
6. **Initialize Git repository** and make initial commit

---

## Test Credentials (Quick Reference)

| User | Email | Password |
|------|-------|----------|
| John Doe | john@novabank.com | Test@1234 |
| Jane Smith | jane@novabank.com | Test@1234 |

## How to Run

```bash
# Backend (Terminal 1)
cd backend
npm install
npm run dev
# Runs on http://localhost:3000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5174
```

## Current Server Status (as of March 4, 2026)

| Server | URL | Status |
|--------|-----|--------|
| Backend API | http://localhost:3000 | Running |
| Frontend App | http://localhost:5174 | Running |
