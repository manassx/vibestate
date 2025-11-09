package com.cursorgallery.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cursorgallery.data.models.CropData
import com.cursorgallery.data.models.GalleryImage
import com.cursorgallery.data.models.ImageTransform

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageEditBottomSheet(
    image: GalleryImage,
    onDismiss: () -> Unit,
    onSave: (String, ImageTransform) -> Unit,
    onScaleChange: ((Float) -> Unit)? = null,
    onCropChange: ((CropData) -> Unit)? = null
) {
    // Store as INTEGER percentage to avoid floating point rounding errors
    var currentScalePercent by remember {
        mutableStateOf(((image.metadata?.transform?.scale ?: 1.0f) * 100).toInt())
    }

    // Convert to float when needed
    val currentScale = currentScalePercent / 100f

    var currentCrop by remember {
        mutableStateOf(
            image.metadata?.transform?.crop ?: CropData(
                x = 0f,
                y = 0f,
                width = 100f,
                height = 100f,
                unit = "%"
            )
        )
    }
    var showCropModal by remember { mutableStateOf(false) }

    // Track if there are local changes relative to the initial image state
    val hasLocalChanges = remember(currentScale, currentCrop, image) {
        val initialScale = image.metadata?.transform?.scale ?: 1.0f
        val initialCrop = image.metadata?.transform?.crop ?: CropData(0f, 0f, 100f, 100f, "%")
        currentScale != initialScale || currentCrop != initialCrop
    }

    // Notify parent of scale changes in real-time
    LaunchedEffect(currentScale) {
        onScaleChange?.invoke(currentScale)
    }

    // Notify parent of crop changes in real-time
    LaunchedEffect(currentCrop) {
        onCropChange?.invoke(currentCrop)
    }

    // ISSUE #3 FIX: Redesigned to match web - solid background, accent buttons
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color.Transparent,  // Transparent container
        scrimColor = Color.Transparent,  // No overlay
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
        dragHandle = null,
        modifier = Modifier.navigationBarsPadding()
    ) {
        // Floating card with border matching web design
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .shadow(
                    elevation = 8.dp,
                    shape = RoundedCornerShape(12.dp),
                    clip = false
                )
                .border(
                    width = 2.dp,
                    color = Color(0xFFa89c8e),  // Primary accent
                    shape = RoundedCornerShape(12.dp)
                ),
            shape = RoundedCornerShape(12.dp),
            color = Color(0xE6000000),  // rgba(0,0,0,0.9)
            tonalElevation = 0.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Title - centered as in web version
                Text(
                    "Edit Image",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 20.sp
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Scale Control Label
                Text(
                    "Scale",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Color(0xFFF0F0F0),  // Light text
                        fontSize = 14.sp
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Scale Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Zoom Out Button - black background with border
                    IconButton(
                        onClick = {
                            currentScalePercent = (currentScalePercent - 10).coerceAtLeast(50)
                        },
                        enabled = currentScalePercent > 50,
                        modifier = Modifier
                            .size(48.dp)
                            .background(
                                color = Color(0xFF000000),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .border(
                                width = 1.dp,
                                color = Color(0x33FFFFFF),
                                shape = RoundedCornerShape(8.dp)
                            )
                    ) {
                        Icon(
                            Icons.Default.ZoomOut,
                            contentDescription = "Zoom out",
                            tint = if (currentScalePercent > 50) Color.White else Color.White.copy(
                                alpha = 0.5f
                            ),
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Scale Percentage
                    Text(
                        "$currentScalePercent%",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 24.sp
                        )
                    )

                    // Zoom In Button - black background with border
                    IconButton(
                        onClick = {
                            currentScalePercent = (currentScalePercent + 10).coerceAtMost(200)
                        },
                        enabled = currentScalePercent < 200,
                        modifier = Modifier
                            .size(48.dp)
                            .background(
                                color = Color(0xFF000000),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .border(
                                width = 1.dp,
                                color = Color(0x33FFFFFF),
                                shape = RoundedCornerShape(8.dp)
                            )
                    ) {
                        Icon(
                            Icons.Default.ZoomIn,
                            contentDescription = "Zoom in",
                            tint = if (currentScalePercent < 200) Color.White else Color.White.copy(
                                alpha = 0.5f
                            ),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action Buttons Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // CROP Button - black background with border
                    Button(
                        onClick = { showCropModal = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF000000),
                            contentColor = Color(0xFFF0F0F0)
                        ),
                        border = BorderStroke(1.dp, Color(0x33FFFFFF))
                    ) {
                        Icon(
                            Icons.Default.Crop,
                            contentDescription = null,
                            tint = Color.White,  // White icon
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CROP", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    // DONE Button - always primary accent
                    Button(
                        onClick = {
                            onSave(
                                image.id,
                                ImageTransform(
                                    crop = currentCrop,
                                    scale = currentScale,
                                    rotation = 0f
                                )
                            )
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFa89c8e)  // Always primary accent
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color(0xFF0a0a0a),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "DONE",
                            color = Color(0xFF0a0a0a),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }

    // Crop Modal
    if (showCropModal) {
        CropImageModal(
            imageUrl = image.url,
            initialCrop = currentCrop,
            onApply = { newCrop ->
                currentCrop = newCrop
                showCropModal = false
                // ISSUE #4 FIX: Immediately notify parent of crop change for instant preview
                onCropChange?.invoke(newCrop)
            },
            onCancel = { showCropModal = false }
        )
    }
}
