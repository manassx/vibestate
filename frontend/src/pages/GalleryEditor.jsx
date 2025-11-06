import {useState, useEffect} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import CursorTrailGallery from '../components/gallery/CursorTrailGallery';
import {useTheme} from '../context/ThemeContext';
import {get as apiGet, patch} from '../utils/api';
import toast from 'react-hot-toast';

const GalleryEditor = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {currentTheme, isDark} = useTheme();
    const [gallery, setGallery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadGallery();
    }, [id]);

    const loadGallery = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch gallery from backend
            const galleryData = await apiGet(`/api/galleries/${id}`);

            // Transform images to the format expected by CursorTrailGallery
            const formattedGallery = {
                id: galleryData.id,
                name: galleryData.name,
                description: galleryData.description,
                status: galleryData.status,
                images: galleryData.images.map((img, index) => ({
                    id: img.id,
                    url: img.url,
                    thumbnail: img.thumbnail_url || img.url,
                    title: `Photo ${index + 1}`,
                })),
                config: galleryData.config || {
                    threshold: 80,
                    animationType: 'fade',
                    mood: 'calm'
                },
            };

            setGallery(formattedGallery);
            setLoading(false);
        } catch (err) {
            console.error('Error loading gallery:', err);
            setError(err.message || 'Failed to load gallery');
            setLoading(false);
            toast.error('Failed to load gallery');
        }
    };

    const handlePublish = async () => {
        try {
            await patch(`/api/galleries/${id}`, {status: 'published'});
            toast.success('Gallery published!');
            setGallery(prev => ({...prev, status: 'published'}));
        } catch (err) {
            console.error('Error publishing gallery:', err);
            toast.error('Failed to publish gallery');
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: currentTheme.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentTheme.text,
                fontFamily: '"Inter", sans-serif'
            }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
                    <p>Loading gallery...</p>
                </div>
            </div>
        );
    }

    if (error || !gallery) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: currentTheme.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentTheme.text,
                fontFamily: '"Inter", sans-serif'
            }}>
                <div className="text-center">
                    <p className="text-xl mb-4">😕 Failed to load gallery</p>
                    <p className="text-sm opacity-70 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{
                            backgroundColor: currentTheme.accent,
                            color: '#fff'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!gallery.images || gallery.images.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: currentTheme.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentTheme.text,
                fontFamily: '"Inter", sans-serif'
            }}>
                <div className="text-center">
                    <p className="text-xl mb-4">📷 No images in this gallery yet</p>
                    <p className="text-sm opacity-70 mb-6">Upload some images to get started</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{
                            backgroundColor: currentTheme.accent,
                            color: '#fff'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            height: '100vh',
            backgroundColor: currentTheme.bg,
            color: currentTheme.text,
            fontFamily: '"Inter", sans-serif',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Floating Exit Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-xs tracking-wide transition-all duration-300 opacity-70 hover:opacity-100"
                style={{
                    backgroundColor: currentTheme.bgAlt,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = currentTheme.bg;
                    e.target.style.borderColor = currentTheme.accent;
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = currentTheme.bgAlt;
                    e.target.style.borderColor = currentTheme.border;
                }}
            >
                <ArrowLeft size={16}/>
                <span>EXIT</span>
            </button>

            {/* Gallery Info */}
            <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex gap-2">
                <div className="px-4 py-2 rounded-lg opacity-90" style={{
                    backgroundColor: currentTheme.bgAlt,
                    border: `1px solid ${currentTheme.border}`
                }}>
                    <p className="text-sm font-medium">{gallery.name}</p>
                    <p className="text-xs opacity-60">{gallery.images.length} photos • {gallery.status}</p>
                </div>

                {gallery.status !== 'published' && (
                    <button
                        onClick={handlePublish}
                        className="px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300"
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
                        PUBLISH
                    </button>
                )}

                {gallery.status === 'published' && (
                    <button
                        onClick={() => window.open(`/gallery/${id}`, '_blank')}
                        className="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all duration-300"
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
                    </button>
                )}
            </div>

            <CursorTrailGallery
                images={gallery.images}
                threshold={gallery.config.threshold || 80}
                showControls={true}
                theme={{
                    controlsBg: currentTheme.bgAlt,
                    controlsText: currentTheme.text
                }}
            />
        </div>
    );
};

export default GalleryEditor;