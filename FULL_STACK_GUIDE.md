# CursorGallery - Complete Full Stack Application Guide

**Create interactive, cursor-driven photo galleries with a powerful backend and beautiful frontend.**

## 🎯 What is CursorGallery?

CursorGallery is a full-stack web application that transforms static photo collections into dynamic, cursor-driven
experiences. Move your mouse across the screen and watch images appear and fade in a trailing effect, creating an
immersive way to explore memories.

### Key Features

- 🎨 **Cursor-Interactive Galleries** - Images respond to mouse movement
- 🔐 **User Authentication** - Secure signup/login with Supabase
- 📸 **Image Management** - Upload, organize, and manage photos
- 🌐 **Public Sharing** - Share galleries via unique URLs
- ⚙️ **Customizable Settings** - Adjust sensitivity, animation, and mood
- 📱 **Responsive Design** - Works on desktop and mobile
- ☁️ **Cloud Storage** - Images stored securely in Supabase

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Landing  │ │   Auth   │ │Dashboard │ │  Gallery  │ │
│  │   Page   │ │  Pages   │ │   Page   │ │  Editor   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  State Management (Zustand)                       │  │
│  │  - authStore: User authentication state           │  │
│  │  - galleryStore: Gallery data and operations      │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────┴──────────────────────────────────┐
│                    BACKEND (Flask)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Endpoints                                    │  │
│  │  - /api/auth/*       - Authentication            │  │
│  │  - /api/galleries/*  - Gallery CRUD              │  │
│  │  - /api/public/*     - Public access             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Core Features                                    │  │
│  │  - JWT token validation                          │  │
│  │  - Image upload & thumbnail generation           │  │
│  │  - Gallery management                            │  │
│  │  - Storage integration                           │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Supabase Client SDK
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  SUPABASE (Backend Services)             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │    Auth      │ │  PostgreSQL  │ │   Storage    │   │
│  │   Service    │ │   Database   │ │   Buckets    │   │
│  │              │ │              │ │              │   │
│  │ - Users      │ │ - galleries  │ │ - images     │   │
│  │ - Sessions   │ │ - images     │ │ - thumbnails │   │
│  │ - JWT tokens │ │ - RLS        │ │ - public URL │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Axios** - HTTP client

### Backend

- **Flask** - Python web framework
- **Supabase Python SDK** - Database & auth
- **Pillow** - Image processing
- **Flask-CORS** - Cross-origin support

### Infrastructure

- **Supabase** - Backend as a Service
    - PostgreSQL database
    - Authentication service
    - File storage
    - Row Level Security (RLS)

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ (for frontend)
- Python 3.9+ (for backend)
- Supabase account (free tier)

### 1. Backend Setup

```bash
# Navigate to backend
cd vibestate/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup Supabase (run database_schema.sql in Supabase SQL Editor)
# Create storage bucket 'gallery-images'
# Configure storage policies

# Start backend server
python app.py
```

Backend runs on: `http://localhost:8000`

**Detailed instructions:** `vibestate/backend/GETTING_STARTED.md`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd vibestate/frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3. Verify Setup

1. **Backend:** Visit `http://localhost:8000` - should show API running message
2. **Frontend:** Visit `http://localhost:5173` - should show landing page
3. **Run tests:** `cd vibestate/backend && python test_backend.py`

## 📁 Project Structure

```
vibestate/
├── backend/                    # Flask API server
│   ├── app.py                 # Main application file
│   ├── database_schema.sql    # Database schema
│   ├── requirements.txt       # Python dependencies
│   ├── test_backend.py       # Test suite
│   ├── .env                   # Environment variables
│   ├── README.md             # Backend documentation
│   ├── GETTING_STARTED.md    # Quick start guide
│   ├── SETUP_GUIDE.md        # Detailed setup
│   └── API_DOCUMENTATION.md  # API reference
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── auth/        # Auth components
│   │   │   ├── gallery/     # Gallery components
│   │   │   ├── layout/      # Layout components
│   │   │   └── upload/      # Upload components
│   │   ├── pages/           # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateGallery.jsx
│   │   │   ├── GalleryEditor.jsx
│   │   │   └── PublicGallery.jsx
│   │   ├── store/           # Zustand stores
│   │   │   ├── authStore.js
│   │   │   └── galleryStore.js
│   │   ├── utils/           # Utilities
│   │   │   ├── api.js
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── context/         # React contexts
│   │   └── App.jsx          # Main app component
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
│
└── FULL_STACK_GUIDE.md      # This file
```

## 🔄 Data Flow

### 1. User Authentication Flow

```
User → Login Form → Frontend (authStore)
  → POST /api/auth/login → Backend (Flask)
  → Supabase Auth → Validate Credentials
  → Return JWT Token → Backend
  → Frontend stores token → User authenticated
```

### 2. Gallery Creation Flow

```
User → Create Gallery Form → Frontend (galleryStore)
  → POST /api/galleries (with JWT) → Backend
  → Validate token → Check user permissions
  → Insert into galleries table → Supabase PostgreSQL
  → Generate slug → Return gallery object
  → Frontend updates state → User sees new gallery
```

### 3. Image Upload Flow

```
User → Select images → Frontend
  → POST /api/galleries/:id/upload → Backend
  → Validate files (size, type)
  → Process each image:
     - Upload original to Supabase Storage
     - Generate thumbnail (Pillow)
     - Upload thumbnail to Storage
     - Extract metadata
     - Insert record into images table
  → Return uploaded images → Frontend
  → Display images in gallery
```

### 4. Public Gallery Access

```
User → Share link → Visitor
  → GET /api/gallery/:id → Backend
  → Query gallery (status = published)
  → Fetch images
  → Return public gallery data
  → Frontend renders interactive gallery
```

## 🗄️ Database Schema

### Tables

**galleries**

```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- name (TEXT)
- description (TEXT)
- slug (TEXT, unique per user)
- status (TEXT: draft|processing|analyzed|published)
- image_count (INTEGER)
- config (JSONB)
- analysis_complete (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**images**

```sql
- id (UUID, PK)
- gallery_id (UUID, FK → galleries)
- url (TEXT)
- thumbnail_url (TEXT)
- metadata (JSONB)
- order_index (INTEGER)
- created_at (TIMESTAMP)
```

### Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own galleries
- Public access only for published galleries
- Storage policies restrict uploads to authenticated users

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/signup     - Register new user
POST   /api/auth/login      - Login user
POST   /api/auth/logout     - Logout user
```

### Galleries (Protected)

```
GET    /api/galleries           - List user's galleries
POST   /api/galleries           - Create new gallery
GET    /api/galleries/:id       - Get single gallery
PUT    /api/galleries/:id       - Update gallery
PATCH  /api/galleries/:id       - Partial update
DELETE /api/galleries/:id       - Delete gallery
POST   /api/galleries/:id/upload - Upload images
POST   /api/galleries/:id/analyze - Analyze gallery
```

### Public Access

```
GET    /api/gallery/:id              - Get published gallery
GET    /api/public/:username/:slug   - Get gallery by slug
```

**Full API documentation:** `vibestate/backend/API_DOCUMENTATION.md`

## 🎨 Frontend Routes

```
/                    - Landing page (public)
/login               - Login page
/signup              - Signup page
/dashboard           - User dashboard (protected)
/create              - Create new gallery (protected)
/gallery/:id/edit    - Edit gallery (protected)
/gallery/:id         - View published gallery (public)
/g/:id               - Short URL for gallery (public)
/:username/:slug     - User's gallery (public)
```

## 🔐 Authentication & Authorization

### How It Works

1. **Signup/Login:** User provides credentials → Supabase Auth creates session → JWT token returned
2. **Token Storage:** Frontend stores token in Zustand state (persisted to localStorage)
3. **API Requests:** Token included in Authorization header: `Bearer <token>`
4. **Backend Validation:** Flask extracts token → Validates with Supabase → Allows/denies access
5. **Protected Routes:** Frontend ProtectedRoute component checks auth state → Redirects if not authenticated

### Token Flow

```javascript
// Frontend (authStore.js)
const login = async (email, password) => {
  const response = await post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  setUser(response.user);
  setToken(response.token);
};

// Backend (app.py)
def get_user_from_token():
    auth_header = request.headers.get('Authorization')
    token = auth_header.replace('Bearer ', '')
    user = supabase.auth.get_user(token)
    return user
```

## 🖼️ Image Processing

### Upload Pipeline

1. **Client-side validation** - Check file size and type
2. **Upload to backend** - Send as multipart/form-data
3. **Server-side validation** - Verify file type, size limits
4. **Original upload** - Store in Supabase Storage
5. **Thumbnail generation** - Resize to 400x400 (Pillow)
6. **Thumbnail upload** - Store in storage
7. **Metadata extraction** - Width, height, format, size
8. **Database record** - Save image info in database
9. **Response** - Return URLs and metadata

### Storage Structure

```
gallery-images/
├── {user_id}/
│   ├── {gallery_id}/
│   │   ├── {uuid}.jpg        # Original images
│   │   ├── {uuid}.jpg
│   │   └── thumbs/
│   │       ├── {uuid}.jpg    # Thumbnails
│   │       └── {uuid}.jpg
```

## 🎮 User Journey

### First-Time User

1. **Land on homepage** → See demo gallery
2. **Click "Get Started"** → Signup page
3. **Create account** → Email & password
4. **Dashboard** → Empty state with "Create Gallery" button
5. **Create gallery** → Name & description
6. **Upload images** → Drag & drop photos
7. **Configure settings** → Adjust threshold, animation
8. **Publish** → Get shareable link
9. **Share** → Send link to friends/family

### Returning User

1. **Login** → Dashboard
2. **View galleries** → List of created galleries
3. **Edit gallery** → Add/remove images, update settings
4. **View analytics** → See views/interactions (future)
5. **Create more** → Build new galleries

## 📊 State Management

### Frontend State (Zustand)

**authStore**

```javascript
{
  user: null | { id, email, name },
  token: null | string,
  isAuthenticated: boolean,
  login(),
  signup(),
  logout()
}
```

**galleryStore**

```javascript
{
  galleries: [],
  currentGallery: null,
  isLoading: boolean,
  error: null,
  fetchGalleries(),
  createGallery(),
  updateGallery(),
  deleteGallery(),
  uploadImages()
}
```

## 🧪 Testing

### Backend Tests

```bash
cd vibestate/backend
python test_backend.py
```

Tests cover:

- ✅ Server connectivity
- ✅ User signup & login
- ✅ Gallery CRUD operations
- ✅ Image upload
- ✅ Gallery publishing
- ✅ Public access
- ✅ Authorization checks

### Manual Testing Checklist

- [ ] User can signup with email/password
- [ ] User can login
- [ ] User can create gallery
- [ ] User can upload images
- [ ] User can update gallery settings
- [ ] User can publish gallery
- [ ] Published gallery is publicly accessible
- [ ] User can delete gallery
- [ ] Unauthorized users cannot access protected routes

## 🚀 Deployment

### Backend Deployment (Recommended: Heroku, Railway, Render)

1. Set environment variables
2. Use Gunicorn: `gunicorn -w 4 app:app`
3. Set `debug=False` in production
4. Configure CORS for production domain

### Frontend Deployment (Recommended: Vercel, Netlify)

1. Build: `npm run build`
2. Set `VITE_API_URL` to production backend URL
3. Deploy `dist` folder

### Database

- Already hosted on Supabase
- No additional deployment needed
- Scale as needed (Supabase handles this)

## 🔮 Future Enhancements

### Planned Features

- [ ] **AI Analysis** - Smart image analysis for optimal settings
- [ ] **Analytics** - View counts, interactions, popular galleries
- [ ] **Themes** - Multiple visual themes (dark, light, custom)
- [ ] **Collaborative galleries** - Multiple users can contribute
- [ ] **Gallery templates** - Pre-made layouts and styles
- [ ] **Social features** - Like, comment, follow
- [ ] **Export** - Download gallery as video or PDF
- [ ] **Mobile app** - Native iOS/Android apps

### Improvements

- [ ] Rate limiting on API endpoints
- [ ] Image compression before upload
- [ ] Lazy loading for large galleries
- [ ] Progressive image loading
- [ ] Search and filter galleries
- [ ] Gallery categories/tags
- [ ] User profiles
- [ ] Email notifications

## 📚 Documentation

- **Backend:**
    - [README.md](backend/README.md) - Overview
    - [GETTING_STARTED.md](backend/GETTING_STARTED.md) - Quick start
    - [SETUP_GUIDE.md](backend/SETUP_GUIDE.md) - Detailed setup
    - [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) - API reference

- **Frontend:**
    - [README.md](frontend/README.md) - Overview
    - [API_DOCUMENTATION.md](frontend/API_DOCUMENTATION.md) - Frontend API usage

## 🐛 Common Issues & Solutions

### Backend not connecting to Supabase

- Verify `.env` file has correct credentials
- Check Supabase project is active
- Run database schema in Supabase SQL Editor

### Frontend can't reach backend

- Ensure backend is running on port 8000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is properly configured

### Images not uploading

- Check storage bucket exists and is public
- Verify storage policies are configured
- Ensure file size < 10MB

### Authentication errors

- Clear localStorage and try again
- Check token format in requests
- Verify Supabase Auth is enabled

## 💡 Best Practices

### Frontend

- Keep components small and focused
- Use TypeScript for type safety (optional upgrade)
- Implement error boundaries
- Optimize images before upload
- Use lazy loading for routes

### Backend

- Validate all inputs
- Use environment variables for secrets
- Implement proper error handling
- Add request logging
- Use connection pooling for database

### Security

- Never commit `.env` files
- Validate file uploads server-side
- Sanitize user inputs
- Use HTTPS in production
- Implement rate limiting
- Keep dependencies updated

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## 📄 License

Part of the CursorGallery project.

## 🆘 Support

Having issues? Check:

1. This documentation
2. Backend SETUP_GUIDE.md
3. API_DOCUMENTATION.md
4. Test the API with test_backend.py
5. Check Supabase dashboard for errors

---

**Built with ❤️ for creating beautiful, interactive photo galleries**

🎨 Create | 📸 Upload | 🌐 Share | ✨ Enjoy
