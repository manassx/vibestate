import {create} from 'zustand';
import {get as apiGet, post} from '../utils/api';
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

    updateGallery: (galleryId, updates) => set((state) => ({
        galleries: state.galleries.map(gallery =>
            gallery.id === galleryId ? {...gallery, ...updates} : gallery
        ),
        currentGallery: state.currentGallery?.id === galleryId
            ? {...state.currentGallery, ...updates}
            : state.currentGallery
    })),

    deleteGallery: (galleryId) => set((state) => ({
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

    uploadImages: async (galleryId, files) => {
        set({uploadProgress: 0, error: null});
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('images', file));

            const result = await post(API_ENDPOINTS.GALLERIES.UPLOAD(galleryId), formData);
            set({uploadProgress: 100});
            return result;
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
            get().updateGallery(galleryId, {
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