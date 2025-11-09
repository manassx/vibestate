package com.cursorgallery.ui.components

import android.graphics.Bitmap
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import coil.imageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
import com.cursorgallery.data.models.CropData
import com.cursorgallery.data.models.GalleryImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID
import kotlin.math.pow
import kotlin.math.sqrt

data class RevealedImage(
    val image: GalleryImage,
    val position: Offset,
    val id: String = UUID.randomUUID().toString(),
    val timestamp: Long = System.currentTimeMillis()
)

@Composable
fun TouchTrailCanvas(
    images: List<GalleryImage>,
    threshold: Int = 80,
    editMode: Boolean = false,
    onImageClick: ((String, String) -> Unit)? = null,
    modifier: Modifier = Modifier,
    temporaryScaleOverrides: Map<String, Float> = emptyMap(),
    temporaryCropOverrides: Map<String, CropData> = emptyMap(),
    selectedImageId: String? = null
) {
    var revealedImages by remember { mutableStateOf<List<RevealedImage>>(emptyList()) }
    var currentImageIndex by remember { mutableStateOf(0) }
    var lastRevealPoint by remember { mutableStateOf(Offset.Zero) }

    val loadedImages = remember { mutableStateMapOf<String, ImageBitmap>() }
    var isLoading by remember { mutableStateOf(true) }
    var loadProgress by remember { mutableStateOf(0f) }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Update revealed images when the images list changes (e.g., after saving transforms)
    // This ensures that revealed images always reference the latest GalleryImage data
    // while maintaining their original positions
    LaunchedEffect(images) {
        if (revealedImages.isNotEmpty()) {
            revealedImages = revealedImages.map { revealed ->
                // Find the updated image with same ID
                val updatedImage = images.find { it.id == revealed.image.id }
                if (updatedImage != null) {
                    // Keep the position, update the image reference
                    revealed.copy(image = updatedImage)
                } else {
                    revealed
                }
            }
        }
    }

    // Preload images
    LaunchedEffect(images) {
        if (images.isEmpty()) {
            isLoading = false
            return@LaunchedEffect
        }

        scope.launch {
            withContext(Dispatchers.IO) {
                images.forEachIndexed { index, image ->
                    try {
                        val request = ImageRequest.Builder(context)
                            .data(image.thumbnailUrl ?: image.url)
                            .allowHardware(false)
                            .build()

                        val result = context.imageLoader.execute(request)
                        if (result is SuccessResult) {
                            val bitmap =
                                (result.drawable as? android.graphics.drawable.BitmapDrawable)?.bitmap
                            bitmap?.let {
                                loadedImages[image.id] = it.asImageBitmap()
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }

                    withContext(Dispatchers.Main) {
                        loadProgress = (index + 1).toFloat() / images.size
                    }
                }
            }
            isLoading = false
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        if (isLoading) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(
                    progress = { loadProgress },
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Preparing Gallery...",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Bold
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "${(loadProgress * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        } else {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(threshold, images.size, editMode) {
                        detectDragGestures { change, _ ->
                            if (currentImageIndex >= images.size) {
                                currentImageIndex = 0
                            }

                            val currentPoint = change.position
                            val distance = sqrt(
                                (currentPoint.x - lastRevealPoint.x).pow(2) +
                                        (currentPoint.y - lastRevealPoint.y).pow(2)
                            )

                            if (distance >= threshold) {
                                // Offset position to appear above touch point (120px up)
                                val adjustedPosition = Offset(
                                    x = currentPoint.x,
                                    y = currentPoint.y - 120f
                                )

                                val newRevealed = RevealedImage(
                                    image = images[currentImageIndex],
                                    position = adjustedPosition
                                )

                                val maxImages = getMaxImages(threshold)
                                revealedImages = (revealedImages + newRevealed).takeLast(maxImages)

                                currentImageIndex = (currentImageIndex + 1) % images.size
                                lastRevealPoint = currentPoint
                            }
                        }
                    }
                    .then(
                        if (editMode && onImageClick != null) {
                            Modifier.pointerInput(Unit) {
                                detectTapGestures { tapOffset ->
                                    // ISSUE #2 FIX: Only allow topmost image to be selectable, taking into account any cropping and scaling.
                                    val tappedImage = revealedImages
                                        .asReversed()
                                        .firstOrNull { revealed ->
                                            val bitmap = loadedImages[revealed.image.id]
                                            if (bitmap != null) {
                                                val scaleOverride =
                                                    temporaryScaleOverrides[revealed.image.id]
                                                val effectiveScale = scaleOverride
                                                    ?: revealed.image.metadata?.transform?.scale
                                                    ?: 1.0f

                                                // Instant crop preview: If a crop is active for this image, use the cropping bounds for hit test
                                                val crop = temporaryCropOverrides[revealed.image.id]
                                                    ?: revealed.image.metadata?.transform?.crop?.let {
                                                        CropData(it.x, it.y, it.width, it.height)
                                                    }
                                                val maxSize = 300f
                                                val aspectRatio =
                                                    bitmap.width.toFloat() / bitmap.height.toFloat()
                                                val baseImageWidth =
                                                    if (aspectRatio > 1) maxSize else maxSize * aspectRatio
                                                val baseImageHeight =
                                                    if (aspectRatio > 1) maxSize / aspectRatio else maxSize

                                                val scaledWidth = baseImageWidth * effectiveScale
                                                val scaledHeight = baseImageHeight * effectiveScale

                                                // Compute the destination rectangle (same centering as drawRevealedImage)
                                                val centerX = revealed.position.x
                                                val centerY = revealed.position.y

                                                if (crop != null) {
                                                    val srcLeft =
                                                        (bitmap.width * crop.x / 100f).toInt()
                                                    val srcTop =
                                                        (bitmap.height * crop.y / 100f).toInt()
                                                    val srcWidth =
                                                        (bitmap.width * crop.width / 100f).toInt()
                                                    val srcHeight =
                                                        (bitmap.height * crop.height / 100f).toInt()
                                                    val croppedAspectRatio =
                                                        srcWidth.toFloat() / srcHeight.toFloat()

                                                    val dstWidth: Float
                                                    val dstHeight: Float
                                                    val dstOffsetX: Float
                                                    val dstOffsetY: Float

                                                    if (croppedAspectRatio > (baseImageWidth / baseImageHeight)) {
                                                        dstWidth = baseImageWidth * effectiveScale
                                                        dstHeight =
                                                            (baseImageWidth / croppedAspectRatio) * effectiveScale
                                                        dstOffsetX = centerX - dstWidth / 2
                                                        dstOffsetY = centerY - dstHeight / 2
                                                    } else {
                                                        dstHeight = baseImageHeight * effectiveScale
                                                        dstWidth =
                                                            (baseImageHeight * croppedAspectRatio) * effectiveScale
                                                        dstOffsetX = centerX - dstWidth / 2
                                                        dstOffsetY = centerY - dstHeight / 2
                                                    }

                                                    tapOffset.x >= dstOffsetX && tapOffset.x <= (dstOffsetX + dstWidth) &&
                                                            tapOffset.y >= dstOffsetY && tapOffset.y <= (dstOffsetY + dstHeight)
                                                } else {
                                                    // No crop: simple rect
                                                    val imageLeft = centerX - scaledWidth / 2
                                                    val imageTop = centerY - scaledHeight / 2
                                                    val imageRight = centerX + scaledWidth / 2
                                                    val imageBottom = centerY + scaledHeight / 2

                                                    tapOffset.x >= imageLeft && tapOffset.x <= imageRight &&
                                                            tapOffset.y >= imageTop && tapOffset.y <= imageBottom
                                                }
                                            } else {
                                                false
                                            }
                                        }

                                    // Only trigger click if topmost image was found at the tap location
                                    tappedImage?.let {
                                        onImageClick(it.image.url, it.image.id)
                                    }
                                }
                            }
                        } else Modifier
                    )
            ) {
                revealedImages.forEach { revealed ->
                    val bitmap = loadedImages[revealed.image.id]
                    if (bitmap != null) {
                        val scaleOverride = temporaryScaleOverrides[revealed.image.id]
                        val cropOverride = temporaryCropOverrides[revealed.image.id] ?: revealed.image.metadata?.transform?.crop?.let {
                            CropData(it.x, it.y, it.width, it.height)
                        }
                        drawRevealedImage(revealed, bitmap, scaleOverride, cropOverride, selectedImageId)
                    }
                }
            }
        }
    }
}

private fun getMaxImages(threshold: Int): Int {
    return when {
        threshold <= 20 -> 15
        threshold <= 40 -> 10
        threshold <= 80 -> 6
        threshold <= 140 -> 4
        else -> 3
    }
}

private fun DrawScope.drawRevealedImage(
    revealed: RevealedImage,
    bitmap: ImageBitmap,
    scaleOverride: Float? = null,
    cropOverride: CropData? = null,
    selectedImageId: String? = null
) {
    val transform = revealed.image.metadata?.transform

    // Calculate base image dimensions (before scaling)
    val maxSize = 300.dp.toPx()
    val aspectRatio = bitmap.width.toFloat() / bitmap.height.toFloat()
    val baseImageWidth = if (aspectRatio > 1) maxSize else maxSize * aspectRatio
    val baseImageHeight = if (aspectRatio > 1) maxSize / aspectRatio else maxSize

    val scale = scaleOverride ?: transform?.scale ?: 1.0f
    val rotation = transform?.rotation ?: 0f
    // ISSUE #4 FIX: Use cropOverride parameter for instant preview
    val crop = cropOverride

    // CRITICAL FIX: Move origin to reveal position, then scale from there
    // This matches CSS: translate(x, y) scale(s) with transform-origin: center
    translate(revealed.position.x, revealed.position.y) {
        // Scale from the current origin (which is now at reveal position)
        scale(scale, scale, pivot = Offset.Zero) {
            rotate(rotation) {
                // Draw image centered at current origin by offsetting by half the base size
                val drawLeft = -baseImageWidth / 2
                val drawTop = -baseImageHeight / 2

                if (crop != null) {
                    // CRITICAL FIX: Crop without stretching
                    // The cropped portion should be extracted and scaled to fill the base dimensions
                    val srcLeft = (bitmap.width * crop.x / 100f).toInt()
                    val srcTop = (bitmap.height * crop.y / 100f).toInt()
                    val srcWidth = (bitmap.width * crop.width / 100f).toInt()
                    val srcHeight = (bitmap.height * crop.height / 100f).toInt()

                    // Calculate the aspect ratio of the cropped region
                    val croppedAspectRatio = srcWidth.toFloat() / srcHeight.toFloat()
                    
                    // Calculate destination size that maintains the cropped aspect ratio
                    // while fitting within the base dimensions (similar to ContentScale.Fit)
                    val dstWidth: Float
                    val dstHeight: Float
                    val dstOffsetX: Float
                    val dstOffsetY: Float
                    
                    if (croppedAspectRatio > (baseImageWidth / baseImageHeight)) {
                        // Cropped region is wider - fit to width
                        dstWidth = baseImageWidth
                        dstHeight = baseImageWidth / croppedAspectRatio
                        dstOffsetX = drawLeft
                        dstOffsetY = drawTop + (baseImageHeight - dstHeight) / 2
                    } else {
                        // Cropped region is taller - fit to height
                        dstHeight = baseImageHeight
                        dstWidth = baseImageHeight * croppedAspectRatio
                        dstOffsetX = drawLeft + (baseImageWidth - dstWidth) / 2
                        dstOffsetY = drawTop
                    }

                    drawImage(
                        image = bitmap,
                        srcOffset = IntOffset(srcLeft, srcTop),
                        srcSize = IntSize(srcWidth, srcHeight),
                        dstOffset = IntOffset(dstOffsetX.toInt(), dstOffsetY.toInt()),
                        dstSize = IntSize(dstWidth.toInt(), dstHeight.toInt())
                    )
                } else {
                    drawImage(
                        image = bitmap,
                        dstOffset = IntOffset(drawLeft.toInt(), drawTop.toInt()),
                        dstSize = IntSize(baseImageWidth.toInt(), baseImageHeight.toInt())
                    )
                }

                // Draw selection border if selected
                if (selectedImageId != null && selectedImageId == revealed.image.id) {
                    drawRect(
                        color = Color(0xFFa89c8e).copy(alpha = 0.4f),
                        topLeft = Offset(drawLeft, drawTop),
                        size = Size(baseImageWidth, baseImageHeight),
                        style = Stroke(width = 2.dp.toPx())
                    )
                }
            }
        }
    }
}
