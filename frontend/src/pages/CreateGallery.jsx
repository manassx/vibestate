import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {motion} from 'framer-motion';
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
                    console.log('Loaded user preferences:', data.preferences);
                }
            } catch (error) {
                console.log('Could not load preferences, using defaults');
            }
        };
        fetchPreferences();
    }, []);

    const handleDetailsSubmit = (e) => {
        e.preventDefault();

        if (!galleryData.name.trim()) {
            toast.error('Please enter a gallery name');
            return;
        }

        setStep(2);
    };

    const handleFilesSelected = (files) => {
        setUploadedFiles(files);
    };

    const handleCreateGallery = async () => {
        if (uploadedFiles.length === 0) {
            toast.error('Please upload at least 1 image');
            return;
        }

        setStep(3);
        setProcessingStep(0); // Start at 0 for compression

        try {
            // Step 0: Compress images (if enabled in preferences)
            let filesToUpload = uploadedFiles;

            if (userPreferences.compressImages) {
                setProcessingStep(0);
                toast.loading('Optimizing images (95% quality)...', {id: 'compress'});

                console.log('Starting compression for', uploadedFiles.length, 'files');
                const compressedFiles = await compressImages(uploadedFiles, (progress) => {
                    setCompressionProgress(progress);
                });

                console.log('Compression complete! Compressed files:', compressedFiles.length);
                toast.success('Images optimized!', {id: 'compress'});

                // Verify files are valid
                if (!compressedFiles || compressedFiles.length === 0) {
                    throw new Error('Image compression failed - no files returned');
                }

                filesToUpload = compressedFiles;
            }

            // Step 1: Create gallery with user's default threshold
            setProcessingStep(1);
            toast.loading('Creating gallery...', {id: 'create'});

            console.log('Creating gallery with threshold:', userPreferences.defaultThreshold);
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
            toast.success('Gallery created!', {id: 'create'});

            // Step 2: Upload images
            setProcessingStep(2);
            toast.loading(`Uploading ${filesToUpload.length} images...`, {id: 'upload'});

            const result = await uploadImages(newGallery.id, filesToUpload);

            setUploadProgress(100);
            toast.success(`${result.uploadedCount} images uploaded!`, {id: 'upload'});

            // Step 3: Mark as ready
            setProcessingStep(3);
            toast.loading('Finalizing gallery...', {id: 'finalize'});

            await updateGallery(newGallery.id, {
                status: 'analyzed',
                analysis_complete: true
            });

            toast.success('Gallery ready!', {id: 'finalize'});

            // Navigate to gallery editor
            setTimeout(() => {
                navigate(`/gallery/${newGallery.id}/edit`);
            }, 1000);

        } catch (error) {
            console.error('Error creating gallery:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response
            });
            toast.error(error.message || 'Failed to create gallery. Please try again.');
            setStep(2);
            setProcessingStep(0);
            setUploadProgress(0);
            setCompressionProgress(0);
        }
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
                onClick={() => step > 1 && step < 3 ? setStep(step - 1) : navigate('/dashboard')}
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
                                Name Your Gallery
                            </h1>
                            <p
                                className="text-xs md:text-sm lg:text-base transition-colors duration-500"
                                style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                            >
                                Give it a title. Add context if you want.
                            </p>
                        </div>

                        <form onSubmit={handleDetailsSubmit} className="space-y-3 md:space-y-5 lg:space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs md:text-sm font-bold mb-1.5 md:mb-2 tracking-wide transition-colors duration-500"
                                    style={{color: currentTheme.text}}
                                >
                                    TITLE
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
                                    placeholder="Summer in Tokyo"
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
                                    DESCRIPTION (OPTIONAL)
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
                                    placeholder="A collection of moments from..."
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
                            <FileUploadZone onFilesSelected={handleFilesSelected}/>

                            {uploadedFiles.length > 0 && (
                                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t transition-colors duration-500"
                                     style={{borderColor: currentTheme.border}}>
                                    <motion.button
                                        onClick={handleCreateGallery}
                                        disabled={isLoading || uploadedFiles.length < 1}
                                        className="w-full flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-4 lg:py-5 font-bold text-xs md:text-sm tracking-wide transition-all duration-300"
                                        style={{
                                            backgroundColor: uploadedFiles.length >= 1 ? currentTheme.accent : currentTheme.border,
                                            color: uploadedFiles.length >= 1 ? (isDark ? '#0a0a0a' : '#f5f3ef') : currentTheme.textDim,
                                            cursor: uploadedFiles.length < 1 ? 'not-allowed' : 'pointer'
                                        }}
                                        whileHover={uploadedFiles.length >= 1 ? {scale: 1.02} : {}}
                                        whileTap={uploadedFiles.length >= 1 ? {scale: 0.98} : {}}
                                    >
                                        <span>CREATE GALLERY</span>
                                    </motion.button>
                                    {uploadedFiles.length < 1 && (
                                        <p
                                            className="text-xs md:text-sm text-center mt-2 transition-colors duration-500"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            Need at least 1 image
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && (
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
                            <h2
                                className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-black mb-2 md:mb-3 transition-colors duration-500"
                                style={{color: currentTheme.text}}
                            >
                                Working On It
                            </h2>
                            <p
                                className="text-xs md:text-sm lg:text-base transition-colors duration-500"
                                style={{fontFamily: 'Georgia, serif', color: currentTheme.textMuted}}
                            >
                                Processing your images and setting things up
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
                                className="text-xs md:text-sm text-center transition-colors duration-500"
                                style={{color: currentTheme.text}}
                            >
                                Takes about 2 minutes. Keep this window open.
                            </p>
                        </div>
                    </motion.div>
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

export default CreateGallery;