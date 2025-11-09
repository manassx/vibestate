package com.cursorgallery.ui.screens.portfolio

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.CropData
import com.cursorgallery.ui.components.ImageEditBottomSheet
import com.cursorgallery.ui.components.TouchTrailCanvas
import com.cursorgallery.viewmodel.GalleryEditorViewModel
import com.cursorgallery.viewmodel.GalleryEditorViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GalleryEditorScreen(
    tokenManager: TokenManager,
    galleryId: String,
    onNavigateBack: () -> Unit,
    onNavigateToViewer: ((String) -> Unit)? = null,
    viewModel: GalleryEditorViewModel = viewModel(
        factory = GalleryEditorViewModelFactory(tokenManager, galleryId)
    )
) {
    val uiState by viewModel.uiState.collectAsState()
    var currentThreshold by remember { mutableStateOf(80) }
    var selectedImageId by remember { mutableStateOf<String?>(null) }
    var showEditSheet by remember { mutableStateOf(false) }
    var temporaryScaleOverrides by remember { mutableStateOf<Map<String, Float>>(emptyMap()) }
    var temporaryCropOverrides by remember { mutableStateOf<Map<String, CropData>>(emptyMap()) }
    var hasPendingChanges by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }

    LaunchedEffect(uiState.gallery?.config?.threshold) {
        currentThreshold = uiState.gallery?.config?.threshold ?: 80
    }

    // Show bottom sheet when image is selected
    LaunchedEffect(selectedImageId) {
        showEditSheet = selectedImageId != null
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
    ) {
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            uiState.error != null -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            "Error loading portfolio",
                            style = MaterialTheme.typography.headlineSmall
                        )
                        Text(
                            uiState.error ?: "Unknown error",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                        Button(onClick = { viewModel.loadGallery() }) {
                            Text("RETRY")
                        }
                    }
                }
            }

            uiState.gallery != null && !uiState.gallery!!.images.isNullOrEmpty() -> {
                // Touch trail canvas - fills entire screen
                TouchTrailCanvas(
                    images = uiState.gallery!!.images!!,
                    threshold = currentThreshold,
                    editMode = true,
                    onImageClick = { _, imageId ->
                        selectedImageId = imageId
                    },
                    temporaryScaleOverrides = temporaryScaleOverrides,
                    temporaryCropOverrides = temporaryCropOverrides,
                    selectedImageId = selectedImageId,
                    modifier = Modifier.fillMaxSize()
                )

                // Top bar controls with proper status bar padding
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // EXIT button (left side)
                    Button(
                        onClick = onNavigateBack,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            contentColor = Color.White
                        ),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("EXIT", fontWeight = FontWeight.Bold)
                    }

                    // SAVE and VIEW buttons (right side)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // SAVE button - only show when there are pending changes
                        if (hasPendingChanges) {
                            Button(
                                onClick = {
                                    // All changes are already saved via updateImageTransform in onSave
                                    // This just resets the pending flag to hide the button
                                    hasPendingChanges = false
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFFa89c8e),
                                    contentColor = Color(0xFF0a0a0a)
                                ),
                                contentPadding = PaddingValues(
                                    horizontal = 24.dp,
                                    vertical = 14.dp
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("SAVE", fontWeight = FontWeight.Bold)
                            }
                        }

                        // VIEW button
                        Button(
                            onClick = { onNavigateToViewer?.invoke(galleryId) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF000000),
                                contentColor = Color(0xFFF0F0F0)
                            ),
                            border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.OpenInNew,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("VIEW", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Threshold control (bottom center) with proper navigation bar padding
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(16.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF1A1A1A)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Threshold:",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )

                        IconButton(
                            onClick = {
                                val newThreshold = when {
                                    currentThreshold > 140 -> 140
                                    currentThreshold > 80 -> 80
                                    currentThreshold > 40 -> 40
                                    else -> 20
                                }
                                currentThreshold = newThreshold
                                viewModel.updateThreshold(newThreshold)
                                // Threshold is auto-saved, no need for save button
                            }
                        ) {
                            Icon(Icons.Default.Remove, "Decrease", tint = Color.White)
                        }

                        Text(
                            "${currentThreshold}px",
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )

                        IconButton(
                            onClick = {
                                val newThreshold = when {
                                    currentThreshold < 40 -> 40
                                    currentThreshold < 80 -> 80
                                    currentThreshold < 140 -> 140
                                    else -> 200
                                }
                                currentThreshold = newThreshold
                                viewModel.updateThreshold(newThreshold)
                                // Threshold is auto-saved, no need for save button
                            }
                        ) {
                            Icon(Icons.Default.Add, "Increase", tint = Color.White)
                        }
                    }
                }

                // Image edit bottom sheet - floats over canvas
                if (showEditSheet && selectedImageId != null) {
                    val selectedImage =
                        uiState.gallery!!.images!!.find { it.id == selectedImageId }
                    if (selectedImage != null) {
                        ImageEditBottomSheet(
                            image = selectedImage,
                            onDismiss = {
                                selectedImageId = null
                                showEditSheet = false
                                // Clear temporary overrides for this image when dismissed
                                temporaryScaleOverrides = temporaryScaleOverrides - selectedImage.id
                                temporaryCropOverrides = temporaryCropOverrides - selectedImage.id
                            },
                            onSave = { imageId, transform ->
                                // Save to backend immediately, keep pending flag true
                                viewModel.updateImageTransform(imageId, transform)
                                selectedImageId = null
                                showEditSheet = false
                                // Clear temporary overrides for this image when saved
                                temporaryScaleOverrides = temporaryScaleOverrides - imageId
                                temporaryCropOverrides = temporaryCropOverrides - imageId
                                // Keep hasPendingChanges true - don't reset it here
                                // User will click the top save button to confirm all changes
                                hasPendingChanges = true
                            },
                            onScaleChange = { newScale ->
                                // Update temporary scale override for real-time preview
                                temporaryScaleOverrides =
                                    temporaryScaleOverrides + (selectedImage.id to newScale)
                            },
                            onCropChange = { newCrop ->
                                // Update temporary crop override for real-time preview
                                temporaryCropOverrides =
                                    temporaryCropOverrides + (selectedImage.id to newCrop)
                            }
                        )
                    }
                }
            }
        }
    }
}
