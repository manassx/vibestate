package com.cursorgallery.ui.screens.portfolio

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.viewmodel.CreatePortfolioViewModel
import com.cursorgallery.viewmodel.CreatePortfolioViewModelFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePortfolioScreen(
    tokenManager: TokenManager,
    onNavigateBack: () -> Unit,
    onNavigateToEditor: (String) -> Unit,
    viewModel: CreatePortfolioViewModel = viewModel(
        factory = CreatePortfolioViewModelFactory(tokenManager)
    )
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var portfolioName by remember { mutableStateOf("") }
    var portfolioDescription by remember { mutableStateOf("") }
    var selectedImageUris by remember { mutableStateOf<List<Uri>>(emptyList()) }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        selectedImageUris = uris
    }

    // Navigate to editor after successful creation
    LaunchedEffect(uiState.createdGalleryId) {
        if (uiState.createdGalleryId != null && uiState.processingStep == 4) {
            onNavigateToEditor(uiState.createdGalleryId!!)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (uiState.currentStep == 1) "Create Portfolio" else "Upload Images",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Black
                        )
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (uiState.currentStep) {
                1 -> {
                    // Step 1: Portfolio Details
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        Text(
                            "Name Your Portfolio",
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Black
                            )
                        )

                        Text(
                            "Give it a memorable name. This is your creative space.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = portfolioName,
                            onValueChange = { portfolioName = it },
                            label = { Text("PORTFOLIO NAME") },
                            placeholder = { Text("Sarah Chen Photography") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = portfolioDescription,
                            onValueChange = { portfolioDescription = it },
                            label = { Text("TAGLINE (OPTIONAL)") },
                            placeholder = { Text("Visual storyteller capturing life's fleeting moments...") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2,
                            maxLines = 3
                        )

                        Button(
                            onClick = {
                                if (portfolioName.isNotBlank()) {
                                    viewModel.setPortfolioDetails(
                                        portfolioName,
                                        portfolioDescription
                                    )
                                    viewModel.nextStep()
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = portfolioName.isNotBlank()
                        ) {
                            Text("CONTINUE")
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.ArrowForward, null, modifier = Modifier.size(20.dp))
                        }
                    }
                }

                2 -> {
                    // Step 2: Upload Images
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            portfolioName,
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Black
                            )
                        )

                        if (portfolioDescription.isNotBlank()) {
                            Text(
                                portfolioDescription,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        // File upload zone
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clickable { imagePickerLauncher.launch("image/*") },
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Icon(
                                        Icons.Default.CloudUpload,
                                        contentDescription = null,
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        if (selectedImageUris.isEmpty())
                                            "Tap to select images"
                                        else
                                            "${selectedImageUris.size} images selected",
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "Select multiple photos from your gallery",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        if (selectedImageUris.isNotEmpty()) {
                            Button(
                                onClick = {
                                    viewModel.createPortfolioWithImages(
                                        context = context,
                                        imageUris = selectedImageUris
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !uiState.isLoading
                            ) {
                                if (uiState.isLoading) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp),
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                }
                                Text(if (uiState.isLoading) "PROCESSING..." else "BUILD PORTFOLIO")
                            }
                        }
                    }
                }

                3 -> {
                    // Step 3: Processing
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            "Crafting Your Portfolio",
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Black
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            "Setting up your interactive canvas. Almost there...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(32.dp))

                        // Processing steps
                        ProcessingSteps(
                            currentStep = uiState.processingStep,
                            compressionProgress = uiState.compressionProgress,
                            uploadProgress = uiState.uploadProgress
                        )

                        Spacer(modifier = Modifier.height(32.dp))

                        if (uiState.error != null) {
                            Text(
                                uiState.error!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProcessingSteps(
    currentStep: Int,
    compressionProgress: Float,
    uploadProgress: Float
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ProcessingStepItem(
            title = "Optimizing images",
            isActive = currentStep == 0,
            isComplete = currentStep > 0,
            progress = if (currentStep == 0) compressionProgress else 1f
        )

        ProcessingStepItem(
            title = "Creating portfolio",
            isActive = currentStep == 1,
            isComplete = currentStep > 1
        )

        ProcessingStepItem(
            title = "Uploading images",
            isActive = currentStep == 2,
            isComplete = currentStep > 2,
            progress = if (currentStep == 2) uploadProgress else 1f
        )

        ProcessingStepItem(
            title = "Finalizing",
            isActive = currentStep == 3,
            isComplete = currentStep > 3
        )
    }
}

@Composable
fun ProcessingStepItem(
    title: String,
    isActive: Boolean,
    isComplete: Boolean,
    progress: Float? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    when {
                        isComplete -> MaterialTheme.colorScheme.primary
                        isActive -> MaterialTheme.colorScheme.primaryContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    },
                    MaterialTheme.shapes.small
                ),
            contentAlignment = Alignment.Center
        ) {
            when {
                isComplete -> Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(20.dp)
                )

                isActive -> CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
            }
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
            )

            if (progress != null && isActive) {
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                )
            }
        }
    }
}
