package com.cursorgallery.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cursorgallery.data.api.ApiClient
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.CreateGalleryRequest
import com.cursorgallery.data.models.GalleryConfig
import com.cursorgallery.data.models.UpdateGalleryRequest
import com.cursorgallery.util.ImageCompressor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

data class CreatePortfolioUiState(
    val currentStep: Int = 1, // 1: Details, 2: Upload, 3: Processing
    val processingStep: Int = 0, // 0: Compress, 1: Create, 2: Upload, 3: Finalize, 4: Done
    val isLoading: Boolean = false,
    val error: String? = null,
    val compressionProgress: Float = 0f,
    val uploadProgress: Float = 0f,
    val createdGalleryId: String? = null,
    val portfolioName: String = "",
    val portfolioDescription: String = ""
)

class CreatePortfolioViewModel(
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreatePortfolioUiState())
    val uiState: StateFlow<CreatePortfolioUiState> = _uiState.asStateFlow()

    fun setPortfolioDetails(name: String, description: String) {
        _uiState.value = _uiState.value.copy(
            portfolioName = name,
            portfolioDescription = description
        )
    }

    fun nextStep() {
        _uiState.value = _uiState.value.copy(
            currentStep = _uiState.value.currentStep + 1
        )
    }

    fun createPortfolioWithImages(context: Context, imageUris: List<Uri>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                currentStep = 3,
                processingStep = 0,
                isLoading = true,
                error = null
            )

            try {
                // Step 0: Get user preferences
                val userSettings = try {
                    ApiClient.apiService.getUserSettings()
                } catch (e: Exception) {
                    null
                }

                val defaultThreshold = userSettings?.body()?.preferences?.defaultThreshold ?: 80
                val compressImages = userSettings?.body()?.preferences?.compressImages ?: true

                // Step 0: Compress images (if enabled)
                val filesToUpload = if (compressImages) {
                    _uiState.value = _uiState.value.copy(processingStep = 0)
                    val compressor = ImageCompressor(context)
                    val compressedFiles = mutableListOf<File>()

                    imageUris.forEachIndexed { index, uri ->
                        try {
                            val compressed = compressor.compressImage(uri)
                            if (compressed != null) {
                                compressedFiles.add(compressed)
                            }
                            _uiState.value = _uiState.value.copy(
                                compressionProgress = (index + 1).toFloat() / imageUris.size
                            )
                        } catch (e: Exception) {
                            // If compression fails, skip this image
                        }
                    }
                    compressedFiles
                } else {
                    // Convert URIs to files without compression
                    imageUris.mapNotNull { uri ->
                        try {
                            val inputStream = context.contentResolver.openInputStream(uri)
                            val file =
                                File(context.cacheDir, "upload_${System.currentTimeMillis()}.jpg")
                            file.outputStream().use { outputStream ->
                                inputStream?.copyTo(outputStream)
                            }
                            file
                        } catch (e: Exception) {
                            null
                        }
                    }
                }

                if (filesToUpload.isEmpty()) {
                    throw Exception("No images could be processed")
                }

                // Step 1: Create portfolio
                _uiState.value = _uiState.value.copy(processingStep = 1)

                val createRequest = CreateGalleryRequest(
                    name = _uiState.value.portfolioName,
                    description = _uiState.value.portfolioDescription.takeIf { it.isNotBlank() },
                    config = GalleryConfig(
                        threshold = defaultThreshold,
                        animationType = "fade",
                        mood = "calm"
                    )
                )

                val createResponse = ApiClient.apiService.createGallery(createRequest)
                if (!createResponse.isSuccessful) {
                    throw Exception("Failed to create portfolio: ${createResponse.message()}")
                }

                val gallery = createResponse.body() ?: throw Exception("No gallery data received")
                _uiState.value = _uiState.value.copy(createdGalleryId = gallery.id)

                // Step 2: Upload images
                _uiState.value = _uiState.value.copy(processingStep = 2)

                val imageParts = filesToUpload.mapIndexed { index, file ->
                    val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                    _uiState.value = _uiState.value.copy(
                        uploadProgress = index.toFloat() / filesToUpload.size
                    )
                    MultipartBody.Part.createFormData("images", file.name, requestFile)
                }

                val uploadResponse = ApiClient.apiService.uploadImages(gallery.id, imageParts)
                if (!uploadResponse.isSuccessful) {
                    throw Exception("Failed to upload images: ${uploadResponse.message()}")
                }

                _uiState.value = _uiState.value.copy(uploadProgress = 1f)

                // Clean up temp files
                filesToUpload.forEach { it.delete() }

                // Step 3: Finalize
                _uiState.value = _uiState.value.copy(processingStep = 3)

                val updateRequest = UpdateGalleryRequest(
                    status = "analyzed"
                )
                ApiClient.apiService.patchGallery(gallery.id, updateRequest)

                // Step 4: Done
                _uiState.value = _uiState.value.copy(
                    processingStep = 4,
                    isLoading = false
                )

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to create portfolio",
                    currentStep = 2 // Go back to upload step
                )
            }
        }
    }
}

class CreatePortfolioViewModelFactory(
    private val tokenManager: TokenManager
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(CreatePortfolioViewModel::class.java)) {
            return CreatePortfolioViewModel(tokenManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
