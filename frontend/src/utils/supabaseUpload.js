import {createClient} from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Upload multiple images in parallel to Supabase Storage
 * This bypasses Vercel's 4.5MB serverless function limit
 * Images go directly from browser to Supabase
 *
 * @param {File[]} files - Array of image files to upload
 * @param {string} userId - User ID for folder organization
 * @param {string} galleryId - Gallery ID for folder organization
 * @param {Function} onProgress - Callback for progress updates (completed, total)
 * @returns {Promise<Array>} Array of upload results with URLs and metadata
 */
export async function uploadImagesInParallel(files, userId, galleryId, onProgress) {
    console.log(`🚀 [Direct Upload] Starting parallel upload of ${files.length} images`);

    // Create upload promises for parallel execution
    const uploadPromises = files.map(async (file, index) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${userId}/${galleryId}/${fileName}`;

            console.log(`📤 [Direct Upload ${index + 1}/${files.length}] Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

            // Upload directly to Supabase Storage (no Vercel involved!)
            const {data, error} = await supabase.storage
                .from('gallery-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error(`❌ [Direct Upload] Failed: ${file.name}`, error);
                throw error;
            }

            // Get public URL
            const {data: {publicUrl}} = supabase.storage
                .from('gallery-images')
                .getPublicUrl(filePath);

            console.log(`✅ [Direct Upload ${index + 1}/${files.length}] Success: ${file.name}`);

            // Get image dimensions
            const dimensions = await getImageDimensions(file);

            // Update progress callback
            if (onProgress) {
                onProgress(index + 1, files.length);
            }

            return {
                url: publicUrl,
                fileName: file.name,
                size: file.size,
                path: filePath,
                width: dimensions.width,
                height: dimensions.height,
                success: true
            };
        } catch (error) {
            console.error(`❌ [Direct Upload] Critical error for ${file.name}:`, error);
            return {
                fileName: file.name,
                error: error.message,
                success: false
            };
        }
    });

    // Wait for ALL uploads to complete (parallel execution)
    const results = await Promise.all(uploadPromises);

    // Filter out failed uploads
    const successfulUploads = results.filter(r => r.success === true);
    const failedUploads = results.filter(r => r.success === false);

    console.log(`✅ [Direct Upload] Completed: ${successfulUploads.length}/${files.length} successful`);
    if (failedUploads.length > 0) {
        console.warn(`⚠️ [Direct Upload] Failed uploads:`, failedUploads.map(f => f.fileName));
    }

    return successfulUploads;
}

/**
 * Extract image dimensions from a file
 * Used to get width/height before uploading to backend
 *
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = url;
    });
}

/**
 * Delete an image from Supabase Storage
 * Used for cleanup when database registration fails
 *
 * @param {string} filePath - Storage path of the file
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImageFromStorage(filePath) {
    try {
        const {error} = await supabase.storage
            .from('gallery-images')
            .remove([filePath]);

        if (error) {
            console.error(`❌ [Storage Cleanup] Failed to delete: ${filePath}`, error);
            return false;
        }

        console.log(`🗑️ [Storage Cleanup] Deleted: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`❌ [Storage Cleanup] Error:`, error);
        return false;
    }
}

/**
 * Delete multiple images from Supabase Storage
 * Used for bulk cleanup operations
 *
 * @param {string[]} filePaths - Array of storage paths
 * @returns {Promise<number>} Number of successfully deleted files
 */
export async function deleteImagesFromStorage(filePaths) {
    if (!filePaths || filePaths.length === 0) {
        return 0;
    }

    try {
        const {data, error} = await supabase.storage
            .from('gallery-images')
            .remove(filePaths);

        if (error) {
            console.error(`❌ [Storage Cleanup] Bulk delete failed:`, error);
            return 0;
        }

        console.log(`🗑️ [Storage Cleanup] Deleted ${filePaths.length} files`);
        return filePaths.length;
    } catch (error) {
        console.error(`❌ [Storage Cleanup] Error:`, error);
        return 0;
    }
}
