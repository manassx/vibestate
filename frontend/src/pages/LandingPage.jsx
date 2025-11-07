import {Link, useNavigate} from 'react-router-dom';
import {useState, useEffect, useRef} from 'react';
import {ArrowRight, Eye} from 'lucide-react';
import {motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence} from 'framer-motion';
import CursorTrailGallery from '../components/gallery/CursorTrailGallery';
import {useTheme} from '../context/ThemeContext';
import useAuthStore from '../store/authStore';
import Navbar from '../components/layout/Navbar';

const LandingPage = () => {
    const navigate = useNavigate();
    const {isDark, currentTheme} = useTheme();
    const {isAuthenticated, user} = useAuthStore();
    const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
    const [isMobile, setIsMobile] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [canvasInteracted, setCanvasInteracted] = useState(false);
    const lastNavbarState = useRef(true);
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

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Track cursor for custom cursor effect (desktop only)
    useEffect(() => {
        if (isMobile) return;

        const handleMouseMove = (e) => {
            setCursorPos({x: e.clientX, y: e.clientY});
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile]);

    // Navbar auto-hide when demo section is in view (desktop only)
    useEffect(() => {
        const handleScroll = () => {
            // Skip navbar auto-hide on mobile
            if (isMobile) {
                if (!showNavbar) setShowNavbar(true);
                return;
            }

            if (!canvasRef.current) return;

            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how much of the canvas is visible in the viewport
            const canvasTop = Math.max(0, rect.top);
            const canvasBottom = Math.min(windowHeight, rect.bottom);
            const visibleHeight = Math.max(0, canvasBottom - canvasTop);
            const canvasVisiblePercentage = (visibleHeight / windowHeight) * 100;

            // Simple symmetrical logic: hide when canvas is dominant (75%+), show otherwise
            const shouldShowNavbar = canvasVisiblePercentage < 75;

            // Only update if state actually changed
            if (shouldShowNavbar !== lastNavbarState.current) {
                lastNavbarState.current = shouldShowNavbar;
                setShowNavbar(shouldShowNavbar);
            }

            // Reset canvas interaction when scrolling away from canvas
            if (shouldShowNavbar && canvasInteracted) {
                setCanvasInteracted(false);
            }
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        handleScroll(); // Check initial state

        return () => window.removeEventListener('scroll', handleScroll);
    }, [canvasInteracted, isMobile, showNavbar]);

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
             style={{backgroundColor: currentTheme.bg, cursor: !isMobile ? 'none' : 'auto'}}>
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
            {!isMobile && (
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

            {/* Use consistent Navbar component */}
            <AnimatePresence mode="wait">
                {showNavbar && <Navbar key="navbar"/>}
            </AnimatePresence>

            {/* Hero Section */}
            <section
                className="relative min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 z-20 flex items-center transition-colors duration-500"
                style={{backgroundColor: currentTheme.bg}}
                ref={heroRef}>
                <div className="max-w-[1400px] mx-auto w-full">
                    {/* Main heading - Larger on mobile, original size on desktop */}
                    <motion.h1
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        className="text-[16vw] sm:text-[13vw] md:text-[10vw] lg:text-[8.5vw] font-black leading-[0.9] sm:leading-[0.85] tracking-tighter mb-6 sm:mb-8 md:mb-10 transition-colors duration-500"
                        style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                    >
                        Your Portfolio, Reimagined.
                    </motion.h1>

                    {/* Description text - Larger on mobile, original on desktop */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8, delay: 0.3}}
                        className="max-w-xl mb-8 sm:mb-10 md:mb-12"
                    >
                        <p className="text-sm sm:text-sm md:text-base lg:text-lg leading-relaxed transition-colors duration-500"
                           style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}>
                            {isMobile
                                ? 'Create an interactive portfolio that responds to your touch. Transform your work into a dynamic, memorable experience.'
                                : 'Create an interactive portfolio that moves with your cursor. Transform your work into a dynamic, memorable experience. Share it like it\'s your own website.'
                            }
                        </p>
                    </motion.div>

                    {/* CTA buttons - Centered on mobile, larger on mobile */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{duration: 0.8, delay: 0.6}}
                        className="flex justify-center sm:justify-start"
                    >
                        {isAuthenticated ? (
                            // Logged-in user CTAs
                            <Link
                                to="/dashboard"
                                className="px-8 sm:px-6 md:px-8 py-3.5 sm:py-3 md:py-4 font-bold text-sm sm:text-xs md:text-sm tracking-wide transition-all duration-300 text-center"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                                onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                            >
                                GO TO DASHBOARD
                            </Link>
                        ) : (
                            // Logged-out user CTA - Only Get Started button
                            <Link
                                to="/create"
                                className="px-8 sm:px-6 md:px-8 py-3.5 sm:py-3 md:py-4 font-bold text-sm sm:text-xs md:text-sm tracking-wide transition-all duration-300 text-center"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                                onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                            >
                                GET STARTED
                            </Link>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* How it works - Responsive */}
            <section
                className="py-16 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 z-20 transition-colors duration-500"
                style={{backgroundColor: currentTheme.bgAlt}}>
                <div className="max-w-[1400px] mx-auto">
                    <h2 className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-10 sm:mb-12 md:mb-20 transition-colors duration-500"
                        style={{color: currentTheme.text}}>
                        How it works
                    </h2>

                    {/* Desktop Grid - Hidden on mobile */}
                    <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
                        {[
                            {
                                num: '01',
                                title: 'Upload',
                                desc: 'Add your best work. Start with at least one image.'
                            },
                            {
                                num: '02',
                                title: 'Customize',
                                desc: 'Fine-tune cursor sensitivity and visual mood. Make it yours.'
                            },
                            {
                                num: '03',
                                title: 'Share',
                                desc: 'One link. Your interactive portfolio, ready to impress.'
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

                    {/* Mobile Zigzag Layout - Only visible on mobile */}
                    <div className="sm:hidden space-y-8">
                        {[
                            {
                                num: '01',
                                title: 'Upload',
                                desc: 'Add your best work. Start with at least one image.'
                            },
                            {
                                num: '02',
                                title: 'Customize',
                                desc: 'Fine-tune touch sensitivity and visual mood. Make it yours.'
                            },
                            {
                                num: '03',
                                title: 'Share',
                                desc: 'One link. Your interactive portfolio, ready to impress.'
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{opacity: 0, x: idx % 2 === 0 ? -30 : 30}}
                                whileInView={{opacity: 1, x: 0}}
                                transition={{duration: 0.6, delay: idx * 0.15}}
                                viewport={{once: true}}
                                className="relative"
                            >
                                {/* Connecting line between items */}
                                {idx < 2 && (
                                    <div
                                        className="absolute w-px h-8 -bottom-8"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            opacity: 0.3,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    />
                                )}

                                {/* Minimal card design */}
                                <div
                                    className="relative px-6 py-8 border transition-all duration-300"
                                    style={{
                                        backgroundColor: currentTheme.bg,
                                        borderColor: currentTheme.border,
                                        marginLeft: idx % 2 === 0 ? '0' : '12%',
                                        marginRight: idx % 2 === 0 ? '12%' : '0',
                                    }}
                                >
                                    {/* Large decorative number background */}
                                    <div
                                        className="absolute font-black pointer-events-none select-none"
                                        style={{
                                            fontSize: '8rem',
                                            lineHeight: '1',
                                            color: currentTheme.accent,
                                            opacity: 0.08,
                                            top: '-0.5rem',
                                            [idx % 2 === 0 ? 'left' : 'right']: '1rem',
                                        }}
                                    >
                                        {item.num}
                                    </div>

                                    {/* Content with clean spacing */}
                                    <div className="relative z-10">
                                        <h3
                                            className="text-2xl font-black mb-3 tracking-tight transition-colors duration-500"
                                            style={{color: currentTheme.text}}
                                        >
                                            {item.title}
                                        </h3>
                                        <p
                                            className="text-base leading-relaxed transition-colors duration-500"
                                            style={{
                                                fontFamily: 'Georgia, serif',
                                                color: currentTheme.textMuted,
                                            }}
                                        >
                                            {item.desc}
                                        </p>
                                    </div>

                                    {/* Subtle accent indicator at bottom */}
                                    <div
                                        className="absolute bottom-0 h-0.5"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            width: '40%',
                                            [idx % 2 === 0 ? 'left' : 'right']: 0,
                                            opacity: 0.4,
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Demo Section - Responsive */}
            <section
                className="py-16 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 z-20 transition-colors duration-500"
                style={{backgroundColor: currentTheme.bg}}
                ref={demoSectionRef}>
                <div className="max-w-[1400px] mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        viewport={{once: true}}
                        className="mb-8 sm:mb-8 md:mb-16 text-center"
                    >
                        <h2 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black mb-4 sm:mb-4 md:mb-6 transition-colors duration-500"
                            style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}>
                            EXPERIENCE IT
                        </h2>
                        <p className="text-xs sm:text-xs md:text-sm tracking-wider transition-colors duration-500"
                           style={{color: currentTheme.textMuted}}>
                            {isMobile ? 'Drag your finger across the canvas' : 'Move across the canvas below'}
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
                            className="absolute -top-1.5 sm:-top-2 -left-1.5 sm:-left-2 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 border-l-2 border-t-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 border-r-2 border-t-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -bottom-1.5 sm:-bottom-2 -left-1.5 sm:-left-2 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 border-l-2 border-b-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>
                        <div
                            className="absolute -bottom-1.5 sm:-bottom-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-6 sm:h-6 md:w-8 md:h-8 border-r-2 border-b-2 z-10 transition-colors duration-500"
                            style={{borderColor: currentTheme.borderAlt}}></div>

                        {/* Demo gallery - Responsive height */}
                        <div className="relative border transition-all duration-500"
                             style={{
                                 backgroundColor: isDark ? '#000000' : '#ede9e0',
                                 borderColor: currentTheme.border,
                                 height: isMobile ? '50vh' : '65vh',
                                 minHeight: isMobile ? '350px' : '500px',
                                 maxHeight: isMobile ? '500px' : '700px'
                             }}
                             ref={canvasRef}
                        >
                            <CursorTrailGallery
                                images={demoImages}
                                threshold={isMobile ? 60 : 40}
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
                        className="mt-6 sm:mt-8 md:mt-12 text-center"
                    >
                        <p className="text-xs sm:text-xs md:text-sm tracking-wider transition-colors duration-500"
                           style={{color: currentTheme.textMuted}}>
                            {isMobile ? 'Touch-driven image trail · Adjustable sensitivity' : 'Cursor-driven image trail · Adjustable sensitivity'}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA Section - Responsive */}
            <section
                className="py-16 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12 z-20 transition-colors duration-500"
                style={{backgroundColor: currentTheme.bgAlt}}>
                <div className="max-w-[1400px] mx-auto text-center">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        transition={{duration: 0.8}}
                        viewport={{once: true}}
                    >
                        {isAuthenticated ? (
                            // Logged-in user final CTA
                            <>
                                <h2 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black mb-4 sm:mb-4 md:mb-6 transition-colors duration-500"
                                    style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}>
                                    Welcome Back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                                </h2>
                                <p className="text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl mb-8 sm:mb-8 md:mb-12 max-w-3xl mx-auto transition-colors duration-500"
                                   style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}>
                                    Ready to polish your portfolio? Manage your gallery, explore new features, or refine
                                    your interactive experience.
                                </p>
                                <Link
                                    to="/dashboard"
                                    className="inline-flex items-center gap-2 md:gap-3 px-8 sm:px-6 md:px-8 py-3.5 sm:py-3 md:py-4 font-bold text-sm sm:text-xs md:text-sm tracking-wide transition-all duration-300"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                                >
                                    <Eye className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5"/>
                                    GO TO DASHBOARD
                                </Link>
                            </>
                        ) : (
                            // Logged-out user final CTA
                            <>
                                <h2 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-black mb-8 sm:mb-8 md:mb-12 transition-colors duration-500"
                                    style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}>
                                    START NOW
                                </h2>
                                <Link
                                    to="/create"
                                    className="inline-flex items-center gap-2 md:gap-3 px-8 sm:px-6 md:px-8 py-3.5 sm:py-3 md:py-4 font-bold text-sm sm:text-xs md:text-sm tracking-wide transition-all duration-300"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
                                >
                                    CREATE YOUR PORTFOLIO
                                    <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5"/>
                                </Link>
                            </>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Footer - Responsive */}
            <footer
                className="py-6 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 lg:px-12 z-20 border-t transition-all duration-500"
                style={{backgroundColor: currentTheme.bg, borderColor: currentTheme.border}}>
                <div
                    className="max-w-[1000px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-3 md:gap-4">
                    <div
                        className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] transition-colors duration-500"
                        style={{color: currentTheme.text}}>
                        CURSOR GALLERY &copy; 2025
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs opacity-50 transition-colors duration-500"
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