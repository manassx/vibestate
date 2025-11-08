package com.cursorgallery.ui.screens.portfolio

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.ui.components.ImageEditorModal
import com.cursorgallery.ui.components.TouchTrailCanvas
import com.cursorgallery.viewmodel.GalleryEditorViewModel
import com.cursorgallery.viewmodel.GalleryEditorViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GalleryEditorScreen(
    tokenManager: TokenManager,
    galleryId: String,
    onNavigateBack: () -> Unit,
    viewModel: GalleryEditorViewModel = viewModel(
        factory = GalleryEditorViewModelFactory(tokenManager, galleryId)
    )
) {
    val uiState by viewModel.uiState.collectAsState()
    var currentThreshold by remember { mutableStateOf(80) }
    var selectedImageId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }

    LaunchedEffect(uiState.gallery?.config?.threshold) {
        currentThreshold = uiState.gallery?.config?.threshold ?: 80
    }

    Box(modifier = Modifier.fillMaxSize()) {
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
                // Touch trail canvas
                TouchTrailCanvas(
                    images = uiState.gallery!!.images!!,
                    threshold = currentThreshold,
                    editMode = true,
                    onImageClick = { _, imageId ->
                        selectedImageId = imageId
                    }
                )

                // Top bar controls
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter),
                    color = MaterialTheme.colorScheme.background.copy(alpha = 0.9f)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }

                        Text(
                            uiState.gallery!!.name,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold
                            )
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (uiState.gallery!!.status != "published") {
                                FilledTonalButton(onClick = { viewModel.publishGallery() }) {
                                    Text("PUBLISH")
                                }
                            }
                        }
                    }
                }

                // Threshold control (bottom center)
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Threshold:",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold
                            )
                        )

                        IconButton(
                            onClick = {
                                currentThreshold = when {
                                    currentThreshold > 140 -> 140
                                    currentThreshold > 80 -> 80
                                    currentThreshold > 40 -> 40
                                    else -> 20
                                }
                                viewModel.updateThreshold(currentThreshold)
                            }
                        ) {
                            Icon(Icons.Default.Remove, "Decrease")
                        }

                        Text(
                            "${currentThreshold}px",
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.Bold
                            )
                        )

                        IconButton(
                            onClick = {
                                currentThreshold = when {
                                    currentThreshold < 40 -> 40
                                    currentThreshold < 80 -> 80
                                    currentThreshold < 140 -> 140
                                    else -> 200
                                }
                                viewModel.updateThreshold(currentThreshold)
                            }
                        ) {
                            Icon(Icons.Default.Add, "Increase")
                        }
                    }
                }

                // Image editor modal
                if (selectedImageId != null) {
                    val selectedImage =
                        uiState.gallery!!.images!!.find { it.id == selectedImageId }
                    if (selectedImage != null) {
                        ImageEditorModal(
                            image = selectedImage,
                            onDismiss = { selectedImageId = null },
                            onSave = { imageId, transform ->
                                viewModel.updateImageTransform(imageId, transform)
                                selectedImageId = null
                            }
                        )
                    }
                }
            }
        }
    }
}
