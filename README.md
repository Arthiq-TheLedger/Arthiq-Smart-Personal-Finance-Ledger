# Arthiq — Smart Personal Finance Ledger

A full-stack digital ledger application to track money received (credits) and spent (debits), with classic ledger book styling, interactive summaries, company sharing, and PDF export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL (local pgAdmin or Supabase) |
| Auth | Google OAuth 2.0 (free) |
| PDF | PDFKit |

## Features

- **Landing page** — Describes the app, features, and security
- **Google OAuth** — Sign in / register via Google (top-right)
- **Multiple companies** — Create ledgers for HOME, business, etc., each password-protected
- **Ledger entries** — Date, particulars, credit/debit (+/−), amount, running balance
- **Particulars autocomplete** — Suggestions match what you type (not the full list)
- **Ledger filters** — Filter by particular name and date range (e.g. 24 Jun – 24 Jul 2026)
- **Ghost balance** — Balance shown faintly after every entry; permanent only when ticked (✓)
- **Summary & charts** — Monthly/yearly overview toggle, pie chart, trends, top expenses
- **Sharing** — Share companies via registered email with Read / Write / Both roles
- **Entry attribution** — Shows who recorded each entry
- **PDF export** — Print ledger in book style for a custom date range
- **Dark / Light mode** — Toggle in header

## Project Structure

```
├── backend/              # Express API
├── frontend/             # React app
├── database/             # SQL schemas (init.sql, supabase.sql)
└── README.md
```

## Setup Instructions

### 1. PostgreSQL Database

**Local (pgAdmin):** create database `arthiq` and run `database/init.sql`.

**Supabase (production):**
1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → run `database/supabase.sql`
3. Go to **Project Settings → Database → Connection string** (URI mode)
4. Use the **Session pooler** URI and append `?sslmode=require` if missing
5. Set `DATABASE_URL` on Render to that URI

**Switching from CockroachDB to Supabase:**
1. Run `database/supabase.sql` in Supabase SQL Editor
2. Update `DATABASE_URL` on Render with the Supabase connection string
3. Redeploy Render — no code changes needed beyond the connection string
4. Re-create companies and entries (or export/import data manually)

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
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/arthiq
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback
SESSION_SECRET=long_random_string_here
JWT_SECRET=another_long_random_string
FRONTEND_URL=http://localhost:5173
```

## Usage Flow

1. Visit the landing page and click **Sign in with Google**
2. On the dashboard, click **New Company** — set name and password
3. Open a company → enter password to unlock
4. Add ledger entries (credit = money in, debit = money out)
5. Use **Filter Entries** to search by particular or date range
6. Tick ✓ on an entry to make its balance permanent on the ledger
7. Switch to **Summary** for charts (Monthly / Yearly toggle), **Share** to invite others, **Export PDF** to download

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/me` | Current user |
| GET | `/api/companies` | List companies |
| POST | `/api/companies` | Create company |
| POST | `/api/companies/:id/unlock` | Unlock with password |
| POST | `/api/companies/:id/share` | Share with user |
| GET | `/api/ledger/:id` | Get entries (`?from=&to=&title=`) |
| GET | `/api/ledger/:id/titles?q=` | Particular autocomplete suggestions |
| POST | `/api/ledger/:id` | Add entry |
| GET | `/api/ledger/:id/summary` | Summary stats (`?from=&to=`) |
| GET | `/api/pdf/:id?from=&to=&title=` | Download PDF |

## License

MIT
