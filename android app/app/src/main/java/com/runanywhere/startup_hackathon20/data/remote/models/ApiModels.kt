package com.runanywhere.startup_hackathon20.data.remote.models

import com.google.gson.annotations.SerializedName

// ==================== Request Models ====================

data class SignupRequest(
    val email: String,
    val password: String,
    val name: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class CreateGalleryRequest(
    val name: String,
    val description: String,
    val config: GalleryConfig
)

data class UpdateGalleryRequest(
    val name: String?,
    val description: String?,
    val config: GalleryConfig?,
    val status: String?
)

data class GalleryConfig(
    val threshold: Int = 80,
    @SerializedName("animationType")
    val animationType: String = "fade",
    val mood: String = "calm"
)

// ==================== Response Models ====================

data class AuthResponse(
    val user: UserData,
    val token: String,
    val message: String? = null
)

data class UserData(
    val id: String,
    val email: String,
    val name: String,
    @SerializedName("createdAt")
    val createdAt: String? = null
)

data class MessageResponse(
    val message: String
)

data class ErrorResponse(
    val error: String
)

data class GalleryResponse(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    val name: String,
    val description: String,
    val slug: String,
    val status: String,
    @SerializedName("image_count")
    val imageCount: Int,
    val config: GalleryConfig,
    @SerializedName("analysis_complete")
    val analysisComplete: Boolean,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String
)

data class GalleryDetailResponse(
    val id: String,
    @SerializedName("user_id")
    val userId: String,
    val name: String,
    val description: String,
    val slug: String,
    val status: String,
    @SerializedName("image_count")
    val imageCount: Int,
    val config: GalleryConfig,
    @SerializedName("analysis_complete")
    val analysisComplete: Boolean,
    val images: List<ImageData>,
    @SerializedName("created_at")
    val createdAt: String,
    @SerializedName("updated_at")
    val updatedAt: String
)

data class ImageData(
    val id: String,
    @SerializedName("gallery_id")
    val galleryId: String,
    val url: String,
    @SerializedName("thumbnail_url")
    val thumbnailUrl: String?,
    val metadata: ImageMetadata?,
    @SerializedName("order_index")
    val orderIndex: Int,
    @SerializedName("created_at")
    val createdAt: String
)

data class ImageMetadata(
    val width: Int,
    val height: Int,
    val size: Long,
    val format: String
)

data class UploadImagesResponse(
    @SerializedName("uploadedCount")
    val uploadedCount: Int,
    val images: List<ImageData>
)

data class AnalyzeResponse(
    @SerializedName("analysisComplete")
    val analysisComplete: Boolean,
    val config: GalleryConfig,
    val message: String
)

data class PublicGalleryResponse(
    val id: String,
    val name: String,
    val description: String,
    val owner: OwnerData,
    @SerializedName("image_count")
    val imageCount: Int,
    val images: List<ImageData>,
    val config: GalleryConfig,
    @SerializedName("publishedAt")
    val publishedAt: String? = null
)

data class OwnerData(
    val username: String,
    val name: String
)
