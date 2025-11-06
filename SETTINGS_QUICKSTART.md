# Settings Feature - Quick Start Guide ⚡

Get the complete settings system up and running in **5 minutes**!

## What You're Getting

A fully functional settings system with:

- 👤 **Profile Management** - Name, bio, website, location
- 🔐 **Password Change** - Secure with validation
- ⚙️ **Preferences** - Notifications & gallery defaults
- 📦 **Data Export** - Download all your data
- 🗑️ **Account Deletion** - Complete data removal

## Prerequisites

- ✅ Backend running on `http://localhost:8000`
- ✅ Frontend running on `http://localhost:5173`
- ✅ Supabase project configured
- ✅ User account created (for testing)

## Setup (3 Steps)

### Step 1: Run the Database Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **New Query**
5. Copy the contents of `backend/migrations/create_user_settings_table.sql`
6. Paste and click **Run** (or press `Ctrl+Enter`)
7. You should see: "Success. No rows returned"

**Option B: Using Setup Script**

```bash
# Linux/Mac
cd vibestate/backend
chmod +x setup_settings.sh
./setup_settings.sh

# Windows (PowerShell)
cd vibestate/backend
.\setup_settings.ps1
```

### Step 2: Restart Your Backend

```bash
cd vibestate/backend

# Kill the current backend process (Ctrl+C)
# Then restart:
python app.py
```

You should see the new routes loaded:

```
* Running on http://0.0.0.0:8000
```

### Step 3: Test the Settings Page

1. Open your browser to `http://localhost:5173`
2. Log in to your account
3. Click your profile icon (top right)
4. Click **SETTINGS**
5. You should see the settings page with 4 tabs!

## Quick Test

### Test Profile Update (30 seconds)

1. Go to **Profile** tab
2. Update your name to "Test User"
3. Add a bio: "Testing the new settings!"
4. Click **SAVE PROFILE**
5. Check the navbar - your name should update
6. Refresh the page - settings should persist ✅

### Test Password Change (1 minute)

1. Go to **Account** tab
2. Enter your current password
3. Enter a new password (min 6 chars)
4. Confirm the new password
5. Click **CHANGE PASSWORD**
6. Log out and log back in with the new password ✅

### Test Preferences (30 seconds)

1. Go to **Preferences** tab
2. Toggle "Email Notifications" off
3. Change "Default Visibility" to "Public"
4. Adjust the threshold slider
5. Click **SAVE PREFERENCES**
6. Refresh - settings should persist ✅

### Test Data Export (15 seconds)

1. Go to **Danger Zone** tab
2. Click **EXPORT** button
3. A JSON file should download ✅
4. Open it - you should see your user data, galleries, and settings

## Verify Everything Works

Check each feature:

```bash
✅ Settings page loads at /settings
✅ Profile updates save correctly
✅ Name updates appear in navbar
✅ Password change works
✅ Preferences save and persist
✅ Data export downloads JSON file
✅ Settings survive page refresh
✅ Theme (light/dark) works
✅ Mobile responsive design
✅ All tabs accessible
```

## Common Issues & Fixes

### ❌ "Settings page not found"

**Fix:** Make sure frontend is running and you're logged in. Settings requires authentication.

### ❌ "Error saving profile"

**Fix:**

1. Check backend is running on port 8000
2. Check browser console for errors
3. Verify user_settings table exists in Supabase

### ❌ "Password change fails"

**Fix:**

1. Ensure current password is correct
2. New password must be at least 6 characters
3. Check that Supabase Admin API is enabled

### ❌ "Settings not persisting"

**Fix:**

1. Run the SQL migration again
2. Check RLS policies are set up
3. Clear browser cache and localStorage
4. Try with a fresh login

## Architecture Overview

```
Frontend (React)
  └─ /settings route
      ├─ Profile Tab
      ├─ Account Tab
      ├─ Preferences Tab
      └─ Danger Zone Tab
          ↓
      API Calls
          ↓
Backend (Flask)
  ├─ GET  /api/user/settings
  ├─ PUT  /api/user/profile
  ├─ PUT  /api/user/preferences
  ├─ POST /api/user/change-password
  ├─ GET  /api/user/export-data
  └─ DELETE /api/user/account
          ↓
Database (Supabase)
  └─ user_settings table
      ├─ profile (JSONB)
      ├─ preferences (JSONB)
      └─ RLS policies
```

## Files Created

**Frontend:**

- `frontend/src/pages/Settings.jsx` (926 lines)
- Updated: `frontend/src/App.jsx` (added route)
- Updated: `frontend/src/store/authStore.js` (added updateUser)

**Backend:**

- Updated: `backend/app.py` (added 6 endpoints)
- `backend/migrations/create_user_settings_table.sql`
- `backend/SETTINGS_SETUP.md`
- `backend/setup_settings.sh`
- `backend/setup_settings.ps1`

**Documentation:**

- `SETTINGS_FEATURE.md` (comprehensive overview)
- `SETTINGS_QUICKSTART.md` (this file)

## Next Steps

### Customize Settings

- Adjust validation rules in `backend/app.py`
- Modify UI colors in `frontend/src/pages/Settings.jsx`
- Add new preference fields as needed

### Add Features

- Enable email verification
- Add profile picture upload
- Implement 2FA
- Add activity log
- Create API keys section

### Deploy to Production

1. Run migration on production database
2. Update environment variables
3. Test all endpoints
4. Enable rate limiting
5. Set up monitoring

## Need Help?

**Documentation:**

- Full details: `SETTINGS_FEATURE.md`
- API docs: `backend/SETTINGS_SETUP.md`
- Database schema: `backend/migrations/create_user_settings_table.sql`

**Support:**

1. Check the troubleshooting section above
2. Review backend logs: `python app.py` output
3. Check browser console: F12 → Console tab
4. Verify database table: Supabase Dashboard → Table Editor

## Success! 🎉

If you've completed the quick test above, your settings feature is **fully operational**!

Users can now:

- ✅ Manage their profile
- ✅ Change passwords securely
- ✅ Customize preferences
- ✅ Export their data
- ✅ Delete their account

Enjoy your new settings system! 🚀
