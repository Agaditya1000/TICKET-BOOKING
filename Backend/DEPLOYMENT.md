# Backend Deployment Guide - Vercel

This guide will help you deploy the Ticket Booking Backend to Vercel.

## Prerequisites

1. **GitHub Account** (or GitLab/Bitbucket)
2. **Vercel Account** (sign up at https://vercel.com - free tier available)
3. **PostgreSQL Database** (we'll use a free cloud database)

## Step 1: Set Up Cloud PostgreSQL Database

You need a cloud PostgreSQL database. Here are free options:

### Option A: Neon (Recommended - Free Tier)
1. Go to https://neon.tech
2. Sign up for free
3. Create a new project
4. Copy the connection string (it will look like: `postgresql://user:password@host.neon.tech/dbname`)
5. **Save this connection string** - you'll need it in Step 4

### Option B: Supabase (Free Tier)
1. Go to https://supabase.com
2. Sign up for free
3. Create a new project
4. Go to Settings → Database
5. Copy the connection string from "Connection string" → "URI"
6. **Save this connection string**

### Option C: Railway (Free Tier with Credit Card)
1. Go to https://railway.app
2. Sign up
3. Create a new project → Add PostgreSQL
4. Copy the connection string from the database service
5. **Save this connection string**

## Step 2: Run Database Migrations

You need to run the database migrations on your cloud database:

### Using Neon/Supabase/Railway Web Console:
1. Go to your database provider's dashboard
2. Find the SQL Editor or Query tool
3. Copy the contents of `migrations/001_create_tables.sql`
4. Paste and execute it

### Using psql (Command Line):
```bash
# Set your DATABASE_URL environment variable
$env:DATABASE_URL="postgresql://user:password@host:port/dbname"  # Windows PowerShell
# or
export DATABASE_URL="postgresql://user:password@host:port/dbname"  # Linux/macOS

# Run migration
psql $env:DATABASE_URL -f migrations/001_create_tables.sql  # Windows
# or
psql $DATABASE_URL -f migrations/001_create_tables.sql  # Linux/macOS
```

## Step 3: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd "c:\Users\agadi\Downloads\ticket b"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (e.g., `ticket-booking-system`)
   - **Don't** initialize with README

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ticket-booking-system.git
   git branch -M main
   git push -u origin main
   ```

## Step 4: Deploy to Vercel

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Sign up/Login (use GitHub to connect)

2. **Import Your Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository you just created

3. **Configure Project Settings**:
   - **Root Directory**: Select `Backend` (or type `Backend`)
   - **Framework Preset**: Other
   - **Build Command**: Leave default (Vercel will use `vercel-build` from package.json)
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   - **Variable Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string from Step 1
   - **Environment**: Production, Preview, Development (select all)
   - Click "Save"

   Optional variables (if you want to customize):
   - `PORT`: Leave default (Vercel handles this)
   - `BOOKING_HOLD_SECONDS`: `120` (default)

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)

## Step 5: Get Your Backend URL

After deployment:
1. Vercel will show you a deployment URL like: `https://your-project-name.vercel.app`
2. **Copy this URL** - this is your backend API URL
3. Test it by visiting: `https://your-project-name.vercel.app/health`
   - You should see: `{"ok":true}`

## Step 6: Update Frontend with Backend URL

Now update your Netlify frontend to use this backend URL:

1. **Go to Netlify Dashboard**:
   - Visit https://app.netlify.com
   - Select your site: `merry-squirrel-df1b83`

2. **Add Environment Variable**:
   - Go to: Site settings → Environment variables
   - Click "Add a variable"
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-project-name.vercel.app` (your Vercel backend URL)
   - Click "Save"

3. **Redeploy Frontend**:
   - Go to: Deploys tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

## Step 7: Test Your Deployment

1. **Test Backend**:
   - Visit: `https://your-backend.vercel.app/health` → Should return `{"ok":true}`
   - Visit: `https://your-backend.vercel.app/api/shows` → Should return `[]` (empty array)

2. **Test Frontend**:
   - Visit: `https://merry-squirrel-df1b83.netlify.app`
   - The network error should be gone!
   - You should see the ticket booking interface

## Troubleshooting

### Backend Issues:

**Build Fails:**
- Check that `vercel.json` exists in the `Backend` folder
- Verify `vercel-build` script is in `package.json`
- Check build logs in Vercel dashboard

**Database Connection Error:**
- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Check that migrations were run on your cloud database
- Ensure your database allows connections from Vercel's IPs (most cloud providers do by default)

**API Returns 404:**
- Check that `api/index.ts` exists
- Verify routes are configured correctly in `vercel.json`

### Frontend Issues:

**Still Shows Network Error:**
- Verify `VITE_API_URL` is set in Netlify
- Make sure you redeployed after adding the environment variable
- Check browser console for actual error messages

**CORS Errors:**
- The backend has CORS enabled, but if you see CORS errors, check that your backend URL is correct

## Important Notes

1. **Database Migrations**: You only need to run migrations once when setting up the database
2. **Environment Variables**: Make sure `DATABASE_URL` is set in Vercel for all environments
3. **Worker Process**: The expiry worker (`npm run worker`) won't run on Vercel serverless. You'll need to:
   - Deploy it separately (e.g., on Railway, Render, or a cron job)
   - Or implement it as a Vercel Cron Job (requires Pro plan)
   - For now, bookings will expire when the API is called (not ideal, but functional)

## Next Steps

- Set up the expiry worker on a separate service (optional but recommended)
- Monitor your Vercel and database usage
- Set up custom domain (optional)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check database connection
3. Verify all environment variables are set correctly
