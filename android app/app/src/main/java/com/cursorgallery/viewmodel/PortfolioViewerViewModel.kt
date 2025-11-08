package com.cursorgallery.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cursorgallery.data.api.ApiClient
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.Gallery
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PortfolioViewerUiState(
    val isLoading: Boolean = false,
    val gallery: Gallery? = null,
    val error: String? = null
)

class PortfolioViewerViewModel(
    private val tokenManager: TokenManager,
    private val galleryId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(PortfolioViewerUiState())
    val uiState: StateFlow<PortfolioViewerUiState> = _uiState.asStateFlow()

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
}

class PortfolioViewerViewModelFactory(
    private val tokenManager: TokenManager,
    private val galleryId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(PortfolioViewerViewModel::class.java)) {
            return PortfolioViewerViewModel(tokenManager, galleryId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
