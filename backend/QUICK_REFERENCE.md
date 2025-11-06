# CursorGallery Backend - Quick Reference Card

## 🚀 Start Backend (3 Commands)

```bash
cd vibestate/backend
pip install -r requirements.txt
python app.py
```

Server runs on: **http://localhost:8000**

---

## 📝 Essential Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Start server (development)
python app.py

# Run tests
python test_backend.py

# Production server
gunicorn -w 4 app:app
```

---

## 🔌 API Endpoints

### Auth

```
POST   /api/auth/signup       # Register user
POST   /api/auth/login        # Login user
POST   /api/auth/logout       # Logout user
```

### Galleries (require auth)

```
GET    /api/galleries         # List galleries
POST   /api/galleries         # Create gallery
GET    /api/galleries/:id     # Get gallery
PUT    /api/galleries/:id     # Update gallery
DELETE /api/galleries/:id     # Delete gallery
POST   /api/galleries/:id/upload    # Upload images
PATCH  /api/galleries/:id     # Publish gallery
```

### Public (no auth)

```
GET    /api/gallery/:id       # View published gallery
```

---

## 📦 Request Examples

### Signup

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John"}'
```

### Create Gallery

```bash
curl -X POST http://localhost:8000/api/galleries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Gallery","description":"Test gallery"}'
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
  -d '{"status":"published"}'
```

---

## 🗄️ Database Tables

### galleries

```
id, user_id, name, description, slug, status, 
image_count, config, analysis_complete, 
created_at, updated_at
```

### images

```
id, gallery_id, url, thumbnail_url, metadata,
order_index, created_at
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### File Limits

- Max file size: **10MB**
- Max images per gallery: **50**
- Supported formats: **JPEG, PNG, WebP**
- Thumbnail size: **400x400px**

---

## 🔐 Authentication

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

Get token from login/signup response:

```json
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🐛 Quick Troubleshooting

### Port already in use

```python
# Change port in app.py
app.run(host='0.0.0.0', port=8001, debug=True)
```

### Module not found

```bash
pip install -r requirements.txt
```

### Database errors

- Run `database_schema.sql` in Supabase SQL Editor
- Check `.env` credentials
- Verify RLS policies

### Image upload fails

- Create `gallery-images` bucket in Supabase Storage
- Set bucket to public
- Configure storage policies

---

## 📊 Gallery Status Flow

```
draft → processing → analyzed → published
```

- **draft**: Just created
- **processing**: Uploading images
- **analyzed**: Ready to configure
- **published**: Public & shareable

---

## 🧪 Test the Backend

```bash
python test_backend.py
```

Tests:

- ✅ Server connectivity
- ✅ Auth (signup/login)
- ✅ Gallery CRUD
- ✅ Image upload
- ✅ Public access

---

## 📚 Documentation

- **README.md** - Overview
- **GETTING_STARTED.md** - 5-step setup
- **SETUP_GUIDE.md** - Detailed guide
- **API_DOCUMENTATION.md** - Complete API reference

---

## 🆘 Getting Help

1. Read GETTING_STARTED.md
2. Check API_DOCUMENTATION.md
3. Run test_backend.py
4. Review Supabase logs

---

## 🎯 Quick Setup Checklist

- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Storage bucket created (`gallery-images`)
- [ ] Storage policies configured
- [ ] `.env` file configured
- [ ] Backend running (`python app.py`)
- [ ] Tests passing (`python test_backend.py`)

---

**Backend URL:** http://localhost:8000  
**Frontend URL:** http://localhost:5173

**Happy coding! 🚀**
