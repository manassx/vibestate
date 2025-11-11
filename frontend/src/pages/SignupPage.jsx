import {useState, useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Eye, EyeOff, ArrowLeft} from 'lucide-react';
import {motion} from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const [tiltRotation, setTiltRotation] = useState({rotateX: 0, rotateY: 0});
    const [buttonPosition, setButtonPosition] = useState({x: 0, y: 0});
    const [focusedField, setFocusedField] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const {signup, error} = useAuthStore();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const buttonRef = useRef(null);
    const formRef = useRef(null);

    // Theme colors matching landing page and login page
    const theme = {
        dark: {
            bg: '#0a0a0a',
            bgAlt: '#1a1a1a',
            text: '#e8e8e8',
            textMuted: '#a8a8a8',
            textDim: '#666',
            border: '#2a2a2a',
            borderAlt: '#3a3a3a',
            accent: '#e8e8e8',
            accentHover: '#ffffff',
            input: '#1a1a1a',
            inputBorder: '#2a2a2a',
            inputFocus: '#3a3a3a',
        },
        light: {
            bg: '#f5f3ef',
            bgAlt: '#e8e3d8',
            text: '#2a2520',
            textMuted: '#5a5248',
            textDim: '#8a7f70',
            border: '#d8d0c0',
            borderAlt: '#c4b8a0',
            accent: '#2a2520',
            accentHover: '#3a3530',
            input: '#ffffff',
            inputBorder: '#d8d0c0',
            inputFocus: '#c4b8a0',
        }
    };

    const currentTheme = isDark ? theme.dark : theme.light;

    // Persist theme changes to localStorage
    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // 3D Tilt Effect
    const handleCardMouseMove = (e) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateY = (mouseX / rect.width) * 20;
        const rotateX = -(mouseY / rect.height) * 20;

        setTiltRotation({rotateX, rotateY});
    };

    const handleCardMouseLeave = () => {
        setTiltRotation({rotateX: 0, rotateY: 0});
    };

    // Magnetic Button Effect
    const handleFormMouseMove = (e) => {
        if (!buttonRef.current || !formRef.current) return;

        const button = buttonRef.current;
        const buttonRect = button.getBoundingClientRect();

        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const distanceX = mouseX - buttonCenterX;
        const distanceY = mouseY - buttonCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        const magneticRange = 150;

        if (distance < magneticRange) {
            const strength = (magneticRange - distance) / magneticRange;
            const moveX = (distanceX / distance) * strength * 15;
            const moveY = (distanceY / distance) * strength * 15;
            setButtonPosition({x: moveX, y: moveY});
        } else {
            setButtonPosition({x: 0, y: 0});
        }
    };

    const handleFormMouseLeave = () => {
        setButtonPosition({x: 0, y: 0});
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        try {
            // --- THIS IS THE FIX ---
            // The order now matches authStore.js (name, email, password)
            await signup(formData.name, formData.email, formData.password);

            toast.success('Welcome to CursorGallery!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Signup failed');
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

            if (!SUPABASE_URL) {
                toast.error('Supabase configuration missing');
                return;
            }

            // CRITICAL FIX: Use current host (works for both localhost and network IPs)
            const currentOrigin = window.location.origin;
            const redirectTo = `${currentOrigin}/auth/callback`;

            // CRITICAL FIX: Add prompt=select_account to force Google account selector
            // This ensures users can choose which account to use every time
            const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&prompt=select_account`;

            // console.log('=== GOOGLE SIGN UP ===');
            // console.log('Current origin:', currentOrigin);
            // console.log('Redirect URL:', redirectTo);
            // console.log('Auth URL:', authUrl);
            // console.log('======================');

            // Redirect to Supabase Google OAuth
            window.location.href = authUrl;

        } catch (error) {
            // console.error('Google sign-up error:', error);
            toast.error('Failed to sign up with Google');
        }
    };

    return (
        <div
            className="min-h-screen grid place-items-center px-4 py-12 relative transition-colors duration-500"
            style={{backgroundColor: currentTheme.bg}}
        >
            {/* Animated noise scanline overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay transition-opacity duration-500"
                style={{
                    opacity: isDark ? 0.15 : 0.08,
                    background: `repeating-linear-gradient(
                        0deg,
                        ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 0px,
                        ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 1px,
                        transparent 1px,
                        transparent 2px
                    )`,
                    animation: 'scanlines 8s linear infinite',
                    backgroundSize: '100% 4px',
                }}
            />

            {/* Grain texture overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500"
                style={{
                    opacity: isDark ? 0.08 : 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Back to Home Button */}
            <motion.div
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.6}}
                className="fixed top-4 left-4 md:top-8 md:left-8 z-10"
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm tracking-wider transition-colors duration-300"
                    style={{color: currentTheme.textDim}}
                    onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                    onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                >
                    <ArrowLeft size={20}/>
                    <span className="hidden sm:inline">BACK TO HOME</span>
                </Link>
            </motion.div>

            {/* Centered Signup Card */}
            <div className="w-full max-w-[90%] sm:max-w-md relative z-10">
                {/* Header */}
                <motion.div
                    className="text-center mb-4 md:mb-6"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6}}
                >
                    <h1
                        className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight transition-colors duration-500"
                        style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                    >
                        Sign Up
                    </h1>
                    <p
                        className="mt-2 md:mt-4 text-sm transition-colors duration-500"
                        style={{color: currentTheme.textMuted}}
                    >
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-bold transition-colors duration-300"
                            style={{color: currentTheme.accent}}
                            onMouseEnter={(e) => e.target.style.color = currentTheme.accentHover}
                            onMouseLeave={(e) => e.target.style.color = currentTheme.accent}
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>

                {/* Signup Card with 3D Tilt Effect */}
                <motion.div
                    ref={cardRef}
                    initial={{opacity: 0, y: 50}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5, ease: 'easeOut'}}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="px-6 py-8 md:px-8 md:py-10 shadow-2xl rounded-xl border transition-all duration-100"
                    style={{
                        backgroundColor: currentTheme.bgAlt,
                        borderColor: currentTheme.border,
                        transform: `perspective(1000px) rotateX(${tiltRotation.rotateX}deg) rotateY(${tiltRotation.rotateY}deg)`,
                        transition: 'transform 0.1s ease-out, background-color 0.5s, border-color 0.5s',
                    }}
                >
                    <form
                        ref={formRef}
                        className="space-y-4 md:space-y-6"
                        onSubmit={handleSubmit}
                        onMouseMove={handleFormMouseMove}
                        onMouseLeave={handleFormMouseLeave}
                    >
                        {/* Name field with animated label */}
                        <div className="relative">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full px-3 md:px-4 pt-5 md:pt-6 pb-1.5 md:pb-2 rounded-lg border-2 transition-all duration-300 outline-none text-sm md:text-base"
                                style={{
                                    backgroundColor: currentTheme.input,
                                    borderColor: focusedField === 'name' ? currentTheme.accent : currentTheme.inputBorder,
                                    color: currentTheme.text,
                                }}
                            />
                            <label
                                htmlFor="name"
                                className="absolute left-3 md:left-4 transition-all duration-300 pointer-events-none text-xs md:text-sm"
                                style={{
                                    top: focusedField === 'name' || formData.name ? '6px' : '50%',
                                    transform: `translateY(${focusedField === 'name' || formData.name ? '0' : '-50%'}) scale(${focusedField === 'name' || formData.name ? '0.85' : '1'})`,
                                    transformOrigin: 'left top',
                                    color: focusedField === 'name' ? currentTheme.accent : currentTheme.textDim,
                                }}
                            >
                                Full name
                            </label>
                        </div>

                        {/* Email field with animated label */}
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full px-3 md:px-4 pt-5 md:pt-6 pb-1.5 md:pb-2 rounded-lg border-2 transition-all duration-300 outline-none text-sm md:text-base"
                                style={{
                                    backgroundColor: currentTheme.input,
                                    borderColor: focusedField === 'email' ? currentTheme.accent : currentTheme.inputBorder,
                                    color: currentTheme.text,
                                }}
                            />
                            <label
                                htmlFor="email"
                                className="absolute left-3 md:left-4 transition-all duration-300 pointer-events-none text-xs md:text-sm"
                                style={{
                                    top: focusedField === 'email' || formData.email ? '6px' : '50%',
                                    transform: `translateY(${focusedField === 'email' || formData.email ? '0' : '-50%'}) scale(${focusedField === 'email' || formData.email ? '0.85' : '1'})`,
                                    transformOrigin: 'left top',
                                    color: focusedField === 'email' ? currentTheme.accent : currentTheme.textDim,
                                }}
                            >
                                Email address
                            </label>
                        </div>

                        {/* Password field with animated label */}
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full px-3 md:px-4 pt-5 md:pt-6 pb-1.5 md:pb-2 pr-12 rounded-lg border-2 transition-all duration-300 outline-none text-sm md:text-base"
                                style={{
                                    backgroundColor: currentTheme.input,
                                    borderColor: focusedField === 'password' ? currentTheme.accent : currentTheme.inputBorder,
                                    color: currentTheme.text,
                                }}
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-3 md:left-4 transition-all duration-300 pointer-events-none text-xs md:text-sm"
                                style={{
                                    top: focusedField === 'password' || formData.password ? '6px' : '50%',
                                    transform: `translateY(${focusedField === 'password' || formData.password ? '0' : '-50%'}) scale(${focusedField === 'password' || formData.password ? '0.85' : '1'})`,
                                    transformOrigin: 'left top',
                                    color: focusedField === 'password' ? currentTheme.accent : currentTheme.textDim,
                                }}
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{color: currentTheme.textDim}}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </button>
                        </div>

                        {/* Confirm Password field with animated label */}
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full px-3 md:px-4 pt-5 md:pt-6 pb-1.5 md:pb-2 pr-12 rounded-lg border-2 transition-all duration-300 outline-none text-sm md:text-base"
                                style={{
                                    backgroundColor: currentTheme.input,
                                    borderColor: focusedField === 'confirmPassword' ? currentTheme.accent : currentTheme.inputBorder,
                                    color: currentTheme.text,
                                }}
                            />
                            <label
                                htmlFor="confirmPassword"
                                className="absolute left-3 md:left-4 transition-all duration-300 pointer-events-none text-xs md:text-sm"
                                style={{
                                    top: focusedField === 'confirmPassword' || formData.confirmPassword ? '6px' : '50%',
                                    transform: `translateY(${focusedField === 'confirmPassword' || formData.confirmPassword ? '0' : '-50%'}) scale(${focusedField === 'confirmPassword' || formData.confirmPassword ? '0.85' : '1'})`,
                                    transformOrigin: 'left top',
                                    color: focusedField === 'confirmPassword' ? currentTheme.accent : currentTheme.textDim,
                                }}
                            >
                                Confirm password
                            </label>
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{color: currentTheme.textDim}}
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </button>
                        </div>

                        {/* Error message */}
                        {error && (
                            <motion.div
                                initial={{opacity: 0, y: -10}}
                                animate={{opacity: 1, y: 0}}
                                className="rounded-lg p-4"
                                style={{
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                            >
                                <div className="text-sm" style={{color: '#ef4444'}}>{error}</div>
                            </motion.div>
                        )}

                        {/* Terms and conditions */}
                        <div className="flex items-center">
                            <input
                                id="agree-terms"
                                name="agree-terms"
                                type="checkbox"
                                required
                                className="h-4 w-4 rounded transition-colors duration-300"
                                style={{
                                    accentColor: currentTheme.accent,
                                }}
                            />
                            <label
                                htmlFor="agree-terms"
                                className="ml-2 block text-[10px] md:text-xs transition-colors duration-500 leading-tight"
                                style={{color: currentTheme.textMuted}}
                            >
                                I agree to the{' '}
                                <a
                                    href="#"
                                    className="font-medium transition-colors duration-300 whitespace-nowrap"
                                    style={{color: currentTheme.accent}}
                                    onMouseEnter={(e) => e.target.style.color = currentTheme.accentHover}
                                    onMouseLeave={(e) => e.target.style.color = currentTheme.accent}
                                >
                                    Terms
                                </a>
                                {' '}and{' '}
                                <a
                                    href="#"
                                    className="font-medium transition-colors duration-300 whitespace-nowrap"
                                    style={{color: currentTheme.accent}}
                                    onMouseEnter={(e) => e.target.style.color = currentTheme.accentHover}
                                    onMouseLeave={(e) => e.target.style.color = currentTheme.accent}
                                >
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Submit button with magnetic effect */}
                        <div>
                            <motion.button
                                ref={buttonRef}
                                type="submit"
                                disabled={isLoading}
                                className="w-full px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-sm tracking-wide transition-all duration-300"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef',
                                    transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
                                }}
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div
                                            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create account'
                                )}
                            </motion.button>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div
                                className="absolute inset-0 flex items-center"
                                aria-hidden="true"
                            >
                                <div
                                    className="w-full border-t"
                                    style={{borderColor: currentTheme.border}}
                                ></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span
                                    className="px-2 text-xs tracking-wider"
                                    style={{
                                        backgroundColor: currentTheme.bgAlt,
                                        color: currentTheme.textDim
                                    }}
                                >
                                    OR
                                </span>
                            </div>
                        </div>

                        {/* Google Sign-Up Button */}
                        <div>
                            <motion.button
                                type="button"
                                onClick={handleGoogleSignUp}
                                className="w-full px-4 py-3 md:px-6 md:py-4 rounded-lg font-medium text-xs md:text-sm tracking-wide flex items-center justify-center gap-2 md:gap-3 border-2 transition-all duration-300 whitespace-nowrap"
                                style={{
                                    backgroundColor: currentTheme.input,
                                    borderColor: currentTheme.inputBorder,
                                    color: currentTheme.text,
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    borderColor: currentTheme.accent,
                                }}
                                whileTap={{scale: 0.98}}
                            >
                                <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign up with Google
                            </motion.button>
                        </div>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.8, delay: 0.5}}
                    className="mt-4 md:mt-8 text-center"
                >
                    <p className="text-xs transition-colors duration-500" style={{color: currentTheme.textDim}}>
                        CursorGallery &copy; 2025 - Interactive Gallery System
                    </p>
                </motion.div>
            </div>

            <style jsx>{`
                @keyframes scanlines {
                    0% {
                        background-position: 0 0;
                    }
                    100% {
                        background-position: 0 100%;
                    }
                }

                /* Text selection styling */
                ::selection {
                    background-color: ${isDark ? '#e8e8e8' : '#2a2520'};
                    color: ${isDark ? '#0a0a0a' : '#f5f3ef'};
                }

                ::-moz-selection {
                    background-color: ${isDark ? '#e8e8e8' : '#2a2520'};
                    color: ${isDark ? '#0a0a0a' : '#f5f3ef'};
                }
            `}</style>
        </div>
    );
};

export default SignupPage;