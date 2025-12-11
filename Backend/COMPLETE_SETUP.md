# 🚀 Complete Setup - Copy & Paste Guide

## ✅ STEP 1: Run Database Migration (2 minutes)

### Method: Neon SQL Editor (Easiest)

1. **Open Neon Dashboard**
   - Go to: https://console.neon.tech
   - Login and select your project: `neondb`

2. **Open SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New query"** or use the editor

3. **Copy & Paste SQL**
   - Open file: `Backend/NEON_MIGRATION.sql`
   - Copy **ALL** the SQL code
   - Paste into Neon SQL Editor
   - Click **"Run"** button (or press `Ctrl+Enter`)

4. **Verify Success**
   - You should see: "Success" or "Query executed successfully"
   - Tables are now created!

---

## ✅ STEP 2: Update Vercel Environment Variable (3 minutes)

### Exact Steps:

1. **Go to Vercel**
   - Visit: https://vercel.com/dashboard
   - Login

2. **Select Your Project**
   - Find your backend project
   - Click on it

3. **Go to Environment Variables**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in left sidebar

4. **Update DATABASE_URL**
   - Find `DATABASE_URL` in the list
   - Click **three dots (⋯)** → **"Edit"**
   - **DELETE** the old value completely
   - **PASTE** this exact value:
     ```
     postgresql://neondb_owner:npg_On4PqTe6LjHV@ep-jolly-lab-ah2ku3qx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
     ```
   - **Check ALL boxes:**
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

5. **Verify**
   - You should see the new connection string (starts with `postgresql://neondb_owner...`)

---

## ✅ STEP 3: Redeploy Backend (Automatic)

- Vercel will **automatically redeploy** after you save the environment variable
- Wait 2-3 minutes for deployment to complete
- Or manually: **Deployments** tab → **Redeploy**

---

## ✅ STEP 4: Test Backend (1 minute)

After deployment completes:

1. **Get Your Backend URL**
   - In Vercel dashboard, go to **"Deployments"** tab
   - Click on the latest deployment
   - Copy the URL (e.g., `https://ticket-backend-xxx.vercel.app`)

2. **Test Health Endpoint**
   - Visit: `https://your-backend-url.vercel.app/health`
   - Should return: `{"ok":true}` ✅

3. **Test API Endpoint**
   - Visit: `https://your-backend-url.vercel.app/api/shows`
   - Should return: `[]` ✅

---

## ✅ STEP 5: Update Frontend (2 minutes)

1. **Go to Netlify**
   - Visit: https://app.netlify.com/sites/merry-squirrel-df1b83/configuration/env
   - Login if needed

2. **Add Environment Variable**
   - Click **"Add a variable"** button
   - **Key**: `VITE_API_URL`
   - **Value**: Your Vercel backend URL (from Step 4)
     - Example: `https://ticket-backend-xxx.vercel.app`
   - Click **"Save"**

3. **Redeploy Frontend**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Wait 2-3 minutes

4. **Test Frontend**
   - Visit: https://merry-squirrel-df1b83.netlify.app
   - Should work! No more network errors! ✅

---

## 🎉 DONE!

Your full stack is now deployed:
- ✅ Backend: Vercel (with Neon database)
- ✅ Frontend: Netlify (connected to backend)
- ✅ Database: Neon (migrations completed)

---

## 📋 Quick Reference

**Neon Connection String:**
```
postgresql://neondb_owner:npg_On4PqTe6LjHV@ep-jolly-lab-ah2ku3qx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Neon SQL Editor:**
https://console.neon.tech

**Vercel Dashboard:**
https://vercel.com/dashboard

**Netlify Dashboard:**
https://app.netlify.com

---

## 🆘 Troubleshooting

**Backend returns 500 error:**
- Check Vercel deployment logs
- Verify `DATABASE_URL` is set correctly
- Make sure migrations ran successfully

**Frontend shows network error:**
- Verify `VITE_API_URL` is set in Netlify
- Make sure you redeployed after adding the variable
- Check browser console for errors

**Database connection fails:**
- Verify connection string is correct
- Check Neon dashboard - database should be active
- Make sure migrations completed successfully
