import {Plus, Image as ImageIcon, Trash2, ExternalLink} from 'lucide-react';
import {Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import useAuthStore from '../store/authStore';
import {useTheme} from '../context/ThemeContext';
import useGalleryStore from '../store/galleryStore';
import {useState, useEffect} from 'react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const {user} = useAuthStore();
    const {isDark, currentTheme} = useTheme();
    const {galleries, fetchGalleries, deleteGallery, isLoading} = useGalleryStore();

    useEffect(() => {
        // Fetch galleries from backend on mount
        fetchGalleries().catch(err => {
            console.error('Error fetching galleries:', err);
            toast.error('Failed to load galleries');
        });
    }, []);

    const handleDeleteGallery = async (galleryId) => {
        if (!confirm('Are you sure you want to delete this gallery?')) return;

        try {
            await deleteGallery(galleryId);
            toast.success('Gallery deleted successfully');
        } catch (err) {
            console.error('Error deleting gallery:', err);
            toast.error('Failed to delete gallery');
        }
    };

    const totalImages = galleries.reduce((sum, g) => sum + (g.image_count || 0), 0);

    return (
        <div
            className="min-h-screen relative overflow-hidden transition-colors duration-500"
            style={{backgroundColor: currentTheme.bg, paddingTop: '64px'}}
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
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative z-10">
                {/* Header */}
                <motion.div
                    className="mb-8 md:mb-12"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6}}
                >
                    <h1
                        className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight transition-colors duration-500"
                        style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                    >
                        Welcome back, {user?.name || 'User'}!
                    </h1>
                    <p
                        className="text-sm md:text-base lg:text-lg mt-3 md:mt-4 transition-colors duration-500"
                        style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                    >
                        Create and manage your interactive photo galleries
                    </p>
                </motion.div>

                {/* Quick stats */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, delay: 0.2}}
                >
                    {[
                        {label: 'Total Galleries', value: galleries.length, icon: ImageIcon},
                        {label: 'Total Images', value: totalImages, icon: ImageIcon},
                        {
                            label: 'Published',
                            value: galleries.filter(g => g.status === 'published').length,
                            icon: ImageIcon
                        }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            className="p-4 md:p-6 border transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                borderColor: currentTheme.border,
                            }}
                            whileHover={{
                                borderColor: currentTheme.accent,
                                y: -4
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p
                                        className="text-xs md:text-sm mb-2 transition-colors duration-500"
                                        style={{color: currentTheme.textMuted}}
                                    >
                                        {stat.label}
                                    </p>
                                    <p
                                        className="text-3xl md:text-4xl font-black transition-colors duration-500"
                                        style={{color: currentTheme.text}}
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                                <div
                                    className="p-2 md:p-3 rounded-lg transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <stat.icon
                                        className="w-5 h-5 md:w-6 md:h-6"
                                        style={{color: currentTheme.accent}}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Galleries List or Empty State */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"
                             style={{borderColor: currentTheme.accent}}></div>
                        <p style={{color: currentTheme.textMuted}}>Loading galleries...</p>
                    </div>
                ) : galleries.length === 0 ? (
                    <motion.div
                        className="p-8 md:p-12 lg:p-16 border text-center transition-all duration-500"
                        style={{
                            backgroundColor: currentTheme.bgAlt,
                            borderColor: currentTheme.border,
                        }}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.4}}
                    >
                        <div
                            className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center transition-colors duration-300"
                            style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <ImageIcon
                                className="w-8 h-8 md:w-10 md:h-10"
                                style={{color: currentTheme.textDim}}
                            />
                        </div>
                        <h3
                            className="text-2xl md:text-3xl font-black mb-3 md:mb-4 transition-colors duration-500"
                            style={{color: currentTheme.text}}
                        >
                            No galleries yet
                        </h3>
                        <p
                            className="text-sm md:text-base mb-6 md:mb-8 max-w-md mx-auto px-4 transition-colors duration-500"
                            style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                        >
                            Create your first interactive gallery to get started. Transform your photos into a dynamic,
                            cursor-driven experience.
                        </p>
                        <Link
                            to="/create"
                            className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm tracking-wide transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.accent,
                                color: isDark ? '#0a0a0a' : '#f5f3ef'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = currentTheme.accentHover;
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = currentTheme.accent;
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            <Plus size={window.innerWidth < 768 ? 16 : 20}/>
                            <span>Create Your First Gallery</span>
                        </Link>
                    </motion.div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black" style={{color: currentTheme.text}}>Your Galleries</h2>
                            <Link
                                to="/create"
                                className="inline-flex items-center gap-2 px-4 py-2 font-bold text-xs tracking-wide transition-all duration-300"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                }}
                            >
                                <Plus size={16}/>
                                <span>NEW GALLERY</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {galleries.map((gallery) => (
                                <motion.div
                                    key={gallery.id}
                                    className="p-6 border transition-all duration-300"
                                    style={{
                                        backgroundColor: currentTheme.bgAlt,
                                        borderColor: currentTheme.border,
                                    }}
                                    whileHover={{y: -4, borderColor: currentTheme.accent}}
                                >
                                    <h3 className="text-xl font-black mb-2"
                                        style={{color: currentTheme.text}}>{gallery.name}</h3>
                                    {gallery.description && (
                                        <p className="text-sm mb-4"
                                           style={{color: currentTheme.textMuted}}>{gallery.description}</p>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs px-2 py-1 rounded" style={{
                                            backgroundColor: gallery.status === 'published'
                                                ? (isDark ? 'rgba(168, 156, 142, 0.2)' : 'rgba(42, 37, 32, 0.15)')
                                                : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                            color: gallery.status === 'published'
                                                ? currentTheme.accent
                                                : currentTheme.textMuted,
                                            fontWeight: gallery.status === 'published' ? 'bold' : 'normal'
                                        }}>{gallery.status}</span>
                                        <span className="text-xs"
                                              style={{color: currentTheme.textMuted}}>{gallery.image_count} images</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {gallery.status === 'published' && (
                                            <Link
                                                to={`/gallery/${gallery.id}`}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold transition-all duration-300 hover:opacity-80"
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                    color: currentTheme.text,
                                                    border: `1px solid ${currentTheme.border}`
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
                                                    e.currentTarget.style.borderColor = currentTheme.accent;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                                                    e.currentTarget.style.borderColor = currentTheme.border;
                                                }}
                                            >
                                                <ExternalLink size={14}/>
                                                <span>VIEW</span>
                                            </Link>
                                        )}
                                        <Link
                                            to={`/gallery/${gallery.id}/edit`}
                                            className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold border transition-all duration-300 hover:opacity-80"
                                            style={{
                                                borderColor: currentTheme.border,
                                                color: currentTheme.text,
                                                backgroundColor: 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = currentTheme.accent;
                                                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = currentTheme.border;
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            EDIT
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteGallery(gallery.id)}
                                            className="px-3 py-2 border transition-all duration-300 hover:opacity-80"
                                            style={{
                                                borderColor: currentTheme.border,
                                                color: '#ff4444',
                                                backgroundColor: 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#ff4444';
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = currentTheme.border;
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
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

export default Dashboard;