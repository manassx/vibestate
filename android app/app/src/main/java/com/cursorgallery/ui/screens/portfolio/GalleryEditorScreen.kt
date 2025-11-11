package com.cursorgallery.ui.screens.portfolio

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import com.cursorgallery.ui.components.AiChatPanel
import com.cursorgallery.viewmodel.AiChatViewModel
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
    val chatViewModel: AiChatViewModel = viewModel()
    val chatUiState by chatViewModel.uiState.collectAsState()
    var showAiChat by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Check if gallery is published
    val isPublished = uiState.gallery?.status == "published"

    // Debug logging to track state changes
    LaunchedEffect(uiState.gallery) {
        android.util.Log.d(
            "GalleryEditor",
            "Gallery state changed: status=${uiState.gallery?.status}, hasImages=${!uiState.gallery?.images.isNullOrEmpty()}, imageCount=${uiState.gallery?.images?.size}"
        )
    }

    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }

    LaunchedEffect(uiState.gallery?.config?.threshold) {
        currentThreshold = uiState.gallery?.config?.threshold ?: 80
    }

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
                val gallery = uiState.gallery!!

                TouchTrailCanvas(
                    images = gallery.images!!,
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

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
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

                    Column(
                        horizontalAlignment = Alignment.End,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (hasPendingChanges) {
                                Button(
                                    onClick = {
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

                            // Show PUBLISH button if not published, VIEW button if published
                            if (isPublished) {
                                Button(
                                    onClick = { onNavigateToViewer?.invoke(galleryId) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF000000),
                                        contentColor = Color(0xFFF0F0F0)
                                    ),
                                    border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                                    contentPadding = PaddingValues(
                                        horizontal = 16.dp,
                                        vertical = 12.dp
                                    ),
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
                            } else {
                                Button(
                                    onClick = { viewModel.publishGallery() },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF000000),
                                        contentColor = Color(0xFFF0F0F0)
                                    ),
                                    border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                                    contentPadding = PaddingValues(
                                        horizontal = 16.dp,
                                        vertical = 12.dp
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("PUBLISH", fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Button(
                            onClick = { showAiChat = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF000000),
                                contentColor = Color(0xFFF0F0F0)
                            ),
                            border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.Chat,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("AI Chat", fontWeight = FontWeight.Bold)
                        }
                    }
                }

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
                            }
                        ) {
                            Icon(Icons.Default.Add, "Increase", tint = Color.White)
                        }
                    }
                }

                if (showEditSheet && selectedImageId != null) {
                    val selectedImage =
                        uiState.gallery!!.images!!.find { it.id == selectedImageId }
                    if (selectedImage != null) {
                        ImageEditBottomSheet(
                            image = selectedImage,
                            onDismiss = {
                                selectedImageId = null
                                showEditSheet = false
                                temporaryScaleOverrides = temporaryScaleOverrides - selectedImage.id
                                temporaryCropOverrides = temporaryCropOverrides - selectedImage.id
                            },
                            onSave = { imageId, transform ->
                                viewModel.updateImageTransform(imageId, transform)
                                selectedImageId = null
                                showEditSheet = false
                                temporaryScaleOverrides = temporaryScaleOverrides - imageId
                                temporaryCropOverrides = temporaryCropOverrides - imageId
                                hasPendingChanges = true
                            },
                            onScaleChange = { newScale ->
                                temporaryScaleOverrides =
                                    temporaryScaleOverrides + (selectedImage.id to newScale)
                            },
                            onCropChange = { newCrop ->
                                temporaryCropOverrides =
                                    temporaryCropOverrides + (selectedImage.id to newCrop)
                            }
                        )
                    }
                }

                if (showAiChat) {
                    ModalBottomSheet(
                        onDismissRequest = { showAiChat = false },
                        sheetState = sheetState,
                        containerColor = Color(0xFF141414),
                        contentColor = Color.White,
                        dragHandle = {}
                    ) {
                        AiChatPanel(
                            gallery = gallery,
                            uiState = chatUiState,
                            onSendMessage = { message ->
                                chatViewModel.sendMessage(message, gallery)
                            },
                            onClose = { showAiChat = false }
                        )
                    }
                }
            }
        }
    }
}
