// src/store/authStore.js

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import axios from 'axios'; // Import axios

// Your Flask backend URL
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth`;

// Define the initial (logged-out) state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const useAuthStore = create(
    persist(
        (set, get) => ({
            ...initialState,

            /**
             * ### LOGIN ACTION ###
             * Fetches a token from the backend and updates the state.
             */
            login: async (email, password) => {
                set({isLoading: true, error: null});
                try {
                    // 1. Call your Flask API
                    const response = await axios.post(`${API_URL}/login`, {
                        email,
                        password,
                    });

                    const {user, token} = response.data;

                    // 2. On success, update the store
                    set({
                        user: user,
                        token: token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });

                    return response.data;

                } catch (error) {
                    // 3. Handle errors (e.g., 401 Invalid Credentials)
                    const errorMessage = error.response?.data?.error || error.message || 'Login failed';

                    set({
                        ...initialState, // Reset to logged-out state on failure
                        isLoading: false,
                        error: errorMessage,
                    });

                    // 4. Re-throw the error so the LoginPage component can show a toast
                    throw new Error(errorMessage);
                }
            },

            /**
             * ### SIGNUP ACTION ###
             * Creates a new user.
             */
            signup: async (name, email, password) => {
                set({isLoading: true, error: null});
                try {
                    const response = await axios.post(`${API_URL}/signup`, {
                        name,
                        email,
                        password,
                    });

                    const {user, token, message} = response.data;

                    // If backend auto-logs in user (returns token), update state
                    if (token && user) {
                        set({
                            isAuthenticated: true,
                            user: user,
                            token: token,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        // Otherwise, just stop loading (user may need to confirm email)
                        set({isLoading: false});
                    }

                    return response.data; // Return data for component to handle

                } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Signup failed';
                    set({isLoading: false, error: errorMessage});
                    throw new Error(errorMessage);
                }
            },

            /**
             * ### UPDATE USER ACTION ###
             * Updates the user data in the store - persist middleware handles localStorage
             */
            updateUser: (userData) => {
                const currentUser = get().user;
                const updatedUser = {
                    ...currentUser,
                    ...userData
                };
                // console.log('Updating user in store:', updatedUser);
                set({
                    user: updatedUser
                });
                // Persist middleware will automatically save to localStorage
            },

            /**
             * ### LOGOUT ACTION ###
             * Resets state. The 'persist' middleware will auto-update localStorage.
             */
            logout: () => {
                set(initialState); // Reset to the initial logged-out state
            },

            clearError: () => set({error: null}),
        }),
        {
            name: 'auth-storage', // The key in localStorage
            storage: createJSONStorage(() => localStorage),
            // Only persist these fields to localStorage
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;