import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import toast from 'react-hot-toast';
import FileUploadZone from '../components/upload/FileUploadZone';
import UploadProgress from '../components/upload/UploadProgress';
import useGalleryStore from '../store/galleryStore';
import {generateSlug} from '../utils/helpers';
import {useTheme} from '../context/ThemeContext';
import {compressImages} from '../utils/imageCompression';
import api from '../utils/api';

const CreateGallery = () => {
    const navigate = useNavigate();
    const {createGallery, uploadImages, updateGallery, isLoading} = useGalleryStore();
    const {isDark, currentTheme} = useTheme();
    const uploadInProgressRef = useRef(false);
    const abortControllerRef = useRef(null);

    const [step, setStep] = useState(1); // 1: Details, 2: Upload, 3: Processing
    const [galleryData, setGalleryData] = useState({
        name: '',
        description: ''
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [processingStep, setProcessingStep] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [createdGalleryId, setCreatedGalleryId] = useState(null);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [userPreferences, setUserPreferences] = useState({
        defaultThreshold: 80,
        compressImages: true
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch user preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const data = await api.get('/api/user/settings');
                if (data && data.preferences) {
                    setUserPreferences({
                        defaultThreshold: data.preferences.defaultThreshold || 80,
                        compressImages: data.preferences.compressImages !== false
                    });
                    // console.log('Loaded user preferences:', data.preferences);
                }
            } catch (error) {
                // console.log('Could not load preferences, using defaults');
            }
        };
        fetchPreferences();
    }, []);

    const handleDetailsSubmit = (e) => {
        e.preventDefault();

        if (!galleryData.name.trim()) {
            toast.error('Please enter a portfolio name');
            return;
        }

        setStep(2);
    };

    const handleFilesSelected = (files) => {
        setUploadedFiles(files);
    };

    const handleBackClick = () => {
        // If we're in step 3 (processing), show confirmation dialog
        if (step === 3 && uploadInProgressRef.current) {
            const confirmed = window.confirm(
                '⚠️ Portfolio creation is in progress!\n\n' +
                'Going back will cancel the upload and delete any partially uploaded data.\n\n' +
                'Are you sure you want to go back?'
            );

            if (confirmed) {
                // Cancel the upload
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                uploadInProgressRef.current = false;

                // Clean up any created gallery
                if (createdGalleryId) {
                    // Attempt to delete the partially created gallery
                    api.delete(`/api/galleries/${createdGalleryId}`)
                        .catch(err => {
                            // console.error('Failed to clean up gallery:', err)
                        });
                }

                toast.error('Portfolio creation cancelled', {id: 'cancelled'});

                // Navigate back to dashboard
                navigate('/dashboard');
            }
            return;
        }

        // Normal back navigation for other steps
        if (step > 1 && step < 3) {
            setStep(step - 1);
        } else {
            navigate('/dashboard');
        }
    };

    const handleCreateGallery = async () => {
        if (uploadedFiles.length === 0) {
            toast.error('Please upload at least 1 image');
            return;
        }

        setStep(3);
        setProcessingStep(0);
        uploadInProgressRef.current = true;
        abortControllerRef.current = new AbortController();

        try {
            // Step 0: Compress images (if enabled in preferences)
            let filesToUpload = uploadedFiles;

            if (userPreferences.compressImages) {
                setProcessingStep(0);

                const compressedFiles = await compressImages(uploadedFiles, (progress) => {
                    setCompressionProgress(progress);
                });

                // Verify files are valid
                if (!compressedFiles || compressedFiles.length === 0) {
                    throw new Error('Image optimization failed');
                }

                filesToUpload = compressedFiles;
            }

            // Check if aborted
            if (abortControllerRef.current.signal.aborted) {
                throw new Error('Upload cancelled by user');
            }

            // Step 1: Create gallery with user's default threshold
            setProcessingStep(1);

            const newGallery = await createGallery({
                name: galleryData.name,
                description: galleryData.description,
                config: {
                    threshold: userPreferences.defaultThreshold,
                    animationType: 'fade',
                    mood: 'calm'
                }
            });

            setCreatedGalleryId(newGallery.id);

            // Check if aborted
            if (abortControllerRef.current.signal.aborted) {
                throw new Error('Upload cancelled by user');
            }

            // Step 2: Upload images
            setProcessingStep(2);

            const result = await uploadImages(newGallery.id, filesToUpload);

            setUploadProgress(100);

            // Check if aborted
            if (abortControllerRef.current.signal.aborted) {
                throw new Error('Upload cancelled by user');
            }

            // Step 3: Mark as ready
            setProcessingStep(3);

            await updateGallery(newGallery.id, {
                status: 'analyzed',
                analysis_complete: true
            });

            uploadInProgressRef.current = false;

            // Show success modal instead of redirecting
            setShowSuccessModal(true);

        } catch (error) {
            uploadInProgressRef.current = false;

            // Don't show error toast if user cancelled
            if (error.message === 'Upload cancelled by user') {
                // console.log('Upload was cancelled by user');
                return;
            }

            // Show specific error messages
            let errorMessage = 'Failed to create portfolio. Please try again.';

            if (error.message.includes('Network error') || error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('timeout') || error.message.includes('taking longer')) {
                errorMessage = 'Upload is taking too long. Try uploading fewer images or check your connection.';
            } else if (error.message.includes('optimization') || error.message.includes('compression')) {
                errorMessage = 'Image processing failed. Please try with different images.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {duration: 5000});
            setStep(2);
            setProcessingStep(0);
            setUploadProgress(0);
            setCompressionProgress(0);
        }
    };

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div
            className="min-h-screen relative overflow-hidden transition-colors duration-500"
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

            {/* Floating Back Button */}
            <button
                onClick={handleBackClick}
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
                <span>BACK</span>
            </button>

            <div className="h-screen grid place-items-center px-4 py-16 md:py-0 overflow-hidden relative z-10">

                {/* Step 1: Gallery Details */}
                {step === 1 && (
                    <motion.div
                        className="w-full max-w-2xl p-4 md:p-8 lg:p-10 border transition-all duration-500 my-auto"
                        style={{
                            backgroundColor: currentTheme.bgAlt,
                            borderColor: currentTheme.border,
                        }}
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                    >
                        <div className="text-center mb-4 md:mb-6 lg:mb-8">
                            <h1
                                className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight mb-2 md:mb-3 transition-colors duration-500"
                                style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                            >
                                Name Your Portfolio
                            </h1>
                            <p
                                className="text-xs md:text-sm lg:text-base transition-colors duration-500"
                                style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                            >
                                Give it a memorable name. This is your creative space.
                            </p>
                        </div>

                        <form onSubmit={handleDetailsSubmit} className="space-y-3 md:space-y-5 lg:space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs md:text-sm font-bold mb-1.5 md:mb-2 tracking-wide transition-colors duration-500"
                                    style={{color: currentTheme.text}}
                                >
                                    PORTFOLIO NAME
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={galleryData.name}
                                    onChange={(e) => setGalleryData({...galleryData, name: e.target.value})}
                                    className="w-full px-3 py-2.5 md:px-5 md:py-4 border-2 transition-all duration-300 outline-none text-sm md:text-base lg:text-lg"
                                    style={{
                                        backgroundColor: currentTheme.input || currentTheme.bg,
                                        borderColor: currentTheme.border,
                                        color: currentTheme.text,
                                    }}
                                    placeholder="Sarah Chen Photography"
                                    required
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-xs md:text-sm font-bold mb-1.5 md:mb-2 tracking-wide transition-colors duration-500"
                                    style={{color: currentTheme.text}}
                                >
                                    TAGLINE (OPTIONAL)
                                </label>
                                <textarea
                                    id="description"
                                    rows={2}
                                    value={galleryData.description}
                                    onChange={(e) => setGalleryData({...galleryData, description: e.target.value})}
                                    className="w-full px-3 py-2.5 md:px-5 md:py-4 border-2 resize-none transition-all duration-300 outline-none text-xs md:text-sm lg:text-base"
                                    style={{
                                        backgroundColor: currentTheme.input || currentTheme.bg,
                                        borderColor: currentTheme.border,
                                        color: currentTheme.text,
                                    }}
                                    placeholder="Visual storyteller capturing life's fleeting moments..."
                                    onFocus={(e) => e.target.style.borderColor = currentTheme.accent}
                                    onBlur={(e) => e.target.style.borderColor = currentTheme.border}
                                />
                            </div>

                            <motion.button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-4 lg:py-5 font-bold text-xs md:text-sm tracking-wide transition-all duration-300"
                                style={{
                                    backgroundColor: currentTheme.accent,
                                    color: isDark ? '#0a0a0a' : '#f5f3ef'
                                }}
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                            >
                                <span>CONTINUE</span>
                                <ArrowRight size={window.innerWidth < 768 ? 16 : 20}/>
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {/* Step 2: Upload Images */}
                {step === 2 && (
                    <motion.div
                        className="w-full max-w-4xl my-auto max-h-[90vh] overflow-y-auto"
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                    >
                        <div className="text-center mb-4 md:mb-6">
                            <h1
                                className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight mb-2 md:mb-3 transition-colors duration-500"
                                style={{fontFamily: 'Arial Black, sans-serif', color: currentTheme.text}}
                            >
                                {galleryData.name}
                            </h1>
                            {galleryData.description && (
                                <p
                                    className="text-xs md:text-sm lg:text-base xl:text-lg transition-colors duration-500"
                                    style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                                >
                                    {galleryData.description}
                                </p>
                            )}
                        </div>

                        <div
                            className="p-3 md:p-6 lg:p-8 border transition-all duration-500"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                borderColor: currentTheme.border,
                            }}
                        >
                            {/* Always show FileUploadZone - it has built-in image preview */}
                            <FileUploadZone onFilesSelected={handleFilesSelected}/>

                            {/* Show build button below when files are uploaded */}
                            {uploadedFiles.length > 0 && (
                                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t transition-colors duration-500"
                                     style={{borderColor: currentTheme.border}}>
                                    {/* File count badge */}
                                    <div className="mb-4 text-center">
                                        <div
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-300"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(168, 156, 142, 0.1)' : 'rgba(42, 37, 32, 0.05)',
                                                borderColor: currentTheme.border
                                            }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{backgroundColor: currentTheme.accent}}
                                            />
                                            <span
                                                className="text-sm md:text-base font-bold"
                                                style={{color: currentTheme.text}}
                                            >
                                                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'image' : 'images'} ready
                                            </span>
                                        </div>
                                    </div>

                                    {/* Build button - prominent */}
                                    <motion.button
                                        onClick={handleCreateGallery}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 lg:py-5 font-bold text-sm md:text-base tracking-wide transition-all duration-300"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            color: isDark ? '#0a0a0a' : '#f5f3ef',
                                            boxShadow: `0 4px 0 0 ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`
                                        }}
                                        whileHover={{scale: 1.02}}
                                        whileTap={{scale: 0.98}}
                                    >
                                        <span>BUILD PORTFOLIO</span>
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && !showSuccessModal && (
                    <motion.div
                        className="w-full max-w-2xl p-4 md:p-8 lg:p-10 border transition-all duration-500 my-4 md:my-auto mx-4 md:mx-auto"
                        style={{
                            backgroundColor: currentTheme.bgAlt,
                            borderColor: currentTheme.border,
                        }}
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                    >
                        <div className="text-center mb-4 md:mb-6 lg:mb-8">
                            <h2
                                className="text-base md:text-2xl lg:text-3xl xl:text-4xl font-black mb-2 md:mb-3 transition-colors duration-500 leading-tight"
                                style={{color: currentTheme.text}}
                            >
                                Crafting Your Portfolio
                            </h2>
                            <p
                                className="text-xs md:text-sm lg:text-base transition-colors duration-500 leading-relaxed"
                                style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                            >
                                Setting up your interactive canvas. Almost there...
                            </p>
                        </div>

                        <UploadProgress
                            currentStep={processingStep}
                            uploadProgress={uploadProgress}
                            analysisProgress={analysisProgress}
                            compressionProgress={compressionProgress}
                        />

                        <div
                            className="mt-4 md:mt-6 lg:mt-8 p-3 md:p-4 transition-all duration-500"
                            style={{
                                backgroundColor: isDark ? 'rgba(232, 232, 232, 0.05)' : 'rgba(42, 37, 32, 0.03)',
                                borderLeft: `4px solid ${currentTheme.accent}`
                            }}
                        >
                            <p
                                className="text-xs md:text-sm text-center transition-colors duration-500 leading-relaxed"
                                style={{color: currentTheme.text}}
                            >
                                This usually takes about 2 minutes. Keep this window open.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(8px)'
                        }}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                    >
                        <motion.div
                            className="relative border-2 max-w-md w-full"
                            style={{
                                backgroundColor: currentTheme.bgAlt,
                                borderColor: currentTheme.accent,
                            }}
                            initial={{scale: 0.9, opacity: 0, y: 20}}
                            animate={{scale: 1, opacity: 1, y: 0}}
                            exit={{scale: 0.9, opacity: 0, y: 20}}
                            transition={{type: 'spring', duration: 0.5}}
                        >
                            <div className="p-6 md:p-8">
                                {/* Success Icon */}
                                <div className="flex items-center justify-center mb-6">
                                    <div className="relative">
                                        <motion.div
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: currentTheme.accent,
                                            }}
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{delay: 0.2, type: 'spring'}}
                                        >
                                            <Check size={isMobile ? 32 : 40}
                                                   style={{color: isDark ? '#0a0a0a' : '#f5f3ef'}} strokeWidth={3}/>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="text-center mb-8">
                                    <h2
                                        className="text-2xl md:text-3xl font-black mb-3 tracking-tight"
                                        style={{color: currentTheme.text}}
                                    >
                                        Portfolio Created!
                                    </h2>
                                    <p
                                        className="text-sm md:text-base leading-relaxed"
                                        style={{
                                            fontFamily: 'Georgia, serif',
                                            color: currentTheme.textMuted
                                        }}
                                    >
                                        Your portfolio has been successfully created with {uploadedFiles.length} images.
                                        You can now view and customize it from your dashboard.
                                    </p>
                                </div>

                                {/* Button */}
                                <button
                                    onClick={handleGoToDashboard}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 font-bold text-sm tracking-wide transition-all duration-300"
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
                                    <span>GO TO DASHBOARD</span>
                                    <ArrowRight size={18}/>
                                </button>
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
            </AnimatePresence>

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

export default CreateGallery;