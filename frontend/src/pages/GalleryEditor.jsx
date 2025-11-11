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
    const [pendingChanges, setPendingChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveHandler, setSaveHandler] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        loadGallery();
    }, [id]);

    const loadGallery = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch gallery from backend
            const galleryData = await apiGet(`/api/galleries/${id}`);
            // console.log('===== GALLERY EDITOR: Loaded gallery data =====');
            // console.log('Gallery:', galleryData);
            // console.log('Gallery images:', galleryData.images);

            // Log each image's metadata
            // galleryData.images.forEach((img, idx) => {
            //     console.log(`Image ${idx}:`, {
            //         id: img.id,
            //         url: img.url,
            //         metadata: img.metadata,
            //         hasTransform: !!(img.metadata && img.metadata.transform)
            //     });
            // });

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
                    metadata: img.metadata  // MAKE SURE TO INCLUDE METADATA
                })),
                config: galleryData.config || {
                    threshold: 80,
                    animationType: 'fade',
                    mood: 'calm'
                },
            };

            // console.log('Formatted gallery:', formattedGallery);
            // console.log('Formatted images with metadata:', formattedGallery.images);
            setGallery(formattedGallery);
            setLoading(false);
        } catch (err) {
            // console.error('Error loading gallery:', err);
            setError(err.message || 'Failed to load portfolio');
            setLoading(false);
            toast.error('Failed to load portfolio');
        }
    };

    const handlePublish = async () => {
        try {
            await patch(`/api/galleries/${id}`, {status: 'published'});
            toast.success('Portfolio published!');
            setGallery(prev => ({...prev, status: 'published'}));
        } catch (err) {
            // console.error('Error publishing gallery:', err);
            toast.error('Failed to publish portfolio');
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
                    <p>Loading your portfolio...</p>
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
                    <p className="text-xl mb-4">Failed to load portfolio</p>
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
                    <p className="text-xl mb-4">No images in your portfolio yet</p>
                    <p className="text-sm opacity-70 mb-6">Add some images to get started</p>
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
            {/* Top Controls - Mobile: Single line layout, Desktop: Original layout */}
            {isMobile ? (
                /* Mobile: All controls in one line */
                <div className="fixed top-3 left-3 right-3 z-50 flex items-center justify-between gap-1.5">
                    {/* EXIT Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[10px] tracking-wide transition-all duration-300"
                        style={{
                            backgroundColor: currentTheme.bgAlt,
                            color: currentTheme.text,
                            border: `1px solid ${currentTheme.border}`,
                            flex: '0 0 auto'
                        }}
                    >
                        <ArrowLeft size={12}/>
                        <span>EXIT</span>
                    </button>

                    {/* Empty space where portfolio name was */}
                    <div style={{flex: '1 1 auto'}}/>

                    {/* SAVE Button - Only show when there are pending changes */}
                    {pendingChanges && (
                        <button
                            onClick={() => saveHandler && saveHandler()}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[10px] tracking-wide transition-all duration-300"
                            style={{
                                backgroundColor: '#a89c8e',
                                color: '#0a0a0a',
                                border: 'none',
                                flex: '0 0 auto',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            <span>{isSaving ? 'SAVING...' : 'SAVE'}</span>
                        </button>
                    )}

                    {/* VIEW or PUBLISH Button */}
                    {gallery.status === 'published' ? (
                        <button
                            onClick={() => window.open(`/gallery/${id}`, '_blank')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[10px] tracking-wide transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                color: currentTheme.text,
                                border: `1px solid ${currentTheme.border}`,
                                flex: '0 0 auto'
                            }}
                        >
                            <ExternalLink size={12}/>
                            <span>VIEW</span>
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[10px] tracking-wide transition-all duration-300"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                color: currentTheme.text,
                                border: `1px solid ${currentTheme.border}`,
                                flex: '0 0 auto'
                            }}
                        >
                            <span>PUBLISH</span>
                        </button>
                    )}
                </div>
            ) : (
                /* Desktop: Original layout */
                <>
                    {/* Floating Exit Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs tracking-wide transition-all duration-300 opacity-70 hover:opacity-100"
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
                    <div className="fixed top-6 right-6 z-50 flex gap-2">
                        <div className="px-4 py-2 rounded-lg" style={{
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
                                    backgroundColor: currentTheme.bgAlt,
                                    color: currentTheme.text,
                                    border: `1px solid ${currentTheme.border}`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = currentTheme.bg;
                                    e.currentTarget.style.borderColor = currentTheme.accent;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = currentTheme.bgAlt;
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
                                    backgroundColor: currentTheme.bgAlt,
                                    color: currentTheme.text,
                                    border: `1px solid ${currentTheme.border}`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = currentTheme.bg;
                                    e.currentTarget.style.borderColor = currentTheme.accent;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = currentTheme.bgAlt;
                                    e.currentTarget.style.borderColor = currentTheme.border;
                                }}
                            >
                                <ExternalLink size={14}/>
                                <span>VIEW</span>
                            </button>
                        )}
                    </div>
                </>
            )}

            <CursorTrailGallery
                images={gallery.images}
                threshold={gallery.config.threshold || 80}
                showControls={true}
                editMode={true}
                galleryId={gallery.id}
                onUpdate={loadGallery}
                initialName={gallery.config.branding?.customName || ''}
                initialNameLink={gallery.config.branding?.customNameLink || ''}
                initialEmail={gallery.config.branding?.customEmail || ''}
                galleryConfig={gallery.config}
                setPendingSaveState={setPendingChanges}
                setSaveHandler={(handler, saving) => {
                    setSaveHandler(() => handler);
                    setIsSaving(saving);
                }}
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

export default GalleryEditor;