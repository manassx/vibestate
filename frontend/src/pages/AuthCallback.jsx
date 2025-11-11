import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../context/ThemeContext';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const AuthCallback = () => {
    const navigate = useNavigate();
    const {currentTheme} = useTheme();
    const {updateUser} = useAuthStore();

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            // console.log('===== AUTH CALLBACK STARTED =====');
            // console.log('Full URL:', window.location.href);
            // console.log('Hash:', window.location.hash);
            // console.log('Search:', window.location.search);
            // console.log('Port:', window.location.port);

            // CRITICAL FIX: Check if we're on the wrong port (Supabase redirected to 3000 instead of 5173)
            if (window.location.port === '3000' && window.location.hash) {
                // console.warn('⚠️ Detected redirect to port 3000 instead of 5173!');
                // console.log('Redirecting to correct port with hash...');
                const correctUrl = `http://${window.location.hostname}:5173/auth/callback${window.location.hash}`;
                window.location.href = correctUrl;
                return;
            }

            // Check both hash and query parameters
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const queryParams = new URLSearchParams(window.location.search);

            // Try to get access token from either location
            let accessToken = hashParams.get('access_token') || queryParams.get('access_token');
            let refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
            let error = hashParams.get('error') || queryParams.get('error');
            let errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

            // console.log('Access Token:', accessToken ? 'Found' : 'Not found');
            // console.log('Error:', error);

            if (error) {
                // console.error('OAuth error:', error, errorDescription);
                toast.error(errorDescription || 'Authentication failed');
                navigate('/login');
                return;
            }

            if (!accessToken) {
                // console.error('No access token in URL');
                toast.error('Authentication failed - no access token received');
                navigate('/login');
                return;
            }

            // Fetch user info from Supabase using the access token
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                // console.error('Missing Supabase configuration');
                toast.error('Configuration error - please check environment variables');
                navigate('/login');
                return;
            }

            // console.log('Fetching user info from Supabase...');
            const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                // console.error('Failed to fetch user data:', errorText);
                throw new Error('Failed to fetch user data from Supabase');
            }

            const userData = await userResponse.json();
            // console.log('User data received from Supabase:', {
            //     email: userData.email,
            //     id: userData.id,
            //     name: userData.user_metadata?.full_name
            // });

            // CRITICAL FIX: Call our backend's /api/auth/google endpoint
            // This ensures account unification happens properly
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            // console.log('Calling backend /api/auth/google for unification...');
            // console.log('API URL:', API_URL);

            const backendResponse = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idToken: accessToken,
                    email: userData.email,
                    name: userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email.split('@')[0]
                })
            });

            if (!backendResponse.ok) {
                const errorData = await backendResponse.json().catch(() => ({}));
                // console.error('Backend auth failed:', errorData);
                throw new Error(errorData.error || 'Backend authentication failed');
            }

            const backendData = await backendResponse.json();
            // console.log('Backend auth successful:', {
            //     userId: backendData.user.id,
            //     email: backendData.user.email,
            //     name: backendData.user.name
            // });

            // Store auth data from backend (this includes unified account)
            const authData = {
                user: backendData.user,
                token: backendData.token,
                isAuthenticated: true
            };

            // Update auth store
            localStorage.setItem('auth-storage', JSON.stringify({state: authData}));

            // console.log('Authentication successful! Redirecting to dashboard...');
            toast.success('Successfully signed in with Google!');

            // Reload to update auth state
            window.location.href = '/dashboard';

        } catch (error) {
            // console.error('===== CALLBACK ERROR =====');
            // console.error('Error details:', error);
            // console.error('Error message:', error.message);
            // console.error('========================');
            toast.error(error.message || 'Authentication failed');
            navigate('/login');
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{backgroundColor: currentTheme.bg, color: currentTheme.text}}
        >
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
                <p className="text-lg">Completing sign in...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
