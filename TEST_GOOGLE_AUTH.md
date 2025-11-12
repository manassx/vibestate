# Google Auth Debugging Guide

## Step 1: Verify Backend is Running

```bash
curl https://cursorgallery.vercel.app/api/
```

**Expected:** `{"message":"CursorGallery API is running!","version":"1.0.0"}`

## Step 2: Check Environment Configuration

```bash
curl https://cursorgallery.vercel.app/api/debug
```

**Expected:** All environment variables should be `true`, Python version should be 3.11

## Step 3: Test Google Auth Endpoint (Invalid Request)

```bash
curl -X POST https://cursorgallery.vercel.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** `{"error":"Missing required fields (idToken, email)"}`
**Status Code:** 400 (NOT 500)

## Step 4: Check Vercel Runtime Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment
3. Click "Runtime Logs" tab
4. Look for lines starting with `[GOOGLE AUTH]`

## Step 5: Test Full Google Sign-In Flow

1. Go to https://cursorgallery.vercel.app/login
2. Click "Sign in with Google"
3. Complete Google OAuth on Supabase
4. Watch Network tab in DevTools
5. Find the POST request to `/api/auth/google`
6. Check:
    - Request payload (should have idToken, email, name)
    - Response body (if error, note the `errorType` and `step`)

## Expected Log Flow (Success)

```
[GOOGLE AUTH] ===== REQUEST STARTED =====
[GOOGLE AUTH] Request body received: True
[GOOGLE AUTH] Parsed data - Email: user@example.com, Name: John Doe, Token present: True
[GOOGLE AUTH] Salt configured: True
[GOOGLE AUTH] Generated password hash for user
[GOOGLE AUTH] Attempting sign-in with existing credentials...
[GOOGLE AUTH] ✅ Sign-in successful for existing user
[GOOGLE AUTH] Updating user metadata...
[GOOGLE AUTH] ✅ Metadata updated
[GOOGLE AUTH] Fetching fresh user data...
[GOOGLE AUTH] ✅ Fresh user data fetched
```

## Common Error Patterns

### Error: `SUPABASE_KEY` is False in `/api/debug`

**Fix:** Set environment variable in Vercel dashboard → Redeploy

### Error: `Python process exited with exit status: 1`

**Fix:** Check if Python 3.11 is being used (see `/api/debug`)

### Error: `errorType: "APIError"`, `step: "account_lookup_or_creation"`

**Fix:** Check Supabase service_role key permissions

### Error: Network request fails before reaching backend

**Fix:** Check Google OAuth console authorized origins

## Quick Fixes Checklist

- [ ] Google Cloud Console → Add `https://dmhihoqijrjasjgjsxgn.supabase.co` to Authorized JavaScript origins
- [ ] Supabase Dashboard → Add `https://cursorgallery.vercel.app/auth/callback` to Redirect URLs
- [ ] Vercel → Environment Variables → Verify all are set for Production
- [ ] Vercel → Redeploy after any config change
- [ ] Check `/api/debug` shows Python 3.11
