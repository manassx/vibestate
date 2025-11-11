# 🚀 VERCEL DEPLOYMENT GUIDE - CursorGallery

**ESTIMATED TIME: 20-30 minutes**

This guide will help you deploy your CursorGallery app to Vercel in a few simple steps.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Step 1: Verify Supabase Database Setup (5 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `dmhihoqijrjasjgjsxgn`
3. **Go to SQL Editor** (left sidebar)
4. **Run this verification query**:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('galleries', 'images', 'user_settings');
```

**Expected Result**: Should return 3 rows (galleries, images, user_settings)

**If tables are missing**, run the full schema from `backend/database_schema.sql`:

- Copy the entire contents of `backend/database_schema.sql`
- Paste in SQL Editor
- Click "Run"

5. **Verify user_settings table exists**:

```sql
-- If user_settings table is missing, create it
-- (Check your backend/CREATE_SETTINGS_TABLE.sql or backend/QUICK_SETUP.sql)
```

---

### Step 2: Verify Supabase Storage Bucket (2 minutes)

1. **Go to Storage** (left sidebar in Supabase)
2. **Check if `gallery-images` bucket exists**

**If it doesn't exist**:

- Click "Create bucket"
- Name: `gallery-images`
- Public: ✅ **YES** (check this box)
- Click "Create bucket"

3. **Configure bucket policies**:
    - Click on the bucket
    - Go to "Policies"
    - Make sure it allows:
        - **Authenticated users** can upload
        - **Everyone** can read (for public galleries)

---

### Step 3: Get Your Supabase Keys (2 minutes)

1. **Go to Project Settings** → **API**
2. **Copy these keys** (you'll need them for Vercel):
    - **Project URL**: `https://dmhihoqijrjasjgjsxgn.supabase.co`
    - **anon public key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
    - **service_role key**: (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) ⚠️ Keep this SECRET

⚠️ **IMPORTANT**:

- **anon key** = Frontend (safe to expose)
- **service_role key** = Backend (NEVER expose in frontend)

---

## 🌐 VERCEL DEPLOYMENT

### Step 4: Push Code to GitHub (5 minutes)

1. **Initialize git** (if not already):

```bash
cd D:/projects/CursorGallery
git init
```

2. **Create `.gitignore`** in root (if not exists):

```
node_modules/
dist/
.env
.env.local
__pycache__/
*.pyc
venv/
```

3. **Commit and push**:

```bash
git add .
git commit -m "Production-ready deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

---

### Step 5: Deploy to Vercel (10 minutes)

1. **Go to**: https://vercel.com/
2. **Sign in** with GitHub
3. **Click "Add New Project"**
4. **Import your repository**:
    - Select your CursorGallery repo
    - Click "Import"

5. **Configure Project**:

   **Framework Preset**: Other (it will auto-detect from vercel.json)

   **Root Directory**: `vibestate` (IMPORTANT!)

   **Build Settings**:
    - Build Command: `cd frontend && npm install && npm run build`
    - Output Directory: `frontend/dist`
    - Install Command: `cd frontend && npm install && cd ../backend && pip install -r requirements.txt`

6. **Add Environment Variables** (Click "Environment Variables"):

   Add these **EXACT** variables (replace values with YOUR actual values):

   ```
   # Backend Variables
   SUPABASE_URL = https://dmhihoqijrjasjgjsxgn.supabase.co
   SUPABASE_KEY = YOUR_SERVICE_ROLE_KEY_HERE
   CORS_ORIGINS = https://your-project-name.vercel.app
   GOOGLE_AUTH_SALT = cursor-gallery-google-auth-2024
   FLASK_ENV = production

   # Frontend Variables (all start with VITE_)
   VITE_API_URL = https://your-project-name.vercel.app
   VITE_SUPABASE_URL = https://dmhihoqijrjasjgjsxgn.supabase.co
   VITE_SUPABASE_ANON_KEY = YOUR_ANON_KEY_HERE
   VITE_APP_NAME = CursorGallery
   VITE_APP_URL = https://your-project-name.vercel.app
   VITE_NODE_ENV = production
   ```

   ⚠️ **CRITICAL**: Replace `your-project-name` with your ACTUAL Vercel project name

   ⚠️ **CRITICAL**: Use **service_role** key for `SUPABASE_KEY` (backend)

   ⚠️ **CRITICAL**: Use **anon** key for `VITE_SUPABASE_ANON_KEY` (frontend)

7. **Click "Deploy"**

   Wait 3-5 minutes for deployment to complete.

---

### Step 6: Update CORS After First Deploy (IMPORTANT!)

After your first deployment, Vercel will give you a URL like: `https://cursor-gallery-xyz123.vercel.app`

1. **Copy your actual Vercel URL**
2. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
3. **Update these variables** with your ACTUAL URL:
    - `CORS_ORIGINS` → `https://your-actual-url.vercel.app`
    - `VITE_API_URL` → `https://your-actual-url.vercel.app`
    - `VITE_APP_URL` → `https://your-actual-url.vercel.app`
4. **Redeploy**:
    - Go to "Deployments" tab
    - Click "..." on latest deployment
    - Click "Redeploy"

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Step 7: Test Your Deployment (5 minutes)

Visit your Vercel URL and test these features:

1. **Homepage loads** ✅
    - Should see landing page with "Cursor Gallery" branding

2. **Signup/Login works** ✅
    - Create a new account
    - Verify you receive email confirmation (check spam)
    - Login with credentials

3. **Create Portfolio** ✅
    - Click "Create Portfolio"
    - Enter name and description
    - Upload 3-5 test images
    - Wait for processing to complete

4. **View Portfolio** ✅
    - Click "View" on your portfolio
    - Verify images load
    - Test cursor interaction
    - Verify images follow cursor

5. **Share Link** ✅
    - Click "Share" on dashboard
    - Copy link
    - Open in incognito/private window
    - Verify public access works

---

## 🐛 TROUBLESHOOTING

### Issue: "500 Internal Server Error" on API calls

**Solution**:

1. Check Vercel Function Logs:
    - Vercel Dashboard → Your Project → Functions
    - Look for error messages
2. Common causes:
    - Missing environment variables
    - Wrong Supabase keys (using anon key instead of service_role)
    - Database tables not created

---

### Issue: "CORS Error" in browser console

**Solution**:

1. Verify `CORS_ORIGINS` environment variable matches your Vercel URL EXACTLY
2. Make sure URL has `https://` and NO trailing slash
3. Redeploy after changing

---

### Issue: Images don't upload

**Solution**:

1. Verify Supabase storage bucket `gallery-images` exists
2. Check bucket is set to **Public**
3. Verify bucket policies allow authenticated uploads

---

### Issue: "Gallery not found" on public view

**Solution**:

1. Make sure you clicked "Publish" on the gallery
2. Check gallery status is "published" in database
3. Verify public policies on `galleries` and `images` tables

---

## 📊 MONITORING YOUR DEPLOYMENT

### Check Logs:

1. **Vercel Dashboard** → Your Project → **Functions**
2. Click on any function to see logs
3. Look for errors or warnings

### Check Analytics:

1. **Vercel Dashboard** → Your Project → **Analytics**
2. Monitor page views, response times

---

## 🔒 SECURITY CHECKLIST

After deployment, verify:

- ✅ `.env` files are in `.gitignore` (NOT committed to GitHub)
- ✅ Service role key is ONLY in Vercel environment variables
- ✅ CORS is restricted to your Vercel domain
- ✅ Database RLS (Row Level Security) is enabled in Supabase
- ✅ Storage bucket policies are configured correctly

---

## 🎯 YOUR DEPLOYMENT CHECKLIST

Before submitting:

- [ ] Supabase database tables created
- [ ] Supabase storage bucket created and public
- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Environment variables added to Vercel
- [ ] CORS URLs updated with actual Vercel domain
- [ ] Redeployed after CORS update
- [ ] Tested signup/login
- [ ] Tested portfolio creation
- [ ] Tested image upload
- [ ] Tested public gallery view
- [ ] Verified in incognito mode
- [ ] **Copied deployment URL for submission** ✅

---

## 🆘 NEED HELP?

If you encounter issues:

1. Check Vercel function logs first
2. Verify all environment variables are set correctly
3. Make sure Supabase tables and bucket exist
4. Try redeploying after fixes

---

## 🎉 SUCCESS!

Once all tests pass, your app is live!

**Your deployment URL**: `https://your-project-name.vercel.app`

Copy this URL for your hackathon submission.

---

**Good luck with your submission! 🚀**
