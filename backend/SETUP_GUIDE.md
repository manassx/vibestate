# CursorGallery Backend Setup Guide

Complete guide to setting up and running the CursorGallery Flask backend.

## 📋 Prerequisites

- Python 3.9 or higher
- Supabase account
- pip (Python package manager)

## 🚀 Setup Instructions

### 1. Install Python Dependencies

First, create and activate a virtual environment (recommended):

**Windows:**

```bash
cd vibestate/backend
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**

```bash
cd vibestate/backend
python3 -m venv venv
source venv/bin/activate
```

Install required packages:

```bash
pip install -r requirements.txt
```

### 2. Configure Supabase

#### A. Create Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the `database_schema.sql` file from this directory
4. Copy and paste the entire SQL script into the editor
5. Click **Run** to create all tables, indexes, and policies

#### B. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Configure the bucket:
    - **Name:** `gallery-images`
    - **Public bucket:** ✅ Yes (checked)
    - **File size limit:** 10MB
    - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`
4. Click **Create bucket**

#### C. Configure Storage Policies

After creating the bucket, set up policies:

1. Click on the `gallery-images` bucket
2. Go to **Policies**
3. Add the following policies:

**Policy 1: Public Read**

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery-images' );
```

**Policy 2: Authenticated Upload**

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-images' 
    AND auth.role() = 'authenticated'
);
```

**Policy 3: Users can delete own files**

```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'gallery-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Environment Configuration

Your `.env` file should already contain:

```env
SUPABASE_URL=https://dmhihoqijrjasjgjsxgn.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If not, create a `.env` file in the `backend` directory with your Supabase credentials.

### 4. Run the Backend

Start the Flask development server:

```bash
python app.py
```

The server will start on `http://localhost:8000`

You should see:

```
 * Running on http://0.0.0.0:8000
 * Debug mode: on
```

### 5. Verify Installation

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

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Galleries (Authenticated)

- `GET /api/galleries` - List user's galleries
- `POST /api/galleries` - Create new gallery
- `GET /api/galleries/:id` - Get single gallery with images
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery
- `POST /api/galleries/:id/upload` - Upload images
- `POST /api/galleries/:id/analyze` - Analyze gallery (placeholder)

### Public Access (No Auth Required)

- `GET /api/public/:username/:slug` - Get published gallery by slug
- `GET /api/gallery/:id` - Get published gallery by ID

## 🧪 Testing

Run the test script to verify all endpoints:

```bash
python test_backend.py
```

## 🔧 Configuration

### File Upload Limits

Edit `app.py` to change limits:

```python
STORAGE_BUCKET = "gallery-images"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
THUMBNAIL_SIZE = (400, 400)
```

### CORS Settings

To restrict CORS to specific origins:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "https://yourdomain.com"]
    }
})
```

## 🐛 Troubleshooting

### Port Already in Use

If port 8000 is already in use, change it in `app.py`:

```python
app.run(host='0.0.0.0', port=8001, debug=True)
```

### Database Connection Issues

- Verify your `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check that tables are created by running the SQL schema
- Ensure Row Level Security policies are active

### Image Upload Fails

- Verify storage bucket exists and is named `gallery-images`
- Check storage policies are properly configured
- Ensure Pillow library is installed: `pip install Pillow`

### Authentication Errors

- Verify JWT token is being sent in Authorization header
- Check token format: `Bearer <token>`
- Ensure user exists in Supabase Auth

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/)
- [Pillow Documentation](https://pillow.readthedocs.io/)

## 🔐 Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use HTTPS in production** - Always use secure connections
3. **Enable rate limiting** - Protect against abuse (consider Flask-Limiter)
4. **Validate all inputs** - Never trust client data
5. **Keep dependencies updated** - Run `pip list --outdated` regularly

## 📦 Production Deployment

For production deployment, consider:

1. **Use a production WSGI server** (Gunicorn, uWSGI)
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

2. **Set environment variables** properly (don't use `.env` in production)

3. **Enable HTTPS** with a reverse proxy (Nginx, Caddy)

4. **Set `debug=False`** in `app.run()`

5. **Use a proper logging system**

6. **Implement monitoring** (Sentry, Datadog, etc.)

## ✅ Checklist

- [ ] Python 3.9+ installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed from requirements.txt
- [ ] Supabase project created
- [ ] Database schema executed in Supabase
- [ ] Storage bucket `gallery-images` created
- [ ] Storage policies configured
- [ ] `.env` file configured with Supabase credentials
- [ ] Backend running on http://localhost:8000
- [ ] Test script passes all tests

---

**Need help?** Check the troubleshooting section or review the API documentation.
