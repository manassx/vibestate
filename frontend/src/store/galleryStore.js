import {create} from 'zustand';
import {get as apiGet, post, patch, del} from '../utils/api';
import {API_ENDPOINTS} from '../utils/constants';

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
            console.log('Starting upload for', files.length, 'files');
            console.log('Gallery ID:', galleryId);
            console.log('Files:', files.map(f => ({name: f.name, size: f.size, type: f.type})));

            const formData = new FormData();
            files.forEach((file, index) => {
                console.log(`Adding file ${index + 1}:`, file.name, file.size, 'bytes');
                formData.append('images', file);
            });

            console.log('FormData created, making API call...');
            const result = await post(API_ENDPOINTS.GALLERIES.UPLOAD(galleryId), formData);
            console.log('Upload result:', result);

            set({uploadProgress: 100});

            // Update gallery image count locally
            get().updateGalleryLocal(galleryId, {
                image_count: result.uploadedCount,
                status: 'processing'
            });

            return result;
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
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