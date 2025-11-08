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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
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
    modifier: Modifier = Modifier
) {
    var revealedImages by remember { mutableStateOf<List<RevealedImage>>(emptyList()) }
    var currentImageIndex by remember { mutableStateOf(0) }
    var lastRevealPoint by remember { mutableStateOf(Offset.Zero) }

    val loadedImages = remember { mutableStateMapOf<String, ImageBitmap>() }
    var isLoading by remember { mutableStateOf(true) }
    var loadProgress by remember { mutableStateOf(0f) }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

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
                                val newRevealed = RevealedImage(
                                    image = images[currentImageIndex],
                                    position = currentPoint
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
                                    val tappedImage = revealedImages
                                        .reversed()
                                        .firstOrNull { revealed ->
                                            val distance = sqrt(
                                                (tapOffset.x - revealed.position.x).pow(2) +
                                                        (tapOffset.y - revealed.position.y).pow(2)
                                            )
                                            distance <= 150f
                                        }

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
                        drawRevealedImage(revealed, bitmap)
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
    bitmap: ImageBitmap
) {
    val transform = revealed.image.metadata?.transform

    val maxSize = 300.dp.toPx()
    val aspectRatio = bitmap.width.toFloat() / bitmap.height.toFloat()
    val imageWidth = if (aspectRatio > 1) maxSize else maxSize * aspectRatio
    val imageHeight = if (aspectRatio > 1) maxSize / aspectRatio else maxSize

    val scale = transform?.scale ?: 1.0f
    val rotation = transform?.rotation ?: 0f
    val crop = transform?.crop

    translate(revealed.position.x, revealed.position.y) {
        rotate(rotation) {
            scale(scale, scale) {
                if (crop != null) {
                    val srcLeft = (bitmap.width * crop.x / 100f).toInt()
                    val srcTop = (bitmap.height * crop.y / 100f).toInt()
                    val srcWidth = (bitmap.width * crop.width / 100f).toInt()
                    val srcHeight = (bitmap.height * crop.height / 100f).toInt()

                    drawImage(
                        image = bitmap,
                        srcOffset = IntOffset(srcLeft, srcTop),
                        srcSize = IntSize(srcWidth, srcHeight),
                        dstOffset = IntOffset(
                            (-imageWidth / 2).toInt(),
                            (-imageHeight / 2).toInt()
                        ),
                        dstSize = IntSize(imageWidth.toInt(), imageHeight.toInt())
                    )
                } else {
                    drawImage(
                        image = bitmap,
                        dstOffset = IntOffset(
                            (-imageWidth / 2).toInt(),
                            (-imageHeight / 2).toInt()
                        ),
                        dstSize = IntSize(imageWidth.toInt(), imageHeight.toInt())
                    )
                }
            }
        }
    }
}
