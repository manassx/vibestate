import {API_BASE_URL, API_ENDPOINTS} from './constants';
import toast from 'react-hot-toast';

// Track if we're already handling auth failure to prevent multiple redirects
let isHandlingAuthFailure = false;

/**
 * Makes an API request with proper base URL and authentication
 * @param {string} endpoint - The API endpoint (can be relative or full path)
 * @param {RequestInit} options - Fetch options
 * @param {boolean} isRetry - Whether this is a retry attempt
 * @returns {Promise<any>} - The response data
 */
export const apiRequest = async (endpoint, options = {}, isRetry = false) => {
    // Build full URL
    const url = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage if it exists
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;

    if (authStorage) {
        try {
            const parsed = JSON.parse(authStorage);
            token = parsed.state?.token;
        } catch (e) {
            // console.error('Failed to parse auth storage:', e);
        }
    }

    // Merge headers
    const headers = {
        ...options.headers,
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON requests (unless it's FormData)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Detect if this is a large upload (FormData)
    const isUpload = options.body instanceof FormData;
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

    // Set appropriate timeout: 10 minutes for uploads on mobile (slow networks), 3 minutes for desktop uploads, 2 minutes for other requests
    const timeoutMs = isUpload ? (isMobile ? 600000 : 180000) : 120000;

    // Log mobile uploads for debugging
    if (isUpload && isMobile) {
        console.log(`[Mobile Upload] Starting upload to ${endpoint}`);
        console.log(`[Mobile Upload] Timeout set to: ${timeoutMs / 1000} seconds (${timeoutMs / 60000} minutes)`);

        // Calculate FormData size
        if (options.body.entries) {
            let totalSize = 0;
            for (let pair of options.body.entries()) {
                if (pair[1] instanceof File) {
                    totalSize += pair[1].size;
                }
            }
            console.log(`[Mobile Upload] Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        }
    }

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Make the request with timeout
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Log mobile upload success
        if (isUpload && isMobile) {
            console.log(`[Mobile Upload] Upload successful to ${endpoint}`);
        }

        // Handle errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                // Retry once before giving up (could be transient network error)
                if (!isRetry) {
                    // console.log('[INFO] 401 error, retrying once...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return apiRequest(endpoint, options, true);
                }

                // Only handle auth failure once
                if (!isHandlingAuthFailure) {
                    isHandlingAuthFailure = true;

                    // console.warn('Authentication failed - token expired or invalid');

                    // Show user-friendly message (only once)
                    toast.error('Your session has expired. Please log in again.', {
                        duration: 4000,
                        id: 'auth-expired'
                    });

                    // Clear auth storage
                    localStorage.removeItem('auth-storage');

                    // Redirect to login after a delay
                    setTimeout(() => {
                        isHandlingAuthFailure = false;
                        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                            window.location.href = '/login';
                        }
                    }, 2000);
                }
            }

            // Handle other errors with user-friendly messages
            let errorMessage = errorData.message || errorData.error;

            // Provide user-friendly error messages
            if (!errorMessage) {
                switch (response.status) {
                    case 400:
                        errorMessage = 'Invalid request. Please check your input.';
                        break;
                    case 403:
                        errorMessage = 'You don\'t have permission to do that.';
                        break;
                    case 404:
                        errorMessage = 'Resource not found.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    case 503:
                        errorMessage = 'Service temporarily unavailable. Please try again.';
                        break;
                    default:
                        errorMessage = `Request failed with status ${response.status}`;
                }
            }

            throw new Error(errorMessage);
        }

        // Return JSON response
        return response.json();
    } catch (error) {
        // Log mobile upload error
        if (isUpload && isMobile) {
            console.error(`[Mobile Upload] Error during upload to ${endpoint}:`, error);
        }

        // Handle abort/timeout errors
        if (error.name === 'AbortError') {
            if (isUpload) {
                throw new Error('Upload is taking longer than expected. Please check your connection and try again with fewer images.');
            }
            throw new Error('Request timeout. Please check your connection and try again.');
        }

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Network error - retry once if not already retried and not an upload
            if (!isRetry && !isUpload) {
                // console.log('[INFO] Network error, retrying once...');
                await new Promise(resolve => setTimeout(resolve, 500));
                return apiRequest(endpoint, options, true);
            }

            if (isUpload) {
                throw new Error('Network error during upload. Please check your connection and try again.');
            }
            throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
    }
};

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'GET',
    });
};

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
};

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * PATCH request
 */
export const patch = (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
    return apiRequest(endpoint, {
        ...options,
        method: 'DELETE',
    });
};

export const updateImageTransform = async (imageId, transformData) => {
    return await patch(`/api/images/${imageId}/transform`, transformData);
};

export const updateGalleryBranding = async (galleryId, brandingData) => {
    return await patch(`/api/galleries/${galleryId}/branding`, brandingData);
};

export default {
    get,
    post,
    put,
    patch,
    delete: del,
    request: apiRequest,
    updateImageTransform,
    updateGalleryBranding
};
