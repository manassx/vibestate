package com.runanywhere.startup_hackathon20.data.remote

import android.content.Context
import android.net.Uri
import com.runanywhere.startup_hackathon20.data.remote.models.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

/**
 * Network Repository - Handles all backend API communication
 */
class NetworkRepository(private val context: Context) {

    private val apiService = ApiClient.getApiService(context)

    // ==================== Authentication ====================

    suspend fun signup(email: String, password: String, name: String): Result<AuthResponse> {
        return safeApiCall {
            val request = SignupRequest(email, password, name)
            apiService.signup(request)
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return safeApiCall {
            val request = LoginRequest(email, password)
            apiService.login(request)
        }
    }

    suspend fun logout(): Result<MessageResponse> {
        return safeApiCall {
            apiService.logout()
        }
    }

    // ==================== Galleries ====================

    suspend fun getGalleries(): Result<List<GalleryResponse>> {
        return safeApiCall {
            apiService.getGalleries()
        }
    }

    suspend fun createGallery(
        name: String,
        description: String,
        config: GalleryConfig
    ): Result<GalleryResponse> {
        return safeApiCall {
            val request = CreateGalleryRequest(name, description, config)
            apiService.createGallery(request)
        }
    }

    suspend fun getGallery(id: String): Result<GalleryDetailResponse> {
        return safeApiCall {
            apiService.getGallery(id)
        }
    }

    suspend fun updateGallery(
        id: String,
        name: String?,
        description: String?,
        config: GalleryConfig?,
        status: String?
    ): Result<GalleryResponse> {
        return safeApiCall {
            val request = UpdateGalleryRequest(name, description, config, status)
            apiService.updateGallery(id, request)
        }
    }

    suspend fun publishGallery(id: String): Result<GalleryResponse> {
        return safeApiCall {
            val updateMap = mapOf("status" to "published")
            apiService.patchGallery(id, updateMap)
        }
    }

    suspend fun deleteGallery(id: String): Result<MessageResponse> {
        return safeApiCall {
            apiService.deleteGallery(id)
        }
    }

    /**
     * Upload images to gallery
     * @param galleryId Gallery UUID
     * @param imageUris List of image URIs from device
     * @param onProgress Progress callback (0-100)
     */
    suspend fun uploadImages(
        galleryId: String,
        imageUris: List<Uri>,
        onProgress: ((Int) -> Unit)? = null
    ): Result<UploadImagesResponse> {
        return try {
            val parts = mutableListOf<MultipartBody.Part>()

            imageUris.forEachIndexed { index, uri ->
                // Convert URI to file
                val file = uriToFile(uri, "image_${System.currentTimeMillis()}_$index.jpg")

                if (file != null && file.exists()) {
                    val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                    val part = MultipartBody.Part.createFormData("images", file.name, requestFile)
                    parts.add(part)
                }

                // Report progress
                onProgress?.invoke(((index + 1) * 100) / imageUris.size)
            }

            safeApiCall {
                apiService.uploadImages(galleryId, parts)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun analyzeGallery(id: String): Result<AnalyzeResponse> {
        return safeApiCall {
            apiService.analyzeGallery(id)
        }
    }

    // ==================== Public Access ====================

    suspend fun getPublicGallery(id: String): Result<PublicGalleryResponse> {
        return safeApiCall {
            apiService.getPublicGallery(id)
        }
    }

    // ==================== Helper Functions ====================

    /**
     * Safe API call wrapper with proper error handling
     */
    private suspend fun <T> safeApiCall(
        apiCall: suspend () -> retrofit2.Response<T>
    ): Result<T> {
        return try {
            val response = apiCall()

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("Empty response body"))
                }
            } else {
                val errorMessage = when (response.code()) {
                    400 -> "Invalid request"
                    401 -> "Unauthorized - Please login again"
                    403 -> "Access forbidden"
                    404 -> "Not found"
                    409 -> "Resource already exists"
                    500 -> "Server error"
                    else -> "Request failed: ${response.code()}"
                }
                Result.failure(Exception(errorMessage))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Convert content URI to File
     */
    private fun uriToFile(uri: Uri, fileName: String): File? {
        return try {
            val contentResolver = context.contentResolver
            val inputStream = contentResolver.openInputStream(uri) ?: return null

            val file = File(context.cacheDir, fileName)
            val outputStream = FileOutputStream(file)

            inputStream.copyTo(outputStream)

            inputStream.close()
            outputStream.close()

            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
