import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {post} from '../utils/api';
import {API_ENDPOINTS} from '../utils/constants';

const useAuthStore = create(
    persist(
        (set) => ({
            // State
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

        // Actions
        setUser: (user) => set({
            user,
            isAuthenticated: !!user,
            error: null
        }),

        setToken: (token) => set({token}),

        setLoading: (isLoading) => set({isLoading}),

        setError: (error) => set({error}),

        login: async (email, password) => {
            set({isLoading: true, error: null});
            try {
                // DEMO MODE: Simulate successful login
                // TODO: Replace with actual API call when backend is ready
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

                const mockUser = {
                    id: 'demo-user-123',
                    name: email.split('@')[0],
                    email: email,
                    createdAt: new Date().toISOString()
                };

                const mockToken = 'demo-token-' + Math.random().toString(36).substr(2, 9);

                set({
                    user: mockUser,
                    token: mockToken,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                return {user: mockUser, token: mockToken};

                /* PRODUCTION CODE - Uncomment when backend is ready:
                const data = await post(API_ENDPOINTS.AUTH.LOGIN, {
                    email,
                    password
                });

                set({
                    user: data.user,
                    token: data.token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                return data;
                */
            } catch (error) {
                set({
                    error: error.message,
                    isLoading: false,
                    isAuthenticated: false
                });
                throw error;
            }
        },

        signup: async (email, password, name) => {
            set({isLoading: true, error: null});
            try {
                // DEMO MODE: Simulate successful signup
                // TODO: Replace with actual API call when backend is ready
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

                const mockUser = {
                    id: 'demo-user-' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                };

                const mockToken = 'demo-token-' + Math.random().toString(36).substr(2, 9);

                set({
                    user: mockUser,
                    token: mockToken,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                return {user: mockUser, token: mockToken};

                /* PRODUCTION CODE - Uncomment when backend is ready:
                const data = await post(API_ENDPOINTS.AUTH.SIGNUP, {
                    email,
                    password,
                    name
                });

                set({
                    user: data.user,
                    token: data.token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });

                return data;
                */
            } catch (error) {
                set({
                    error: error.message,
                    isLoading: false,
                    isAuthenticated: false
                });
                throw error;
            }
        },

        logout: () => {
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null
            });
        },

        clearError: () => set({error: null}),
    }),
      {
          name: 'auth-storage',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({
              user: state.user,
              token: state.token,
              isAuthenticated: state.isAuthenticated
          }),
      }
  )
);

export default useAuthStore;