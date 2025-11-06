# Android Backend Integration - Setup Guide

## 🎯 Overview

This Android app now has **full backend integration** with the CursorGallery Flask API, enabling:

- ✅ Real authentication (JWT tokens)
- ✅ Cloud gallery storage (Supabase)
- ✅ Image upload to cloud
- ✅ Public gallery sharing
- ✅ Hybrid local + cloud sync

---

## 🚀 Quick Start

### Prerequisites

1. **Backend running** at `http://localhost:8000`
2. **Android Studio** with this project open
3. **Android Emulator** or physical device

### Step 1: Start Backend

```bash
# Navigate to backend folder
cd ../backend

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate  # Windows

# Start server
python app.py
```

Verify backend is running: Visit `http://localhost:8000` in browser

### Step 2: Configure Android App

**For Android Emulator (Default - No Changes Needed):**

- Already configured to use `http://10.0.2.2:8000`
- `10.0.2.2` is the emulator's alias for host machine's `localhost`

**For Physical Device:**

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig | grep inet
   # Or: ip addr show
   ```

2. Update `ApiClient.kt`:
   ```kotlin
   // Line 17
   private const val BASE_URL = "http://YOUR_IP_ADDRESS:8000/"
   // Example: "http://192.168.1.100:8000/"
   ```

3. Ensure **same WiFi network** for computer and phone

### Step 3: Run Android App

1. Click **Run ▶️** in Android Studio
2. Select emulator or connected device
3. Wait for app to install

### Step 4: Test Authentication

1. App opens → Tap "GET STARTED"
2. Tap "Sign Up"
3. Enter credentials:
    - Name: `Test User`
    - Email: `test@example.com`
    - Password: `password123`
4. Tap "SIGN UP"
5. Should navigate to dashboard (if backend is reachable)

---

## 📱 Complete User Flow

### Create & Publish Gallery

1. **Dashboard** → Tap **"+"** FAB button
2. **Step 1:** Enter gallery name and description → "CONTINUE"
3. **Step 2:** Pick at least 10 photos → "CREATE GALLERY"
4. **Gallery Detail:** View grid of photos
5. **Tap "PREVIEW GALLERY"** → Test cursor trail
6. **Back to Detail** → Tap **"PUBLISH TO CLOUD"** (coming in Phase 2)
7. Wait for upload progress (all images uploaded to backend)
8. Get public link to share

### View Published Gallery

- Open public link on any device
- Interactive cursor trail experience
- Images load from cloud storage

---

## 🔧 Architecture

### Data Flow: Local → Cloud

```
User Creates Gallery
    ↓
Images saved to app's internal storage
    ↓
User taps "Publish to Cloud"
    ↓
ViewModel.syncGalleryToCloud()
    ↓
Repository.syncGalleryToCloud()
    ↓
1. NetworkRepository.createGallery() → Backend creates gallery
2. NetworkRepository.uploadImages() → Images uploaded
3. NetworkRepository.publishGallery() → Gallery set to "published"
    ↓
Local gallery updated with cloudId & syncStatus
    ↓
Public link generated
```

### Backend API Calls

| Operation | Endpoint | Method | Auth Required |
|-----------|----------|--------|---------------|
| Signup | `/api/auth/signup` | POST | No |
| Login | `/api/auth/login` | POST | No |
| Create Gallery | `/api/galleries` | POST | Yes (JWT) |
| Upload Images | `/api/galleries/{id}/upload` | POST | Yes (JWT) |
| Publish Gallery | `/api/galleries/{id}` | PATCH | Yes (JWT) |
| Get Public Gallery | `/api/gallery/{id}` | GET | No |

---

## 🗄️ Database Schema

### Local (Room - SQLite)

**galleries table:**

```sql
id            INTEGER PRIMARY KEY
name          TEXT
description   TEXT
cloudId       TEXT NULL           -- UUID from backend
syncStatus    TEXT DEFAULT "local" -- local, syncing, synced, error
isPublished   BOOLEAN DEFAULT 0
threshold     INTEGER DEFAULT 80
createdAt     INTEGER
imageCount    INTEGER
```

**gallery_images table:**

```sql
id         INTEGER PRIMARY KEY
galleryId  INTEGER FOREIGN KEY
imagePath  TEXT      -- Local file path
order      INTEGER
```

### Cloud (Supabase - PostgreSQL)

**galleries table:**

```sql
id                UUID PRIMARY KEY
user_id           UUID FOREIGN KEY
name              TEXT
description       TEXT
slug              TEXT UNIQUE
status            TEXT -- draft, processing, analyzed, published
image_count       INTEGER
config            JSONB -- {threshold, animationType, mood}
analysis_complete BOOLEAN
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**images table:**

