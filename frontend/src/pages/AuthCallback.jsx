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
            console.log('Auth callback triggered');
            console.log('Full URL:', window.location.href);
            console.log('Hash:', window.location.hash);
            console.log('Search:', window.location.search);

            // Check both hash and query parameters
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const queryParams = new URLSearchParams(window.location.search);

            // Try to get access token from either location
            let accessToken = hashParams.get('access_token') || queryParams.get('access_token');
            let refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
            let error = hashParams.get('error') || queryParams.get('error');
            let errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

            console.log('Access Token:', accessToken ? 'Found' : 'Not found');
            console.log('Error:', error);

            if (error) {
                console.error('OAuth error:', error, errorDescription);
                toast.error(errorDescription || 'Authentication failed');
                navigate('/login');
                return;
            }

            if (!accessToken) {
                console.error('No access token in URL');
                toast.error('Authentication failed - no access token received');
                navigate('/login');
                return;
            }

            // Fetch user info from Supabase using the access token
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error('Missing Supabase configuration');
                toast.error('Configuration error - please check environment variables');
                navigate('/login');
                return;
            }

            console.log('Fetching user info from Supabase...');
            const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': SUPABASE_ANON_KEY
                }
            });

            if (!userResponse.ok) {
                console.error('Failed to fetch user data:', await userResponse.text());
                throw new Error('Failed to fetch user data');
            }

            const userData = await userResponse.json();
            console.log('User data received:', userData.email);

            // Fetch custom name from backend if it exists
            let customName = userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email.split('@')[0];

            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const backendResponse = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (backendResponse.ok) {
                    const backendData = await backendResponse.json();
                    if (backendData.user && backendData.user.name) {
                        customName = backendData.user.name;
                        console.log('Using custom name from backend:', customName);
                    }
                }
            } catch (e) {
                console.log('Could not fetch custom name, using default');
            }

            // Store auth data
            const authData = {
                user: {
                    id: userData.id,
                    email: userData.email,
                    name: customName,
                    createdAt: userData.created_at
                },
                token: accessToken,
                isAuthenticated: true
            };

            // Update auth store
            localStorage.setItem('auth-storage', JSON.stringify({state: authData}));

            // Create user settings if they don't exist
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                await fetch(`${API_URL}/api/user/settings`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
            } catch (e) {
                console.log('Settings might not exist yet, will be created on first access');
            }

            console.log('Authentication successful!');
            toast.success('Successfully signed in with Google!');

            // Reload to update auth state
            window.location.href = '/dashboard';

        } catch (error) {
            console.error('Callback error:', error);
            toast.error('Authentication failed');
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
