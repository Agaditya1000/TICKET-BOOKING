# Deploying Frontend to Vercel

This document explains how to deploy the Frontend (Vite + React) to Vercel.

Environment variables (set in Vercel Project > Settings > Environment Variables):

- `VITE_API_URL` — the public URL of your deployed backend, e.g. `https://my-backend.vercel.app`.

Vercel project settings:

- Root Directory: `Frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Local build & test commands:

```powershell
cd Frontend
npm install
npm run build
npm run preview   # preview the production build locally
```

Notes:

- The frontend reads the API base URL from `import.meta.env.VITE_API_URL`.
- Set `VITE_API_URL` in Vercel before deploying so the built site contains the correct backend URL, or update it and redeploy if changed.