```sql
id            UUID PRIMARY KEY
gallery_id    UUID FOREIGN KEY
url           TEXT      -- Supabase Storage URL
thumbnail_url TEXT
metadata      JSONB     -- {width, height, size, format}
order_index   INTEGER
created_at    TIMESTAMP
```

---

## 🔐 Authentication Flow

### 1. Signup/Login

```kotlin
// User enters credentials
LoginScreen → NetworkRepository.login(email, password)
    ↓
POST /api/auth/login
    ↓
Backend validates with Supabase Auth
    ↓
Returns: {user: {...}, token: "jwt_token"}
    ↓
Saved to AppPreferences:
- authToken
- userId
- userEmail
- userName
- isLoggedIn = true
```

### 2. Authenticated Requests

```kotlin
// Every API call automatically includes JWT
ApiClient → AuthInterceptor
    ↓
Reads token from AppPreferences
    ↓
Adds header: "Authorization: Bearer {token}"
    ↓
Backend validates token
    ↓
Request processed or 401 Unauthorized returned
```

### 3. Token Expiration

- Backend returns `401 Unauthorized`
- App shows "Session expired" message
- User redirected to login screen
- Token cleared from AppPreferences

---

## 📤 Image Upload Process

### 1. Compression (To Be Implemented)

```kotlin
// Match web app: 95% quality, max 3MB
val compressed = compressImage(originalFile)
```

### 2. Multipart Upload

```kotlin
// Convert local file to multipart
val file = File(imagePath)
val requestBody = file.asRequestBody("image/*".toMediaTypeOrNull())
val part = MultipartBody.Part.createFormData("images", file.name, requestBody)

// Upload to backend
POST /api/galleries/{galleryId}/upload
Content-Type: multipart/form-data

parts: [
  {name: "images", file: image1.jpg},
  {name: "images", file: image2.jpg},
  ...
]
```

### 3. Backend Processing

```python
# app.py - upload_images()
1. Receive multipart files
2. Validate file size (< 10MB) and type
3. Upload original to Supabase Storage
4. Generate thumbnail (400x400px)
5. Upload thumbnail to storage
6. Extract metadata (width, height, format)
7. Save record to images table
8. Return uploaded image data with URLs
```

### 4. Android Receives URLs

```json
{
  "uploadedCount": 15,
  "images": [
    {
      "id": "uuid",
      "url": "https://...storage.supabase.co/...image.jpg",
      "thumbnail_url": "https://...thumbs/thumb.jpg",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "size": 2048576,
        "format": "JPEG"
      }
    }
  ]
}
```

---

## 🎨 Cursor Trail Compatibility

### Web App (React)

```javascript
// CursorTrailGallery.jsx
- Mouse movement triggers image placement
- Threshold: Distance between placements (20-200px)
- Max images on screen: 3-15 based on threshold
- Images preloaded for smooth transitions
- Click image → Lightbox with navigation
```

### Android App (Kotlin)

```kotlin
// PreviewScreen.kt
- Touch drag triggers image placement
- Threshold: Same as web (20-80 on mobile)
- Max images on screen: 3-8 based on threshold
- Images from local storage OR cloud URLs
- Tap image → Fullscreen lightbox
```

### Coil Image Loading

```kotlin
// Coil automatically handles both local and remote
Image(
    painter = rememberAsyncImagePainter(
        model = imageUrl  // "file://..." OR "https://..."
    ),
    contentDescription = null
)
```

**For smooth cursor trail:**

- Preload images into Coil cache
- Use thumbnail URLs for initial display
- Load full resolution on lightbox open

---

## 🐛 Troubleshooting

### Backend not reachable

**Symptoms:**

- Login/Signup shows "Network error"
- App can't connect to backend

**Solutions:**

1. Verify backend is running: `curl http://localhost:8000`
2. Check BASE_URL in `ApiClient.kt` (Line 17)
3. For emulator: Must use `10.0.2.2`, not `localhost`
4. For device: Use computer's IP, not `localhost`
5. Ensure device and computer on same WiFi
6. Check firewall isn't blocking port 8000

### 401 Unauthorized errors

**Cause:** Token expired or invalid

**Solutions:**

