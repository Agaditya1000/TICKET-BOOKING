# Complete Vercel Setup Guide

## ✅ Step 1: Run Database Migrations

### Option A: Using PowerShell Script (Recommended)
```powershell
cd "c:\Users\agadi\Downloads\ticket b\Backend"
.\run-migration-neon.ps1
```

### Option B: Using Neon SQL Editor (Easier)
1. Go to: https://console.neon.tech
2. Select your project: `neondb`
3. Click **"SQL Editor"** in the left sidebar
4. Copy the entire contents of `migrations/001_create_tables.sql`
5. Paste into the SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`
7. You should see "Success" message

### Option C: Using psql Command Line
```powershell
cd "c:\Users\agadi\Downloads\ticket b\Backend"
$env:PGPASSWORD="npg_On4PqTe6LjHV"
psql "postgresql://neondb_owner:npg_On4PqTe6LjHV@ep-jolly-lab-ah2ku3qx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" -f migrations/001_create_tables.sql
```

---

## ✅ Step 2: Update DATABASE_URL in Vercel

### Exact Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Select Your Project**
   - Find your ticket booking backend project
   - Click on it

3. **Go to Settings**
   - Click **"Settings"** tab at the top
   - Click **"Environment Variables"** in the left sidebar

4. **Update DATABASE_URL**
   - Find `DATABASE_URL` in the list
   - Click the **edit/pencil icon** or **three dots** → **Edit**
   - **Delete** the old value (the localhost one)
   - **Paste** this new value:
     ```
     postgresql://neondb_owner:npg_On4PqTe6LjHV@ep-jolly-lab-ah2ku3qx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - Make sure **all environments** are selected:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **"Save"**

5. **Verify**
   - You should see `DATABASE_URL` with the Neon connection string
   - The value should start with `postgresql://neondb_owner...`

---

## ✅ Step 3: Redeploy

After updating the environment variable:

1. **Automatic Redeploy**
   - Vercel should automatically detect the change and redeploy
   - Wait 1-2 minutes

2. **Manual Redeploy (if needed)**
   - Go to **"Deployments"** tab
   - Find the latest deployment
   - Click **three dots** → **"Redeploy"**
   - Or click **"Redeploy"** button

---

## ✅ Step 4: Test Your Backend

After deployment completes:

1. **Health Check**
   - Visit: `https://your-backend-url.vercel.app/health`
   - Should return: `{"ok":true}`

2. **API Test**
   - Visit: `https://your-backend-url.vercel.app/api/shows`
   - Should return: `[]` (empty array)

3. **If you get errors:**
   - Check Vercel deployment logs
   - Verify `DATABASE_URL` is set correctly
   - Make sure migrations ran successfully

---

## ✅ Step 5: Update Frontend

Once backend is working:

1. **Get Your Backend URL**
   - Copy your Vercel backend URL (e.g., `https://xxx.vercel.app`)

2. **Update Netlify**
   - Go to: https://app.netlify.com/sites/merry-squirrel-df1b83/configuration/env
   - Add/Update environment variable:
     - **Key**: `VITE_API_URL`
     - **Value**: Your Vercel backend URL
   - **Save**

3. **Redeploy Frontend**
   - Go to Netlify Deploys tab
   - Click **"Trigger deploy"** → **"Deploy site"**

4. **Test Frontend**
   - Visit: https://merry-squirrel-df1b83.netlify.app
   - Should work without network errors!

---

## 🎉 Done!

Your full stack should now be working:
- ✅ Backend on Vercel with Neon database
- ✅ Frontend on Netlify connected to backend
- ✅ Database migrations completed
