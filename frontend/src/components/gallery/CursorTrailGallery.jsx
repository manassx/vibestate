import {v4 as uuid} from "uuid";
import {useEffect, useRef, useState} from "react";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Crop,
    ZoomIn,
    ZoomOut,
    Check,
    Edit3,
    ExternalLink,
    Save,
    RotateCw
} from "lucide-react";
import styles from "./CursorTrailGallery.module.css";
import {updateImageTransform, updateGalleryBranding, patch} from "../../utils/api";
import toast from "react-hot-toast";

function CursorTrailGallery({
                                images,
                                threshold: initialThreshold = 80,
                                showControls = true,
                                theme = null,
                                clearOnLeave = false,
                                editMode = false,
                                galleryId = null,
                                onUpdate = null,
                                initialName = '',
                                initialNameLink = '',
                                initialEmail = '',
                                galleryConfig = null,
                                setPendingSaveState = null,   // for parent (optional)
                                setSaveHandler = null         // for parent (optional)
                            }) {
    const [nextImage, setNextImage] = useState(0);
    const [placedImages, setPlacedImages] = useState([]);
    const [threshold, setThreshold] = useState(initialThreshold);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [preloadProgress, setPreloadProgress] = useState(0);

    // Edit mode states
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageTransforms, setImageTransforms] = useState({});
    const [pendingChanges, setPendingChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Branding states (local until save) - Load from galleryConfig if available
    const [customName, setCustomName] = useState('');
    const [customNameLink, setCustomNameLink] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempNameLink, setTempNameLink] = useState('');
    const [tempEmail, setTempEmail] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [editingEmail, setEditingEmail] = useState(false);

    // Crop states - NEW: Visual crop instead of sliders
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropArea, setCropArea] = useState({x: 0, y: 0, width: 100, height: 100});
    const [isDragging, setIsDragging] = useState(false);
    const [dragHandle, setDragHandle] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const cropImageRef = useRef(null);
    const cropContainerRef = useRef(null);

    // Store actual image size and coordinates in crop modal
    const [imageRect, setImageRect] = useState({
        left: 0, top: 0, width: 1, height: 1    // Initial dummy values
    });

    // When crop modal opens, measure the image rect within the container
    useEffect(() => {
        if (!showCropModal || !cropImageRef.current || !cropContainerRef.current) return;

        function updateImageRect() {
            const img = cropImageRef.current;
            const container = cropContainerRef.current;
            if (!img || !container) return;

            const imgRect = img.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            // Calculate position of image RELATIVE TO CONTAINER
            const left = imgRect.left - contRect.left;
            const top = imgRect.top - contRect.top;
            setImageRect({
                left: left,
                top: top,
                width: imgRect.width,
                height: imgRect.height,
            });
            console.log('[CROP] Image rect measured:', {
                left, top,
                width: imgRect.width,
                height: imgRect.height
            });
        }

        // Longer timeout to ensure image is fully rendered and positioned
        const timer = setTimeout(updateImageRect, 150);
        // Also recalc if user resizes window
        window.addEventListener('resize', updateImageRect);

        // Try to measure once image is actually loaded for more accuracy
        if (cropImageRef.current) {
            if (cropImageRef.current.complete) {
                // Image already loaded (cached), measure immediately
                updateImageRect();
            } else {
                // Wait for image to load
                cropImageRef.current.onload = updateImageRect;
            }
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateImageRect);
            if (cropImageRef.current) {
                cropImageRef.current.onload = null;
            }
        };
    }, [showCropModal, selectedImage]);

    const lastPosition = useRef({x: 0, y: 0});
    const containerRef = useRef(null);
    const touchMoveRaf = useRef(null);

    // Default theme if none provided
    const defaultTheme = {
        controlsBg: 'transparent',
        controlsText: '#f0f0f0'
    };

    const currentTheme = theme || defaultTheme;

    // Load branding from galleryConfig on mount or when it changes
    useEffect(() => {
        if (galleryConfig && galleryConfig.branding) {
            console.log('Loading branding from galleryConfig:', galleryConfig.branding);
            setCustomName(galleryConfig.branding.customName || initialName || '');
            setCustomNameLink(galleryConfig.branding.customNameLink || initialNameLink || '');
            setCustomEmail(galleryConfig.branding.customEmail || initialEmail || '');
        } else {
            // Fallback to initial props
            setCustomName(initialName || '');
            setCustomNameLink(initialNameLink || '');
            setCustomEmail(initialEmail || '');
        }
    }, [galleryConfig, initialName, initialNameLink, initialEmail]);

    // Load threshold from galleryConfig
    useEffect(() => {
        if (galleryConfig && typeof galleryConfig.threshold === 'number') {
            console.log('Loading threshold from galleryConfig:', galleryConfig.threshold);
            setThreshold(galleryConfig.threshold);
        } else {
            setThreshold(initialThreshold);
        }
    }, [galleryConfig, initialThreshold]);

    // Load initial transforms from images metadata
    useEffect(() => {
        console.log('=== LOADING IMAGE TRANSFORMS ===');
        console.log('Images array:', images);

        if (images && images.length > 0) {
            const transforms = {};
            images.forEach((img, index) => {
                console.log(`Image ${index}:`, {
                    id: img.id,
                    url: img.url,
                    metadata: img.metadata,
                    hasTransform: !!(img.metadata && img.metadata.transform)
                });

                if (img.metadata && img.metadata.transform) {
                    console.log(`✅ Found transform for image ${img.id}:`, img.metadata.transform);
                    transforms[img.id] = img.metadata.transform;
                } else {
                    console.log(`❌ No transform found for image ${img.id}`);
                }
            });

            console.log('Final transforms object:', transforms);
            setImageTransforms(transforms);
        } else {
            console.log('No images to load transforms from');
        }
    }, [images]);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
            setIsMobile(mobile);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Preload all images before allowing interaction
    useEffect(() => {
        if (!images || images.length === 0) {
            console.log('CursorTrailGallery: No images to preload');
            return;
        }

        console.log('CursorTrailGallery: Starting preload for', images.length, 'images');

        let loadedCount = 0;
        const totalImages = images.length;
        const imageUrls = new Set();

        images.forEach((img) => {
            const url = img.url || img.src;

            if (!url) {
                console.warn('CursorTrailGallery: Image missing URL:', img);
                loadedCount++;
                setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
                return;
            }

            if (imageUrls.has(url)) {
                return;
            }
            imageUrls.add(url);

            const image = new Image();
            image.onload = () => {
                loadedCount++;
                setLoadedImages(prev => new Set([...prev, url]));
                setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
            };
            image.onerror = (e) => {
                loadedCount++;
                console.error(`CursorTrailGallery: Failed to load image:`, url, e);
                setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
            };
            image.src = url;
        });
    }, [images]);

    function DecThreshold() {
        setThreshold((prev) => {
            let next = prev;
            if (prev > 140) next = prev - 60;
            else if (prev > 80) next = prev - 40;
            else if (prev > 40) next = prev - 20;
            else if (prev > 20) next = prev - 20;
            if (next < 20) next = 20;
            return next;
        });
    }

    function IncThreshold() {
        setThreshold((prev) => {
            let next = prev;
            if (prev < 40) next = prev + 20;
            else if (prev < 80) next = prev + 40;
            else if (prev < 140) next = prev + 60;
            else if (prev < 200) next = prev + 60;
            if (next > 200) next = 200;
            return next;
        });
    }

    function handleImageClick(imageSrc, imageId) {
        if (editMode && imageId) {
            // In edit mode, select image for editing
            setSelectedImage({src: imageSrc, id: imageId});
        } else {
            // In view mode, open lightbox
            const index = images.findIndex(img => (img.url || img.src) === imageSrc);
            if (index !== -1) {
                setLightboxIndex(index);
                setLightboxOpen(true);
            }
        }
    }

    function placeImageAt(currentX, currentY) {
        if (preloadProgress < 100) return;
        if (selectedImage) return; // PAUSE trail when image is selected

        const distanceX = Math.abs(currentX - lastPosition.current.x);
        const distanceY = Math.abs(currentY - lastPosition.current.y);

        if (distanceX > threshold || distanceY > threshold) {
            lastPosition.current = {x: currentX, y: currentY};
            const currentImage = images[nextImage];
            const imageSrc = currentImage.url || currentImage.src;
            const imageId = currentImage.id;

            setPlacedImages((prevState) => {
                const newImage = {
                    id: uuid(),
                    src: imageSrc,
                    imageId: imageId,
                    x: currentX,
                    y: currentY,
                };

                let maxLength;
                if (threshold <= 20) maxLength = isMobile ? 8 : 15;
                else if (threshold <= 40) maxLength = isMobile ? 5 : 10;
                else maxLength = isMobile ? 3 : 6;

                const newArray = [...prevState, newImage];
                while (newArray.length > maxLength) {
                    newArray.shift();
                }
                return newArray;
            });
            setNextImage((prevState) => (prevState + 1) % images.length);
        }
    }

    function handlePosition(e) {
        // Don't place images if user is editing an image or lightbox is open
        if (selectedImage || lightboxOpen) return;

        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        placeImageAt(currentX, currentY);
    }

    function handleTouch(e) {
        // Don't place images if user is editing an image or lightbox is open
        if (selectedImage || lightboxOpen) return;

        if (touchMoveRaf.current) {
            cancelAnimationFrame(touchMoveRaf.current);
        }

        touchMoveRaf.current = requestAnimationFrame(() => {
            const rect = containerRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            placeImageAt(currentX, currentY);
        });
    }

    function closeLightbox() {
        setLightboxOpen(false);
    }

    function nextLightboxImage() {
        setLightboxIndex((prev) => (prev + 1) % images.length);
    }

    function prevLightboxImage() {
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    }

    // Handle scale change (LOCAL - no save until user clicks Save Changes)
    function handleScaleChange(imageId, delta) {
        const currentTransform = imageTransforms[imageId] || {};
        const newScale = Math.max(0.5, Math.min(3.0, (currentTransform.scale || 1.0) + delta));
        const newTransform = {...currentTransform, scale: newScale};
        setImageTransforms(prev => ({...prev, [imageId]: newTransform}));
        setPendingChanges(true);
    }

    // Handle crop
    function handleStartCrop() {
        setShowCropModal(true);
        const transform = imageTransforms[selectedImage.id] || {};

        // If no previous crop, default to full image (0, 0, 100, 100)
        // If there is a previous crop, use it
        if (transform.crop) {
            setCropArea(transform.crop);
        } else {
            setCropArea({x: 0, y: 0, width: 100, height: 100});
        }
    }

    function handleApplyCrop() {
        if (selectedImage) {
            const currentTransform = imageTransforms[selectedImage.id] || {};
            const newTransform = {...currentTransform, crop: cropArea};
            setImageTransforms(prev => ({...prev, [selectedImage.id]: newTransform}));
            setPendingChanges(true);
            setShowCropModal(false);
        }
    }

    // Crop drag handlers for visual cropping (positions now use imageRect)
    function handleCropMouseDown(e, handle) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragHandle(handle);

        let pointerX, pointerY;
        // Support touch events for crop dragging
        if (e.touches && e.touches.length > 0) {
            pointerX = e.touches[0].clientX - cropContainerRef.current.getBoundingClientRect().left;
            pointerY = e.touches[0].clientY - cropContainerRef.current.getBoundingClientRect().top;
        } else {
            pointerX = e.clientX - cropContainerRef.current.getBoundingClientRect().left;
            pointerY = e.clientY - cropContainerRef.current.getBoundingClientRect().top;
        }
        setDragStart({x: pointerX, y: pointerY});
    }

    function handleCropMouseMove(e) {
        if (!isDragging || !dragHandle || !cropImageRef.current) return;

        let pointerX, pointerY;
        // Support touch events for crop dragging
        if (e.touches && e.touches.length > 0) {
            pointerX = e.touches[0].clientX - cropContainerRef.current.getBoundingClientRect().left;
            pointerY = e.touches[0].clientY - cropContainerRef.current.getBoundingClientRect().top;
        } else {
            pointerX = e.clientX - cropContainerRef.current.getBoundingClientRect().left;
            pointerY = e.clientY - cropContainerRef.current.getBoundingClientRect().top;
        }

        // Only calculate delta while dragging INSIDE the image bounds
        // All crop percentages are in terms of imageRect (not the whole container)
        const {left, top, width, height} = imageRect;

        // Clamp drag positions to image bounds
        let relStartX = Math.max(left, Math.min(left + width, dragStart.x));
        let relStartY = Math.max(top, Math.min(top + height, dragStart.y));
        let relPointerX = Math.max(left, Math.min(left + width, pointerX));
        let relPointerY = Math.max(top, Math.min(top + height, pointerY));

        // Calculate movement in px, convert to percent of image width/height
        const dxPx = relPointerX - relStartX;
        const dyPx = relPointerY - relStartY;
        const dxPct = (dxPx / width) * 100;
        const dyPct = (dyPx / height) * 100;

        let newCrop = {...cropArea};

        switch (dragHandle) {
            case 'move':
                newCrop.x = Math.max(0, Math.min(100 - cropArea.width, cropArea.x + dxPct));
                newCrop.y = Math.max(0, Math.min(100 - cropArea.height, cropArea.y + dyPct));
                break;
            case 'nw': {
                const nwDeltaX = Math.min(dxPct, cropArea.width - 10);
                const nwDeltaY = Math.min(dyPct, cropArea.height - 10);
                newCrop.x = Math.max(0, cropArea.x + nwDeltaX);
                newCrop.y = Math.max(0, cropArea.y + nwDeltaY);
                newCrop.width = Math.max(10, cropArea.width - nwDeltaX);
                newCrop.height = Math.max(10, cropArea.height - nwDeltaY);
            }
                break;
            case 'ne': {
                const neDeltaY = Math.min(dyPct, cropArea.height - 10);
                newCrop.y = Math.max(0, cropArea.y + neDeltaY);
                newCrop.width = Math.max(10, Math.min(100 - cropArea.x, cropArea.width + dxPct));
                newCrop.height = Math.max(10, cropArea.height - neDeltaY);
            }
                break;
            case 'sw': {
                const swDeltaX = Math.min(dxPct, cropArea.width - 10);
                newCrop.x = Math.max(0, cropArea.x + swDeltaX);
                newCrop.width = Math.max(10, cropArea.width - swDeltaX);
                newCrop.height = Math.max(10, Math.min(100 - cropArea.y, cropArea.height + dyPct));
            }
                break;
            case 'se':
                newCrop.width = Math.max(10, Math.min(100 - cropArea.x, cropArea.width + dxPct));
                newCrop.height = Math.max(10, Math.min(100 - cropArea.y, cropArea.height + dyPct));
                break;
            case 'n': {
                const nDeltaY = Math.min(dyPct, cropArea.height - 10);
                newCrop.y = Math.max(0, cropArea.y + nDeltaY);
                newCrop.height = Math.max(10, cropArea.height - nDeltaY);
            }
                break;
            case 's':
                newCrop.height = Math.max(10, Math.min(100 - cropArea.y, cropArea.height + dyPct));
                break;
            case 'e':
                newCrop.width = Math.max(10, Math.min(100 - cropArea.x, cropArea.width + dxPct));
                break;
            case 'w': {
                const wDeltaX = Math.min(dxPct, cropArea.width - 10);
                newCrop.x = Math.max(0, cropArea.x + wDeltaX);
                newCrop.width = Math.max(10, cropArea.width - wDeltaX);
            }
                break;
        }

        setCropArea(newCrop);

        // Update dragStart for next move event
        setDragStart({x: pointerX, y: pointerY});
    }

    function handleCropMouseUp() {
        setIsDragging(false);
        setDragHandle(null);
    }

    // Add mouse/touch event listeners for crop dragging
    useEffect(() => {
        if (showCropModal) {
            window.addEventListener('mousemove', handleCropMouseMove);
            window.addEventListener('mouseup', handleCropMouseUp);
            window.addEventListener('touchmove', handleCropMouseMove, {passive: false});
            window.addEventListener('touchend', handleCropMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleCropMouseMove);
                window.removeEventListener('mouseup', handleCropMouseUp);
                window.removeEventListener('touchmove', handleCropMouseMove);
                window.removeEventListener('touchend', handleCropMouseUp);
            };
        }
    }, [showCropModal, isDragging, dragHandle, cropArea, dragStart]);

    // Save all changes at once
    async function handleSaveAllChanges() {
        if (!galleryId || !editMode) {
            console.error('[SAVE] Cannot save: galleryId or editMode missing', {galleryId, editMode});
            toast.error('Cannot save: missing gallery information');
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading('Saving all changes...');

        console.log('[SAVE] Starting save process...');
        console.log('[SAVE] Gallery ID:', galleryId);
        console.log('[SAVE] Image transforms to save:', imageTransforms);
        console.log('[SAVE] Branding to save:', {customName, customNameLink, customEmail});
        console.log('[SAVE] Threshold to save:', threshold);

        try {
            // 1. Save all image transforms
            console.log('[SAVE] Step 1: Saving image transforms...');
            const imageTransformEntries = Object.entries(imageTransforms);
            console.log(`[SAVE] Found ${imageTransformEntries.length} image transforms to save`);

            if (imageTransformEntries.length > 0) {
                const imageUpdatePromises = imageTransformEntries.map(([imageId, transform]) => {
                    console.log(`[SAVE] Saving transform for image ${imageId}:`, transform);
                    return updateImageTransform(imageId, transform);
                });
                await Promise.all(imageUpdatePromises);
                console.log('[SAVE] ✅ Image transforms saved successfully');
            } else {
                console.log('[SAVE] No image transforms to save');
            }

            // 2. Save branding
            console.log('[SAVE] Step 2: Saving branding...');
            const brandingData = {
                customName,
                customNameLink,
                customEmail
            };
            console.log('[SAVE] Branding data:', brandingData);
            await updateGalleryBranding(galleryId, brandingData);
            console.log('[SAVE] ✅ Branding saved successfully');

            // 3. Save threshold to gallery config
            console.log('[SAVE] Step 3: Saving threshold...');
            await patch(`/api/galleries/${galleryId}`, {
                config: {
                    threshold: threshold
                }
            });
            console.log('[SAVE] ✅ Threshold saved successfully');

            setPendingChanges(false);
            toast.success('All changes saved!', {id: toastId});
            console.log('[SAVE] ✅ Save process completed successfully');

            if (onUpdate) {
                console.log('[SAVE] Calling onUpdate callback...');
                await onUpdate();
            }
        } catch (error) {
            console.error('[SAVE] ❌ Error saving changes:');
            console.error('[SAVE] Error object:', error);
            console.error('[SAVE] Error message:', error.message);
            console.error('[SAVE] Error stack:', error.stack);

            // More specific error messages
            let errorMessage = 'Failed to save changes';
            if (error.message) {
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    errorMessage = 'Session expired. Please login again.';
                } else if (error.message.includes('404') || error.message.includes('not found')) {
                    errorMessage = 'Gallery or image not found. Please refresh the page.';
                } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                    errorMessage = 'Network error. Please check your connection.';
                } else {
                    errorMessage = `Failed to save: ${error.message}`;
                }
            }

            toast.error(errorMessage, {id: toastId});
        } finally {
            setIsSaving(false);
        }
    }

    // Expose pending/save state to parent when requested (mobile top bar)
    // These effects keep the parent informed, if the parent passes corresponding setter functions.
    // Mobile top bar can control its own save button.
    useEffect(() => {
        if (typeof setPendingSaveState === 'function') {
            setPendingSaveState(pendingChanges);
        }
    }, [pendingChanges, setPendingSaveState]);

    useEffect(() => {
        if (typeof setSaveHandler === 'function') {
            setSaveHandler(handleSaveAllChanges, isSaving);
        }
    }, [setSaveHandler, handleSaveAllChanges, isSaving]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!lightboxOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextLightboxImage();
            if (e.key === 'ArrowLeft') prevLightboxImage();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, lightboxIndex]);

    useEffect(() => {
        const container = containerRef.current;

        const handleMouseLeave = () => {
            if (clearOnLeave) {
                setPlacedImages([]);
                lastPosition.current = {x: 0, y: 0};
            }
        };

        const handleTouchEnd = () => {
            if (clearOnLeave) {
                setPlacedImages([]);
                lastPosition.current = {x: 0, y: 0};
            }
        };

        container.addEventListener("mousemove", handlePosition);
        container.addEventListener("touchmove", handleTouch, {passive: true});
        container.addEventListener("touchend", handleTouchEnd);

        if (clearOnLeave) {
            container.addEventListener("mouseleave", handleMouseLeave);
        }

        return function () {
            container.removeEventListener("mousemove", handlePosition);
            container.removeEventListener("touchmove", handleTouch);
            container.removeEventListener("touchend", handleTouchEnd);
            if (clearOnLeave) {
                container.removeEventListener("mouseleave", handleMouseLeave);
            }
            if (touchMoveRaf.current) {
                cancelAnimationFrame(touchMoveRaf.current);
            }
        };
    }, [threshold, nextImage, clearOnLeave, isMobile, preloadProgress, selectedImage, lightboxOpen]);

    // Apply transform to image style
    function getTransformedStyle(imageId) {
        const transform = imageTransforms[imageId];
        if (!transform) return {};

        const scale = transform.scale || 1.0;

        const styles = {
            transformOrigin: 'center center'
        };

        if (transform.crop) {
            // Apply crop using clip-path
            const {x, y, width, height} = transform.crop;
            styles.clipPath = `inset(${y}% ${100 - x - width}% ${100 - y - height}% ${x}%)`;
        }

        // Return scale separately so it can be combined with position transform
        return {
            ...styles,
            scale: scale  // Return scale value separately
        };
    }

    return (
        <div className={styles.container}>
            <div
                ref={containerRef}
                className={styles.galleryContainer}
                style={{
                    overflow: "hidden",
                    cursor: preloadProgress < 100 ? 'wait' : selectedImage ? 'default' : (editMode ? 'crosshair' : 'crosshair'),
                    position: "relative"
                }}
            >
                {preloadProgress === 100 && placedImages.map((image, index) => {
                    const transformStyle = getTransformedStyle(image.imageId);
                    const scaleValue = transformStyle.scale || 1.0;

                    return (
                        <img
                            key={image.id}
                            src={image.src}
                            alt=""
                            className={styles.placedImage}
                            style={{
                                zIndex: index,
                                // Combine position and scale transforms properly
                                transform: `translate(-50%, -50%) translate(${image.x}px, ${image.y}px) scale(${scaleValue})`,
                                transformOrigin: transformStyle.transformOrigin,
                                clipPath: transformStyle.clipPath,
                                cursor: editMode ? 'pointer' : 'pointer',
                                border: selectedImage?.id === image.imageId ? '3px solid #a89c8e' : 'none',
                                boxShadow: selectedImage?.id === image.imageId ? '0 0 20px rgba(168, 156, 142, 0.5)' : 'none'
                            }}
                            onClick={() => handleImageClick(image.src, image.imageId)}
                        />
                    );
                })}
                {preloadProgress < 100 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: currentTheme.controlsText || '#f0f0f0'
                    }}>
                        <div style={{fontSize: isMobile ? 18 : 24, fontWeight: 'bold', marginBottom: 16}}>
                            Preparing Gallery...
                        </div>
                        <div style={{
                            width: isMobile ? 200 : 300,
                            height: 4,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${preloadProgress}%`,
                                height: '100%',
                                backgroundColor: currentTheme.controlsText || '#f0f0f0',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <div style={{fontSize: isMobile ? 12 : 14, marginTop: 12, opacity: 0.7}}>
                            {preloadProgress}%
                        </div>
                    </div>
                )}

            </div>

            {/* Image Edit Panel - Shows when image is selected in edit mode */}
            {editMode && selectedImage && (
                <div style={{
                    position: 'fixed',
                    ...(isMobile ? {
                        // Mobile: Position dynamically to avoid covering the image, and above threshold bar
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        right: 'auto',
                        top: 'auto'
                    } : {
                        // Desktop: Keep original right-side positioning
                        top: '50%',
                        right: 20,
                        transform: 'translateY(-50%)',
                        bottom: 'auto',
                        left: 'auto'
                    }),
                    background: currentTheme.controlsBg || 'rgba(0,0,0,0.9)',
                    padding: isMobile ? '12px 16px' : '24px',
                    borderRadius: isMobile ? '10px' : '12px',
                    border: '2px solid #a89c8e',
                    zIndex: 100,
                    minWidth: isMobile ? '90%' : '240px',
                    maxWidth: isMobile ? '90%' : '320px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }}>
                    <div style={{
                        color: currentTheme.controlsText,
                        marginBottom: isMobile ? 10 : 20,
                        fontSize: isMobile ? 13 : 16,
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        Edit Image
                    </div>

                    {/* Scale Control */}
                    <div style={{marginBottom: isMobile ? 10 : 20}}>
                        <div style={{
                            color: currentTheme.controlsText,
                            fontSize: isMobile ? 11 : 12,
                            marginBottom: 8,
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            Scale
                        </div>
                        <div style={{display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center'}}>
                            <button
                                onClick={() => handleScaleChange(selectedImage.id, -0.1)}
                                disabled={(imageTransforms[selectedImage.id]?.scale || 1.0) <= 0.5}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: currentTheme.controlsText,
                                    padding: isMobile ? '10px 12px' : '10px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    opacity: (imageTransforms[selectedImage.id]?.scale || 1.0) <= 0.5 ? 0.4 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ZoomOut size={isMobile ? 16 : 18}/>
                            </button>
                            <span style={{
                                color: currentTheme.controlsText,
                                fontSize: isMobile ? 14 : 16,
                                minWidth: 50,
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                {((imageTransforms[selectedImage.id]?.scale || 1.0) * 100).toFixed(0)}%
                            </span>
                            <button
                                onClick={() => handleScaleChange(selectedImage.id, 0.1)}
                                disabled={(imageTransforms[selectedImage.id]?.scale || 1.0) >= 3.0}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: currentTheme.controlsText,
                                    padding: isMobile ? '10px 12px' : '10px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    opacity: (imageTransforms[selectedImage.id]?.scale || 1.0) >= 3.0 ? 0.4 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ZoomIn size={isMobile ? 16 : 18}/>
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons - Side by side on mobile */}
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? 8 : 0,
                        flexDirection: isMobile ? 'row' : 'column'
                    }}>
                        {/* Crop Button */}
                        <button
                            onClick={handleStartCrop}
                            style={{
                                flex: isMobile ? 1 : 'none',
                                width: isMobile ? 'auto' : '100%',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: currentTheme.controlsText,
                                padding: isMobile ? '10px 8px' : '12px',
                                marginBottom: isMobile ? 0 : 20,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: isMobile ? 11 : 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: isMobile ? 4 : 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Crop size={isMobile ? 14 : 16}/>
                            <span>{isMobile ? 'CROP' : 'CROP IMAGE'}</span>
                        </button>

                        {/* Done Button */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                flex: isMobile ? 1 : 'none',
                                width: isMobile ? 'auto' : '100%',
                                background: '#a89c8e',
                                border: 'none',
                                color: '#0a0a0a',
                                padding: isMobile ? '10px 8px' : '14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: isMobile ? 11 : 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: isMobile ? 4 : 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Check size={isMobile ? 14 : 16}/>
                            <span>{isMobile ? 'DONE' : 'DONE EDITING'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Crop Modal - ULTRA COMPACT Visual Crop Interface */}
            {showCropModal && selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: isMobile ? '6px' : '12px',
                        overflow: 'auto'
                    }}
                    onClick={() => setShowCropModal(false)}
                >
                    <div
                        style={{
                            background: currentTheme.controlsBg || 'rgba(0,0,0,0.9)',
                            padding: isMobile ? '10px' : '12px',
                            borderRadius: isMobile ? '6px' : '8px',
                            border: '2px solid #a89c8e',
                            maxWidth: isMobile ? '100%' : '750px',
                            width: '100%',
                            maxHeight: '82vh',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isMobile ? '8px' : '10px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            margin: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div style={{
                                color: currentTheme.controlsText,
                                fontSize: isMobile ? 14 : 14,
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5
                            }}>
                                <Crop size={isMobile ? 14 : 14} style={{color: '#a89c8e'}}/>
                                Crop Image
                            </div>
                            <button
                                onClick={() => setShowCropModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: currentTheme.controlsText,
                                    cursor: 'pointer',
                                    padding: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = '1'}
                                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                            >
                                <X size={isMobile ? 20 : 18}/>
                            </button>
                        </div>

                        {/* Image Container with Crop Overlay - ULTRA COMPACT */}
                        <div
                            ref={cropContainerRef}
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: isMobile ? '40vh' : '320px',
                                overflow: 'hidden',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#000'
                            }}
                        >
                            <img
                                src={selectedImage.src}
                                alt="Crop preview"
                                ref={cropImageRef}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: isMobile ? '40vh' : '320px',
                                    width: 'auto',
                                    height: 'auto',
                                    display: 'block',
                                    userSelect: 'none',
                                    pointerEvents: 'none',
                                    objectFit: 'contain'
                                }}
                            />

                            {/* Dark overlay for non-cropped area. ClipPath must match only within IMAGE */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${imageRect.left}px`,
                                    top: `${imageRect.top}px`,
                                    width: `${imageRect.width}px`,
                                    height: `${imageRect.height}px`,
                                    pointerEvents: 'none'
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        clipPath: `
                                            polygon(
                                                0% 0%,
                                                0% 100%,
                                                ${cropArea.x}% 100%,
                                                ${cropArea.x}% ${cropArea.y}%,
                                                ${cropArea.x + cropArea.width}% ${cropArea.y}%,
                                                ${cropArea.x + cropArea.width}% ${cropArea.y + cropArea.height}%,
                                                ${cropArea.x}% ${cropArea.y + cropArea.height}%,
                                                ${cropArea.x}% 100%,
                                                100% 100%,
                                                100% 0%
                                            )
                                        `,
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>

                            {/* Crop frame with handles: Position RELATIVE TO IMAGE */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${imageRect.left + cropArea.x / 100 * imageRect.width}px`,
                                    top: `${imageRect.top + cropArea.y / 100 * imageRect.height}px`,
                                    width: `${imageRect.width * cropArea.width / 100}px`,
                                    height: `${imageRect.height * cropArea.height / 100}px`,
                                    border: '3px solid #a89c8e',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0)',
                                    cursor: 'move'
                                }}
                                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                                onTouchStart={(e) => handleCropMouseDown(e, 'move')}
                            >
                                {/* Grid lines */}
                                <div style={{
                                    position: 'absolute',
                                    top: '33.33%',
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    background: 'rgba(168, 156, 142, 0.5)',
                                    pointerEvents: 'none'
                                }}/>
                                <div style={{
                                    position: 'absolute',
                                    top: '66.66%',
                                    left: 0,
                                    width: '100%',
                                    height: '1px',
                                    background: 'rgba(168, 156, 142, 0.5)',
                                    pointerEvents: 'none'
                                }}/>
                                <div style={{
                                    position: 'absolute',
                                    left: '33.33%',
                                    top: 0,
                                    height: '100%',
                                    width: '1px',
                                    background: 'rgba(168, 156, 142, 0.5)',
                                    pointerEvents: 'none'
                                }}/>
                                <div style={{
                                    position: 'absolute',
                                    left: '66.66%',
                                    top: 0,
                                    height: '100%',
                                    width: '1px',
                                    background: 'rgba(168, 156, 142, 0.5)',
                                    pointerEvents: 'none'
                                }}/>

                                {/* Corner handles */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        left: '-6px',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'nw-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'nw')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'nw')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-6px',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'ne-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'ne')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'ne')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '-6px',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'sw-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'sw')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'sw')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        right: '-6px',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'se-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'se')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'se')}
                                />

                                {/* Edge handles */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'n-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'n')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'n')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-6px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 's-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 's')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 's')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '-6px',
                                        transform: 'translateY(-50%)',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'w-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'w')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'w')}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '-6px',
                                        transform: 'translateY(-50%)',
                                        width: isMobile ? '20px' : '16px',
                                        height: isMobile ? '20px' : '16px',
                                        background: '#a89c8e',
                                        border: '2px solid #fff',
                                        borderRadius: '50%',
                                        cursor: 'e-resize',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseDown={(e) => handleCropMouseDown(e, 'e')}
                                    onTouchStart={(e) => handleCropMouseDown(e, 'e')}
                                />
                            </div>
                        </div>

                        {/* Instructions */}
                        <div style={{
                            color: currentTheme.controlsText,
                            fontSize: isMobile ? 11 : 10,
                            textAlign: 'center',
                            opacity: 0.7,
                            fontStyle: 'italic',
                            flexShrink: 0,
                            lineHeight: 1.3
                        }}>
                            Drag corners/edges to adjust. Drag inside to move.
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: isMobile ? 6 : 6,
                            justifyContent: 'flex-end',
                            flexShrink: 0,
                            flexWrap: isMobile ? 'nowrap' : 'nowrap'
                        }}>
                            <button
                                onClick={() => setShowCropModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: currentTheme.controlsText,
                                    padding: isMobile ? '10px 18px' : '8px 16px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? 13 : 12,
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    flex: isMobile ? '0 0 auto' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                                    e.target.style.background = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplyCrop}
                                style={{
                                    background: '#a89c8e',
                                    border: 'none',
                                    color: '#0a0a0a',
                                    padding: isMobile ? '10px 18px' : '8px 18px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? 13 : 12,
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(168, 156, 142, 0.3)',
                                    flex: isMobile ? '0 0 auto' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#b8ac9e';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#a89c8e';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <Check size={isMobile ? 14 : 13}/>
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close">
                        <X size={isMobile ? 24 : 32}/>
                    </button>
                    <button className={styles.lightboxPrev} onClick={(e) => {
                        e.stopPropagation();
                        prevLightboxImage();
                    }} aria-label="Previous">
                        <ChevronLeft size={isMobile ? 32 : 48}/>
                    </button>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img src={images[lightboxIndex].url || images[lightboxIndex].src} alt=""
                             className={styles.lightboxImage}/>
                    </div>
                    <button className={styles.lightboxNext} onClick={(e) => {
                        e.stopPropagation();
                        nextLightboxImage();
                    }} aria-label="Next">
                        <ChevronRight size={isMobile ? 32 : 48}/>
                    </button>
                </div>
            )}

            {showControls && (
                <div className={styles.controls}
                     style={{backgroundColor: currentTheme.controlsBg, color: currentTheme.controlsText}}>
                    {/* Editable Name */}
                    {editMode ? (
                        editingName ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    placeholder="Name"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: currentTheme.controlsText,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: 12,
                                        outline: 'none'
                                    }}
                                />
                                <input
                                    type="url"
                                    value={tempNameLink}
                                    onChange={(e) => setTempNameLink(e.target.value)}
                                    placeholder="Link (optional)"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: currentTheme.controlsText,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: 12,
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setCustomName(tempName);
                                        setCustomNameLink(tempNameLink);
                                        setPendingChanges(true);
                                        setEditingName(false);
                                    }}
                                    style={{
                                        background: '#a89c8e',
                                        border: 'none',
                                        color: '#0a0a0a',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    setTempName(customName);
                                    setTempNameLink(customNameLink);
                                    setEditingName(true);
                                }}
                                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}
                                className={styles.label}
                            >
                                <span style={{color: currentTheme.controlsText}}>
                                    {customName || 'Click to edit name'}
                                </span>
                                <Edit3 size={12} style={{opacity: 0.5}}/>
                            </div>
                        )
                    ) : (
                        customNameLink ? (
                            <a
                                href={customNameLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.label}
                                style={{
                                    color: currentTheme.controlsText,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                {customName || 'manas.'}
                                <ExternalLink size={12} style={{opacity: 0.6}}/>
                            </a>
                        ) : (
                            <span className={styles.label} style={{color: currentTheme.controlsText}}>
                                {customName || 'manas.'}
                            </span>
                        )
                    )}

                    <div className={styles.threshold}>
                        <span style={{color: currentTheme.controlsText}}>Threshold: </span>
                        <button onClick={DecThreshold} className={styles.adjustBtn}>-</button>
                        <span className={styles.value} style={{color: currentTheme.controlsText}}>{threshold}</span>
                        <button onClick={IncThreshold} className={styles.adjustBtn}>+</button>
                    </div>

                    {/* Editable Email */}
                    {editMode ? (
                        editingEmail ? (
                            <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
                                <input
                                    type="email"
                                    value={tempEmail}
                                    onChange={(e) => setTempEmail(e.target.value)}
                                    placeholder="Email"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: currentTheme.controlsText,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: 12,
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setCustomEmail(tempEmail);
                                        setPendingChanges(true);
                                        setEditingEmail(false);
                                    }}
                                    style={{
                                        background: '#a89c8e',
                                        border: 'none',
                                        color: '#0a0a0a',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    OK
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    setTempEmail(customEmail);
                                    setEditingEmail(true);
                                }}
                                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}
                                className={styles.label}
                            >
                                <span style={{color: currentTheme.controlsText}}>
                                    {customEmail || 'Click to edit email'}
                                </span>
                                <Edit3 size={12} style={{opacity: 0.5}}/>
                            </div>
                        )
                    ) : (
                        <span className={styles.label} style={{color: currentTheme.controlsText}}>
                            {customEmail || 'saxenamanas04@gmail.com'}
                        </span>
                    )}
                </div>
            )}

            {/* Save Changes Button - Desktop: Below edit panel on right side */}
            {editMode && pendingChanges && !isMobile && (
                <button
                    onClick={handleSaveAllChanges}
                    disabled={isSaving}
                    style={{
                        position: 'fixed',
                        top: 'calc(50% + 160px)',
                        right: 20,
                        background: '#a89c8e',
                        border: 'none',
                        color: '#0a0a0a',
                        padding: '14px',
                        borderRadius: '8px',
                        cursor: isSaving ? 'wait' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: 14,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 8px 24px rgba(168, 156, 142, 0.4)',
                        opacity: isSaving ? 0.7 : 1,
                        transition: 'opacity 0.3s',
                        width: '240px'
                    }}
                >
                    <Save size={16}/>
                    {isSaving ? 'SAVING...' : 'SAVE ALL CHANGES'}
                </button>
            )}

            {/* Mobile save button was previously here, now handled by parent in top bar */}

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </div>
    );
}

export default CursorTrailGallery;
