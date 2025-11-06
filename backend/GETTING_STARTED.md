# Getting Started with CursorGallery Backend

Quick start guide to get your CursorGallery backend up and running in minutes!

## 🎯 Prerequisites

Before you begin, make sure you have:

- ✅ Python 3.9 or higher installed
- ✅ A Supabase account (free tier works!)
- ✅ Git (for cloning the repository)

## ⚡ Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
cd vibestate/backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (macOS/Linux)
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 2: Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click on **SQL Editor** in the sidebar
3. Open the `database_schema.sql` file from this directory
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: "Success. No rows returned"

### Step 3: Create Storage Bucket

1. In Supabase, go to **Storage** in the sidebar
2. Click **New bucket**
3. Enter these settings:
    - **Name:** `gallery-images`
    - **Public bucket:** ✅ **YES** (important!)
    - Click **Create bucket**

4. Click on the `gallery-images` bucket
5. Click **Policies** tab
6. Click **New Policy** → **Custom**
7. Add these three policies (copy from SETUP_GUIDE.md or below):

**Policy 1 - Public Read:**

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery-images' );
```

**Policy 2 - Authenticated Upload:**

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-images' 
    AND auth.role() = 'authenticated'
);
```

**Policy 3 - Delete Own Files:**

```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'gallery-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Verify Environment Variables

Your `.env` file should already have:

```env
SUPABASE_URL=https://dmhihoqijrjasjgjsxgn.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **You're good to go!** These are already configured.

### Step 5: Start the Server

```bash
python app.py
```

You should see:

```
 * Running on http://0.0.0.0:8000
 * Debug mode: on
```

## ✅ Verify Everything Works

### Test 1: Check Server

Open your browser and go to:

```
http://localhost:8000
```

You should see:

```json
{
  "message": "CursorGallery API is running!",
  "version": "1.0.0"
}
```

### Test 2: Run Automated Tests

In a new terminal (keep the server running):

```bash
cd vibestate/backend
python test_backend.py
```

This will test:

- ✅ Server connectivity
- ✅ User signup & login
- ✅ Gallery creation
- ✅ Image upload
- ✅ Gallery publishing
- ✅ Public access

If all tests pass, **you're ready to go!** 🎉

## 🚀 Next Steps

### Connect Frontend to Backend

1. Make sure backend is running on `http://localhost:8000`
2. Start the frontend (in a separate terminal):

```bash
cd vibestate/frontend
npm run dev
```

3. Frontend should connect automatically to the backend
4. Try signing up and creating your first gallery!

### API Endpoints You Can Use

**Authentication:**

- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login

**Galleries:**

- `GET /api/galleries` - List galleries
- `POST /api/galleries` - Create gallery
- `GET /api/galleries/:id` - Get gallery
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery
- `POST /api/galleries/:id/upload` - Upload images
- `PATCH /api/galleries/:id` - Publish gallery

**Public:**

- `GET /api/gallery/:id` - View published gallery

## 📚 Documentation

- **[README.md](README.md)** - Project overview and quick reference
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[database_schema.sql](database_schema.sql)** - Database schema

## 🐛 Troubleshooting

### "Module not found" error

```bash
pip install -r requirements.txt
```

### "Port 8000 already in use"

Either:

- Stop the process using port 8000
- Change port in `app.py`: `app.run(host='0.0.0.0', port=8001, debug=True)`

### "Connection error" when testing

- Make sure the server is running (`python app.py`)
- Check that you're using the correct URL (http://localhost:8000)

### "Unauthorized" error

- Check that you're sending the Authorization header
- Format: `Authorization: Bearer <your_token>`
- Get token from login/signup response

### Database errors

- Verify you ran `database_schema.sql` in Supabase
- Check your `.env` file has correct Supabase credentials
- Make sure Row Level Security policies are active

### Image upload fails

- Verify storage bucket `gallery-images` exists
- Check bucket is set to **public**
- Confirm storage policies are configured
- Ensure Pillow is installed: `pip install Pillow`

## 🎯 Common Tasks

### Create a Test Gallery

```bash
curl -X POST http://localhost:8000/api/galleries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Gallery",
    "description": "Testing the API"
  }'
```

### Upload Images

```bash
curl -X POST http://localhost:8000/api/galleries/GALLERY_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@photo.jpg"
```

### Publish Gallery

```bash
curl -X PATCH http://localhost:8000/api/galleries/GALLERY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

## 💡 Tips

1. **Keep the server running** while developing the frontend
2. **Check terminal output** for error messages
3. **Use the test script** to verify changes: `python test_backend.py`
4. **Check Supabase logs** for database/storage errors
5. **Read API_DOCUMENTATION.md** for detailed endpoint info

## 🎉 You're All Set!

Your CursorGallery backend is now:

- ✅ Running on http://localhost:8000
- ✅ Connected to Supabase
- ✅ Ready to handle gallery operations
- ✅ Ready for frontend integration

Start creating amazing cursor-driven photo galleries! 🖼️✨

---

**Need help?** Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) or [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
