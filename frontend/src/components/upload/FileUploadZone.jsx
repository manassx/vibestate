import {useCallback, useState, useEffect} from 'react';
import {useDropzone} from 'react-dropzone';
import {Upload, X, Image as ImageIcon, AlertCircle} from 'lucide-react';
import {validateFiles, formatFileSize} from '../../utils/helpers';
import {GALLERY_CONFIG} from '../../utils/constants';
import {useTheme} from '../../context/ThemeContext';

const FileUploadZone = ({onFilesSelected, maxFiles = GALLERY_CONFIG.MAX_IMAGES}) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errors, setErrors] = useState([]);
    const {isDark, currentTheme} = useTheme();
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setErrors([]);

        // Validate files
        const validation = validateFiles(acceptedFiles);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        // Create preview URLs
        const filesWithPreview = acceptedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        }));

        setSelectedFiles(prev => {
            const newFiles = [...prev, ...filesWithPreview];
            if (newFiles.length > maxFiles) {
                setErrors([`Maximum ${maxFiles} images allowed`]);
                return prev;
            }

            // Notify parent with updated file list
            if (onFilesSelected) {
                const allFiles = newFiles.map(f => f.file);
                onFilesSelected(allFiles);
            }

            return newFiles;
        });

        // Handle rejected files
        if (rejectedFiles.length > 0) {
            const rejectionErrors = rejectedFiles.map(({file, errors}) =>
                `${file.name}: ${errors.map(e => e.message).join(', ')}`
            );
            setErrors(rejectionErrors);
        }
    }, [onFilesSelected, maxFiles]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: GALLERY_CONFIG.MAX_FILE_SIZE,
        multiple: true
    });

    const removeFile = (id) => {
        setSelectedFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file) {
                URL.revokeObjectURL(file.preview);
            }
            const updatedFiles = prev.filter(f => f.id !== id);

            // Notify parent component with updated file list
            if (onFilesSelected) {
                const remainingFiles = updatedFiles.map(f => f.file);
                onFilesSelected(remainingFiles);
            }

            return updatedFiles;
        });
        setErrors([]);
    };

    const clearAll = () => {
        selectedFiles.forEach(({preview}) => URL.revokeObjectURL(preview));
        setSelectedFiles([]);
        setErrors([]);

        // Notify parent that all files were cleared
        if (onFilesSelected) {
            onFilesSelected([]);
        }
    };

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            selectedFiles.forEach(({preview}) => URL.revokeObjectURL(preview));
        };
    }, [selectedFiles]);

    return (
        <div className="w-full">
            {/* Upload Zone - Only show if no files selected yet */}
            {selectedFiles.length === 0 && (
                <div
                    {...getRootProps()}
                    className="border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all duration-300"
                    style={{
                        borderColor: isDragActive ? currentTheme.accent : currentTheme.border,
                        backgroundColor: isDragActive ? (isDark ? 'rgba(232, 232, 232, 0.05)' : 'rgba(42, 37, 32, 0.03)') : 'transparent'
                    }}
                >
                    <input {...getInputProps()} />

                    <Upload
                        className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 transition-colors duration-300"
                        style={{color: isDragActive ? currentTheme.accent : currentTheme.textDim}}
                    />

                    {isDragActive ? (
                        <p
                            className="text-base md:text-lg font-bold tracking-wide transition-colors duration-300"
                            style={{color: currentTheme.accent}}
                        >
                            Drop your images here...
                        </p>
                    ) : (
                        <>
                            {/* Desktop: Show drag and drop text */}
                            {!isMobile && (
                                <>
                                    <p
                                        className="text-base md:text-lg font-bold mb-2 transition-colors duration-500"
                                        style={{color: currentTheme.text}}
                                    >
                                        Drag & drop images here, or click to select
                                    </p>
                                    <p
                                        className="text-xs md:text-sm transition-colors duration-500"
                                        style={{color: currentTheme.textMuted}}
                                    >
                                        Upload up to {GALLERY_CONFIG.MAX_IMAGES} images (JPG, PNG, WebP -
                                        Max {formatFileSize(GALLERY_CONFIG.MAX_FILE_SIZE)} each)
                                    </p>
                                </>
                            )}

                            {/* Mobile: Show button-style interface */}
                            {isMobile && (
                                <>
                                    <div
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm tracking-wide mb-3"
                                        style={{
                                            backgroundColor: currentTheme.accent,
                                            color: isDark ? '#0a0a0a' : '#f5f3ef'
                                        }}
                                    >
                                        <Upload size={18}/>
                                        <span>SELECT IMAGES</span>
                                    </div>
                                    <p
                                        className="text-xs transition-colors duration-500"
                                        style={{color: currentTheme.textMuted}}
                                    >
                                        Tap to choose up to {GALLERY_CONFIG.MAX_IMAGES} images
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <div
                    className="mt-4 p-4 border rounded-lg transition-colors duration-500"
                    style={{
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
                    }}
                >
                    <div className="flex items-start gap-2">
                        <AlertCircle
                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                            style={{color: '#ef4444'}}
                        />
                        <div className="flex-1">
                            <p
                                className="text-sm font-bold mb-1"
                                style={{color: isDark ? '#fca5a5' : '#dc2626'}}
                            >
                                Upload Errors:
                            </p>
                            <ul
                                className="text-sm space-y-1"
                                style={{color: isDark ? '#fca5a5' : '#dc2626'}}
                            >
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3
                            className="text-lg font-black tracking-wide transition-colors duration-500"
                            style={{color: currentTheme.text}}
                        >
                            Selected Images ({selectedFiles.length})
                        </h3>
                        <button
                            onClick={clearAll}
                            className="text-sm font-bold tracking-wide transition-colors duration-300"
                            style={{color: '#ef4444'}}
                            onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                            onMouseLeave={(e) => e.target.style.color = '#ef4444'}
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {selectedFiles.map(({id, preview, file}) => (
                            <div key={id} className="relative group">
                                <div
                                    className="aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-300"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                        borderColor: currentTheme.border
                                    }}
                                >
                                    <img
                                        src={preview}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => removeFile(id)}
                                    className="absolute top-2 right-2 p-1 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    style={{backgroundColor: '#ef4444'}}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                                >
                                    <X size={16}/>
                                </button>

                                {/* File info */}
                                <div className="mt-1">
                                    <p
                                        className="text-xs truncate transition-colors duration-500"
                                        style={{color: currentTheme.text}}
                                        title={file.name}
                                    >
                                        {file.name}
                                    </p>
                                    <p
                                        className="text-xs transition-colors duration-500"
                                        style={{color: currentTheme.textMuted}}
                                    >
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Instructions */}
            {selectedFiles.length === 0 && (
                <div
                    className="mt-6 p-4 border rounded-lg transition-colors duration-500"
                    style={{
                        backgroundColor: isDark ? 'rgba(232, 232, 232, 0.05)' : 'rgba(42, 37, 32, 0.03)',
                        borderColor: currentTheme.border
                    }}
                >
                    <div className="flex items-start gap-3">
                        <ImageIcon
                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                            style={{color: currentTheme.accent}}
                        />
                        <div>
                            <p
                                className="text-sm font-bold mb-1 transition-colors duration-500"
                                style={{color: currentTheme.text}}
                            >
                                Tips for best results:
                            </p>
                            <ul
                                className="text-sm space-y-1 transition-colors duration-500"
                                style={{color: currentTheme.textMuted}}
                            >
                                <li>• Upload at least {GALLERY_CONFIG.MIN_IMAGES} high-quality images</li>
                                <li>• Mix different moods and styles for diverse interactions</li>
                                <li>• AI will analyze colors, emotions, and composition</li>
                                <li>• Each gallery is unique based on your photos!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploadZone;