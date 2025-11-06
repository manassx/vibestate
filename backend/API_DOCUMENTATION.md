# CursorGallery Backend API Documentation

Complete API reference for the CursorGallery backend service.

**Base URL:** `http://localhost:8000` (development)

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Galleries](#galleries)
3. [Images](#images)
4. [Public Access](#public-access)
5. [Error Codes](#error-codes)
6. [Rate Limits](#rate-limits)

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/signup

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Success Response (201 Created):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `409 Conflict`: Email already exists

---

### POST /api/auth/login

Login with existing credentials.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid credentials

---

### POST /api/auth/logout

Logout current user (optional, mainly for frontend state management).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Galleries

### GET /api/galleries

List all galleries belonging to the authenticated user.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200 OK):**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Summer Vacation 2024",
    "description": "Photos from our trip to the mountains",
    "slug": "summer-vacation-2024",
    "status": "published",
    "image_count": 25,
    "config": {
      "threshold": 100,
      "animationType": "fade",
      "mood": "calm"
    },
    "analysis_complete": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token

---

### POST /api/galleries

Create a new gallery.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "My New Gallery",
  "description": "Optional description of the gallery",
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  }
}
```

**Field Descriptions:**

- `name` (required): Gallery name (1-100 characters)
- `description` (optional): Gallery description (max 500 characters)
- `config` (optional): Gallery configuration object
    - `threshold`: Mouse sensitivity (20-200, default: 100)
    - `animationType`: fade | slide | zoom | burst (default: fade)
    - `mood`: calm | energetic | dramatic | playful | elegant | mysterious

**Success Response (201 Created):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My New Gallery",
  "description": "Optional description of the gallery",
  "slug": "my-new-gallery",
  "status": "draft",
  "image_count": 0,
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  },
  "analysis_complete": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Missing gallery name
- `401 Unauthorized`: Missing or invalid token

---

### GET /api/galleries/:id

Get a single gallery with all its images.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `id`: Gallery UUID

**Success Response (200 OK):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Vacation 2024",
  "description": "Photos from our trip",
  "slug": "summer-vacation-2024",
  "status": "published",
  "image_count": 2,
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  },
  "analysis_complete": true,
  "images": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "gallery_id": "123e4567-e89b-12d3-a456-426614174000",
      "url": "https://storage.supabase.co/gallery-images/user-id/gallery-id/image.jpg",
      "thumbnail_url": "https://storage.supabase.co/gallery-images/user-id/gallery-id/thumbs/thumb.jpg",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "size": 2048576,
        "format": "JPEG"
      },
      "order_index": 0,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found or not owned by user

---

### PUT /api/galleries/:id

Update a gallery (full update).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**

- `id`: Gallery UUID

**Request Body:**

```json
{
  "name": "Updated Gallery Name",
  "description": "Updated description",
  "config": {
    "threshold": 120,
    "animationType": "zoom",
    "mood": "energetic"
  }
}
```

**Success Response (200 OK):**

Returns the updated gallery object (same format as GET /api/galleries/:id).

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found

---

### PATCH /api/galleries/:id

Partially update a gallery.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters:**

- `id`: Gallery UUID

**Request Body (any combination):**

```json
{
  "name": "New Name",
  "status": "published",
  "config": {
    "threshold": 150
  }
}
```

**Valid status values:**

- `draft`: Gallery not ready
- `processing`: Images being processed
- `analyzed`: Analysis complete
- `published`: Public and shareable

**Success Response (200 OK):**

Returns the updated gallery object.

**Error Responses:**

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found

---

### DELETE /api/galleries/:id

Delete a gallery and all its images.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `id`: Gallery UUID

**Success Response (200 OK):**

```json
{
  "message": "Gallery deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found

**Note:** This operation:

- Deletes the gallery from the database
- Removes all images from storage
- Deletes all associated database records
- Cannot be undone

---

## Images

### POST /api/galleries/:id/upload

Upload images to a gallery.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**

- `id`: Gallery UUID

**Request Body (multipart/form-data):**

```
images: [File, File, File, ...]
```

**Field name:** `images` (must be plural)
**Multiple files:** Yes
**Max files:** 50 per gallery total
**Max file size:** 10MB per file
**Supported formats:** JPEG, PNG, WebP

**Example using cURL:**

```bash
curl -X POST http://localhost:8000/api/galleries/GALLERY_ID/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "images=@photo3.jpg"
```

**Success Response (200 OK):**

```json
{
  "uploadedCount": 3,
  "images": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "gallery_id": "123e4567-e89b-12d3-a456-426614174000",
      "url": "https://storage.supabase.co/gallery-images/...",
      "thumbnail_url": "https://storage.supabase.co/gallery-images/thumbs/...",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "size": 2048576,
        "format": "JPEG"
      },
      "order_index": 0,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request`: No images provided or invalid format
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found
- `413 Payload Too Large`: File exceeds 10MB

**Notes:**

- Thumbnails are automatically generated (400x400px)
- Images are stored in Supabase Storage
- Gallery status changes to "processing" after first upload
- Original image metadata is extracted and stored

---

### POST /api/galleries/:id/analyze

Trigger analysis of gallery images (placeholder for future AI integration).

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `id`: Gallery UUID

**Success Response (200 OK):**

```json
{
  "analysisComplete": true,
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  },
  "message": "Gallery marked as analyzed. AI analysis coming soon!"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Gallery not found

**Notes:**

- Currently marks gallery as analyzed with default settings
- Future integration will use AI to analyze images and suggest optimal settings
- Updates gallery status to "analyzed"

---

## Public Access

These endpoints do not require authentication and are used for public gallery viewing.

### GET /api/gallery/:id

Get a published gallery by ID (public access).

**URL Parameters:**

- `id`: Gallery UUID

**Success Response (200 OK):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Summer Vacation 2024",
  "description": "Photos from our trip",
  "owner": {
    "username": "johndoe",
    "name": "John Doe"
  },
  "image_count": 25,
  "images": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "url": "https://storage.supabase.co/gallery-images/...",
      "thumbnail_url": "https://storage.supabase.co/gallery-images/thumbs/...",
      "metadata": {
        "width": 1920,
        "height": 1080
      },
      "order_index": 0
    }
  ],
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  }
}
```

**Error Responses:**

- `404 Not Found`: Gallery not found or not published

---

### GET /api/public/:username/:slug

Get a published gallery by username and slug (public access).

**URL Parameters:**

- `username`: Username (derived from email)
- `slug`: Gallery slug (URL-friendly name)

**Example:**

```
GET /api/public/johndoe/summer-vacation-2024
```

**Success Response (200 OK):**

Same format as GET /api/gallery/:id

**Error Responses:**

- `404 Not Found`: Gallery not found or not published

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 413 | Payload Too Large | File size exceeds limit |
| 500 | Internal Server Error | Server error |

### Error Response Format

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### Common Error Messages

- `"Missing JSON data"` - Request body is empty or not JSON
- `"Missing required fields"` - Required fields not provided
- `"Unauthorized"` - No valid authentication token
- `"Gallery not found"` - Gallery doesn't exist or user doesn't have access
- `"No images provided"` - No files in upload request
- `"Maximum 50 images per gallery"` - Image limit exceeded
- `"Invalid email or password"` - Login credentials incorrect
- `"User with this email already exists"` - Email already registered

---

## Rate Limits

Currently no rate limiting is implemented. For production use, consider implementing:

- **Authentication endpoints:** 5 requests per minute per IP
- **Gallery operations:** 60 requests per minute per user
- **Image uploads:** 10 uploads per minute per user
- **Public access:** 100 requests per minute per IP

Recommended implementation: Flask-Limiter

---

## Gallery Status Flow

```
draft → processing → analyzed → published
  ↓         ↓           ↓          ↓
create   upload    analyze    update status
```

- **draft**: Gallery created, no images
- **processing**: Images being uploaded
- **analyzed**: Analysis complete (manual or AI)
- **published**: Publicly accessible via sharing links

---

## Best Practices

### Authentication

1. Store tokens securely (localStorage or httpOnly cookies)
2. Include token in Authorization header for all protected endpoints
3. Handle 401 errors by redirecting to login
4. Refresh tokens before expiration if possible

### Image Uploads

1. Validate file size client-side before upload
2. Use multipart/form-data content type
3. Show upload progress to users
4. Handle partial upload failures gracefully
5. Compress images client-side if very large

### Gallery Management

1. Fetch gallery list once, cache locally
2. Update local cache after create/update/delete operations
3. Lazy-load images in gallery view
4. Use thumbnails for gallery previews
5. Only fetch full gallery data when needed

### Error Handling

1. Always check response status codes
2. Display user-friendly error messages
3. Log detailed errors for debugging
4. Implement retry logic for network errors
5. Validate data client-side before sending

---

## Code Examples

### JavaScript/Fetch

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return data;
};

// Create Gallery
const createGallery = async (token, name, description) => {
  const response = await fetch('http://localhost:8000/api/galleries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  });
  return await response.json();
};

// Upload Images
const uploadImages = async (token, galleryId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  const response = await fetch(
    `http://localhost:8000/api/galleries/${galleryId}/upload`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }
  );
  return await response.json();
};
```

### Python/Requests

```python
import requests

# Login
def login(email, password):
    response = requests.post(
        'http://localhost:8000/api/auth/login',
        json={'email': email, 'password': password}
    )
    return response.json()

# Create Gallery
def create_gallery(token, name, description):
    response = requests.post(
        'http://localhost:8000/api/galleries',
        headers={'Authorization': f'Bearer {token}'},
        json={'name': name, 'description': description}
    )
    return response.json()

# Upload Images
def upload_images(token, gallery_id, file_paths):
    files = [('images', open(path, 'rb')) for path in file_paths]
    response = requests.post(
        f'http://localhost:8000/api/galleries/{gallery_id}/upload',
        headers={'Authorization': f'Bearer {token}'},
        files=files
    )
    return response.json()
```

---

## Changelog

### Version 1.0.0 (Current)

- ✅ User authentication (signup/login)
- ✅ Gallery CRUD operations
- ✅ Image upload with thumbnail generation
- ✅ Public gallery sharing
- ✅ Gallery status management
- ⏳ AI analysis (placeholder, coming soon)

---

## Support

For issues or questions:

- Review this documentation
- Check the SETUP_GUIDE.md
- Verify Supabase configuration
- Run test_backend.py to diagnose issues

---

**Last Updated:** 2024-01-15  
**API Version:** 1.0.0
