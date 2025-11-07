import {
    Edit,
    Eye,
    Share2,
    Settings as SettingsIcon,
    Sparkles,
    Palette,
    Image as ImageIcon,
    ArrowRight,
    Trash2,
    MousePointer2,
    AlertTriangle,
    X as CloseIcon
} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import useAuthStore from '../store/authStore';
import {useTheme} from '../context/ThemeContext';
import useGalleryStore from '../store/galleryStore';
import {useState, useEffect} from 'react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const {user} = useAuthStore();
    const navigate = useNavigate();
    const {isDark, currentTheme} = useTheme();
    const {galleries, fetchGalleries, deleteGallery, isLoading} = useGalleryStore();
    const [portfolio, setPortfolio] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        // Fetch the user's portfolio (single gallery)
        fetchGalleries().then(data => {
            if (data && data.length > 0) {
                // Use the first gallery as their portfolio
                setPortfolio(data[0]);
            } else {
                // No portfolios found
                setPortfolio(null);
            }
        }).catch(err => {
            console.error('Error fetching portfolio:', err);
            toast.error('Failed to load portfolio');
        });
    }, []);

    const handleShare = () => {
        if (portfolio) {
            const shareUrl = `${window.location.origin}/gallery/${portfolio.id}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success('Portfolio link copied to clipboard!');
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setShowDeleteModal(false);
        try {
            await deleteGallery(portfolio.id);
            setPortfolio(null);
            toast.success('Portfolio deleted');
        } catch (err) {
            console.error('Error deleting gallery:', err);
            toast.error('Failed to delete portfolio');
        }
    };

    const hasPortfolio = portfolio !== null;
    const isPublished = portfolio?.status === 'published';

    return (
        <div
            className="min-h-screen relative overflow-hidden transition-colors duration-500"
            style={{backgroundColor: currentTheme.bg, paddingTop: '80px'}}
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

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 relative z-10">
                {/* Header */}
                <motion.div
                    className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6}}
                >
                    <h1
                        className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight transition-colors duration-500"
                        style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                    >
                        {hasPortfolio ? `Welcome back, ${user?.name || 'Creator'}` : `${user?.name || 'Ready'}`}
                    </h1>
                    <p
                        className="text-sm sm:text-xs md:text-sm lg:text-base xl:text-lg mt-2 sm:mt-2 md:mt-3 lg:mt-4 transition-colors duration-500"
                        style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                    >
                        {hasPortfolio
                            ? 'Your interactive portfolio is ready to shine. Edit, refine, and share your vision.'
                            : 'Your canvas is blank. Time to fill it with something unforgettable.'}
                    </p>
                </motion.div>
                {/* Main Content */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"
                             style={{borderColor: currentTheme.accent}}></div>
                        <p style={{color: currentTheme.textMuted}}>Loading your space...</p>
                    </div>
                ) : !hasPortfolio ? (
                    /* Empty State - No Portfolio Yet */
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.2}}
                    >
                        {/* Main Call to Action - REDESIGNED WITH GRAIN */}
                        <motion.div
                            className="md:col-span-2 relative overflow-hidden border transition-all duration-500"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                borderColor: currentTheme.border,
                            }}
                            whileHover={{y: -2}}
                        >
                            {/* Decorative corner accents */}
                            <div className="absolute top-0 left-0 w-16 h-16 opacity-20 z-20" style={{
                                borderTop: `2px solid ${currentTheme.accent}`,
                                borderLeft: `2px solid ${currentTheme.accent}`
                            }}></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 opacity-20 z-20" style={{
                                borderBottom: `2px solid ${currentTheme.accent}`,
                                borderRight: `2px solid ${currentTheme.accent}`
                            }}></div>

                            {/* Content Layer - Behind grain */}
                            <div className="relative p-8 sm:p-10 md:p-12 lg:p-16 xl:p-20 z-0">
                                {/* Icon/Visual Element - CURSOR ICON */}
                                <div className="flex items-center justify-center mb-6 md:mb-8">
                                    <div className="relative">
                                        {/* Layered squares creating depth */}
                                        <div
                                            className="absolute -top-2 -left-2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-15 transition-all duration-500"
                                            style={{
                                                backgroundColor: currentTheme.accent,
                                                transform: 'rotate(12deg)',
                                                filter: 'blur(1px)'
                                            }}
                                        ></div>
                                        <div
                                            className="absolute top-1 left-1 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 opacity-25 transition-all duration-500"
                                            style={{
                                                backgroundColor: currentTheme.accent,
                                                transform: 'rotate(6deg)',
                                                filter: 'blur(0.5px)'
                                            }}
                                        ></div>
                                        <div
                                            className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center transition-all duration-500"
                                            style={{
                                                backgroundColor: currentTheme.accent,
                                            }}
                                        >
                                            <MousePointer2
                                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                                                style={{color: isDark ? '#0a0a0a' : '#f5f3ef'}}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="text-center max-w-2xl mx-auto">
                                    <h2
                                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4 md:mb-6 transition-colors duration-500"
                                        style={{color: currentTheme.text, letterSpacing: '-0.02em'}}
                                    >
                                        Start Building
                                    </h2>
                                    <p
                                        className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 md:mb-10 leading-relaxed transition-colors duration-500"
                                        style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                    >
                                        Create a cursor-driven portfolio that moves as beautifully as your work. Make
                                        something that feels like yours.
                                    </p>

                                    <Link
                                        to="/create"
                                        className="inline-flex items-center gap-3 md:gap-4 px-8 md:px-10 py-4 md:py-5 font-black text-sm md:text-base tracking-wide transition-all duration-300 group"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            color: isDark ? '#0a0a0a' : '#f5f3ef',
                                            boxShadow: `0 4px 0 0 ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = `0 6px 0 0 ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = `0 4px 0 0 ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`;
                                        }}
                                    >
                                        <span>CREATE PORTFOLIO</span>
                                        <ArrowRight
                                            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                                            strokeWidth={3}
                                        />
                                    </Link>
                                </div>
                            </div>

                            {/* Heavy grain overlay - ON TOP of content for gritty look */}
                            <div
                                className="absolute inset-0 pointer-events-none z-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='15'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'repeat',
                                    backgroundSize: '180px 180px',
                                    opacity: isDark ? 0.35 : 0.25,
                                    mixBlendMode: isDark ? 'overlay' : 'multiply',
                                }}
                            />
                        </motion.div>

                        {/* Feature Cards */}
                        {[
                            {
                                icon: Palette,
                                title: 'Fully Customizable',
                                desc: 'Control every aspect. Adjust cursor sensitivity, image transitions, and visual mood to match your style.'
                            },
                            {
                                icon: Share2,
                                title: 'Share Instantly',
                                desc: 'One beautiful link. Share your portfolio as if it\'s your own website. No complex setup required.'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                className="p-6 sm:p-6 border transition-all duration-500"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border,
                                }}
                                whileHover={{y: -4, borderColor: currentTheme.accent}}
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.6, delay: 0.3 + (idx * 0.1)}}
                            >
                                <div
                                    className="w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4 md:mb-4 transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <feature.icon className="w-6 h-6 sm:w-6 sm:h-6"
                                                  style={{color: currentTheme.accent}}/>
                                </div>
                                <h3 className="text-lg sm:text-lg md:text-xl font-black mb-2"
                                    style={{color: currentTheme.text}}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className="text-sm sm:text-sm md:text-base leading-relaxed transition-colors duration-500"
                                    style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                >
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    /* Portfolio Exists - Management View */
                    <div>
                        {/* Portfolio Preview Card */}
                        <motion.div
                            className="p-6 sm:p-6 md:p-8 lg:p-10 border transition-all duration-500 mb-6 sm:mb-6 md:mb-8"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                borderColor: currentTheme.border,
                            }}
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.2}}
                        >
                            <div className="flex flex-col gap-5 sm:gap-5 md:gap-6">
                                {/* Portfolio Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-3">
                                        <h2
                                            className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-black transition-colors duration-500"
                                            style={{color: currentTheme.text}}
                                        >
                                            {portfolio.name}
                                        </h2>
                                        <span
                                            className="text-xs px-3 py-1 sm:px-3 sm:py-1 rounded-full font-bold"
                                            style={{
                                                backgroundColor: isPublished
                                                    ? (isDark ? 'rgba(168, 156, 142, 0.2)' : 'rgba(42, 37, 32, 0.15)')
                                                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                                color: isPublished ? currentTheme.accent : currentTheme.textMuted
                                            }}
                                        >
                                            {isPublished ? 'LIVE' : 'DRAFT'}
                                        </span>
                                    </div>
                                    {portfolio.description && (
                                        <p
                                            className="text-sm sm:text-sm md:text-base mb-4 md:mb-4 transition-colors duration-500"
                                            style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                        >
                                            {portfolio.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-sm">
                                        <div className="flex items-center gap-2 sm:gap-2">
                                            <ImageIcon className="w-4 h-4 sm:w-4 sm:h-4"
                                                       style={{color: currentTheme.accent}}/>
                                            <span style={{color: currentTheme.textMuted}}>
                                                {portfolio.image_count || 0} images
                                            </span>
                                        </div>
                                        {isPublished && (
                                            <div className="flex items-center gap-2 sm:gap-2">
                                                <div className="w-2 h-2 sm:w-2 sm:h-2 rounded-full"
                                                     style={{backgroundColor: '#4ade80'}}></div>
                                                <span style={{color: currentTheme.textMuted}}>
                                                    Ready to share
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons - Two per row: EDIT+VIEW on first row, SHARE+DELETE on second row */}
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    <Link
                                        to={`/gallery/${portfolio.id}/edit`}
                                        className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex-1 sm:flex-initial justify-center sm:justify-start min-w-[calc(50%-0.25rem)] sm:min-w-0"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            color: isDark ? '#0a0a0a' : '#f5f3ef'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = currentTheme.accentHover;
                                            e.target.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = currentTheme.accent;
                                            e.target.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <Edit size={16}/>
                                        <span>EDIT PORTFOLIO</span>
                                    </Link>

                                    {isPublished && (
                                        <>
                                            <Link
                                                to={`/gallery/${portfolio.id}`}
                                                target="_blank"
                                                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex-1 sm:flex-initial justify-center sm:justify-start min-w-[calc(50%-0.25rem)] sm:min-w-0"
                                                style={{
                                                    backgroundColor: currentTheme.accent,
                                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = currentTheme.accentHover;
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = currentTheme.accent;
                                                    e.target.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <Eye size={14}/>
                                                <span>VIEW</span>
                                            </Link>

                                            <button
                                                onClick={handleShare}
                                                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex-1 sm:flex-initial justify-center sm:justify-start min-w-[calc(50%-0.25rem)] sm:min-w-0"
                                                style={{
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text,
                                                    backgroundColor: 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.borderColor = currentTheme.accent;
                                                    e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.borderColor = currentTheme.border;
                                                    e.target.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <Share2 size={14}/>
                                                <span>SHARE</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex items-center gap-1.5 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 border font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 flex-1 sm:flex-initial justify-center sm:justify-start min-w-[calc(50%-0.25rem)] sm:min-w-0"
                                        style={{
                                            borderColor: currentTheme.border,
                                            color: '#ff4444',
                                            backgroundColor: 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.borderColor = '#ff4444';
                                            e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.borderColor = currentTheme.border;
                                            e.target.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <Trash2 size={14}/>
                                        <span>DELETE</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions Grid */}
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.4}}
                        >
                            {/* Customization Card */}
                            <motion.div
                                className="p-6 sm:p-6 border transition-all duration-500 cursor-pointer"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border,
                                }}
                                whileHover={{y: -4, borderColor: currentTheme.accent}}
                                onClick={() => portfolio && navigate(`/gallery/${portfolio.id}/edit`)}
                            >
                                <div
                                    className="w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4 sm:mb-4 transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <Palette className="w-6 h-6 sm:w-6 sm:h-6" style={{color: currentTheme.accent}}/>
                                </div>
                                <h3 className="text-lg sm:text-lg font-black mb-2" style={{color: currentTheme.text}}>
                                    Edit Portfolio
                                </h3>
                                <p
                                    className="text-sm sm:text-sm leading-relaxed mb-3 sm:mb-3 transition-colors duration-500"
                                    style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                >
                                    Fine-tune your portfolio's look and feel
                                </p>
                                <span className="text-xs font-bold tracking-wide" style={{color: currentTheme.accent}}>
                                    EDIT →
                                </span>
                            </motion.div>

                            {/* Stats Card */}
                            <motion.div
                                className="p-6 sm:p-6 border transition-all duration-500"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border,
                                }}
                                whileHover={{y: -4, borderColor: currentTheme.accent}}
                            >
                                <div
                                    className="w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-4 sm:mb-4 transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <ImageIcon className="w-6 h-6 sm:w-6 sm:h-6" style={{color: currentTheme.accent}}/>
                                </div>
                                <h3 className="text-lg sm:text-lg font-black mb-2" style={{color: currentTheme.text}}>
                                    Your Collection
                                </h3>
                                <p
                                    className="text-3xl sm:text-3xl font-black mb-1 transition-colors duration-500"
                                    style={{color: currentTheme.text}}
                                >
                                    {portfolio.image_count || 0}
                                </p>
                                <p className="text-sm" style={{color: currentTheme.textMuted}}>
                                    images in portfolio
                                </p>
                            </motion.div>

                            {/* Tips Card - Hidden on mobile using CSS */}
                            <motion.div
                                className="hidden lg:block p-5 sm:p-6 border transition-all duration-500 sm:col-span-2 lg:col-span-1"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border,
                                }}
                                whileHover={{y: -4, borderColor: currentTheme.accent}}
                            >
                                <div
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" style={{color: currentTheme.accent}}/>
                                </div>
                                <h3 className="text-base sm:text-lg font-black mb-2" style={{color: currentTheme.text}}>
                                    Pro Tip
                                </h3>
                                <p
                                    className="text-xs sm:text-sm leading-relaxed transition-colors duration-500"
                                    style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                >
                                    {!isPublished
                                        ? 'Publish your portfolio to share it with the world. Your work is ready!'
                                        : 'Adjust cursor sensitivity in settings to create different viewing experiences.'}
                                </p>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)'
                    }}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteModal(false);
                        }
                    }}
                >
                    <motion.div
                        className="relative border-2 max-w-md w-full mx-2 sm:mx-0"
                        style={{
                            backgroundColor: currentTheme.bgAlt,
                            borderColor: '#ff4444',
                        }}
                        initial={{scale: 0.9, opacity: 0, y: 20}}
                        animate={{scale: 1, opacity: 1, y: 0}}
                        exit={{scale: 0.9, opacity: 0, y: 20}}
                        transition={{type: 'spring', duration: 0.5}}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 transition-all duration-200 hover:rotate-90"
                            style={{
                                color: currentTheme.textMuted,
                                opacity: 0.6
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.opacity = '1';
                                e.target.style.color = currentTheme.text;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.opacity = '0.6';
                                e.target.style.color = currentTheme.textMuted;
                            }}
                        >
                            <CloseIcon size={18}/>
                        </button>

                        {/* Content */}
                        <div className="p-5 sm:p-6 md:p-8">
                            {/* Icon */}
                            <div className="flex items-center justify-center mb-4 sm:mb-6">
                                <div className="relative">
                                    {/* Animated background layers */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                            transform: 'scale(1.5)',
                                        }}
                                        animate={{
                                            scale: [1.5, 1.7, 1.5],
                                            opacity: [0.5, 0.2, 0.5]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            backgroundColor: 'rgba(255, 68, 68, 0.15)',
                                            transform: 'scale(1.2)',
                                        }}
                                        animate={{
                                            scale: [1.2, 1.4, 1.2],
                                            opacity: [0.6, 0.3, 0.6]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: 0.3
                                        }}
                                    />

                                    {/* Icon container */}
                                    <div
                                        className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                                        style={{
                                            backgroundColor: 'rgba(255, 68, 68, 0.2)',
                                            border: '2px solid #ff4444'
                                        }}
                                    >
                                        <AlertTriangle size={window.innerWidth < 640 ? 24 : 32}
                                                       style={{color: '#ff4444'}} strokeWidth={2.5}/>
                                    </div>
                                </div>
                            </div>

                            {/* Text */}
                            <div className="text-center mb-6 sm:mb-8">
                                <h2
                                    className="text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 tracking-tight"
                                    style={{color: currentTheme.text}}
                                >
                                    Delete Portfolio?
                                </h2>
                                <p
                                    className="text-xs sm:text-sm md:text-base leading-relaxed"
                                    style={{
                                        fontFamily: 'Georgia, serif',
                                        color: currentTheme.textMuted
                                    }}
                                >
                                    This will permanently delete <span className="font-bold"
                                                                       style={{color: currentTheme.text}}>{portfolio?.name || 'your portfolio'}</span> and
                                    all its images. This action cannot be undone.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300"
                                    style={{
                                        borderColor: currentTheme.border,
                                        color: currentTheme.text,
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.borderColor = currentTheme.accent;
                                        e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.borderColor = currentTheme.border;
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm tracking-wide transition-all duration-300"
                                    style={{
                                        backgroundColor: '#ff4444',
                                        color: '#ffffff',
                                        border: '2px solid #ff4444',
                                        boxShadow: '0 4px 0 0 rgba(255, 68, 68, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#ff2222';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 0 0 rgba(255, 68, 68, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#ff4444';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 0 0 rgba(255, 68, 68, 0.3)';
                                    }}
                                >
                                    <Trash2 size={14}/>
                                    Delete Forever
                                </button>
                            </div>
                        </div>

                        {/* Grain overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='15'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'repeat',
                                backgroundSize: '180px 180px',
                                opacity: isDark ? 0.15 : 0.1,
                                mixBlendMode: isDark ? 'overlay' : 'multiply',
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}

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

export default Dashboard;