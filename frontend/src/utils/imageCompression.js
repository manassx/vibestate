import imageCompression from 'browser-image-compression';

/**
 * Compress image with high quality settings (95% quality)
 * Maintains excellent visual quality while reducing file size
 *
 * @param {File} file - The image file to compress
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, onProgress = null) {
    // Detect mobile device
    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window);

    // More aggressive compression on mobile for faster uploads
    const options = {
        maxSizeMB: isMobile ? 1 : 3, // 1MB on mobile, 3MB on desktop
        maxWidthOrHeight: isMobile ? 2048 : 4096, // 2K on mobile, 4K on desktop
        useWebWorker: !isMobile, // Disable web worker on mobile (causes errors), enable on desktop
        quality: 0.92, // 92% quality - excellent quality
        initialQuality: 0.92,
        alwaysKeepResolution: false, // Allow resizing
        preserveExif: false, // Remove metadata to save space
        onProgress: onProgress, // Progress callback
        fileType: file.type, // Preserve original format
    };

    try {
        const compressedBlob = await imageCompression(file, options);

        // Convert blob to File with original filename
        const compressedFile = new File(
            [compressedBlob],
            file.name,
            {
                type: file.type,
                lastModified: Date.now()
            }
        );

        // If compression resulted in larger file, return original
        if (compressedFile.size > file.size) {
            console.log(`[Mobile Compression] Skipping ${file.name} - original is smaller`);
            return file;
        }

        const reductionPercent = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

        if (isMobile) {
            console.log(
                `[Mobile Compression] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (${reductionPercent}% reduction)`
            );
        }

        return compressedFile;
    } catch (error) {
        console.error(`[Compression Error] Failed to compress ${file.name}:`, error.message || error);

        // Return original file if compression fails
        if (isMobile) {
            console.log(`[Mobile] Using original file due to compression error`);
        }
        return file;
    }
}

/**
 * Compress multiple images with progress tracking
 *
 * @param {File[]} files - Array of image files to compress
 * @param {Function} onTotalProgress - Progress callback (0-100)
 * @returns {Promise<File[]>} - Array of compressed files
 */
export async function compressImages(files, onTotalProgress = null) {
    if (!files || files.length === 0) return [];

    const compressedFiles = [];
    let completed = 0;

    for (const file of files) {
        const compressedFile = await compressImage(file, (progress) => {
            // Calculate overall progress
            const itemProgress = progress / files.length;
            const totalProgress = ((completed / files.length) * 100) + itemProgress;

            if (onTotalProgress) {
                onTotalProgress(Math.round(totalProgress));
            }
        });

        compressedFiles.push(compressedFile);
        completed++;

        if (onTotalProgress) {
            onTotalProgress(Math.round((completed / files.length) * 100));
        }
    }

    // Calculate total savings
    const originalSize = files.reduce((sum, f) => sum + f.size, 0);
    const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
    const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    // console.log(
    //     `✅ Compressed ${files.length} images: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savedPercent}% smaller)`
    // );

    return compressedFiles;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
