# ⚡ QUICK START - Deploy in 15 Minutes

## 🎯 PRE-DEPLOYMENT (Do This First!)

### 1. Supabase Setup (5 min)

Go to: https://supabase.com/dashboard/project/dmhihoqijrjasjgjsxgn

**A. Check Tables Exist:**

- SQL Editor → Run:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('galleries', 'images', 'user_settings');
```

- Should return 3 rows
- If missing: Run `backend/database_schema.sql`

**B. Check Storage Bucket:**

- Storage → Look for `gallery-images` bucket
- If missing: Create it (Public = YES)

**C. Get Your Keys:**

- Settings → API → Copy:
    - ✅ **anon public** key (for frontend)
    - ✅ **service_role** key (for backend)

---

## 🚀 DEPLOY TO VERCEL (10 min)

### 2. Push to GitHub

```bash
cd D:/projects/CursorGallery/vibestate
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to: https://vercel.com
2. Sign in with GitHub
3. **New Project** → Import your repo
4. **Root Directory**: Leave as `./` (it will auto-detect)
5. **Add Environment Variables** (see VERCEL_ENV_VARS.txt)
6. Click **Deploy**

### 4. Update URLs After First Deploy

After deploy, you'll get a URL like: `https://your-app-xyz.vercel.app`

**Update these 3 env vars in Vercel:**

- `CORS_ORIGINS` → your actual URL
- `VITE_API_URL` → your actual URL
- `VITE_APP_URL` → your actual URL

Then **REDEPLOY**!

---

## ✅ TEST YOUR DEPLOYMENT

1. Open your Vercel URL
2. Signup/Login
3. Create portfolio
4. Upload images
5. View & share

---

## 🆘 TROUBLESHOOTING

**500 Error?**

- Check Vercel Function logs
- Verify all env vars are set
- Ensure you used SERVICE_ROLE key for backend

**CORS Error?**

- Update CORS_ORIGINS with exact Vercel URL
- Redeploy

**Images won't upload?**

- Check Supabase storage bucket exists
- Ensure bucket is Public

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

Backend (5 vars):

- [ ] SUPABASE_URL
- [ ] SUPABASE_KEY (service_role!)
- [ ] CORS_ORIGINS
- [ ] GOOGLE_AUTH_SALT
- [ ] FLASK_ENV

Frontend (6 vars - all start with VITE_):

- [ ] VITE_API_URL
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY (anon key!)
- [ ] VITE_APP_NAME
- [ ] VITE_APP_URL
- [ ] VITE_NODE_ENV

See `VERCEL_ENV_VARS.txt` for exact values!

---

**Full Guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions.

Good luck! 🚀
