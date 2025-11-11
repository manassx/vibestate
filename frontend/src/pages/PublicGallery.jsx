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
            // console.log('Loaded public gallery data:', galleryData);
            // console.log('Public gallery images:', galleryData.images);

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
                    metadata: img.metadata
                })),
                config: galleryData.config || {
                    threshold: 80,
                    animationType: 'fade',
                    mood: 'calm'
                },
            };

            // console.log('Formatted public gallery:', formattedGallery);
            // console.log('Formatted public images:', formattedGallery.images);
            setGallery(formattedGallery);
            setLoading(false);
        } catch (err) {
            console.error('Error loading gallery:', err);
            setError(err.message || 'Failed to load portfolio');
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
                    <p>Loading portfolio...</p>
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
                    <p className="text-xl mb-4">😕 Portfolio not found</p>
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
                    <p className="text-xl mb-4">📷 This portfolio is empty</p>
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
            <CursorTrailGallery
                images={gallery.images}
                threshold={gallery.config.threshold}
                showControls={true}
                initialName={gallery.config.branding?.customName || ''}
                initialNameLink={gallery.config.branding?.customNameLink || ''}
                initialEmail={gallery.config.branding?.customEmail || ''}
                galleryConfig={gallery.config}
                theme={{
                    ...currentTheme,
                    isDark: isDark,
                    controlsBg: currentTheme.bg,
                    controlsText: currentTheme.text
                }}
            />
        </div>
    );
};

export default PublicGallery;