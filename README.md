# NovaBank - QA Testing Banking Application

A full-featured dummy banking application built for QA testing teams. Includes all core net banking features with a modern UI, REST API backend, and SQLite database.

## Quick Start

### Prerequisites
- Node.js 18+

### Installation & Running

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

Start both servers (in separate terminals):

```bash
# Terminal 1 - Backend (port 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5174)
cd frontend
npm run dev
```

Open http://localhost:5174 in your browser.

## Test Credentials

Displayed on the login page. Click to auto-fill.

| User       | Email              | Password  | Balance      |
|------------|--------------------|-----------|--------------|
| John Doe   | john@novabank.com  | Test@1234 | $998,758.51  |
| Jane Smith | jane@novabank.com  | Test@1234 | $1,000,305.01|

New registered users start with **$1,000,000**.

## Features

### Authentication
- User registration with auto-generated account number
- JWT-based login/logout
- Protected routes

### Dashboard
- Balance overview with account details
- Income vs spending summary
- Recent transactions (last 5)
- Spending by category pie chart
- Quick action shortcuts

### Fund Transfer
- Transfer to registered payees only
- **$1,000 max per transaction** (server-enforced)
- OTP verification step (use `123456` for testing)
- Rate limited: max 5 transfers per minute
- Real-time balance update for both sender and receiver (if both are NovaBank users)

### Payee Management
- Add/remove payees
- Search and filter payees
- Payee details: name, account number, bank, routing number

### Transaction History
- Full transaction list with pagination
- Filter by: type (credit/debit), category, date range, amount range
- Search by description or reference number
- Export to CSV

### Bill Payments
- Pre-loaded utility bills (electricity, water, internet, phone)
- Pay with one click
- Due date tracking with urgency badges

### Fixed Deposits
- Create FDs with 5 tenure options (3, 6, 12, 24, 36 months)
- Interest rates: 4.5% - 7.5%
- Estimated return calculator
- Break FD early (1% penalty on interest rate)

### Additional Features
- Dark mode / Light mode toggle
- Notification bell with unread count
- Profile editing
- Responsive design (desktop + tablet)

## QA Testing Helpers

### Data Test IDs
All interactive elements have `data-testid` attributes for Selenium/Playwright automation:

| Element                | Test ID                    |
|------------------------|----------------------------|
| Login form             | `login-form`               |
| Login email input      | `login-email`              |
| Login password input   | `login-password`           |
| Login submit button    | `login-submit`             |
| Test credentials panel | `test-credentials`         |
| Register form          | `register-form`            |
| Sidebar                | `sidebar`                  |
| Sidebar navigation     | `sidebar-nav`              |
| Nav links              | `nav-dashboard`, `nav-transfer`, etc. |
| Theme toggle           | `theme-toggle`             |
| Notifications bell     | `notifications-bell`       |
| Menu toggle (mobile)   | `menu-toggle`              |
| Logout button          | `logout-button`            |
| Dashboard              | `dashboard`                |
| Balance amount         | `balance-amount`           |
| Transfer page          | `transfer-page`            |
| Transfer payee select  | `transfer-payee`           |
| Transfer amount input  | `transfer-amount`          |
| Transfer OTP input     | `transfer-otp`             |
| Transfer submit        | `transfer-submit`          |
| Payees page            | `payees-page`              |
| Add payee button       | `add-payee-button`         |
| Transactions table     | `transactions-table`       |
| Filter controls        | `filter-search`, `filter-type`, `filter-category` |
| Pagination             | `prev-page`, `next-page`   |
| Bills page             | `bills-page`               |
| Fixed deposits page    | `fd-page`                  |
| Profile page           | `profile-page`             |

### Admin API Endpoints

**Reset database to initial state:**
```bash
curl -X POST http://localhost:3000/api/admin/reset
```

**Health check:**
```bash
curl http://localhost:3000/api/health
```

### Rate Limiting
The transfer endpoint is rate-limited to 5 transfers per minute per user. Exceeding returns HTTP 429 with a `retryAfter` field.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, Vite 7, TailwindCSS 4  |
| Backend   | Node.js, Express.js               |
| Database  | SQLite (via better-sqlite3)       |
| Auth      | JWT (jsonwebtoken, bcryptjs)      |
| Charting  | Recharts                          |
| Icons     | Lucide React                      |
| Toasts    | React Hot Toast                   |
| Routing   | React Router v7                   |
| Validation| Zod (backend)                     |

## API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

| Method | Endpoint                      | Auth | Description                    |
|--------|-------------------------------|------|--------------------------------|
| POST   | /auth/register                | No   | Create new account             |
| POST   | /auth/login                   | No   | Login                          |
| GET    | /account/profile              | Yes  | Get user profile               |
| GET    | /account/balance              | Yes  | Get balance                    |
| PUT    | /account/profile              | Yes  | Update name/phone              |
| GET    | /payees                       | Yes  | List payees                    |
| POST   | /payees                       | Yes  | Add payee                      |
| DELETE | /payees/:id                   | Yes  | Remove payee                   |
| POST   | /transfers                    | Yes  | Transfer money                 |
| GET    | /transactions                 | Yes  | List with filters/pagination   |
| GET    | /transactions/recent          | Yes  | Last 5 transactions            |
| GET    | /transactions/summary         | Yes  | Spending summary               |
| GET    | /transactions/export          | Yes  | Download CSV                   |
| GET    | /bills                        | Yes  | List bills                     |
| POST   | /bills/:id/pay                | Yes  | Pay a bill                     |
| GET    | /fixed-deposits               | Yes  | List FDs + rates               |
| POST   | /fixed-deposits               | Yes  | Create FD                      |
| POST   | /fixed-deposits/:id/break     | Yes  | Break FD early                 |
| GET    | /notifications                | Yes  | List notifications             |
| PUT    | /notifications/:id/read       | Yes  | Mark as read                   |
| PUT    | /notifications/read-all       | Yes  | Mark all as read               |
| POST   | /admin/reset                  | No   | Reset DB to seed state         |
| GET    | /health                       | No   | API health check               |
