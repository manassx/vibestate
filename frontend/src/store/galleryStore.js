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

            // STEP 1: Upload ALL images directly to Supabase Storage (bypasses 4.5MB limit)
            const uploadResults = await uploadImagesInParallel(
                files,
                userId,
                galleryId,
                (completed, total) => {
                    const progress = Math.round((completed / total) * 70);
                    set({uploadProgress: progress});
                }
            );

            if (uploadResults.length === 0) {
                throw new Error('All image uploads failed');
            }

            // STEP 2: Register images ONE BY ONE to prevent server overload
            const successfulRegistrations = [];

            for (let i = 0; i < uploadResults.length; i++) {
                const result = uploadResults[i];

                try {
                    const metadata = {
                        url: result.url,
                        fileName: result.fileName,
                        size: result.size,
                        storageKey: result.path,
                        width: result.width,
                        height: result.height
                    };

                    const response = await post(API_ENDPOINTS.GALLERIES.REGISTER_IMAGE(galleryId), metadata);
                    successfulRegistrations.push(response.image);

                    // Update progress (70-100% for registration phase)
                    const progress = 70 + Math.round(((i + 1) / uploadResults.length) * 30);
                    set({uploadProgress: progress});

                    // Small delay between each registration to be gentle on Render
                    if (i < uploadResults.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }

                } catch (error) {
                    console.error(`Failed to register ${result.fileName}:`, error);
                    // Continue with next image instead of failing completely
                }
            }

            set({uploadProgress: 100});

            // STEP 3: Cleanup orphaned files if any registrations failed
            const failedCount = uploadResults.length - successfulRegistrations.length;
            if (failedCount > 0) {
                const failedUploads = uploadResults.filter(result =>
                    !successfulRegistrations.some(reg => reg.url === result.url)
                );
                const pathsToDelete = failedUploads.map(f => f.path);
                await deleteImagesFromStorage(pathsToDelete);
            }

            // Update gallery image count locally
            get().updateGalleryLocal(galleryId, {
                image_count: successfulRegistrations.length,
                status: 'processing'
            });

            return {
                uploadedCount: successfulRegistrations.length,
                images: successfulRegistrations
            };
        } catch (error) {
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