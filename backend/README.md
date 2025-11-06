# CursorGallery Backend API

Flask-based REST API for the CursorGallery application - Create interactive, cursor-driven photo galleries with ease.

## 🚀 Overview

This backend powers the CursorGallery web application, providing:

- **User Authentication** - Secure signup/login via Supabase Auth
- **Gallery Management** - Create, update, delete, and organize photo galleries
- **Image Storage** - Cloud storage with automatic thumbnail generation
- **Public Sharing** - Share galleries via unique URLs
- **RESTful API** - Clean, well-documented endpoints

## 📦 Tech Stack

- **Flask** - Web framework
- **Supabase** - Authentication, database (PostgreSQL), and file storage
- **Pillow** - Image processing and thumbnail generation
- **Python 3.9+** - Runtime environment

## 📂 Project Structure

```
backend/
├── app.py                    # Main Flask application
├── database_schema.sql       # Database schema for Supabase
├── requirements.txt          # Python dependencies
├── test_backend.py          # Automated test suite
├── SETUP_GUIDE.md           # Detailed setup instructions
├── README.md                # This file
├── .env                     # Environment variables (not in git)
└── venv/                    # Virtual environment (not in git)
```

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd vibestate/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Setup Supabase

1. Run `database_schema.sql` in your Supabase SQL Editor
2. Create storage bucket named `gallery-images` (public)
3. Configure storage policies (see SETUP_GUIDE.md)

### 3. Configure Environment

Your `.env` file should contain:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Run the Server

```bash
python app.py
```

Server runs on `http://localhost:8000`

### 5. Test the API

```bash
python test_backend.py
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |

### Galleries

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/galleries` | List user's galleries | Yes |
| POST | `/api/galleries` | Create new gallery | Yes |
| GET | `/api/galleries/:id` | Get single gallery | Yes |
| PUT | `/api/galleries/:id` | Update gallery | Yes |
| PATCH | `/api/galleries/:id` | Partial update | Yes |
| DELETE | `/api/galleries/:id` | Delete gallery | Yes |
| POST | `/api/galleries/:id/upload` | Upload images | Yes |
| POST | `/api/galleries/:id/analyze` | Analyze gallery | Yes |

### Public Access

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/gallery/:id` | Get published gallery | No |
| GET | `/api/public/:username/:slug` | Get gallery by slug | No |

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get the token from the `/api/auth/login` or `/api/auth/signup` response.

## 📝 Example Requests

### Signup

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### Create Gallery

```bash
curl -X POST http://localhost:8000/api/galleries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Vacation",
    "description": "Summer 2024 trip to the mountains",
    "config": {
      "threshold": 100,
      "animationType": "fade",
      "mood": "calm"
    }
  }'
```

### Upload Images

```bash
curl -X POST http://localhost:8000/api/galleries/GALLERY_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "images=@photo3.jpg"
```

### Publish Gallery

```bash
curl -X PATCH http://localhost:8000/api/galleries/GALLERY_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

## 🗄️ Database Schema

### galleries Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| name | TEXT | Gallery name |
| description | TEXT | Gallery description |
| slug | TEXT | URL-friendly slug |
| status | TEXT | draft/processing/analyzed/published |
| image_count | INTEGER | Number of images |
| config | JSONB | Gallery configuration |
| analysis_complete | BOOLEAN | AI analysis status |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### images Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gallery_id | UUID | Foreign key to galleries |
| url | TEXT | Image URL |
| thumbnail_url | TEXT | Thumbnail URL |
| metadata | JSONB | Width, height, size, format |
| order_index | INTEGER | Display order |
| created_at | TIMESTAMP | Upload time |

## 🖼️ Image Processing

- **Max file size:** 10MB
- **Supported formats:** JPEG, PNG, WebP
- **Thumbnail size:** 400x400px
- **Max images per gallery:** 50

## 🧪 Testing

The test suite covers:

- ✅ Server connectivity
- ✅ User signup & login
- ✅ Gallery CRUD operations
- ✅ Image upload
- ✅ Gallery publishing
- ✅ Public access
- ✅ Authorization checks

Run tests:

```bash
python test_backend.py
```

## 🔧 Configuration

Edit `app.py` to customize:

```python
STORAGE_BUCKET = "gallery-images"      # Supabase bucket name
MAX_FILE_SIZE = 10 * 1024 * 1024      # 10MB max file size
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
THUMBNAIL_SIZE = (400, 400)           # Thumbnail dimensions
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```python
app.run(host='0.0.0.0', port=8001, debug=True)  # Change port
```

**Database connection error:**

- Verify Supabase credentials in `.env`
- Check if tables are created
- Ensure RLS policies are active

**Image upload fails:**

- Verify storage bucket exists
- Check storage policies
- Confirm Pillow is installed

**Authentication errors:**

- Check token format: `Bearer <token>`
- Verify token hasn't expired
- Ensure user exists in Supabase

## 📊 API Response Format

### Success Response

```json
{
  "id": "gallery-id",
  "name": "Gallery Name",
  "status": "published",
  ...
}
```

### Error Response

```json
{
  "error": "Error message here"
}
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Row Level Security (RLS) in database
- ✅ CORS protection
- ✅ Input validation
- ✅ File type/size validation
- ✅ User-owned resource checks

## 📈 Performance

- Automatic thumbnail generation for faster loading
- Database indexing on frequently queried fields
- Efficient image storage in Supabase buckets
- Optimized SQL queries with proper joins

## 🚀 Deployment

### Production Checklist

- [ ] Use production WSGI server (Gunicorn)
- [ ] Set `debug=False`
- [ ] Configure CORS for production domain
- [ ] Use environment variables (not .env)
- [ ] Enable HTTPS
- [ ] Setup monitoring and logging
- [ ] Configure rate limiting
- [ ] Regular backups of database

### Deploy with Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [database_schema.sql](database_schema.sql) - Database schema
- [test_backend.py](test_backend.py) - Test suite

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update documentation
4. Use type hints where appropriate

## 📄 License

Part of the CursorGallery project.

## 🆘 Support

For issues or questions:

1. Check the SETUP_GUIDE.md
2. Review the troubleshooting section
3. Check Supabase dashboard for errors

---

**Made with ❤️ for CursorGallery**
