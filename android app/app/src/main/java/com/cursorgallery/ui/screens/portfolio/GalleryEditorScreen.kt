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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import com.cursorgallery.ai.RunAnywhereManager
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.CropData
import com.cursorgallery.ui.components.ImageEditBottomSheet
import com.cursorgallery.ui.components.TouchTrailCanvas
import com.cursorgallery.viewmodel.AiStudioViewModel
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
    val aiViewModel: AiStudioViewModel = viewModel()
    val aiUiState by aiViewModel.uiState.collectAsState()
    var moodPrompt by remember { mutableStateOf("Design a dusky neon atmosphere for this collection") }
    var showAiTools by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

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
                val activeModelId by RunAnywhereManager.currentModelId.collectAsState()

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
                        }

                        Button(
                            onClick = { showAiTools = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF000000),
                                contentColor = Color(0xFFF0F0F0)
                            ),
                            border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.AutoAwesome,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("AI Tools", fontWeight = FontWeight.Bold)
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

                if (showAiTools) {
                    ModalBottomSheet(
                        onDismissRequest = { showAiTools = false },
                        sheetState = sheetState,
                        containerColor = Color(0xFF141414),
                        contentColor = Color.White,
                        dragHandle = {}
                    ) {
                        AiCompanionPanel(
                            activeModelId = activeModelId,
                            aiUiState = aiUiState,
                            moodPrompt = moodPrompt,
                            onPromptChange = { moodPrompt = it },
                            onComposeAtmosphere = {
                                aiViewModel.runMoodPreset(
                                    moodPrompt,
                                    gallery
                                )
                            },
                            onApplyPreset = { preset ->
                                val currentConfig = gallery.config
                                    ?: com.cursorgallery.data.models.GalleryConfig()
                                val updatedConfig = currentConfig.copy(
                                    animationType = preset.animationType,
                                    mood = preset.mood
                                )
                                viewModel.updateGalleryConfig(updatedConfig)
                            },
                            onSequenceOracle = {
                                aiViewModel.runSequencePlan(
                                    gallery,
                                    gallery.images!!
                                )
                            },
                            onApplySequence = { plan ->
                                viewModel.applyImageOrdering(plan.orderedImageIds)
                                hasPendingChanges = true
                            },
                            onCritique = { aiViewModel.runCritique(gallery, gallery.images!!) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AiCompanionPanel(
    activeModelId: String?,
    aiUiState: com.cursorgallery.viewmodel.AiStudioUiState,
    moodPrompt: String,
    onPromptChange: (String) -> Unit,
    onComposeAtmosphere: () -> Unit,
    onApplyPreset: (com.cursorgallery.viewmodel.MoodPresetUiModel) -> Unit,
    onSequenceOracle: () -> Unit,
    onApplySequence: (com.cursorgallery.viewmodel.SequencePlanUiModel) -> Unit,
    onCritique: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "AI Companion",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
            color = Color.White
        )
        Text(
            text = if (activeModelId != null) "Model: $activeModelId" else "Load a model in AI Studio to enable tools",
            style = MaterialTheme.typography.labelSmall,
            color = Color(0xFFA8A8A8)
        )

        if (aiUiState.isProcessing) {
            LinearProgressIndicator(
                modifier = Modifier.fillMaxWidth(),
                color = Color(0xFFE8E8E8)
            )
        }

        OutlinedTextField(
            value = moodPrompt,
            onValueChange = onPromptChange,
            label = { Text("Atmosphere prompt") },
            enabled = activeModelId != null && !aiUiState.isProcessing,
            textStyle = MaterialTheme.typography.bodySmall,
            modifier = Modifier.fillMaxWidth()
        )

        val controlsEnabled = activeModelId != null && !aiUiState.isProcessing

        Button(
            onClick = onComposeAtmosphere,
            enabled = controlsEnabled,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFE8E8E8),
                contentColor = Color(0xFF0A0A0A)
            )
        ) {
            Icon(
                Icons.Default.AutoAwesome,
                contentDescription = null,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Compose Atmosphere", fontWeight = FontWeight.Bold)
        }

        aiUiState.lastMoodPreset?.let { preset ->
            Surface(
                color = Color(0xFF1E1E1E),
                shape = RoundedCornerShape(12.dp),
                tonalElevation = 2.dp
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        preset.title,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Text(
                        preset.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                    Text(
                        "Animation • ${preset.animationType}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                    Text(
                        "Mood • ${preset.mood}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                    if (preset.colorPalette.isNotEmpty()) {
                        Text(
                            text = "Palette • ${preset.colorPalette.joinToString(", ")}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFFA8A8A8)
                        )
                    }
                    Button(
                        onClick = { onApplyPreset(preset) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFa89c8e),
                            contentColor = Color(0xFF0a0a0a)
                        )
                    ) {
                        Text("Apply preset", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        HorizontalDivider(color = Color(0xFF2A2A2A))

        Button(
            onClick = onSequenceOracle,
            enabled = controlsEnabled,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF0A0A0A),
                contentColor = Color(0xFFE8E8E8)
            ),
            border = BorderStroke(1.dp, Color(0x33FFFFFF))
        ) {
            Icon(
                Icons.Default.Timeline,
                contentDescription = null,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Sequence Oracle", fontWeight = FontWeight.Bold)
        }

        aiUiState.lastSequencePlan?.let { plan ->
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    "Suggested order",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
                plan.entries.forEachIndexed { index, entry ->
                    val rationale = entry.rationale
                    Text(
                        text = "${index + 1}. ${entry.imageId.take(8)}${if (!rationale.isNullOrBlank()) " – $rationale" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                }
                Button(
                    onClick = { onApplySequence(plan) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFE8E8E8),
                        contentColor = Color(0xFF0A0A0A)
                    )
                ) {
                    Text("Apply ordering", fontWeight = FontWeight.Bold)
                }
            }
        }

        HorizontalDivider(color = Color(0xFF2A2A2A))

        Button(
            onClick = onCritique,
            enabled = controlsEnabled,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF1A1A1A),
                contentColor = Color(0xFFE8E8E8)
            ),
            border = BorderStroke(1.dp, Color(0x33FFFFFF))
        ) {
            Icon(
                Icons.Default.Insights,
                contentDescription = null,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Critique Portfolio", fontWeight = FontWeight.Bold)
        }

        aiUiState.lastCritiqueReport?.let { report ->
            Surface(
                color = Color(0xFF1E1E1E),
                shape = RoundedCornerShape(12.dp),
                tonalElevation = 2.dp
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        "Overall ${report.overallScore}/100",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Text(
                        "Composition ${report.compositionScore}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                    Text(
                        "Emotion ${report.emotionScore}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                    Text(
                        "Story ${report.storytellingScore}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                    if (report.highlights.isNotEmpty()) {
                        Text(
                            "Highlights",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White
                        )
                        report.highlights.forEach { highlight ->
                            Text(
                                "- $highlight",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFA8A8A8)
                            )
                        }
                    }
                    if (report.recommendations.isNotEmpty()) {
                        Text(
                            "Recommendations",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White
                        )
                        report.recommendations.forEach { recommendation ->
                            Text(
                                "- $recommendation",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFA8A8A8)
                            )
                        }
                    }
                }
            }
        }

        aiUiState.errorMessage?.let { error ->
            Text(
                text = error,
                color = Color(0xFFFF5555),
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
