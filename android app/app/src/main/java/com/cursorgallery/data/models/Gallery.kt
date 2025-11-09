package com.cursorgallery.data.models

import com.google.gson.annotations.SerializedName

data class Gallery(
    @SerializedName("id") val id: String,
    @SerializedName("user_id") val userId: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String?,
    @SerializedName("slug") val slug: String,
    @SerializedName("status") val status: String, // draft, processing, published
    @SerializedName("image_count") val imageCount: Int,
    @SerializedName("config") val config: GalleryConfig?,
    @SerializedName("analysis_complete") val analysisComplete: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    @SerializedName("images") val images: List<GalleryImage>? = null
)

data class GalleryConfig(
    @SerializedName("threshold") val threshold: Int = 80,
    @SerializedName("animationType") val animationType: String = "fade",
    @SerializedName("mood") val mood: String = "calm",
    @SerializedName("branding") val branding: Branding? = null
)

data class Branding(
    @SerializedName("customName") val customName: String? = null,
    @SerializedName("customNameLink") val customNameLink: String? = null,
    @SerializedName("customEmail") val customEmail: String? = null
)

data class GalleryImage(
    @SerializedName("id") val id: String,
    @SerializedName("gallery_id") val galleryId: String,
    @SerializedName("url") val url: String,
    @SerializedName("thumbnail_url") val thumbnailUrl: String?,
    @SerializedName("metadata") val metadata: ImageMetadata?,
    @SerializedName("order_index") val orderIndex: Int,
    @SerializedName("created_at") val createdAt: String
)

data class ImageMetadata(
    @SerializedName("width") val width: Int,
    @SerializedName("height") val height: Int,
    @SerializedName("size") val size: Long,
    @SerializedName("format") val format: String?,
    @SerializedName("transform") val transform: ImageTransform? = null
)

data class ImageTransform(
    @SerializedName("crop") val crop: CropData? = null,
    @SerializedName("scale") val scale: Float = 1.0f,
    @SerializedName("rotation") val rotation: Float = 0f
)

data class CropData(
    @SerializedName("x") val x: Float,
    @SerializedName("y") val y: Float,
    @SerializedName("width") val width: Float,
    @SerializedName("height") val height: Float,
    @SerializedName("unit") val unit: String = "px" // px or %
)

data class CreateGalleryRequest(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String?,
    @SerializedName("config") val config: GalleryConfig?
)

data class UpdateGalleryRequest(
    @SerializedName("name") val name: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("config") val config: GalleryConfig? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("orderedImageIds") val orderedImageIds: List<String>? = null
)

data class UploadResponse(
    @SerializedName("uploadedCount") val uploadedCount: Int,
    @SerializedName("images") val images: List<GalleryImage>
)
