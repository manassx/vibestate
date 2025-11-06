import {API_BASE_URL, API_ENDPOINTS} from './constants';
import toast from 'react-hot-toast';

/**
 * Makes an API request with proper base URL and authentication
 * @param {string} endpoint - The API endpoint (can be relative or full path)
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} - The response data
 */
export const apiRequest = async (endpoint, options = {}) => {
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
            console.error('Failed to parse auth storage:', e);
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

    // Make the request
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            console.warn('Authentication failed - token expired or invalid');

            // Show user-friendly message
            toast.error('Your session has expired. Please log in again.', {
                duration: 4000,
                id: 'auth-expired'
            });

            // Clear auth storage
            localStorage.removeItem('auth-storage');

            // Redirect to login after a short delay
            setTimeout(() => {
                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                    window.location.href = '/login';
                }
            }, 1500);
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

export default {
    get,
    post,
    put,
    patch,
    delete: del,
    request: apiRequest,
};