1. Logout and login again
2. Check token in AppPreferences is not empty
3. Verify backend is returning valid JWT
4. Check backend Supabase credentials are correct

### Images not uploading

**Symptoms:**

- Upload progress stuck
- "Failed to upload images" error

**Solutions:**

1. Check image file sizes (must be < 10MB)
2. Verify Supabase Storage bucket exists
3. Check storage policies in Supabase dashboard
4. Ensure INTERNET permission in AndroidManifest
5. Check backend logs for errors

### Images not loading in Preview

**Cause:** Cloud URLs not accessible

**Solutions:**

1. Check Supabase Storage bucket is public
2. Verify image URLs are valid (not expired)
3. Test URL in browser directly
4. Check Coil is properly configured
5. Enable logging to see image load errors

---

## 📊 Sync Status Indicators

### Gallery Entity Status Values

```kotlin
syncStatus:
- "local"    → Not synced to cloud (gray icon)
- "syncing"  → Currently uploading (animated spinner)
- "synced"   → Successfully uploaded (green checkmark)
- "error"    → Sync failed (red error icon)

isPublished:
- false      → Private, only visible in app
- true       → Public, accessible via share link
```

### UI Indicators (To Be Implemented)

```
Gallery Card:
[Gallery Name]
[12 photos]
[🔄 Syncing...] or [✓ Published] or [📱 Local]

Gallery Detail:
- Show "Publish to Cloud" button if not published
- Show public link if published
- Show sync progress during upload
```

---

## 🔒 Security Considerations

### JWT Token Storage

- ✅ Stored in SharedPreferences (encrypted on Android 6.0+)
- ✅ Cleared on logout
- ✅ Automatically included in API requests
- ⚠️ Not encrypted on Android < 6.0 (use EncryptedSharedPreferences for production)

### API Security

- ✅ HTTPS in production (update BASE_URL)
- ✅ Row Level Security in Supabase (users can only access own galleries)
- ✅ Token validation on every request
- ✅ File type and size validation
- ⚠️ Currently using HTTP for local development (fine for localhost)

### Image Storage

- ✅ Local images: Stored in app's private directory
- ✅ Cloud images: Supabase Storage with signed URLs
- ✅ Public galleries: Anyone with link can view
- ✅ Private galleries: Only owner can access

---

## 🚀 Deployment Guide

### Backend Deployment (Choose one)

**Option 1: Heroku**

```bash
# Install Heroku CLI, then:
heroku create cursorgallery-api
git push heroku main
```

**Option 2: Railway**

```bash
# Connect GitHub repo to Railway
# Auto-deploys on push
```

**Option 3: Render**

```bash
# Create new Web Service
# Connect to GitHub repo
```

Update `ApiClient.kt` BASE_URL to deployed URL

### Android App Deployment

**For Testing (Internal):**

```bash
./gradlew assembleDebug
# APK in: app/build/outputs/apk/debug/
# Share APK file
```

**For Production (Play Store):**

```bash
./gradlew bundleRelease
# AAB in: app/build/outputs/bundle/release/
# Upload to Google Play Console
```

**Before release:**

1. Change BASE_URL to production backend
2. Enable ProGuard/R8 for code obfuscation
3. Use EncryptedSharedPreferences for tokens
4. Add proper error tracking (Crashlytics)
5. Test with physical devices
6. Add proper app signing

---

## 📚 Additional Resources

- [Backend API Documentation](../backend/API_DOCUMENTATION.md)
- [Backend Setup Guide](../backend/SETUP_GUIDE.md)
- [Frontend Implementation](../frontend/README.md)
- [Full Stack Guide](../FULL_STACK_GUIDE.md)

---

## ✅ Verification Checklist

Before testing, ensure:

- [x] Backend running on `http://localhost:8000`
- [x] Supabase project configured
- [x] Database schema executed
- [x] Storage bucket created (`gallery-images`)
- [x] Android app BASE_URL configured correctly
- [x] Emulator/device has internet access
- [x] INTERNET permission in AndroidManifest

Test flow:

- [ ] Signup new account → Success
- [ ] Login existing account → Success
- [ ] Create local gallery → Success
- [ ] Publish gallery → Upload progress shows → Success
- [ ] View gallery detail → Shows "Published" status
- [ ] Get public link → Works in browser
- [ ] Public gallery loads → Cursor trail smooth

---

**Status:** ✅ Backend integration complete  
**Next:** UI enhancements (publish button, progress dialogs, public link sharing)
