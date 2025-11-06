import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Home} from 'lucide-react';
import CursorTrailGallery from '../components/gallery/CursorTrailGallery';
import {useTheme} from '../context/ThemeContext';
import {get as apiGet} from '../utils/api';
import {API_ENDPOINTS} from '../utils/constants';

const PublicGallery = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {currentTheme, isDark} = useTheme();
    const [gallery, setGallery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPublicGallery();
    }, [id]);

    const loadPublicGallery = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch gallery from backend
            const galleryData = await apiGet(`/api/gallery/${id}`);

            // Transform images to the format expected by CursorTrailGallery
            const formattedGallery = {
                id: galleryData.id,
                name: galleryData.name,
                description: galleryData.description,
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

    if (error) {
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
                    <p className="text-xl mb-4">😕 Gallery not found</p>
                    <p className="text-sm opacity-70 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{
                            backgroundColor: currentTheme.accent,
                            color: '#fff'
                        }}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (!gallery || !gallery.images || gallery.images.length === 0) {
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
                    <p className="text-xl mb-4">📷 No images in this gallery</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 rounded-lg font-medium"
                        style={{
                            backgroundColor: currentTheme.accent,
                            color: '#fff'
                        }}
                    >
                        Go Home
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
            {/* Floating Home Button */}
            <button
                onClick={() => navigate('/')}
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
                <Home size={16}/>
                <span className="hidden sm:inline">CURSORGALLERY</span>
            </button>

            {/* Gallery Title (Optional) */}
            <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 px-4 py-2 rounded-lg opacity-70"
                 style={{
                     backgroundColor: currentTheme.bgAlt,
                     border: `1px solid ${currentTheme.border}`
                 }}>
                <p className="text-sm font-medium">{gallery.name}</p>
                <p className="text-xs opacity-60">{gallery.images.length} photos</p>
            </div>

            <CursorTrailGallery
                images={gallery.images}
                threshold={gallery.config.threshold}
                showControls={true}
                theme={{
                    controlsBg: currentTheme.bgAlt,
                    controlsText: currentTheme.text
                }}
            />
        </div>
    );
};

export default PublicGallery;