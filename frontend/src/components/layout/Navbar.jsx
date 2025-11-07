import {Link, useNavigate, useLocation} from 'react-router-dom';
import {User, LogOut, Settings, Moon, Sun, Menu, X} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {useState} from 'react';
import useAuthStore from '../../store/authStore';
import {useTheme} from '../../context/ThemeContext';

const Navbar = () => {
    const {isAuthenticated, user, logout} = useAuthStore();
    const {isDark, setIsDark, currentTheme} = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isDashboard = location.pathname === '/dashboard';

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    return (
        <AnimatePresence>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-12 py-3 md:py-4"
                style={{cursor: 'auto'}}
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -20}}
                transition={{duration: 0.3, ease: 'easeInOut'}}
            >
                <div
                    className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-6 py-3 border transition-all duration-300"
                    style={{
                        background: currentTheme.navBg,
                        borderColor: currentTheme.borderAlt,
                        boxShadow: `0 8px 32px 0 ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                             style={{backgroundColor: currentTheme.text}}></div>
                        <span
                            className="font-light text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] transition-colors duration-300"
                            style={{color: currentTheme.text}}>
                            CURSOR GALLERY
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-4 lg:gap-8">
                        {isAuthenticated ? (
                            <>
                                {/* Only show these if NOT on dashboard */}
                                {!isDashboard && (
                                    <Link
                                        to="/dashboard"
                                        className="text-xs tracking-[0.2em] transition-colors duration-300"
                                        style={{color: currentTheme.textDim}}
                                        onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                                        onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                                    >
                                        DASHBOARD
                                    </Link>
                                )}

                                {/* Theme Toggle */}
                                <button
                                    onClick={() => setIsDark(!isDark)}
                                    className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                        color: currentTheme.text
                                    }}
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                                </button>

                                {/* User menu */}
                                <div className="relative group">
                                    <button
                                        className="flex items-center gap-2 transition-colors duration-300"
                                        style={{color: currentTheme.textDim}}
                                        onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                                        onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                                    >
                                        <User size={16} strokeWidth={1.5}/>
                                        <span className="text-xs tracking-[0.2em] font-light">
                                            {user?.name || 'USER'}
                                        </span>
                                    </button>

                                    {/* Dropdown menu */}
                                    <div
                                        className="absolute right-0 mt-4 w-48 border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl"
                                        style={{
                                            backgroundColor: currentTheme.bgAlt,
                                            borderColor: currentTheme.border,
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <div className="py-2">
                                            <Link
                                                to="/settings"
                                                className="flex items-center gap-3 px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onMouseEnter={(e) => {
                                                    e.target.style.color = currentTheme.text;
                                                    e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.color = currentTheme.textDim;
                                                    e.target.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <Settings size={14} strokeWidth={1.5}/>
                                                <span>SETTINGS</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onMouseEnter={(e) => {
                                                    e.target.style.color = currentTheme.text;
                                                    e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.color = currentTheme.textDim;
                                                    e.target.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <LogOut size={14} strokeWidth={1.5}/>
                                                <span>LOGOUT</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-xs tracking-[0.2em] transition-colors duration-300"
                                    style={{color: currentTheme.textDim}}
                                    onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                                    onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                                >
                                    LOGIN
                                </Link>

                                {/* Theme Toggle */}
                                <button
                                    onClick={() => setIsDark(!isDark)}
                                    className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                        color: currentTheme.text
                                    }}
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                                </button>

                                <Link
                                    to="/signup"
                                    className="px-4 lg:px-6 py-2 text-xs tracking-[0.2em] font-medium transition-all duration-300"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                                >
                                    GET STARTED
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                            style={{color: currentTheme.text}}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu - Clean & Minimal */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            transition={{duration: 0.3, ease: 'easeInOut'}}
                            className="md:hidden mt-2 mx-4 border overflow-hidden"
                            style={{
                                background: currentTheme.navBg,
                                borderColor: currentTheme.borderAlt,
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <motion.div
                                className="py-2"
                                initial={{y: -20}}
                                animate={{y: 0}}
                                transition={{duration: 0.3}}
                            >
                                {isAuthenticated ? (
                                    <>
                                        {/* Navigation Items */}
                                        {!isDashboard && (
                                            <motion.div
                                                initial={{opacity: 0, x: -10}}
                                                animate={{opacity: 1, x: 0}}
                                                transition={{delay: 0.1}}
                                            >
                                                <Link
                                                    to="/dashboard"
                                                    className="flex items-center px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                    style={{color: currentTheme.textDim}}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    onTouchStart={(e) => {
                                                        e.currentTarget.style.color = currentTheme.text;
                                                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                    }}
                                                    onTouchEnd={(e) => {
                                                        e.currentTarget.style.color = currentTheme.textDim;
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    DASHBOARD
                                                </Link>
                                            </motion.div>
                                        )}

                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.15}}
                                        >
                                            <Link
                                                to="/settings"
                                                className="flex items-center px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onClick={() => setMobileMenuOpen(false)}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.color = currentTheme.text;
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.color = currentTheme.textDim;
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                SETTINGS
                                            </Link>
                                        </motion.div>

                                        {/* Theme Toggle */}
                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.2}}
                                        >
                                            <button
                                                onClick={() => setIsDark(!isDark)}
                                                className="flex items-center justify-between w-full px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.color = currentTheme.text;
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.color = currentTheme.textDim;
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <span>THEME</span>
                                                <div className="flex items-center gap-2">
                                                    {isDark ? (
                                                        <Sun className="w-4 h-4"/>
                                                    ) : (
                                                        <Moon className="w-4 h-4"/>
                                                    )}
                                                </div>
                                            </button>
                                        </motion.div>

                                        {/* Logout */}
                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.25}}
                                        >
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.color = currentTheme.text;
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.color = currentTheme.textDim;
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                LOGOUT
                                            </button>
                                        </motion.div>
                                    </>
                                ) : (
                                    <>
                                        {/* Login */}
                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.1}}
                                        >
                                            <Link
                                                to="/login"
                                                className="flex items-center px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onClick={() => setMobileMenuOpen(false)}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.color = currentTheme.text;
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.color = currentTheme.textDim;
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                LOGIN
                                            </Link>
                                        </motion.div>

                                        {/* Theme Toggle */}
                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.15}}
                                        >
                                            <button
                                                onClick={() => setIsDark(!isDark)}
                                                className="flex items-center justify-between w-full px-4 py-3 text-xs tracking-[0.2em] font-light transition-colors duration-300"
                                                style={{color: currentTheme.textDim}}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.color = currentTheme.text;
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.color = currentTheme.textDim;
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <span>THEME</span>
                                                <div className="flex items-center gap-2">
                                                    {isDark ? (
                                                        <Sun className="w-4 h-4"/>
                                                    ) : (
                                                        <Moon className="w-4 h-4"/>
                                                    )}
                                                </div>
                                            </button>
                                        </motion.div>

                                        {/* Get Started Button */}
                                        <motion.div
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.2}}
                                            className="px-4 py-2"
                                        >
                                            <Link
                                                to="/signup"
                                                className="flex items-center justify-center px-4 py-3 text-xs tracking-[0.2em] font-medium transition-all duration-300"
                                                style={{
                                                    backgroundColor: currentTheme.accent,
                                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                                }}
                                                onClick={() => setMobileMenuOpen(false)}
                                                onTouchStart={(e) => {
                                                    e.currentTarget.style.backgroundColor = currentTheme.accentHover;
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.currentTarget.style.backgroundColor = currentTheme.accent;
                                                }}
                                            >
                                                GET STARTED
                                            </Link>
                                        </motion.div>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </AnimatePresence>
    );
};

export default Navbar;