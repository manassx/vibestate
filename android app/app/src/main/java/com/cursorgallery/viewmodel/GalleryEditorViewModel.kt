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
                val currentConfig = _uiState.value.gallery?.config
                val updatedConfig = GalleryConfig(
                    threshold = newThreshold,
                    animationType = currentConfig?.animationType ?: "fade",
                    mood = currentConfig?.mood ?: "calm",
                    branding = currentConfig?.branding
                )

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
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to update threshold"
                )
            }
        }
    }

    fun updateImageTransform(imageId: String, transform: ImageTransform) {
        viewModelScope.launch {
            try {
                ApiClient.apiService.updateImageTransform(imageId, transform)

                // Reload gallery to get updated image data
                loadGallery()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to update image"
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
