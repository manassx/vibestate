# API Documentation for Backend

This document describes all the API endpoints that the frontend application expects from the backend.

## Base URL

By default, the frontend expects the API to be running at: `http://localhost:8000`

This can be configured in the `.env` file using the `VITE_API_URL` variable.

## Authentication

All authenticated endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token is automatically included by the frontend's API utility for all requests after login.

---

## Endpoints

### Authentication

#### 1. Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "user-id-123",
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

**Error Responses:**

- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid request body

---

#### 2. Signup

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "user-id-123",
    "name": "John Doe",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

**Error Responses:**

- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid request body

---

#### 3. Logout (Optional)

**Endpoint:** `POST /api/auth/logout`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

#### 4. Refresh Token (Optional)

**Endpoint:** `POST /api/auth/refresh`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "token": "new-jwt-token-here"
}
```

---

### Galleries

#### 5. List Galleries

**Endpoint:** `GET /api/galleries`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
[
  {
    "id": "gallery-id-123",
    "name": "My Gallery",
    "description": "Gallery description",
    "userId": "user-id-123",
    "status": "draft|processing|analyzed|published",
    "imageCount": 25,
    "slug": "my-gallery",
    "config": {
      "threshold": 100,
      "animationType": "fade",
      "mood": "calm"
    },
    "analysisComplete": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 6. Create Gallery

**Endpoint:** `POST /api/galleries`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "My New Gallery",
  "description": "Optional description",
  "config": {
    "threshold": 100,
    "animationType": "fade"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "gallery-id-123",
  "name": "My New Gallery",
  "description": "Optional description",
  "userId": "user-id-123",
  "status": "draft",
  "imageCount": 0,
  "slug": "my-new-gallery",
  "config": {
    "threshold": 100,
    "animationType": "fade"
  },
  "analysisComplete": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### 7. Get Single Gallery

**Endpoint:** `GET /api/galleries/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": "gallery-id-123",
  "name": "My Gallery",
  "description": "Gallery description",
  "userId": "user-id-123",
  "status": "published",
  "imageCount": 25,
  "slug": "my-gallery",
  "images": [
    {
      "id": "image-id-1",
      "url": "https://storage.example.com/image1.jpg",
      "thumbnail": "https://storage.example.com/thumb/image1.jpg",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "size": 2048576
      }
    }
  ],
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  },
  "analysisComplete": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### 8. Update Gallery

**Endpoint:** `PUT /api/galleries/:id` or `PATCH /api/galleries/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Updated Gallery Name",
  "description": "Updated description",
  "config": {
    "threshold": 120,
    "animationType": "zoom"
  }
}
```

**Response (200 OK):**

```json
{
  "id": "gallery-id-123",
  "name": "Updated Gallery Name",
  "description": "Updated description",
  // ... rest of gallery object
}
```

---

#### 9. Delete Gallery

**Endpoint:** `DELETE /api/galleries/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Gallery deleted successfully"
}
```

---

#### 10. Upload Images

**Endpoint:** `POST /api/galleries/:id/upload`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
images: [File, File, File, ...]
```

**Notes:**

- Field name must be `images` (plural)
- Multiple files can be uploaded at once
- Max file size: 10MB per image
- Supported formats: JPEG, PNG, WebP
- Max images per gallery: 50

**Response (200 OK):**

```json
{
  "uploadedCount": 5,
  "images": [
    {
      "id": "image-id-1",
      "url": "https://storage.example.com/image1.jpg",
      "thumbnail": "https://storage.example.com/thumb/image1.jpg",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "size": 2048576
      }
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Invalid file type or size
- `413 Payload Too Large`: File too large

---

#### 11. Analyze Gallery (AI Analysis)

**Endpoint:** `POST /api/galleries/:id/analyze`

**Headers:**

```
Authorization: Bearer <token>
```

**Description:**
This endpoint triggers AI analysis of the gallery images to determine optimal settings like mood, animation type, and
interaction threshold.

**Response (200 OK):**

```json
{
  "analysisComplete": true,
  "config": {
    "mood": "energetic",
    "animationType": "burst",
    "threshold": 85,
    "suggestedTheme": "dark"
  },
  "insights": {
    "dominantColors": ["#FF5733", "#33FF57", "#3357FF"],
    "averageBrightness": 0.65,
    "contentType": "landscape|portrait|mixed",
    "recommendedLayout": "grid|masonry|carousel"
  }
}
```

---

### Public Access

#### 12. Get Public Gallery

**Endpoint:** `GET /api/public/:username/:slug`

**Description:**
Publicly accessible endpoint for viewing published galleries. No authentication required.

**Response (200 OK):**

```json
{
  "id": "gallery-id-123",
  "name": "My Public Gallery",
  "description": "Gallery description",
  "owner": {
    "username": "johndoe",
    "name": "John Doe"
  },
  "imageCount": 25,
  "images": [
    {
      "id": "image-id-1",
      "url": "https://storage.example.com/image1.jpg",
      "thumbnail": "https://storage.example.com/thumb/image1.jpg"
    }
  ],
  "config": {
    "threshold": 100,
    "animationType": "fade",
    "mood": "calm"
  },
  "publishedAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404 Not Found`: Gallery not found or not published

---

## Error Response Format

All error responses should follow this format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional error details
}
```

### Common HTTP Status Codes

- `200 OK`: Successful GET/PUT/PATCH/DELETE
- `201 Created`: Successful POST (resource created)
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `413 Payload Too Large`: File too large
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Gallery Status Values

- `draft`: Gallery created but no images uploaded
- `processing`: Images being uploaded/processed
- `analyzed`: AI analysis complete
- `published`: Gallery is publicly accessible

---

## Configuration Options

### Animation Types

- `fade`: Fade in/out
- `slide`: Slide transitions
- `zoom`: Zoom effects
- `burst`: Burst/explosion effects

### Mood Types (from AI analysis)

- `calm`: Peaceful, serene imagery
- `energetic`: High energy, vibrant
- `dramatic`: Strong contrast, emotional
- `playful`: Fun, lighthearted
- `elegant`: Sophisticated, refined
- `mysterious`: Dark, enigmatic

---

## Notes for Backend Developer

1. **Authentication**: Implement JWT-based authentication
2. **File Storage**: Use cloud storage (AWS S3, Cloudinary, etc.) for images
3. **Image Processing**:
    - Generate thumbnails for better performance
    - Extract metadata (dimensions, size, etc.)
4. **AI Analysis**: Integrate with an AI service (OpenAI Vision, Google Cloud Vision, etc.) for gallery analysis
5. **Rate Limiting**: Implement rate limiting on upload and analysis endpoints
6. **CORS**: Enable CORS for frontend origin (http://localhost:5173 in development)
7. **Database**: Store gallery metadata, user info, and image references
8. **Slug Generation**: Auto-generate URL-friendly slugs from gallery names

## CORS Configuration

The backend needs to allow requests from:

- Development: `http://localhost:5173`
- Production: Your production domain

Example CORS headers:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```
