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
import com.cursorgallery.ui.components.TouchTrailCanvas
import com.cursorgallery.viewmodel.PortfolioViewerViewModel
import com.cursorgallery.viewmodel.PortfolioViewerViewModelFactory

@Composable
fun PortfolioViewerScreen(
    tokenManager: TokenManager,
    galleryId: String,
    onNavigateBack: () -> Unit,
    viewModel: PortfolioViewerViewModel = viewModel(
        factory = PortfolioViewerViewModelFactory(tokenManager, galleryId)
    )
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
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
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(24.dp)
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
                // Full-screen touch trail canvas (read-only)
                TouchTrailCanvas(
                    images = uiState.gallery!!.images!!,
                    threshold = uiState.gallery!!.config?.threshold ?: 80,
                    editMode = false,
                    onImageClick = null
                )

                // Minimal floating EXIT button
                IconButton(
                    onClick = onNavigateBack,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(16.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Exit",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
            }

            uiState.gallery != null -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(24.dp)
                    ) {
                        Icon(
                            Icons.Default.RemoveRedEye,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            uiState.gallery!!.name,
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Black
                            )
                        )
                        Text(
                            "0 images",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            "Touch trail canvas implementation coming soon",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Minimal floating EXIT button (auto-hide can be added later)
        IconButton(
            onClick = onNavigateBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
        ) {
            Icon(
                Icons.Default.Close,
                contentDescription = "Exit",
                tint = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}
