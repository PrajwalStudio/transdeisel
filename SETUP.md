# TransDiesel EMS — Setup Guide

A full-stack Equipment Management System built with **React + Vite** (frontend) and **Node.js + Express** (backend), using **PostgreSQL** as the database.

---

## Prerequisites

Install the following software before proceeding:

| Software | Version | Download |
|---|---|---|
| **Node.js** | v18 or later (LTS recommended) | https://nodejs.org |
| **npm** | Comes with Node.js | — |
| **PostgreSQL** | v14 or later | https://www.postgresql.org/download |

> **Tip:** After installing, verify with:
> ```bash
> node -v
> npm -v
> psql --version
> ```

---

## 1. Clone / Copy the Project

Copy the `transdeisel-ems` folder to the new PC.

The project structure should look like:

```
transdeisel-ems/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── utils/
│   ├── validators/
│   ├── .env          <- you will edit this
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── package.json
├── schema.sql        <- database schema
└── SETUP.md
```

---

## 2. PostgreSQL Database Setup

### 2a. Open pgAdmin or psql

Log in with the `postgres` superuser account (set during PostgreSQL installation).

### 2b. Create the database

```sql
CREATE DATABASE service_db;
```

### 2c. Run the schema

In **psql**, run:

```bash
psql -U postgres -d service_db -f path\to\transdeisel-ems\schema.sql
```

Or in **pgAdmin**: open the Query Tool on `service_db`, paste the contents of `schema.sql`, and execute.

This creates all required tables:
- `equipment`
- `service_request`
- `service_orders`
- `invoices`

---

## 3. Backend Setup

### 3a. Navigate to the backend folder

```bash
cd transdeisel-ems\backend
```

### 3b. Install dependencies

```bash
npm install
```

This installs:
- `express` — web framework
- `pg` — PostgreSQL client
- `dotenv` — environment variables
- `cors` — cross-origin requests
- `helmet` — security headers
- `morgan` — request logging
- `express-rate-limit` — rate limiting
- `express-validator` — input validation
- `sanitize-html` — HTML sanitisation
- `nodemon` — auto-restart on file changes

### 3c. Configure environment variables

Open `backend\.env` and update the values to match the new PC's PostgreSQL setup:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=service_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

> **Important:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with the actual password you set for the `postgres` user during PostgreSQL installation.

### 3d. Start the backend server

```bash
npm run dev
```

You should see:
```
Server running on port 5000
```

The API is now available at: `http://localhost:5000/api`

---

## 4. Frontend Setup

Open a **new terminal** (keep the backend terminal running).

### 4a. Navigate to the frontend folder

```bash
cd transdeisel-ems\frontend
```

### 4b. Install dependencies

```bash
npm install
```

This installs:
- `react` & `react-dom` — UI framework
- `react-router-dom` — client-side routing
- `axios` — HTTP requests
- `jspdf` & `jspdf-autotable` — PDF export
- `xlsx` — Excel export
- `vite` — build tool & dev server
- `tailwindcss` — CSS utility framework

### 4c. Start the frontend dev server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  Local:   http://localhost:5173/
```

Open your browser and go to: **http://localhost:5173**

---

## 5. Running Both Servers

You need **two terminals open at the same time**:

| Terminal | Folder | Command |
|---|---|---|
| Terminal 1 (Backend) | `transdeisel-ems\backend` | `npm run dev` |
| Terminal 2 (Frontend) | `transdeisel-ems\frontend` | `npm run dev` |

---

## 6. Quick Verification Checklist

- [ ] PostgreSQL is running (check Windows Services or pgAdmin)
- [ ] `service_db` database exists with all tables created from `schema.sql`
- [ ] `backend\.env` has the correct DB password
- [ ] Backend server starts on port `5000` without errors
- [ ] Frontend starts on port `5173` without errors
- [ ] App loads at `http://localhost:5173` in the browser
- [ ] Dashboard shows data (confirms DB connection is working)

---

## 7. Common Issues & Fixes

### ECONNREFUSED or DB connection error on backend startup
- Make sure the PostgreSQL service is running.
- Double-check `DB_PASSWORD` in `backend\.env`.
- Ensure `service_db` database exists in PostgreSQL.

### npm install fails
- Make sure Node.js v18+ is installed (`node -v`).
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again.

### Frontend shows blank page or network errors
- Make sure the backend is running on port `5000`.
- Check that `CORS_ORIGINS=http://localhost:5173` is set in `backend\.env`.

### psql command not found
- Add PostgreSQL `bin` folder to your system PATH (e.g., `C:\Program Files\PostgreSQL\16\bin`).

### Tables not created / schema errors
- Make sure you are running `schema.sql` against the correct database (`service_db`).
- Check PostgreSQL version (v14 or later required).

---

## 8. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TailwindCSS 3 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 14+ |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Excel Export | SheetJS (xlsx) |
| HTTP Client | Axios |
| Routing | React Router DOM v6 |
