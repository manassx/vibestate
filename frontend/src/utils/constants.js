// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
    },
    GALLERIES: {
        LIST: '/api/galleries',
        CREATE: '/api/galleries',
        GET: (id) => `/api/galleries/${id}`,
        UPDATE: (id) => `/api/galleries/${id}`,
        DELETE: (id) => `/api/galleries/${id}`,
        UPLOAD: (id) => `/api/galleries/${id}/upload`,
        ANALYZE: (id) => `/api/galleries/${id}/analyze`,
    },
    PUBLIC: {
        GALLERY: (username, slug) => `/api/public/${username}/${slug}`,
    }
};

// Gallery configuration constants
export const GALLERY_CONFIG = {
    MAX_IMAGES: 50,
    MIN_IMAGES: 10,
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

    // Default interaction settings
    DEFAULT_THRESHOLD: 80,
    MIN_THRESHOLD: 20,
    MAX_THRESHOLD: 200,

    // Animation types
    ANIMATION_TYPES: {
        FADE: 'fade',
        SLIDE: 'slide',
        ZOOM: 'zoom',
        BURST: 'burst',
    },

    // Mood types (from AI analysis)
    MOOD_TYPES: {
        CALM: 'calm',
        ENERGETIC: 'energetic',
        DRAMATIC: 'dramatic',
        PLAYFUL: 'playful',
        ELEGANT: 'elegant',
        MYSTERIOUS: 'mysterious',
    }
};

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
    FREE: {
        name: 'Free',
        maxGalleries: 1,
        maxImages: 20,
        features: ['Basic interactions', 'Standard themes']
    },
    PRO: {
        name: 'Pro',
        price: 9,
        maxGalleries: 10,
        maxImages: 100,
        features: ['Premium effects', 'Custom themes', 'Analytics']
    },
    BUSINESS: {
        name: 'Business',
        price: 29,
        maxGalleries: -1, // unlimited
        maxImages: -1,
        features: ['Everything in Pro', 'Custom domain', 'Advanced analytics', 'Priority support']
    }
};

// Error messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Please log in to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload JPEG, PNG, or WebP images.',
    TOO_MANY_FILES: 'Too many files. Maximum is 50 images per gallery.',
};