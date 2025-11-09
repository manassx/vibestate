package com.cursorgallery.viewmodel

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

            try {
                val response = ApiClient.apiService.getGallery(galleryId)

                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        gallery = response.body(),
                        error = null
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load gallery"
                    )
                }
            } catch (e: Exception) {
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
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(status = "published")
                )

                if (response.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        gallery = response.body()
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to publish"
                )
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

                // Update state immediately for smooth UI
                _uiState.value = _uiState.value.copy(
                    gallery = currentGallery.copy(config = updatedConfig)
                )

                // Send update to backend asynchronously
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(config = updatedConfig)
                )

                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = _uiState.value.copy(
                        gallery = response.body()
                    )
                }
            } catch (e: Exception) {
                // Don't clear gallery on error, just log it
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to update threshold"
                )
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
            val currentGallery = _uiState.value.gallery ?: return@launch

            _uiState.value = _uiState.value.copy(
                gallery = currentGallery.copy(config = config)
            )

            try {
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(config = config)
                )

                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = _uiState.value.copy(gallery = response.body())
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to apply preset"
                )
            }
        }
    }

    fun applyImageOrdering(orderedIds: List<String>) {
        viewModelScope.launch {
            val currentGallery = _uiState.value.gallery ?: return@launch

            val reorderedImages = orderedIds.mapNotNull { id ->
                currentGallery.images?.find { it.id == id }
            }

            _uiState.value = _uiState.value.copy(
                gallery = currentGallery.copy(images = reorderedImages)
            )

            try {
                val response = ApiClient.apiService.patchGallery(
                    galleryId,
                    UpdateGalleryRequest(orderedImageIds = orderedIds)
                )

                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = _uiState.value.copy(gallery = response.body())
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to apply ordering"
                )
            }
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
