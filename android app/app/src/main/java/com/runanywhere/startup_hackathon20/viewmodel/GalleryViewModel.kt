package com.runanywhere.startup_hackathon20.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.runanywhere.startup_hackathon20.data.local.AppDatabase
import com.runanywhere.startup_hackathon20.data.local.entities.Gallery
import com.runanywhere.startup_hackathon20.data.local.entities.GalleryWithImages
import com.runanywhere.startup_hackathon20.data.remote.NetworkRepository
import com.runanywhere.startup_hackathon20.data.repository.GalleryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class GalleryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: GalleryRepository
    private val networkRepository: NetworkRepository
    private val _galleries = MutableStateFlow<List<GalleryWithImages>>(emptyList())
    val galleries: StateFlow<List<GalleryWithImages>> = _galleries.asStateFlow()

    private val _currentGallery = MutableStateFlow<GalleryWithImages?>(null)
    val currentGallery: StateFlow<GalleryWithImages?> = _currentGallery.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    // Cloud sync states
    private val _syncProgress = MutableStateFlow(0)
    val syncProgress: StateFlow<Int> = _syncProgress.asStateFlow()

    private val _syncMessage = MutableStateFlow<String?>(null)
    val syncMessage: StateFlow<String?> = _syncMessage.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    private val _publicLink = MutableStateFlow<String?>(null)
    val publicLink: StateFlow<String?> = _publicLink.asStateFlow()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = GalleryRepository(database.galleryDao(), application.applicationContext)
        networkRepository = NetworkRepository(application.applicationContext)

        // Load local galleries first (fast)
        loadGalleries()

        // Then sync from cloud in background
        syncGalleriesFromCloud()
    }

    private fun loadGalleries() {
        viewModelScope.launch {
            repository.getAllGalleriesWithImages().collect { galleryList ->
                _galleries.value = galleryList
            }
        }
    }

    /**
     * Sync galleries from cloud - fetches from backend and displays them
     */
    fun syncGalleriesFromCloud() {
        viewModelScope.launch {
            try {
                _isSyncing.value = true
                val result = networkRepository.getGalleries()

                if (result.isSuccess) {
                    val cloudGalleries = result.getOrThrow()
                    // For now, just trigger a refresh
                    // In a full implementation, you'd merge cloud + local data
                    _error.value = null
                }
            } catch (e: Exception) {
                // Silent fail - user can still see local galleries
                _error.value = null
            } finally {
                _isSyncing.value = false
            }
        }
    }

    fun loadGallery(id: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val gallery = repository.getGalleryWithImages(id)
                _currentGallery.value = gallery
                _error.value = null

                // Load public link if published
                if (gallery?.gallery?.isPublished == true && gallery.gallery.cloudId != null) {
                    _publicLink.value = generatePublicLink(gallery.gallery.cloudId)
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun createGallery(
        name: String,
        description: String,
        imagePaths: List<String>,
        onSuccess: (Long) -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val galleryId = repository.createGallery(name, description, imagePaths)
                _error.value = null
                onSuccess(galleryId)
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateGallery(gallery: Gallery) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                repository.updateGallery(gallery)
                _error.value = null
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteGallery(gallery: Gallery, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                repository.deleteGallery(gallery)
                _currentGallery.value = null
                _error.value = null
                onSuccess()
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ==================== Cloud Sync Operations ====================

    /**
     * Sync gallery to cloud (create + upload + publish)
     */
    fun syncGalleryToCloud(galleryId: Long, onSuccess: (String) -> Unit) {
        viewModelScope.launch {
            _isSyncing.value = true
            _syncProgress.value = 0
            _syncMessage.value = "Preparing..."
            _error.value = null

            try {
                val result = repository.syncGalleryToCloud(
                    galleryId = galleryId,
                    onProgress = { message, progress ->
                        _syncMessage.value = message
                        _syncProgress.value = progress
                    }
                )

                if (result.isSuccess) {
                    val cloudId = result.getOrThrow()
                    _publicLink.value = generatePublicLink(cloudId)
                    _syncMessage.value = "Gallery published!"
                    _syncProgress.value = 100

                    // Reload gallery to get updated sync status
                    loadGallery(galleryId)

                    onSuccess(cloudId)
                } else {
                    val error = result.exceptionOrNull()?.message ?: "Sync failed"
                    _error.value = error
                    _syncMessage.value = null
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "Sync failed"
                _syncMessage.value = null
            } finally {
                _isSyncing.value = false
            }
        }
    }

    /**
     * Generate public link for sharing
     */
    private fun generatePublicLink(cloudId: String): String {
        return "http://192.168.1.6:8000/g/$cloudId"
    }

    /**
     * Reset sync progress
     */
    fun resetSyncState() {
        _syncProgress.value = 0
        _syncMessage.value = null
        _publicLink.value = null
        _error.value = null
    }

    fun clearError() {
        _error.value = null
    }
}
