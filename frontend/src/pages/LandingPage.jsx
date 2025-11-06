import {Link, useNavigate} from 'react-router-dom';
import {useState, useEffect, useRef} from 'react';
import {ArrowRight, MoveRight, Moon, Sun, Menu, X} from 'lucide-react';
import {motion, useScroll, useTransform, useMotionValue, useSpring} from 'framer-motion';
import CursorTrailGallery from '../components/gallery/CursorTrailGallery';
import {useTheme} from '../context/ThemeContext';
import useAuthStore from '../store/authStore';

const LandingPage = () => {
    const navigate = useNavigate();
    const {isDark, setIsDark, currentTheme} = useTheme();
    const {isAuthenticated} = useAuthStore();
    const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
    const [scrolled, setScrolled] = useState(false);
    const [navbarVisible, setNavbarVisible] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const heroRef = useRef(null);
    const demoSectionRef = useRef(null);
    const canvasRef = useRef(null);
    const {scrollYProgress} = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    // Smooth cursor following
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);
    const smoothCursorX = useSpring(cursorX, {damping: 30, stiffness: 200});
    const smoothCursorY = useSpring(cursorY, {damping: 30, stiffness: 200});

    // Track cursor for custom cursor effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            setCursorPos({x: e.clientX, y: e.clientY});
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Track scroll for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Track scroll for navbar hide/show in demo section
    useEffect(() => {
        const handleScroll = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const canvasHeight = rect.height;
                const canvasTop = rect.top;
                const canvasBottom = rect.bottom;

                // Calculate how much of canvas is visible
                const visibleHeight = Math.min(canvasBottom, windowHeight) - Math.max(canvasTop, 0);
                const visiblePercentage = visibleHeight / canvasHeight;

                // Hide navbar when canvas is 80% visible
                // Show navbar when scrolled past canvas middle
                if (visiblePercentage >= 0.8 && canvasTop <= windowHeight * 0.2) {
                    setNavbarVisible(false);
                } else if (canvasTop > windowHeight * 0.2 || canvasBottom < windowHeight * 0.5) {
                    setNavbarVisible(true);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Demo gallery images (subset for performance)
    const demoImages = [
        '/images/IMG-20250628-WA0027.jpg',
        '/images/IMG-20250628-WA0029.jpg',
        '/images/IMG-20250628-WA0032.jpg',
        '/images/IMG-20250224-WA0001.jpg',
        '/images/IMG-20250628-WA0019.jpg',
        '/images/IMG-20250628-WA0044.jpg',
        '/images/IMG-20250628-WA0037.jpg',
        '/images/IMG_20240713_035003.jpg',
    ].map((url, i) => ({
        id: i + 1,
        url,
        thumbnail: url,
        title: `Demo ${i + 1}`,
    }));

    return (
        <div className="min-h-screen relative overflow-hidden transition-colors duration-500"
             style={{backgroundColor: currentTheme.bg, cursor: window.innerWidth > 768 ? 'none' : 'auto'}}>
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

            {/* Custom cursor - Only on desktop */}
            {window.innerWidth > 768 && (
                <motion.div
                    className="fixed w-1 h-1 rounded-full pointer-events-none z-50 mix-blend-difference transition-colors duration-300"
                    style={{
                        backgroundColor: currentTheme.cursor,
                        left: smoothCursorX,
                        top: smoothCursorY,
                        x: -0.5,
                        y: -0.5,
                    }}
                />
            )}

            {/* Glassmorphism Navigation Bar - Always visible, changes on scroll */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 lg:px-12 py-3 md:py-4"
                style={{cursor: 'auto'}}
            >
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: navbarVisible ? 0 : -100}}
                    transition={{duration: 0.4, ease: "easeInOut"}}
                    className="max-w-[1400px] mx-auto flex items-center justify-between px-4 md:px-6 py-3 border transition-all duration-300"
                    style={{
                        background: scrolled ? currentTheme.navBg : currentTheme.navBgTransparent,
                        borderColor: scrolled ? currentTheme.borderAlt : currentTheme.border,
                        boxShadow: scrolled ? `0 8px 32px 0 ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'}` : 'none',
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
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/login"}
                            className="text-xs tracking-[0.2em] transition-colors duration-300"
                            style={{color: currentTheme.textDim}}
                            onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                            onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                        >
                            {isAuthenticated ? "DASHBOARD" : "LOGIN"}
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
                            to="/create"
                            className="px-4 lg:px-6 py-2 text-xs tracking-[0.2em] font-medium transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.accent,
                                color: isDark ? '#0a0a0a' : '#f5f3ef'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                        >
                            START
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-3">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                color: currentTheme.text
                            }}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                            style={{color: currentTheme.text}}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                        </button>
                    </div>
                </motion.div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        className="md:hidden mt-2 mx-4 border transition-all duration-300"
                        style={{
                            background: currentTheme.navBg,
                            borderColor: currentTheme.borderAlt,
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div className="flex flex-col p-4 gap-4">
                            <Link
                                to={isAuthenticated ? "/dashboard" : "/login"}
                                className="text-xs tracking-[0.2em] py-2 transition-colors duration-300"
                                style={{color: currentTheme.textDim}}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {isAuthenticated ? "DASHBOARD" : "LOGIN"}
                            </Link>
                            <Link
                                to="/create"
                                className="px-4 py-3 text-xs tracking-[0.2em] font-medium transition-all duration-300 text-center"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                START
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.nav>

            {/* Hero Section */}
            <section
                className="relative min-h-screen px-4 md:px-6 lg:px-12 pt-20 md:pt-24 pb-12 md:pb-20 z-20 flex items-center transition-colors duration-500"
                style={{backgroundColor: currentTheme.bg}}>
                <div className="max-w-[1400px] mx-auto w-full">
                    {/* Main heading */}
                    <motion.h1
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        className="text-[13vw] sm:text-[12vw] md:text-[10vw] lg:text-[8.5vw] font-black leading-[0.85] tracking-tighter mb-8 md:mb-12 transition-colors duration-500"
                        style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                    >
                        Your Portfolio, Reimagined.
                    </motion.h1>

                    {/* Description text overlaying */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8, delay: 0.3}}
                        className="max-w-md mb-8 md:mb-12"
                    >
                        <p className="text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500"
                           style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}>
                            Images that follow your cursor. A trail of memories that appear with every movement,
                            transforming static galleries into dynamic experiences.
                        </p>
                    </motion.div>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.8, delay: 0.6}}
                        className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4"
                    >
                        <Link
                            to="/create"
                            className="px-6 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm tracking-wide transition-all duration-300 text-center"
                            style={{
                                backgroundColor: currentTheme.accent,
                                color: isDark ? '#0a0a0a' : '#f5f3ef'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                        >
                            GET STARTED
                        </Link>
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/signup"}
                            className="px-6 md:px-8 py-3 md:py-4 border-2 font-bold text-xs md:text-sm tracking-wide transition-all duration-300 text-center"
                            style={{
                                borderColor: currentTheme.accent,
                                color: currentTheme.accent,
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = currentTheme.accent;
                                e.target.style.color = isDark ? '#0a0a0a' : '#f5f3ef';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = currentTheme.accent;
                            }}
                        >
                            {isAuthenticated ? "GO TO DASHBOARD" : "SIGN UP FREE"}
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 md:py-24 lg:py-32 px-4 md:px-6 lg:px-12 z-20 transition-colors duration-500"
                     style={{backgroundColor: currentTheme.bgAlt}}>
                <div className="max-w-[1400px] mx-auto">
                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-black mb-12 md:mb-20 transition-colors duration-500"
                        style={{color: currentTheme.text}}>
                        How it works
                    </h2>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
                        {[
                            {
                                num: '01',
                                title: 'Upload',
                                desc: 'Drop your images. Minimum 10 photos.'
                            },
                            {
                                num: '02',
                                title: 'Customize',
                                desc: 'Adjust threshold sensitivity. Control how images appear as you move.'
                            },
                            {
                                num: '03',
                                title: 'Share',
                                desc: 'One link. Instant interactive gallery.'
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{opacity: 0, y: 30}}
                                whileInView={{opacity: 1, y: 0}}
                                transition={{duration: 0.6, delay: idx * 0.2}}
                                viewport={{once: true}}
                            >
                                <div
                                    className="text-6xl md:text-7xl lg:text-8xl font-black mb-3 md:mb-4 transition-colors duration-500"
                                     style={{color: currentTheme.text, opacity: isDark ? 0.1 : 0.2}}>{item.num}</div>
                                <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 transition-colors duration-500"
                                    style={{color: currentTheme.text}}>{item.title}</h3>
                                <p className="text-sm md:text-base leading-relaxed opacity-70 transition-colors duration-500"
                                   style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}>
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Demo Section */}
            <section className="py-16 md:py-24 lg:py-32 px-4 md:px-6 lg:px-12 z-20 transition-colors duration-500"
                     style={{backgroundColor: currentTheme.bg}}
                     ref={demoSectionRef}>
                <div className="max-w-[1400px] mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        viewport={{once: true}}
                        className="mb-8 md:mb-16 text-center"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 transition-colors duration-500"
                            style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}>
                            EXPERIENCE IT
                        </h2>
                        <p className="text-xs tracking-[0.2em] md:tracking-[0.3em] uppercase transition-colors duration-500"
                           style={{color: currentTheme.textDim}}>
                            {window.innerWidth > 768 ? 'Glide across the canvas below' : 'Drag your finger across the canvas'}
                        </p>
                    </motion.div>

                    {/* Demo gallery container - Clean minimal frame */}
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.8, delay: 0.2}}
                        viewport={{once: true}}
                        className="relative"
                    >
                        {/* Subtle corner decorations */}
                        <div
                            className="absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 border-l-2 border-t-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 border-r-2 border-t-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -bottom-2 -left-2 w-6 h-6 md:w-8 md:h-8 border-l-2 border-b-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -bottom-2 -right-2 w-6 h-6 md:w-8 md:h-8 border-r-2 border-b-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>

                        {/* Demo gallery - Responsive height */}
                        <div className="relative border transition-all duration-500"
                             style={{
                                 backgroundColor: isDark ? '#000000' : '#ede9e0',
                                 borderColor: currentTheme.border,
                                 height: window.innerWidth <= 768 ? '60vh' : '65vh',
                                 minHeight: window.innerWidth <= 768 ? '400px' : '500px',
                                 maxHeight: window.innerWidth <= 768 ? '600px' : '700px'
                             }}
                             ref={canvasRef}
                        >
                            <CursorTrailGallery
                                images={demoImages}
                                threshold={40}
                                showControls={false}
                                clearOnLeave={true}
                                theme={{
                                    controlsBg: currentTheme.controlsBg,
                                    controlsText: currentTheme.controlsText
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Caption */}
                    <motion.div
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        transition={{duration: 0.8, delay: 0.4}}
                        viewport={{once: true}}
                        className="mt-8 md:mt-12 text-center"
                    >
                        <p className="text-xs tracking-wider transition-colors duration-500"
                           style={{color: currentTheme.textDim}}>
                            {window.innerWidth > 768 ? 'Cursor-driven image trail · Adjustable sensitivity' : 'Touch-driven image trail · Adjustable sensitivity'}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-16 md:py-24 lg:py-32 px-4 md:px-6 lg:px-12 z-20 transition-colors duration-500"
                     style={{backgroundColor: currentTheme.bgAlt}}>
                <div className="max-w-[1400px] mx-auto text-center">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        viewport={{once: true}}
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-8 md:mb-12 transition-colors duration-500"
                            style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}>
                            START NOW
                        </h2>
                        <Link
                            to="/create"
                            className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 font-bold text-sm md:text-lg transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.accent,
                                color: isDark ? '#0a0a0a' : '#f5f3ef'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                        >
                            CREATE YOUR GALLERY
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5"/>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 md:py-12 px-4 md:px-6 lg:px-12 z-20 border-t transition-all duration-500"
                    style={{backgroundColor: currentTheme.bg, borderColor: currentTheme.border}}>
                <div
                    className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                    <div className="text-xs md:text-sm font-bold tracking-wider transition-colors duration-500"
                         style={{color: currentTheme.text}}>
                        CURSOR GALLERY &copy; 2025
                    </div>
                    <div className="text-xs md:text-sm opacity-60 transition-colors duration-500"
                         style={{color: currentTheme.textMuted}}>
                        INTERACTIVE PORTFOLIO SYSTEM
                    </div>
                </div>
            </footer>

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

export default LandingPage;