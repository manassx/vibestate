import {GALLERY_CONFIG, ERROR_MESSAGES} from './constants';

// File validation helpers
export const validateFile = (file) => {
    const errors = [];

    // Check file type
    if (!GALLERY_CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Check file size
    if (file.size > GALLERY_CONFIG.MAX_FILE_SIZE) {
        errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateFiles = (files) => {
    const fileArray = Array.from(files);

    // Check number of files
    if (fileArray.length > GALLERY_CONFIG.MAX_IMAGES) {
        return {
            isValid: false,
            errors: [ERROR_MESSAGES.TOO_MANY_FILES]
        };
    }

    if (fileArray.length < GALLERY_CONFIG.MIN_IMAGES) {
        return {
            isValid: false,
            errors: [`Please upload at least ${GALLERY_CONFIG.MIN_IMAGES} images.`]
        };
    }

    // Validate each file
    const allErrors = [];
    fileArray.forEach((file, index) => {
        const validation = validateFile(file);
        if (!validation.isValid) {
            allErrors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
        }
    });

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
};

// Format file size for display
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate slug from string
export const generateSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
};

// Color utilities
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const getRgbString = (hex, alpha = 1) => {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
};

// Mouse position utilities
export const getMousePosition = (event, element) => {
    const rect = element.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
};

export const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
};

// Time utilities
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(dateString);
};

// URL utilities
export const getPublicGalleryUrl = (username, gallerySlug) => {
    return `${window.location.origin}/gallery/${username}/${gallerySlug}`;
};

// Local storage utilities
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            // console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// Debounce utility
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};