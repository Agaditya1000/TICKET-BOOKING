# Quick Deployment Checklist

Follow these steps in order:

## ✅ Step 1: Get a Free PostgreSQL Database (5 minutes)

**Option: Neon (Easiest)**
1. Go to https://neon.tech → Sign up
2. Create project → Copy connection string
3. Run SQL migration (see Step 2)

## ✅ Step 2: Run Database Migration

**In Neon Dashboard:**
1. Go to SQL Editor
2. Copy contents of `migrations/001_create_tables.sql`
3. Paste and run

## ✅ Step 3: Push to GitHub

```bash
cd "c:\Users\agadi\Downloads\ticket b"
git init
git add .
git commit -m "Ready for deployment"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## ✅ Step 4: Deploy to Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Import your repository
3. **Root Directory**: `Backend`
4. **Environment Variable**: 
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string
5. Deploy!

## ✅ Step 5: Update Frontend

1. Copy your Vercel backend URL (e.g., `https://xxx.vercel.app`)
2. Go to Netlify → Your site → Environment variables
3. Add: `VITE_API_URL` = your Vercel URL
4. Redeploy frontend

## ✅ Step 6: Test

- Backend: `https://your-backend.vercel.app/health` → Should show `{"ok":true}`
- Frontend: `https://merry-squirrel-df1b83.netlify.app` → Should work!

---

**Full detailed guide**: See `DEPLOYMENT.md`
