package com.cursorgallery.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.drag
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.cursorgallery.data.models.CropData
import kotlin.math.abs
import kotlin.math.min

@Composable
fun CropImageModal(
    imageUrl: String,
    initialCrop: CropData,
    onApply: (CropData) -> Unit,
    onCancel: () -> Unit
) {
    var cropRect by remember { mutableStateOf(initialCrop) }
    var imageSize by remember { mutableStateOf(IntSize.Zero) }
    var containerSize by remember { mutableStateOf(IntSize.Zero) }

    // Calculate actual rendered image bounds (accounting for ContentScale.Fit)
    val imageBounds = remember(imageSize, containerSize) {
        if (imageSize.width > 0 && imageSize.height > 0 &&
            containerSize.width > 0 && containerSize.height > 0
        ) {

            val imageAspect = imageSize.width.toFloat() / imageSize.height.toFloat()
            val containerAspect = containerSize.width.toFloat() / containerSize.height.toFloat()

            if (imageAspect > containerAspect) {
                // Image is wider - fits to width
                val renderedWidth = containerSize.width.toFloat()
                val renderedHeight = containerSize.width / imageAspect
                val offsetY = (containerSize.height - renderedHeight) / 2f
                ImageBounds(0f, offsetY, renderedWidth, renderedHeight)
            } else {
                // Image is taller - fits to height
                val renderedHeight = containerSize.height.toFloat()
                val renderedWidth = containerSize.height * imageAspect
                val offsetX = (containerSize.width - renderedWidth) / 2f
                ImageBounds(offsetX, 0f, renderedWidth, renderedHeight)
            }
        } else {
            ImageBounds(0f, 0f, 0f, 0f)
        }
    }

    Dialog(
        onDismissRequest = onCancel,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = true
        )
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .border(
                    width = 2.dp,
                    color = Color(0xFFa89c8e),
                    shape = RoundedCornerShape(16.dp)
                ),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xE6000000)
            )
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Crop,
                            contentDescription = null,
                            tint = Color(0xFFa89c8e),
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            "Crop Image",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )
                    }
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Image with crop overlay
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .background(Color.Black, RoundedCornerShape(8.dp))
                        .clip(RoundedCornerShape(8.dp))
                        .onGloballyPositioned { coordinates ->
                            containerSize = coordinates.size
                        }
                ) {
                    // Background image
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit,
                        onSuccess = { state ->
                            // Get actual image intrinsic size
                            imageSize = IntSize(
                                state.painter.intrinsicSize.width.toInt(),
                                state.painter.intrinsicSize.height.toInt()
                            )
                        }
                    )

                    // Crop overlay with handles
                    if (imageBounds.width > 0 && imageBounds.height > 0) {
                        CropOverlay(
                            cropRect = cropRect,
                            imageBounds = imageBounds,
                            onCropChange = { newCrop -> cropRect = newCrop }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Instructions
                Text(
                    "Drag corners to adjust. Drag inside to move.",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = Color(0xFFF0F0F0).copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Buttons Row - matching screenshot proportions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Cancel Button - transparent with border
                    Button(
                        onClick = onCancel,
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent
                        ),
                        border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "Cancel",
                            color = Color(0xFFF0F0F0),
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Apply Button - primary accent
                    Button(
                        onClick = { onApply(cropRect) },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFa89c8e)
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color(0xFF0a0a0a),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "Apply",
                            color = Color(0xFF0a0a0a),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

// Data class to hold actual rendered image bounds
data class ImageBounds(
    val offsetX: Float,
    val offsetY: Float,
    val width: Float,
    val height: Float
)

@Composable
fun CropOverlay(
    cropRect: CropData,
    imageBounds: ImageBounds,
    onCropChange: (CropData) -> Unit
) {
    var dragHandle by remember { mutableStateOf<String?>(null) }
    // Track the ACTUAL current crop state locally
    var currentCropState by remember { mutableStateOf(cropRect) }
    // Update local state when parent state changes
    LaunchedEffect(cropRect) {
        currentCropState = cropRect
    }
    var dragStartCrop by remember { mutableStateOf<CropData?>(null) }

    val handleRadius = 16.dp // Visual size of handle
    val touchRadius = 48.dp // Large touch area (Android minimum)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(imageBounds) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    val downPos = down.position

                    // Calculate crop bounds in pixels relative to ACTUAL IMAGE
                    val cropLeftPx =
                        imageBounds.offsetX + (currentCropState.x / 100f) * imageBounds.width
                    val cropTopPx =
                        imageBounds.offsetY + (currentCropState.y / 100f) * imageBounds.height
                    val cropWidthPx = (currentCropState.width / 100f) * imageBounds.width
                    val cropHeightPx = (currentCropState.height / 100f) * imageBounds.height
                    val cropRightPx = cropLeftPx + cropWidthPx
                    val cropBottomPx = cropTopPx + cropHeightPx

                    val touchRadiusPx = touchRadius.toPx()

                    // Detect which handle was touched - CORNERS ONLY (no edges)
                    dragHandle = when {
                        // Corner handles - use distance check (priority order)
                        (downPos - Offset(
                            cropLeftPx,
                            cropTopPx
                        )).getDistance() < touchRadiusPx -> "nw"

                        (downPos - Offset(
                            cropRightPx,
                            cropTopPx
                        )).getDistance() < touchRadiusPx -> "ne"

                        (downPos - Offset(
                            cropLeftPx,
                            cropBottomPx
                        )).getDistance() < touchRadiusPx -> "sw"

                        (downPos - Offset(
                            cropRightPx,
                            cropBottomPx
                        )).getDistance() < touchRadiusPx -> "se"

                        // Inside crop area - move entire box
                        downPos.x >= cropLeftPx && downPos.x <= cropRightPx &&
                                downPos.y >= cropTopPx && downPos.y <= cropBottomPx -> "move"

                        else -> null
                    }

                    if (dragHandle != null) {
                        // Capture CURRENT local state (not the parameter)
                        dragStartCrop = currentCropState.copy()

                        // Calculate FIXED anchors from the captured state
                        val initialAnchorRight = dragStartCrop!!.x + dragStartCrop!!.width
                        val initialAnchorBottom = dragStartCrop!!.y + dragStartCrop!!.height
                        val initialAnchorLeft = dragStartCrop!!.x
                        val initialAnchorTop = dragStartCrop!!.y

                        // Store the starting pointer position
                        val dragStartPos = downPos

                        drag(down.id) { change ->
                            change.consume()
                            val currentPos = change.position

                            // Calculate TOTAL delta from START position
                            val totalDeltaPx = currentPos - dragStartPos

                            // Convert total delta to percentage
                            val totalDeltaXPct = (totalDeltaPx.x / imageBounds.width) * 100f
                            val totalDeltaYPct = (totalDeltaPx.y / imageBounds.height) * 100f

                            val minSize = 10f

                            // Calculate new crop using dragStartCrop + TOTAL delta
                            val newCrop = when (dragHandle) {
                                "nw" -> {
                                    // Top-left corner: bottom-right stays FIXED at initialAnchorRight/Bottom
                                    val newX = (dragStartCrop!!.x + totalDeltaXPct).coerceIn(
                                        0f,
                                        initialAnchorRight - minSize
                                    )
                                    val newY = (dragStartCrop!!.y + totalDeltaYPct).coerceIn(
                                        0f,
                                        initialAnchorBottom - minSize
                                    )
                                    CropData(
                                        x = newX,
                                        y = newY,
                                        width = initialAnchorRight - newX,
                                        height = initialAnchorBottom - newY,
                                        unit = "%"
                                    )
                                }

                                "ne" -> {
                                    // Top-right corner: bottom-left stays FIXED at initialAnchorLeft/Bottom
                                    val newY = (dragStartCrop!!.y + totalDeltaYPct).coerceIn(
                                        0f,
                                        initialAnchorBottom - minSize
                                    )
                                    val newWidth =
                                        (dragStartCrop!!.width + totalDeltaXPct).coerceIn(
                                            minSize,
                                            100f - initialAnchorLeft
                                        )
                                    CropData(
                                        x = initialAnchorLeft,
                                        y = newY,
                                        width = newWidth,
                                        height = initialAnchorBottom - newY,
                                        unit = "%"
                                    )
                                }

                                "sw" -> {
                                    // Bottom-left corner: top-right stays FIXED at initialAnchorRight/Top
                                    val newX = (dragStartCrop!!.x + totalDeltaXPct).coerceIn(
                                        0f,
                                        initialAnchorRight - minSize
                                    )
                                    val newHeight =
                                        (dragStartCrop!!.height + totalDeltaYPct).coerceIn(
                                            minSize,
                                            100f - initialAnchorTop
                                        )
                                    CropData(
                                        x = newX,
                                        y = initialAnchorTop,
                                        width = initialAnchorRight - newX,
                                        height = newHeight,
                                        unit = "%"
                                    )
                                }

                                "se" -> {
                                    // Bottom-right corner: top-left stays FIXED at initialAnchorLeft/Top
                                    val newWidth =
                                        (dragStartCrop!!.width + totalDeltaXPct).coerceIn(
                                            minSize,
                                            100f - initialAnchorLeft
                                        )
                                    val newHeight =
                                        (dragStartCrop!!.height + totalDeltaYPct).coerceIn(
                                            minSize,
                                            100f - initialAnchorTop
                                        )
                                    CropData(
                                        x = initialAnchorLeft,
                                        y = initialAnchorTop,
                                        width = newWidth,
                                        height = newHeight,
                                        unit = "%"
                                    )
                                }

                                "move" -> {
                                    // Move entire crop area
                                    val newX = (dragStartCrop!!.x + totalDeltaXPct).coerceIn(
                                        0f,
                                        100f - dragStartCrop!!.width
                                    )
                                    val newY = (dragStartCrop!!.y + totalDeltaYPct).coerceIn(
                                        0f,
                                        100f - dragStartCrop!!.height
                                    )
                                    CropData(
                                        x = newX,
                                        y = newY,
                                        width = dragStartCrop!!.width,
                                        height = dragStartCrop!!.height,
                                        unit = "%"
                                    )
                                }

                                else -> currentCropState
                            }

                            // Update BOTH local state and notify parent
                            currentCropState = newCrop
                            onCropChange(newCrop)
                        }

                        dragHandle = null
                        dragStartCrop = null
                    }
                }
            }
    ) {
        // Dimmed overlay and handles drawn with Canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Calculate crop bounds relative to ACTUAL IMAGE
            val cropLeft = imageBounds.offsetX + (currentCropState.x / 100f) * imageBounds.width
            val cropTop = imageBounds.offsetY + (currentCropState.y / 100f) * imageBounds.height
            val cropWidth = (currentCropState.width / 100f) * imageBounds.width
            val cropHeight = (currentCropState.height / 100f) * imageBounds.height

            // Draw dimmed areas (black overlay outside crop) covering entire canvas
            // Top
            drawRect(
                color = Color.Black.copy(alpha = 0.5f),
                topLeft = Offset(0f, 0f),
                size = Size(size.width, cropTop)
            )
            // Bottom
            drawRect(
                color = Color.Black.copy(alpha = 0.5f),
                topLeft = Offset(0f, cropTop + cropHeight),
                size = Size(size.width, size.height - cropTop - cropHeight)
            )
            // Left
            drawRect(
                color = Color.Black.copy(alpha = 0.5f),
                topLeft = Offset(0f, cropTop),
                size = Size(cropLeft, cropHeight)
            )
            // Right
            drawRect(
                color = Color.Black.copy(alpha = 0.5f),
                topLeft = Offset(cropLeft + cropWidth, cropTop),
                size = Size(size.width - cropLeft - cropWidth, cropHeight)
            )

            // Draw crop border (white)
            drawRect(
                color = Color(0xFFa89c8e),
                topLeft = Offset(cropLeft, cropTop),
                size = Size(cropWidth, cropHeight),
                style = Stroke(width = 3.dp.toPx())
            )

            // Draw grid lines (rule of thirds)
            val gridColor = Color(0x80a89c8e) // rgba(168,156,142,0.5)
            // Vertical lines
            drawLine(
                color = gridColor,
                start = Offset(cropLeft + cropWidth / 3, cropTop),
                end = Offset(cropLeft + cropWidth / 3, cropTop + cropHeight),
                strokeWidth = 1f
            )
            drawLine(
                color = gridColor,
                start = Offset(cropLeft + 2 * cropWidth / 3, cropTop),
                end = Offset(cropLeft + 2 * cropWidth / 3, cropTop + cropHeight),
                strokeWidth = 1f
            )
            // Horizontal lines
            drawLine(
                color = gridColor,
                start = Offset(cropLeft, cropTop + cropHeight / 3),
                end = Offset(cropLeft + cropWidth, cropTop + cropHeight / 3),
                strokeWidth = 1f
            )
            drawLine(
                color = gridColor,
                start = Offset(cropLeft, cropTop + 2 * cropHeight / 3),
                end = Offset(cropLeft + cropWidth, cropTop + 2 * cropHeight / 3),
                strokeWidth = 1f
            )

            val handleRadiusPx = 16.dp.toPx()

            // Draw ONLY 4 corner handles as simple white circles with black border
            val corners = listOf(
                Offset(cropLeft, cropTop), // nw
                Offset(cropLeft + cropWidth, cropTop), // ne
                Offset(cropLeft, cropTop + cropHeight), // sw
                Offset(cropLeft + cropWidth, cropTop + cropHeight) // se
            )

            corners.forEach { center ->
                // White fill
                drawCircle(
                    color = Color(0xFFa89c8e), // #a89c8e
                    radius = handleRadiusPx,
                    center = center
                )
                // White border
                drawCircle(
                    color = Color.White,
                    radius = handleRadiusPx,
                    center = center,
                    style = Stroke(width = 2.dp.toPx())
                )
            }
        }
    }
}
