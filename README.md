# Arthiq — Smart Personal Finance Ledger

A full-stack digital ledger application to track money received (credits) and spent (debits), with classic ledger book styling, interactive summaries, company sharing, and PDF export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL (pgAdmin) |
| Auth | Google OAuth 2.0 (free) |
| PDF | PDFKit |

## Features

- **Landing page** — Describes the app, features, and security
- **Google OAuth** — Sign in / register via Google (top-right)
- **Multiple companies** — Create ledgers for HOME, business, etc., each password-protected
- **Ledger entries** — Date, particulars, credit/debit (+/−), amount, running balance
- **Ghost balance** — Balance shown faintly after every entry; permanent only when ticked (✓)
- **Summary & charts** — Bar charts, pie graphs, monthly trends
- **Sharing** — Share companies via registered email with Read / Write / Both roles
- **Entry attribution** — Shows who recorded each entry
- **PDF export** — Print ledger in book style for a custom date range
- **Dark / Light mode** — Toggle in header

## Project Structure

```
├── backend/          # Express API
├── frontend/         # React app
├── database/         # PostgreSQL init script
└── README.md
```

## Setup Instructions

### 1. PostgreSQL Database

1. Open **pgAdmin** and create a database named `arthiq`
2. Run the SQL script: `database/init.sql` (skip the `CREATE DATABASE` line if already created)

### 2. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use existing)
3. Configure **OAuth consent screen** (External, add your email as test user)
4. Create **OAuth 2.0 Client ID** → Web application
5. Add authorized redirect URI: `http://localhost:5173/api/auth/google/callback`
   (Use port **5173** so the login cookie works with the Vite dev server.)
6. Copy Client ID and Client Secret

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, Google credentials, and secrets
npm install
npm run dev
```

Backend runs at **http://localhost:5000**

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Environment Variables (backend/.env)

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/arthiq
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=long_random_string_here
JWT_SECRET=another_long_random_string
FRONTEND_URL=http://localhost:5173
```

## Usage Flow

1. Visit the landing page and click **Sign in with Google**
2. On the dashboard, click **New Company** — set name and password
3. Open a company → enter password to unlock
4. Add ledger entries (credit = money in, debit = money out)
5. Tick ✓ on an entry to make its balance permanent on the ledger
6. Switch to **Summary** for charts, **Share** to invite others, **Export PDF** to download

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/me` | Current user |
| GET | `/api/companies` | List companies |
| POST | `/api/companies` | Create company |
| POST | `/api/companies/:id/unlock` | Unlock with password |
| POST | `/api/companies/:id/share` | Share with user |
| GET | `/api/ledger/:id` | Get entries |
| POST | `/api/ledger/:id` | Add entry |
| GET | `/api/ledger/:id/summary` | Get summary stats |
| GET | `/api/pdf/:id?from=&to=` | Download PDF |

## License

MIT
