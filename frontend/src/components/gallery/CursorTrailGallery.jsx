import {v4 as uuid} from "uuid";
import {useEffect, useRef, useState} from "react";
import {X, ChevronLeft, ChevronRight} from "lucide-react";
import styles from "./CursorTrailGallery.module.css";

function CursorTrailGallery({
                                images,
                                threshold: initialThreshold = 80,
                                showControls = true,
                                theme = null,
                                clearOnLeave = false
                            }) {
    const [nextImage, setNextImage] = useState(0);
    const [placedImages, setPlacedImages] = useState([]);
    const [threshold, setThreshold] = useState(initialThreshold);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [preloadProgress, setPreloadProgress] = useState(0);

    const lastPosition = useRef({x: 0, y: 0});
    const containerRef = useRef(null);
    const touchMoveRaf = useRef(null);

    // Default theme if none provided
    const defaultTheme = {
        controlsBg: 'transparent',
        controlsText: '#f0f0f0'
    };

    const currentTheme = theme || defaultTheme;

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
        if (!images || images.length === 0) return;

        let loadedCount = 0;
        const totalImages = images.length;
        const imageUrls = new Set();

        images.forEach((img) => {
            const url = img.url || img.src;
            if (imageUrls.has(url)) return; // Skip duplicates
            imageUrls.add(url);

            const image = new Image();
            image.onload = () => {
                loadedCount++;
                setLoadedImages(prev => new Set([...prev, url]));
                setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
            };
            image.onerror = () => {
                loadedCount++;
                setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
            };
            image.src = url;
        });
    }, [images]);

    function DecThreshold() {
        setThreshold((prev) => {
            let next = prev;
            if (prev > 140) {
                next = prev - 60;
            } else if (prev > 80) {
                next = prev - 40;
            } else if (prev > 40) {
                next = prev - 20;
            } else if (prev > 20) {
                next = prev - 20;
            }
            if (next < 20) next = 20;

            return next;
        });
    }

    function IncThreshold() {
        setThreshold((prev) => {
            let next = prev;
            if (prev < 40) {
                next = prev + 20;
            } else if (prev < 80) {
                next = prev + 40;
            } else if (prev < 140) {
                next = prev + 60;
            } else if (prev < 200) {
                next = prev + 60;
            }
            if (next > 200) next = 200;

            return next;
        });
    }

    function handleImageClick(imageSrc) {
        // Find the index of clicked image in the full images array
        const index = images.findIndex(img => {
            const imgUrl = img.url || img.src;
            return imgUrl === imageSrc;
        });
        if (index !== -1) {
            setLightboxIndex(index);
            setLightboxOpen(true);
        }
    }

    function placeImageAt(currentX, currentY) {
        // Don't place images if still preloading
        if (preloadProgress < 100) return;

        const distanceX = Math.abs(currentX - lastPosition.current.x);
        const distanceY = Math.abs(currentY - lastPosition.current.y);

        if (distanceX > threshold || distanceY > threshold) {
            lastPosition.current = {x: currentX, y: currentY};
            // Use full images for quality
            const currentImage = images[nextImage];
            const imageSrc = currentImage.url || currentImage.src;

            setPlacedImages((prevState) => {
                const newImage = {
                    id: uuid(),
                    src: imageSrc,
                    x: currentX,
                    y: currentY,
                };

                let maxLength;
                if (threshold <= 20) {
                    maxLength = isMobile ? 8 : 15;
                } else if (threshold <= 40) {
                    maxLength = isMobile ? 5 : 10;
                } else {
                    maxLength = isMobile ? 3 : 6;
                }
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
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        placeImageAt(currentX, currentY);
    }

    function handleTouch(e) {
        // Use requestAnimationFrame for smoother rendering
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

        // Mouse events (desktop)
        container.addEventListener("mousemove", handlePosition);

        // Touch events (mobile)
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
            // Clean up animation frame
            if (touchMoveRaf.current) {
                cancelAnimationFrame(touchMoveRaf.current);
            }
        };
    }, [threshold, nextImage, clearOnLeave, isMobile, preloadProgress]);

    return (
        <div className={styles.container}>
            <div
                ref={containerRef}
                className={styles.galleryContainer}
                style={{
                    overflow: "hidden",
                    cursor: preloadProgress < 100 ? 'wait' : 'default'
                }}
            >
                {preloadProgress === 100 && placedImages.map((image, index) => (
                    <img
                        key={image.id}
                        src={image.src}
                        alt=""
                        className={styles.placedImage}
                        style={{
                            zIndex: index,
                            transform: `translate(-50%, -50%) translate(${image.x}px, ${image.y}px)`,
                            cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(image.src)}
                    />
                ))}
                {preloadProgress < 100 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: currentTheme.controlsText || '#f0f0f0'
                    }}>
                        <div style={{
                            fontSize: isMobile ? 18 : 24,
                            fontWeight: 'bold',
                            marginBottom: 16
                        }}>
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
                        <div style={{
                            fontSize: isMobile ? 12 : 14,
                            marginTop: 12,
                            opacity: 0.7
                        }}>
                            {preloadProgress}%
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    {/* Close button */}
                    <button
                        className={styles.lightboxClose}
                        onClick={closeLightbox}
                        aria-label="Close"
                    >
                        <X size={isMobile ? 24 : 32}/>
                    </button>

                    {/* Previous button */}
                    <button
                        className={styles.lightboxPrev}
                        onClick={(e) => {
                            e.stopPropagation();
                            prevLightboxImage();
                        }}
                        aria-label="Previous"
                    >
                        <ChevronLeft size={isMobile ? 32 : 48}/>
                    </button>

                    {/* Image */}
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[lightboxIndex].url || images[lightboxIndex].src}
                            alt=""
                            className={styles.lightboxImage}
                        />
                    </div>

                    {/* Next button */}
                    <button
                        className={styles.lightboxNext}
                        onClick={(e) => {
                            e.stopPropagation();
                            nextLightboxImage();
                        }}
                        aria-label="Next"
                    >
                        <ChevronRight size={isMobile ? 32 : 48}/>
                    </button>
                </div>
            )}

            {showControls && (
                <div className={styles.controls}
                     style={{backgroundColor: currentTheme.controlsBg, color: currentTheme.controlsText}}>
                    <a href="https://www.instagram.com/manas.sx/" target="_blank" rel="noopener noreferrer"
                       className={styles.label}
                       style={{color: currentTheme.controlsText}}>
                        manas.
                    </a>
                    <div className={styles.threshold}>
                        <span style={{color: currentTheme.controlsText}}>Threshold: </span>
                        <button onClick={DecThreshold} className={styles.adjustBtn}>
                            -
                        </button>
                        <span className={styles.value} style={{color: currentTheme.controlsText}}>{threshold}</span>
                        <button onClick={IncThreshold} className={styles.adjustBtn}>
                            +
                        </button>
                    </div>
                    <span className={styles.label}
                          style={{color: currentTheme.controlsText}}>
                        saxenamanas04@gmail.com
                    </span>
                </div>
            )}
        </div>
    );
}

export default CursorTrailGallery;
