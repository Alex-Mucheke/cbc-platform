# CBC Platform Backend

Node.js + Express API with SQLite. Handles auth (register, login, session).

## Setup

```bash
cd backend
npm install
```

Optional: copy `.env.example` to `.env` and set `PORT` and `JWT_SECRET`.

## Run

```bash
npm start
# or with auto-reload:
npm run dev
```

Server runs at **http://localhost:3001**.

## API

- `POST /api/auth/register` — body: `{ email, password, fullName, userType }` → returns `{ user, profile, token }`
- `POST /api/auth/login` — body: `{ email, password }` → returns `{ user, profile, token }`
- `GET /api/auth/me` — header `Authorization: Bearer <token>` → returns `{ user, profile }`
- `GET /api/health` — health check

## Frontend

Set `VITE_API_URL=http://localhost:3001` in the project root `.env` and restart the Vite dev server. The app will use this backend instead of localStorage auth.
