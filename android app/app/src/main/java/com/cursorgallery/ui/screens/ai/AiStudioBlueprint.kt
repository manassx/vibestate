package com.cursorgallery.ui.screens.ai

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cursorgallery.ai.AiActionBlueprints
import com.cursorgallery.ai.RunAnywhereManager
import com.cursorgallery.viewmodel.AiStudioViewModel

@Composable
internal fun AiStudioBlueprintScreen() {
    val viewModel = viewModel<AiStudioViewModel>()
    val managerState by RunAnywhereManager.state.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val activeModelId by RunAnywhereManager.currentModelId.collectAsState()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            Text(
                text = "AI Studio (Blueprint)",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = "State: $managerState",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "Active model: ${activeModelId ?: "none"}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            uiState.models.forEach { model ->
                val progress = uiState.downloadProgress[model.id]
                Text(
                    text = buildString {
                        append(model.name)
                        append(" — ")
                        append(if (model.isDownloaded) "Downloaded" else "Not downloaded")
                        if (progress != null) {
                            append(" (Downloading ${(progress * 100).toInt()}%)")
                        }
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = "Planned actions:",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(top = 24.dp, bottom = 12.dp)
            )
            AiActionBlueprints.actions.forEach { action ->
                Text(
                    text = "• ${action.title} — ${action.description}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }
    }
}
