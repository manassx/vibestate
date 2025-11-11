package com.cursorgallery.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cursorgallery.data.api.ApiClient
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.UpdateGalleryRequest
import com.cursorgallery.data.models.ImageTransform
import com.cursorgallery.data.models.GalleryConfig
import com.cursorgallery.ai.MoodPresetSuggestion
import com.cursorgallery.ai.ImageSequencePlan
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private const val TAG = "GalleryEditorVM"

data class GalleryEditorUiState(
    val isLoading: Boolean = false,
    val gallery: Gallery? = null,
    val error: String? = null
)

class GalleryEditorViewModel(
    private val tokenManager: TokenManager,
    private val galleryId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(GalleryEditorUiState())
    val uiState: StateFlow<GalleryEditorUiState> = _uiState.asStateFlow()

    fun loadGallery() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            Log.d(TAG, "Loading gallery: $galleryId")

            try {
                val response = ApiClient.apiService.getGallery(galleryId)

                if (response.isSuccessful) {
                    val gallery = response.body()
                    Log.d(TAG, "Gallery loaded successfully: ${gallery?.name}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        gallery = gallery,
                        error = null
                    )
                } else {
                    Log.e(TAG, "Failed to load gallery: ${response.code()}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load gallery: ${response.code()}"
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception loading gallery", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Unknown error occurred"
                )
            }
        }
    }

    fun publishGallery() {
        viewModelScope.launch {
            try {
                val currentGallery = _uiState.value.gallery ?: return@launch

                Log.d(TAG, "Publishing gallery: ${currentGallery.name}")

                // Update status immediately in local state (optimistic update)
                val publishedGallery = currentGallery.copy(status = "published")
                _uiState.value = _uiState.value.copy(gallery = publishedGallery)

                Log.d(TAG, "Gallery status updated to published in UI")

                // Send update to backend (fire and forget - don't update state with response)
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(status = "published")
                )

                if (response.isSuccessful) {
                    Log.d(TAG, "Gallery published successfully on backend")
                } else {
                    Log.e(TAG, "Failed to publish gallery on backend: ${response.code()}")
                    // Keep the optimistic update even if backend fails
                    // User will see it as published, and it will sync on next load
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception publishing gallery", e)
                // Keep the optimistic update even on exception
                // This prevents UI from breaking
            }
        }
    }

    fun updateThreshold(newThreshold: Int) {
        viewModelScope.launch {
            try {
                val currentGallery = _uiState.value.gallery ?: return@launch
                val currentConfig = currentGallery.config
                val updatedConfig = GalleryConfig(
                    threshold = newThreshold,
                    animationType = currentConfig?.animationType ?: "fade",
                    mood = currentConfig?.mood ?: "calm",
                    branding = currentConfig?.branding
                )

                Log.d(TAG, "Updating threshold to: $newThreshold")

                // Update state immediately for smooth UI (optimistic update)
                val updatedGallery = currentGallery.copy(config = updatedConfig)
                _uiState.value = _uiState.value.copy(gallery = updatedGallery)

                Log.d(TAG, "Threshold updated in UI, syncing to backend...")

                // Send update to backend (fire and forget - don't replace gallery with response)
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(config = updatedConfig)
                )

                if (response.isSuccessful) {
                    Log.d(TAG, "Threshold synced to backend successfully")
                } else {
                    Log.e(TAG, "Failed to sync threshold to backend: ${response.code()}")
                    // Keep the local update even if backend fails
                }
            } catch (e: Exception) {
                Log.e(TAG, "Exception updating threshold", e)
                // Keep the local update even on exception to prevent UI breaking
            }
        }
    }

    fun updateImageTransform(imageId: String, transform: ImageTransform) {
        viewModelScope.launch {
            try {
                val currentGallery = _uiState.value.gallery ?: return@launch

                // Update the specific image in state immediately
                val updatedImages = currentGallery.images?.map { image ->
                    if (image.id == imageId) {
                        // Preserve existing metadata, only update transform
                        val updatedMetadata = image.metadata?.copy(transform = transform)
                        if (updatedMetadata != null) {
                            image.copy(metadata = updatedMetadata)
                        } else {
                            image
                        }
                    } else {
                        image
                    }
                }

                _uiState.value = _uiState.value.copy(
                    gallery = currentGallery.copy(images = updatedImages)
                )

                // Send update to backend asynchronously
                ApiClient.apiService.updateImageTransform(imageId, transform)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to update image"
                )
            }
        }
    }

    fun updateGalleryConfig(config: GalleryConfig) {
        viewModelScope.launch {
            val currentGallery = _uiState.value.gallery

            if (currentGallery == null) {
                Log.e(TAG, "Cannot update config: gallery is null")
                _uiState.value = _uiState.value.copy(
                    error = "Gallery not loaded"
                )
                return@launch
            }

            Log.d(
                TAG,
                "Updating gallery config LOCALLY (temporary): animationType=${config.animationType}, mood=${config.mood}"
            )

            // Update local state ONLY - makes changes temporary and revertable
            val updatedGallery = currentGallery.copy(config = config)
            _uiState.value = _uiState.value.copy(
                gallery = updatedGallery,
                error = null
            )

            Log.d(TAG, "Local config updated successfully")

            // API sync disabled for temporary AI changes - user can save manually if desired
            // try {
            //     val response = ApiClient.apiService.patchGallery(galleryId, UpdateGalleryRequest(config = config))
            //     if (response.isSuccessful && response.body() != null) {
            //         _uiState.value = _uiState.value.copy(gallery = response.body(), error = null)
            //     }
            // } catch (e: Exception) {
            //     Log.e(TAG, "API sync skipped for temporary changes")
            // }
        }
    }

    fun applyImageOrdering(orderedIds: List<String>) {
        viewModelScope.launch {
            val currentGallery = _uiState.value.gallery

            if (currentGallery == null) {
                Log.e(TAG, "Cannot apply ordering: gallery is null")
                _uiState.value = _uiState.value.copy(
                    error = "Gallery not loaded"
                )
                return@launch
            }

            Log.d(TAG, "Applying image ordering LOCALLY (temporary): ${orderedIds.size} images")

            // Validate all IDs exist
            val availableIds = currentGallery.images?.map { it.id } ?: emptyList()
            val missingIds = orderedIds.filter { it !in availableIds }
            if (missingIds.isNotEmpty()) {
                Log.e(TAG, "Cannot apply ordering: unknown image IDs: $missingIds")
                _uiState.value = _uiState.value.copy(
                    error = "Invalid image IDs in sequence"
                )
                return@launch
            }

            // Reorder images based on provided IDs
            val reorderedImages = orderedIds.mapNotNull { id ->
                currentGallery.images?.find { it.id == id }
            }

            Log.d(TAG, "Reordered ${reorderedImages.size} images locally")

            // Update local state ONLY - makes changes temporary and revertable
            val updatedGallery = currentGallery.copy(images = reorderedImages)
            _uiState.value = _uiState.value.copy(
                gallery = updatedGallery,
                error = null
            )

            Log.d(TAG, "Local ordering updated successfully")

            // API sync disabled for temporary AI changes - user can save manually if desired
            // try {
            //     val response = ApiClient.apiService.patchGallery(galleryId, UpdateGalleryRequest(orderedImageIds = orderedIds))
            //     if (response.isSuccessful && response.body() != null) {
            //         _uiState.value = _uiState.value.copy(gallery = response.body(), error = null)
            //     }
            // } catch (e: Exception) {
            //     Log.e(TAG, "API sync skipped for temporary changes")
            // }
        }
    }
}

class GalleryEditorViewModelFactory(
    private val tokenManager: TokenManager,
    private val galleryId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(GalleryEditorViewModel::class.java)) {
            return GalleryEditorViewModel(tokenManager, galleryId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
