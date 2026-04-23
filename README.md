# Dr. Ai Prompt Enhance

Production-ready full-stack prompt engineering platform.

## Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + SSE
- Database: MongoDB (`AiPromptEnhance`)
- Auth: JWT (7 days), bcrypt password hashing

## Local Run

1. Create `backend/.env` from `backend/.env.example`
2. Create `frontend/.env` from `frontend/.env.example`
3. Install dependencies:
   - `npm install`
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
4. Start app:
   - `npm run dev`
5. Open frontend:
   - `http://localhost:5173`

## Deployment (Frontend and Backend on Different Hosts)

1. Backend environment (on backend host):
   - `PORT=5000`
   - `MONGO_URI=<your mongo connection string>`
   - `MONGO_DB_NAME=AiPromptEnhance`
   - `JWT_SECRET=<strong random secret>`
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_ORIGIN=https://your-frontend-domain.com`

   Render example:
   - `FRONTEND_ORIGIN=https://aipromptenhance.vercel.app,https://*.vercel.app`
   - Do not include a path (for example, not `https://aipromptenhance.vercel.app/login`).

2. Frontend environment (on frontend host):
   - `VITE_API_BASE=https://your-backend-domain.com/api`

   Vercel example:
   - `VITE_API_BASE=https://aipromptenhance.onrender.com/api`
   - After editing env vars in Vercel, redeploy so the new value is baked into the build.

3. CORS:
   - Set `FRONTEND_ORIGIN` to your deployed frontend URL (comma-separated if multiple domains).

4. Important security rule:
   - Never commit real credentials (`.env` is ignored).
   - Commit only `.env.example` placeholder files.

## Admin Features

- Add model/provider from dashboard
- Enable/disable model access by role
- Remove model completely from admin dashboard

## Core API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/models`
- `POST /api/chat/message` (SSE streaming)
- `GET /api/chats`
- `DELETE /api/chats/:id`
- `GET /api/admin/models`
- `POST /api/admin/models`
- `PATCH /api/admin/models/:id`
- `DELETE /api/admin/models/:id`

## Notes

- Backend enforces role + model permissions and rate limits.
- Free users have max 10 saved chats with 24h expiry.
- Paid users get templates, multi-model comparison, analyzer, and playground controls.
