package com.runanywhere.startup_hackathon20.data.repository

import android.content.Context
import android.net.Uri
import com.runanywhere.startup_hackathon20.data.local.AppPreferences
import com.runanywhere.startup_hackathon20.data.local.GalleryDao
import com.runanywhere.startup_hackathon20.data.local.entities.Gallery
import com.runanywhere.startup_hackathon20.data.local.entities.GalleryImage
import com.runanywhere.startup_hackathon20.data.local.entities.GalleryWithImages
import com.runanywhere.startup_hackathon20.data.remote.NetworkRepository
import com.runanywhere.startup_hackathon20.data.remote.models.GalleryConfig
import kotlinx.coroutines.flow.Flow
import java.io.File
import java.io.FileOutputStream

class GalleryRepository(
    private val galleryDao: GalleryDao,
    private val context: Context
) {
    
    private val networkRepository = NetworkRepository(context)
    private val prefs = AppPreferences(context)

    // ==================== Local Gallery Operations ====================
    
    fun getAllGalleries(): Flow<List<Gallery>> {
        return galleryDao.getAllGalleries()
    }

    fun getAllGalleriesWithImages(): Flow<List<GalleryWithImages>> {
        return galleryDao.getAllGalleriesWithImages()
    }

    suspend fun getGalleryById(id: Long): Gallery? {
        return galleryDao.getGalleryById(id)
    }

    suspend fun getGalleryWithImages(id: Long): GalleryWithImages? {
        return galleryDao.getGalleryWithImages(id)
    }

    private fun copyImageToInternalStorage(uri: Uri, galleryId: Long, index: Int): String? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null

            // Create gallery directory
            val galleryDir = File(context.filesDir, "galleries/$galleryId")
            if (!galleryDir.exists()) {
                galleryDir.mkdirs()
            }

            // Create unique filename
            val fileName = "image_${System.currentTimeMillis()}_$index.jpg"
            val outputFile = File(galleryDir, fileName)

            // Copy file
            FileOutputStream(outputFile).use { outputStream ->
                inputStream.copyTo(outputStream)
            }
            inputStream.close()

            outputFile.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun createGallery(name: String, description: String, imageUris: List<String>): Long {
        val gallery = Gallery(
            name = name,
            description = description,
            imageCount = imageUris.size
        )
        val galleryId = galleryDao.insertGallery(gallery)

        // Copy images to internal storage
        val images = imageUris.mapIndexedNotNull { index, uriString ->
            val uri = Uri.parse(uriString)
            val savedPath = copyImageToInternalStorage(uri, galleryId, index)

            savedPath?.let {
                GalleryImage(
                    galleryId = galleryId,
                    imagePath = it,
                    order = index
                )
            }
        }

        if (images.isNotEmpty()) {
            galleryDao.insertImages(images)
        }

        return galleryId
    }

    suspend fun updateGallery(gallery: Gallery) {
        galleryDao.updateGallery(gallery)
    }

    suspend fun deleteGallery(gallery: Gallery) {
        // Delete cloud gallery if it has cloudId
        if (!gallery.cloudId.isNullOrEmpty()) {
            try {
                networkRepository.deleteGallery(gallery.cloudId)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        // Delete gallery images from storage
        val galleryDir = File(context.filesDir, "galleries/${gallery.id}")
        if (galleryDir.exists()) {
            galleryDir.deleteRecursively()
        }

        galleryDao.deleteGallery(gallery)
    }

    suspend fun addImagesToGallery(galleryId: Long, imageUris: List<String>) {
        val currentImages = galleryDao.getImagesForGallery(galleryId)
        val startOrder = currentImages.maxOfOrNull { it.order }?.plus(1) ?: 0

        val newImages = imageUris.mapIndexedNotNull { index, uriString ->
            val uri = Uri.parse(uriString)
            val savedPath = copyImageToInternalStorage(uri, galleryId, startOrder + index)

            savedPath?.let {
                GalleryImage(
                    galleryId = galleryId,
                    imagePath = it,
                    order = startOrder + index
                )
            }
        }

        if (newImages.isNotEmpty()) {
            galleryDao.insertImages(newImages)
        }

        // Update image count
        val updatedCount = galleryDao.getImageCount(galleryId)
        val gallery = galleryDao.getGalleryById(galleryId)
        gallery?.let {
            galleryDao.updateGallery(it.copy(imageCount = updatedCount))
        }
    }

    suspend fun deleteImage(image: GalleryImage) {
        // Delete image file
        val file = File(image.imagePath)
        if (file.exists()) {
            file.delete()
        }

        galleryDao.deleteImage(image)

        // Update image count
        val gallery = galleryDao.getGalleryById(image.galleryId)
        gallery?.let {
            val updatedCount = galleryDao.getImageCount(image.galleryId)
            galleryDao.updateGallery(it.copy(imageCount = updatedCount))
        }
    }
    
    // ==================== Cloud Sync Operations ====================
    
    /**
     * Sync gallery to cloud - creates on backend and uploads images
     */
    suspend fun syncGalleryToCloud(
        galleryId: Long,
        onProgress: ((String, Int) -> Unit)? = null
    ): Result<String> {
        return try {
            val galleryWithImages = getGalleryWithImages(galleryId)
                ?: return Result.failure(Exception("Gallery not found"))
            
            onProgress?.invoke("Creating gallery on cloud...", 10)
            
            // Create gallery on backend
            val config = GalleryConfig(
                threshold = galleryWithImages.gallery.threshold,
                animationType = "fade",
                mood = "calm"
            )
            
            val createResult = networkRepository.createGallery(
                name = galleryWithImages.gallery.name,
                description = galleryWithImages.gallery.description,
                config = config
            )
            
            if (createResult.isFailure) {
                return Result.failure(createResult.exceptionOrNull() ?: Exception("Failed to create gallery"))
            }
            
            val cloudGallery = createResult.getOrThrow()
            val cloudId = cloudGallery.id
            
            // Update local gallery with cloud ID
            val updatedGallery = galleryWithImages.gallery.copy(
                cloudId = cloudId,
                syncStatus = "syncing"
            )
            updateGallery(updatedGallery)
            
            onProgress?.invoke("Uploading images...", 30)
            
            // Upload images
            val imageUris = galleryWithImages.images.map { Uri.parse("file://${it.imagePath}") }
            
            val uploadResult = networkRepository.uploadImages(
                galleryId = cloudId,
                imageUris = imageUris,
                onProgress = { progress ->
                    // Scale progress from 30 to 90
                    val scaledProgress = 30 + (progress * 60 / 100)
                    onProgress?.invoke("Uploading images...", scaledProgress)
                }
            )
            
            if (uploadResult.isFailure) {
                return Result.failure(uploadResult.exceptionOrNull() ?: Exception("Failed to upload images"))
            }
            
            onProgress?.invoke("Publishing gallery...", 95)
            
            // Publish gallery
            networkRepository.publishGallery(cloudId)
            
            // Update local gallery status
            val finalGallery = updatedGallery.copy(
                syncStatus = "synced",
                isPublished = true
            )
            updateGallery(finalGallery)
            
            onProgress?.invoke("Sync complete!", 100)
            
            Result.success(cloudId)
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure(e)
        }
    }
    
    /**
     * Fetch galleries from cloud and cache locally
     */
    suspend fun fetchGalleriesFromCloud(): Result<Unit> {
        return try {
            val result = networkRepository.getGalleries()
            
            if (result.isSuccess) {
                val cloudGalleries = result.getOrThrow()
                
                // TODO: Implement cloud gallery caching if needed
                // For now, galleries are created locally first then synced to cloud
                
                Result.success(Unit)
            } else {
                Result.failure(result.exceptionOrNull() ?: Exception("Failed to fetch galleries"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
