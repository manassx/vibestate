package com.cursorgallery.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.cursorgallery.data.models.CropData
import com.cursorgallery.data.models.GalleryImage
import com.cursorgallery.data.models.ImageTransform

@Composable
fun ImageEditorModal(
    image: GalleryImage,
    onDismiss: () -> Unit,
    onSave: (String, ImageTransform) -> Unit
) {
    var currentScale by remember {
        mutableStateOf(image.metadata?.transform?.scale ?: 1.0f)
    }
    var currentRotation by remember {
        mutableStateOf(image.metadata?.transform?.rotation ?: 0f)
    }
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
    var showCropTool by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.95f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Close", tint = Color.White)
                    }

                    Text(
                        "Edit Image",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )

                    TextButton(
                        onClick = {
                            onSave(
                                image.id,
                                ImageTransform(
                                    crop = currentCrop,
                                    scale = currentScale,
                                    rotation = currentRotation
                                )
                            )
                        }
                    ) {
                        Icon(Icons.Default.Check, "Save", tint = Color.White)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("SAVE", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Image preview
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = image.url,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Controls
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Scale control
                        Column {
                            Text(
                                "SCALE",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(
                                    onClick = {
                                        currentScale = (currentScale - 0.1f).coerceIn(0.5f, 3.0f)
                                    },
                                    enabled = currentScale > 0.5f
                                ) {
                                    Icon(Icons.Default.Remove, "Decrease scale")
                                }

                                Text(
                                    "${(currentScale * 100).toInt()}%",
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        fontWeight = FontWeight.Bold
                                    )
                                )

                                IconButton(
                                    onClick = {
                                        currentScale = (currentScale + 0.1f).coerceIn(0.5f, 3.0f)
                                    },
                                    enabled = currentScale < 3.0f
                                ) {
                                    Icon(Icons.Default.Add, "Increase scale")
                                }
                            }
                        }

                        HorizontalDivider()

                        // Rotation control
                        Column {
                            Text(
                                "ROTATION",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        currentRotation = (currentRotation - 90f) % 360f
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        Icons.Default.RotateLeft,
                                        "Rotate left",
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("90° LEFT")
                                }

                                OutlinedButton(
                                    onClick = {
                                        currentRotation = (currentRotation + 90f) % 360f
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        Icons.Default.RotateRight,
                                        "Rotate right",
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("90° RIGHT")
                                }
                            }
                        }

                        HorizontalDivider()

                        // Crop button
                        FilledTonalButton(
                            onClick = { showCropTool = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Crop, "Crop")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("CROP IMAGE")
                        }
                    }
                }
            }

            // Crop tool overlay
            if (showCropTool) {
                CropToolOverlay(
                    crop = currentCrop,
                    onCropChange = { currentCrop = it },
                    onDismiss = { showCropTool = false }
                )
            }
        }
    }
}

@Composable
fun CropToolOverlay(
    crop: CropData,
    onCropChange: (CropData) -> Unit,
    onDismiss: () -> Unit
) {
    var tempCrop by remember { mutableStateOf(crop) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.9f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onDismiss) {
                    Text("Cancel", color = Color.White)
                }

                Text(
                    "Adjust Crop",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )

                TextButton(
                    onClick = {
                        onCropChange(tempCrop)
                        onDismiss()
                    }
                ) {
                    Text("Apply", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Crop adjustment controls
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        "Drag the sliders to adjust crop area",
                        style = MaterialTheme.typography.bodySmall
                    )

                    // X position
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("X:", modifier = Modifier.width(40.dp))
                        Slider(
                            value = tempCrop.x,
                            onValueChange = { tempCrop = tempCrop.copy(x = it) },
                            valueRange = 0f..100f,
                            modifier = Modifier.weight(1f)
                        )
                        Text("${tempCrop.x.toInt()}%", modifier = Modifier.width(50.dp))
                    }

                    // Y position
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Y:", modifier = Modifier.width(40.dp))
                        Slider(
                            value = tempCrop.y,
                            onValueChange = { tempCrop = tempCrop.copy(y = it) },
                            valueRange = 0f..100f,
                            modifier = Modifier.weight(1f)
                        )
                        Text("${tempCrop.y.toInt()}%", modifier = Modifier.width(50.dp))
                    }

                    // Width
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Width:", modifier = Modifier.width(40.dp))
                        Slider(
                            value = tempCrop.width,
                            onValueChange = { tempCrop = tempCrop.copy(width = it) },
                            valueRange = 10f..100f,
                            modifier = Modifier.weight(1f)
                        )
                        Text("${tempCrop.width.toInt()}%", modifier = Modifier.width(50.dp))
                    }

                    // Height
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Height:", modifier = Modifier.width(40.dp))
                        Slider(
                            value = tempCrop.height,
                            onValueChange = { tempCrop = tempCrop.copy(height = it) },
                            valueRange = 10f..100f,
                            modifier = Modifier.weight(1f)
                        )
                        Text("${tempCrop.height.toInt()}%", modifier = Modifier.width(50.dp))
                    }

                    // Reset button
                    OutlinedButton(
                        onClick = {
                            tempCrop = CropData(0f, 0f, 100f, 100f, "%")
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("RESET TO FULL IMAGE")
                    }
                }
            }
        }
    }
}
