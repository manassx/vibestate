# Frontend Setup Guide

## What Changed?

Your backend developer asked you to fix the endpoints and create settings. Here's what was fixed:

### 1. ✅ Created Environment Configuration (`.env`)

The frontend now has a `.env` file with proper configuration:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=CursorGallery
VITE_APP_URL=http://localhost:5173
```

**Important:** The `.env` file is now gitignored, so it won't be committed to version control.

### 2. ✅ Fixed API Endpoints

Previously, the API calls were using relative paths without the base URL. Now:

- Created a new `src/utils/api.js` utility that handles all API requests
- Updated `src/store/authStore.js` to use the new API utility
- Updated `src/store/galleryStore.js` to use the new API utility
- All requests now properly use the `VITE_API_URL` from your `.env` file
- Authentication tokens are automatically included in all requests

### 3. ✅ Created API Documentation

The `API_DOCUMENTATION.md` file contains all the endpoints your backend developer needs to implement, including:

- Request/response formats
- Authentication requirements
- Error handling
- CORS configuration

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already created with default values. If your backend runs on a different port, update:

```env
VITE_API_URL=http://localhost:YOUR_BACKEND_PORT
```

### 3. Start Development Server

```bash
npm run dev
```

The app will run at `http://localhost:5173`

---

## For Your Backend Developer

Share the `API_DOCUMENTATION.md` file with your backend developer. It contains:

✅ All 12 API endpoints the frontend expects  
✅ Complete request/response formats  
✅ Authentication flow  
✅ Error handling  
✅ CORS requirements  
✅ Image upload specifications

---

## Project Structure

```
frontend/
├── src/
│   ├── store/
│   │   ├── authStore.js      # Authentication state (now with proper API)
│   │   └── galleryStore.js   # Gallery state (now with proper API)
│   ├── utils/
│   │   ├── api.js            # NEW: API utility with auth
│   │   ├── constants.js      # API endpoints & config
│   │   └── helpers.js        # Helper functions
│   ├── pages/               # React pages
│   ├── components/          # React components
│   └── App.jsx
├── .env                      # NEW: Environment variables
├── .env.example             # Template for .env
├── API_DOCUMENTATION.md     # NEW: For backend dev
└── package.json
```

---

## What to Tell Your Backend Developer

> "Hey! I've fixed the frontend endpoints and created the settings file. Check out `API_DOCUMENTATION.md` - it has all
the API endpoints you need to implement with complete request/response examples. The frontend is now configured to
connect to `http://localhost:8000` by default. Let me know if you need any changes!"

---

## Current Status

🟡 **Demo Mode Active**: The authentication is currently in demo mode (mock data). Once your backend is ready:

1. Tell your backend dev to implement the endpoints in `API_DOCUMENTATION.md`
2. Start your backend server at `http://localhost:8000`
3. Uncomment the "PRODUCTION CODE" sections in:
    - `src/store/authStore.js` (lines 54-70 for login, 106-122 for signup)
4. Comment out or remove the "DEMO MODE" code

The API utility is already set up, so no other changes are needed!

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_APP_NAME` | Application name | `CursorGallery` |
| `VITE_APP_URL` | Frontend URL | `http://localhost:5173` |

**Note:** Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

---

## Troubleshooting

### Backend Connection Issues

If you see CORS errors:

- Make sure your backend has CORS enabled for `http://localhost:5173`
- Check that `VITE_API_URL` in `.env` matches your backend URL

### Authentication Issues

If login/signup doesn't work:

- Demo mode should work immediately (no backend needed)
- For production mode, ensure backend is running and endpoints match the documentation

### Build Issues

If you see build errors:

- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then `npm install` again

---

## Next Steps

1. ✅ Share `API_DOCUMENTATION.md` with your backend developer
2. ⏳ Wait for backend to implement the endpoints
3. ⏳ Test the integration
4. ⏳ Switch from demo mode to production mode
5. ⏳ Deploy!

---

## Questions?

If your backend developer has questions about any of the endpoints or needs clarification, they can refer to:

- `API_DOCUMENTATION.md` - Complete API specification
- `src/utils/constants.js` - Frontend constants and configuration
- `src/utils/api.js` - How the frontend makes API calls
