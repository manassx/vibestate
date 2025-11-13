import {create} from 'zustand';
import {get as apiGet, post, patch, del} from '../utils/api';
import {API_ENDPOINTS} from '../utils/constants';
import {uploadImagesInParallel, deleteImagesFromStorage} from '../utils/supabaseUpload';

const useGalleryStore = create((set, get) => ({
    // State
    galleries: [],
    currentGallery: null,
    isLoading: false,
    error: null,
    uploadProgress: 0,
    analysisProgress: 0,

    // Actions
    setGalleries: (galleries) => set({galleries}),

    setCurrentGallery: (gallery) => set({currentGallery: gallery}),

    setLoading: (isLoading) => set({isLoading}),

    setError: (error) => set({error}),

    setUploadProgress: (progress) => set({uploadProgress: progress}),

    setAnalysisProgress: (progress) => set({analysisProgress: progress}),

    addGallery: (gallery) => set((state) => ({
        galleries: [gallery, ...state.galleries]
    })),

    updateGalleryLocal: (galleryId, updates) => set((state) => ({
        galleries: state.galleries.map(gallery =>
            gallery.id === galleryId ? {...gallery, ...updates} : gallery
        ),
        currentGallery: state.currentGallery?.id === galleryId
            ? {...state.currentGallery, ...updates}
            : state.currentGallery
    })),

    deleteGalleryLocal: (galleryId) => set((state) => ({
        galleries: state.galleries.filter(gallery => gallery.id !== galleryId),
        currentGallery: state.currentGallery?.id === galleryId ? null : state.currentGallery
    })),

    // API Actions
    fetchGalleries: async () => {
        set({isLoading: true, error: null});
        try {
            const galleries = await apiGet(API_ENDPOINTS.GALLERIES.LIST);
            set({galleries, isLoading: false});
            return galleries;
        } catch (error) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    createGallery: async (galleryData) => {
        set({isLoading: true, error: null});
        try {
            const newGallery = await post(API_ENDPOINTS.GALLERIES.CREATE, galleryData);
            set((state) => ({
                galleries: [newGallery, ...state.galleries],
                isLoading: false
            }));
            return newGallery;
        } catch (error) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    updateGallery: async (galleryId, updates) => {
        set({isLoading: true, error: null});
        try {
            const updatedGallery = await patch(API_ENDPOINTS.GALLERIES.UPDATE(galleryId), updates);
            set((state) => ({
                galleries: state.galleries.map(gallery =>
                    gallery.id === galleryId ? updatedGallery : gallery
                ),
                currentGallery: state.currentGallery?.id === galleryId
                    ? updatedGallery
                    : state.currentGallery,
                isLoading: false
            }));
            return updatedGallery;
        } catch (error) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    deleteGallery: async (galleryId) => {
        set({isLoading: true, error: null});
        try {
            await del(API_ENDPOINTS.GALLERIES.DELETE(galleryId));
            set((state) => ({
                galleries: state.galleries.filter(gallery => gallery.id !== galleryId),
                currentGallery: state.currentGallery?.id === galleryId ? null : state.currentGallery,
                isLoading: false
            }));
        } catch (error) {
            set({error: error.message, isLoading: false});
            throw error;
        }
    },

    uploadImages: async (galleryId, files) => {
        set({uploadProgress: 0, error: null});
        try {
            // Get user ID from auth storage
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage) {
                throw new Error('Not authenticated');
            }
            const userId = JSON.parse(authStorage).state.user.id;

            console.log(`📸 [Gallery Store] Starting upload of ${files.length} images to gallery ${galleryId}`);

            // STEP 1: Upload ALL images directly to Supabase (bypasses Vercel 4.5MB limit!)
            const uploadResults = await uploadImagesInParallel(
                files,
                userId,
                galleryId,
                (completed, total) => {
                    // Update progress (0-70% for upload phase)
                    const progress = Math.round((completed / total) * 70);
                    set({uploadProgress: progress});
                    console.log(`📊 [Gallery Store] Upload progress: ${completed}/${total} (${progress}%)`);
                }
            );

            console.log(`✅ [Gallery Store] Uploaded ${uploadResults.length}/${files.length} images to storage`);

            if (uploadResults.length === 0) {
                throw new Error('All image uploads failed');
            }

            // STEP 2: Register each image in the database (tiny metadata payloads < 1KB each)
            const registeredImages = [];
            const failedRegistrations = [];

            for (let i = 0; i < uploadResults.length; i++) {
                const result = uploadResults[i];

                try {
                    console.log(`📝 [Gallery Store] Registering ${i + 1}/${uploadResults.length}: ${result.fileName}`);

                    // Send only metadata to backend (NOT the file!)
                    const metadata = {
                        url: result.url,
                        fileName: result.fileName,
                        size: result.size,
                        storageKey: result.path,
                        width: result.width,
                        height: result.height
                    };

                    // This request is tiny (< 1KB) - won't hit 4.5MB limit!
                    const response = await post(
                        API_ENDPOINTS.GALLERIES.REGISTER_IMAGE(galleryId),
                        metadata
                    );

                    registeredImages.push(response.image);

                    // Update progress (70-100% for registration phase)
                    const progress = 70 + Math.round(((i + 1) / uploadResults.length) * 30);
                    set({uploadProgress: progress});

                } catch (error) {
                    console.error(`❌ [Gallery Store] Failed to register ${result.fileName}:`, error);
                    failedRegistrations.push(result);
                }
            }

            console.log(`✅ [Gallery Store] Successfully registered ${registeredImages.length}/${uploadResults.length} images`);

            // STEP 3: Cleanup orphaned files (uploaded but not registered)
            if (failedRegistrations.length > 0) {
                console.warn(`🗑️ [Gallery Store] Cleaning up ${failedRegistrations.length} orphaned files...`);
                const pathsToDelete = failedRegistrations.map(f => f.path);
                await deleteImagesFromStorage(pathsToDelete);
            }

            // Update gallery image count locally
            get().updateGalleryLocal(galleryId, {
                image_count: registeredImages.length,
                status: 'processing'
            });

            console.log(`🎉 [Gallery Store] Upload Summary:
  📤 Total files: ${files.length}
  ✅ Uploaded to storage: ${uploadResults.length}
  ✅ Registered in database: ${registeredImages.length}
  ${failedRegistrations.length > 0 ? `❌ Failed: ${failedRegistrations.length}` : ''}
            `);

            return {
                uploadedCount: registeredImages.length,
                images: registeredImages
            };
        } catch (error) {
            console.error('❌ [Gallery Store] Upload failed:', error);
            set({error: error.message, uploadProgress: 0});
            throw error;
        }
    },

    analyzeGallery: async (galleryId) => {
        set({analysisProgress: 0, error: null});
        try {
            const result = await post(API_ENDPOINTS.GALLERIES.ANALYZE(galleryId));

            // Update gallery with analysis results
            get().updateGalleryLocal(galleryId, {
                status: 'analyzed',
                config: result.config,
                analysisComplete: true
            });

            set({analysisProgress: 100});
            return result;
        } catch (error) {
            set({error: error.message, analysisProgress: 0});
            throw error;
        }
    },

    clearError: () => set({error: null}),

    resetProgress: () => set({uploadProgress: 0, analysisProgress: 0}),
}));

export default useGalleryStore;