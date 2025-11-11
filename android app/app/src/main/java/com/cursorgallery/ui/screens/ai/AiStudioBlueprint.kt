package com.cursorgallery.ui.screens.ai

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cursorgallery.ai.AiActionBlueprints
import com.cursorgallery.ai.RunAnywhereManager
import com.cursorgallery.viewmodel.AiStudioViewModel
import com.runanywhere.sdk.models.ModelInfo

@Composable
internal fun AiStudioBlueprintScreen(
    onNavigateBack: () -> Unit
) {
    val viewModel = viewModel<AiStudioViewModel>()
    val managerState by RunAnywhereManager.state.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val activeModelId by RunAnywhereManager.currentModelId.collectAsState()

    // Refresh models when screen is loaded or when initialization completes
    LaunchedEffect(managerState) {
        if (managerState is RunAnywhereManager.InitializationState.Initialized) {
            viewModel.refreshModels()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onNavigateBack,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color.White
                    ),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("BACK", fontWeight = FontWeight.Bold)
                }

                Icon(
                    Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = Color(0xFFE8E8E8),
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Title section
                Text(
                    text = "AI Studio",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontWeight = FontWeight.Black
                    ),
                    color = Color.White
                )

                Text(
                    text = "Privacy-first creative intelligence powered by on-device models",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFFA8A8A8)
                )

                // SDK Status Card
                StatusCard(managerState = managerState, activeModelId = activeModelId)

                HorizontalDivider(color = Color(0xFF2A2A2A), thickness = 2.dp)

                // Available Models Section
                Text(
                    text = "Available Models",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = Color.White
                )

                Text(
                    text = "Download and load a model to enable the AI chat assistant",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFA8A8A8)
                )

                if (uiState.models.isEmpty()) {
                    Text(
                        text = "No models found. Make sure SDK is initialized.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFFF5555)
                    )
                } else {
                    uiState.models.forEach { model ->
                        ModelCard(
                            model = model,
                            isActive = model.id == activeModelId,
                            isLoading = uiState.isLoading && uiState.loadingModelId == model.id,
                            downloadProgress = uiState.downloadProgress[model.id],
                            onDownload = { viewModel.downloadModel(model.id) },
                            onLoad = { viewModel.loadModel(model.id) },
                            onUnload = { viewModel.unloadModel() }
                        )
                    }
                }

                HorizontalDivider(color = Color(0xFF2A2A2A), thickness = 2.dp)

                // On-Device AI Benefits Section (moved to bottom)
                OnDeviceAiBenefitsSection()
            }
        }
    }
}

@Composable
private fun OnDeviceAiBenefitsSection() {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Why On-Device AI?",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.Bold
            ),
            color = Color.White
        )

        BenefitCard(
            icon = "🔒",
            title = "100% Private",
            description = "All AI processing happens on your device. Your portfolio data never leaves your phone."
        )

        BenefitCard(
            icon = "✈️",
            title = "Works Offline",
            description = "No internet required. Get creative suggestions anytime, anywhere, even in airplane mode."
        )

        BenefitCard(
            icon = "⚡",
            title = "Instant Responses",
            description = "No cloud latency. Chat with AI assistant and get real-time suggestions as you create."
        )

        BenefitCard(
            icon = "💬",
            title = "Smart Chat Assistant",
            description = "Ask for portfolio titles, descriptions, creative feedback, and optimization tips. The AI understands Cursor Gallery's unique features."
        )
    }
}

@Composable
private fun BenefitCard(
    icon: String,
    title: String,
    description: String
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color(0xFF141414),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Color(0xFF2A2A2A))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Text(
                text = icon,
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(top = 2.dp)
            )
            Column(
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = Color.White
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFA8A8A8)
                )
            }
        }
    }
}

