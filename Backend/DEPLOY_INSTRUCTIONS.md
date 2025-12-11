# Backend Deployment Instructions

## Quick Deploy to Vercel

I've fixed the configuration files. Follow these steps:

### Step 1: Push the Fixed Code
```powershell
cd "c:\Users\agadi\Downloads\ticket b"
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### Step 2: Deploy on Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Sign up/Login** with your GitHub account
3. **Import Project**:
   - Click "Add New" → "Project"
   - Select your repository: `Agaditya1000/TICKET-BOOKING`
4. **Configure Project**:
   - **Root Directory**: Click "Edit" → Select `Backend` folder
   - **Framework Preset**: Other (or leave default)
   - **Build Command**: Leave default (will use `vercel-build`)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - **Key**: `DATABASE_URL`
     - **Value**: Your PostgreSQL connection string (from Neon/Supabase)
     - **Environments**: Select all (Production, Preview, Development)
   - Click "Save"
6. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

### Step 3: Get Your Backend URL

After deployment completes:
- You'll see a URL like: `https://ticket-backend-xxx.vercel.app`
- **Copy this URL** - this is your backend API URL
- Test it: Visit `https://your-backend-url.vercel.app/health`
  - Should return: `{"ok":true}`

### Step 4: Update Frontend

1. Go to Netlify: https://app.netlify.com/sites/merry-squirrel-df1b83/configuration/env
2. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Vercel backend URL (from Step 3)
3. Redeploy Frontend:
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

### Step 5: Test Everything

- ✅ Backend Health: `https://your-backend.vercel.app/health` → `{"ok":true}`
- ✅ Backend API: `https://your-backend.vercel.app/api/shows` → `[]`
- ✅ Frontend: `https://merry-squirrel-df1b83.netlify.app` → Should work!

## Troubleshooting

### If you get 404 errors:
1. Check that Root Directory is set to `Backend` in Vercel
2. Verify `vercel.json` exists in the Backend folder
3. Check build logs in Vercel dashboard for errors

### If database connection fails:
1. Verify `DATABASE_URL` is set correctly in Vercel
2. Make sure you ran the database migrations
3. Check that your database allows external connections

### If frontend still shows network error:
1. Verify `VITE_API_URL` is set in Netlify
2. Make sure you redeployed after adding the variable
3. Check browser console for actual error messages
