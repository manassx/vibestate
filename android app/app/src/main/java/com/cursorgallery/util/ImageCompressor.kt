package com.cursorgallery.util

import android.content.Context
import android.net.Uri
import id.zelory.compressor.Compressor
import id.zelory.compressor.constraint.quality
import id.zelory.compressor.constraint.resolution
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class ImageCompressor(private val context: Context) {

    suspend fun compressImage(uri: Uri): File? = withContext(Dispatchers.IO) {
        try {
            // Copy URI to temp file first
            val inputStream = context.contentResolver.openInputStream(uri)
            val tempFile = File(context.cacheDir, "temp_${System.currentTimeMillis()}.jpg")
            tempFile.outputStream().use { outputStream ->
                inputStream?.copyTo(outputStream)
            }

            // Compress the image with high quality and reasonable resolution
            val compressedFile = Compressor.compress(context, tempFile) {
                quality(95) // 95% quality - maintains near-original quality
                resolution(4096, 4096) // Higher resolution limit - preserves detail for large images
            }

            // Delete temp file
            tempFile.delete()

            compressedFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun compressImages(uris: List<Uri>, onProgress: (Float) -> Unit = {}): List<File> =
        withContext(Dispatchers.IO) {
            val compressed = mutableListOf<File>()
            uris.forEachIndexed { index, uri ->
                compressImage(uri)?.let { compressed.add(it) }
                onProgress((index + 1).toFloat() / uris.size)
            }
            compressed
        }
}
