# Deploying Backend to Vercel

This document explains how to deploy the Backend as a serverless function to Vercel.

Required environment variables (set in Vercel Project > Settings > Environment Variables):

- `DATABASE_URL` — your Postgres connection string (format: `postgres://user:pass@host:port/dbname`).
- Any other secrets from your local `.env` (e.g. `OTHER_SECRET`, etc.)

Vercel project settings:

- Root Directory: `Backend`
- Build Command: leave default (Vercel will run `npm install` then `npm run vercel-build`).
- Output: not required (serverless functions deployed from `api/`).

How it works in this repo:

- `Backend/api/index.ts` is the Vercel serverless entry that forwards requests to the Express `app`.
- `vercel.json` routes all requests to `/api/index.ts` so the Express app handles routing.
- TypeScript is compiled on build via the `vercel-build` script (`tsc`).

Local build & test commands:

```powershell
cd Backend
npm install
npm run vercel-build   # compiles TypeScript
npm run dev           # run locally (requires DATABASE_URL in .env)
```

Notes:

- Ensure `DATABASE_URL` points to a reachable Postgres instance; serverless functions cannot use a local DB unless accessible over the network.
- If you need background workers (expiry worker), consider running them outside Vercel (e.g., Heroku, Fly, or a container) because Vercel serverless functions are stateless and short-lived.