@Composable
private fun ModelCard(
    model: ModelInfo,
    isActive: Boolean,
    isLoading: Boolean,
    downloadProgress: Float?,
    onDownload: () -> Unit,
    onLoad: () -> Unit,
    onUnload: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) Color(0xFF1E3A1E) else Color(0xFF141414)
        ),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(
            width = if (isActive) 2.dp else 1.dp,
            color = if (isActive) Color(0xFF4CAF50) else Color(0xFF2A2A2A)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = model.name,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        color = Color.White
                    )
                    Text(
                        text = model.category.toString(),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                }

                if (isActive) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Active",
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            // Model capabilities
            val capabilities = getModelCapabilities(model.name)
            Surface(
                color = Color(0xFF1A1A1A),
                shape = RoundedCornerShape(6.dp),
                border = BorderStroke(1.dp, Color(0xFF2A2A2A))
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "CAPABILITIES",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = Color(0xFF666666)
                    )
                    Text(
                        text = capabilities.first,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.Medium
                        ),
                        color = Color(0xFFE8E8E8)
                    )
                    Text(
                        text = capabilities.second,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                }
            }

            // Download progress
            if (downloadProgress != null) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    LinearProgressIndicator(
                        progress = { downloadProgress },
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFFE8E8E8),
                        trackColor = Color(0xFF2A2A2A)
                    )
                    Text(
                        text = "Downloading: ${(downloadProgress * 100).toInt()}%",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                }
            }

            // Loading indicator when model is being loaded
            if (isLoading) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color(0xFF4CAF50),
                        strokeWidth = 2.dp
                    )
                    Text(
                        text = "Loading model...",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFA8A8A8)
                    )
                }
            }

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                when {
                    !model.isDownloaded && downloadProgress == null -> {
                        Button(
                            onClick = onDownload,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFE8E8E8),
                                contentColor = Color(0xFF0A0A0A)
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CloudDownload,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Download", fontWeight = FontWeight.Bold)
                        }
                    }
                    model.isDownloaded && !isActive && !isLoading -> {
                        Button(
                            onClick = onLoad,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF4CAF50),
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Load Model", fontWeight = FontWeight.Bold)
                        }
                    }
                    isActive && !isLoading -> {
                        OutlinedButton(
                            onClick = onUnload,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color(0xFFFF5555)
                            ),
                            border = BorderStroke(1.dp, Color(0xFFFF5555)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                Icons.Default.Stop,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Unload", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// Helper function to get model capabilities
private fun getModelCapabilities(modelName: String): Pair<String, String> {
    return when {
        // Match "Llama 3.2 1B Instruct Q6_K"
        modelName.contains("Llama", ignoreCase = true) && modelName.contains("3.2", ignoreCase = true) -> {
            "Most Powerful & Capable" to "1B parameters (~650MB). Highest quality responses with superior reasoning and instruction-following. Best for complex creative tasks, detailed critiques, and nuanced conversations. Slower but most intelligent."
        }
        // Match "Qwen 2.5 0.5B Instruct Q6_K"
        modelName.contains("Qwen", ignoreCase = true) && modelName.contains("2.5", ignoreCase = true) -> {
            "Balanced & Recommended" to "0.5B parameters (~380MB). Excellent balance of speed and quality. Strong creative writing and JSON generation. Fast inference with good intelligence. Ideal for sequence planning and mood suggestions."
        }
        // Match "SmolLM2 360M Q8_0"
        modelName.contains("SmolLM", ignoreCase = true) && modelName.contains("360M", ignoreCase = true) -> {
            "Fastest & Most Efficient" to "360M parameters (~220MB). Ultra-fast responses with minimal battery and memory usage. Best for quick tasks, simple queries, and low-end devices. Instant feedback but lower quality output."
        }
        else -> {
            "General Purpose" to "Suitable for on-device AI text generation tasks. Check model size for performance expectations."
        }
    }
}

@Composable
private fun StatusCard(
    managerState: RunAnywhereManager.InitializationState,
    activeModelId: String?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1A1A1A)
        ),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFF2A2A2A))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val (icon, color) = when (managerState) {
                    is RunAnywhereManager.InitializationState.Initialized ->
                        Icons.Default.CheckCircle to Color(0xFF4CAF50)

                    is RunAnywhereManager.InitializationState.Initializing ->
                        Icons.Default.CloudDownload to Color(0xFFFFA726)

                    is RunAnywhereManager.InitializationState.Failed ->
                        Icons.Default.Error to Color(0xFFFF5555)

                    else -> Icons.Default.Error to Color(0xFFA8A8A8)
                }

                Icon(
                    icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )

                Text(
                    text = "SDK Status",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = Color.White
                )
            }

            Text(
                text = when (managerState) {
                    is RunAnywhereManager.InitializationState.Initialized -> "Ready"
                    is RunAnywhereManager.InitializationState.Initializing -> "Initializing..."
                    is RunAnywhereManager.InitializationState.Failed -> {
                        val errorMsg = managerState.cause.message ?: "Unknown error"
                        val stackTrace = managerState.cause.stackTraceToString().take(200)
                        "Failed: $errorMsg\n\n$stackTrace"
                    }

                    else -> "Not initialized - Check logs for errors"
                },
                style = MaterialTheme.typography.bodySmall,
                color = when (managerState) {
                    is RunAnywhereManager.InitializationState.Failed -> Color(0xFFFF5555)
                    else -> Color(0xFFA8A8A8)
                }
            )

            if (activeModelId != null) {
                HorizontalDivider(color = Color(0xFF2A2A2A))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Active Model: $activeModelId",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White
                    )
                }
            }
        }
    }
}
