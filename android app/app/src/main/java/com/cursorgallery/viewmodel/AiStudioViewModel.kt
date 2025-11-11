package com.cursorgallery.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cursorgallery.ai.AiOrchestrator
import com.cursorgallery.ai.CritiqueReport
import com.cursorgallery.ai.ImageSequencePlan
import com.cursorgallery.ai.MoodPresetSuggestion
import com.cursorgallery.ai.RunAnywhereManager
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.GalleryImage
import com.runanywhere.sdk.models.ModelInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import android.util.Log

data class MoodPresetUiModel(
    val title: String,
    val description: String,
    val animationType: String,
    val mood: String,
    val colorPalette: List<String>
)

data class SequenceEntryUiModel(
    val imageId: String,
    val rationale: String?
)

data class SequencePlanUiModel(
    val orderedImageIds: List<String>,
    val entries: List<SequenceEntryUiModel>
)

data class CritiqueUiModel(
    val overallScore: Int,
    val compositionScore: Int,
    val emotionScore: Int,
    val storytellingScore: Int,
    val highlights: List<String>,
    val recommendations: List<String>
)

private const val DEFAULT_COLOR = "#FFFFFF"

private fun MoodPresetSuggestion.toUiModel(): MoodPresetUiModel = MoodPresetUiModel(
    title = title,
    description = description,
    animationType = animationType,
    mood = mood,
    colorPalette = colorPaletteHex.ifEmpty { listOf(DEFAULT_COLOR) }
)

private fun ImageSequencePlan.toUiModel(): SequencePlanUiModel = SequencePlanUiModel(
    orderedImageIds = orderedImageIds,
    entries = orderedImageIds.mapIndexed { index, imageId ->
        val reason = rationale?.getOrNull(index)
        SequenceEntryUiModel(imageId = imageId, rationale = reason)
    }
)

private fun CritiqueReport.toUiModel(): CritiqueUiModel = CritiqueUiModel(
    overallScore = overallScore,
    compositionScore = compositionScore,
    emotionScore = emotionScore,
    storytellingScore = storytellingScore,
    highlights = highlights,
    recommendations = recommendations
)

internal data class AiStudioUiState(
    val models: List<ModelInfo> = emptyList(),
    val currentModelId: String? = null,
    val downloadProgress: Map<String, Float> = emptyMap(),
    val isLoading: Boolean = false,
    val loadingModelId: String? = null,
    val lastMoodPreset: MoodPresetUiModel? = null,
    val lastSequencePlan: SequencePlanUiModel? = null,
    val lastCritiqueReport: CritiqueUiModel? = null,
    val isProcessing: Boolean = false,
    val errorMessage: String? = null
)

internal class AiStudioViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(AiStudioUiState())
    val uiState: StateFlow<AiStudioUiState> = _uiState.asStateFlow()

    init {
        System.err.println("========== AiStudioViewModel CREATED ==========")
        Log.d("AiStudioVM", "AiStudioViewModel initialized")

        // Don't call refreshModels() here - wait for SDK to initialize first
        // The UI will trigger refresh when needed
        viewModelScope.launch {
            RunAnywhereManager.currentModelId.collect { modelId ->
                _uiState.value = _uiState.value.copy(currentModelId = modelId)
            }
        }
    }

    fun refreshModels() {
        System.err.println("========== refreshModels CALLED ==========")
        viewModelScope.launch {
            val refreshed = RunAnywhereManager.refreshModels()
            _uiState.value = _uiState.value.copy(models = refreshed)
        }
    }

    fun downloadModel(modelId: String) {
        System.err.println("========== downloadModel CALLED: $modelId ==========")
        viewModelScope.launch {
            RunAnywhereManager.downloadModel(modelId) { progress ->
                _uiState.value = _uiState.value.copy(
                    downloadProgress = _uiState.value.downloadProgress.toMutableMap().apply {
                        this[modelId] = progress
                    }
                )
            }
            _uiState.value = _uiState.value.copy(
                downloadProgress = _uiState.value.downloadProgress - modelId,
                models = RunAnywhereManager.refreshModels()
            )
        }
    }

    fun loadModel(modelId: String) {
        System.err.println("========== loadModel CALLED: $modelId ==========")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                loadingModelId = modelId
            )
            val success = RunAnywhereManager.loadModel(modelId)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                loadingModelId = null,
                currentModelId = if (success) modelId else _uiState.value.currentModelId
            )
        }
    }

    fun unloadModel() {
        System.err.println("========== unloadModel CALLED ==========")
        viewModelScope.launch {
            RunAnywhereManager.unloadModel()
            _uiState.value = _uiState.value.copy(currentModelId = null)
        }
    }

    fun runMoodPreset(prompt: String, gallery: Gallery) {
        System.err.println("========== runMoodPreset CALLED ==========")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            val result = AiOrchestrator.generateMoodPreset(prompt, gallery)
            _uiState.value = result.fold(
                onSuccess = { preset ->
                    val uiModel = preset.toUiModel()
                    _uiState.value.copy(
                        isProcessing = false,
                        lastMoodPreset = uiModel,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value.copy(
                        isProcessing = false,
                        errorMessage = error.message
                    )
                }
            )
        }
    }

    fun runSequencePlan(gallery: Gallery, images: List<GalleryImage>) {
        System.err.println("========== runSequencePlan CALLED ==========")
        System.err.println("Gallery: ${gallery.name}, Images: ${images.size}")
        Log.d("AiStudioVM", "=== runSequencePlan CALLED ===")
        Log.d("AiStudioVM", "Gallery: ${gallery.name}, Images: ${images.size}")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            Log.d("AiStudioVM", "State updated to processing")

            try {
                val result = AiOrchestrator.generateSequencePlan(gallery, images)
                Log.d("AiStudioVM", "Orchestrator returned: success=${result.isSuccess}")

                _uiState.value = result.fold(
                    onSuccess = { plan ->
                        Log.d(
                            "AiStudioVM",
                            "✅ Sequence plan success: ${plan.orderedImageIds.size} images"
                        )
                        System.err.println("✅ SUCCESS: ${plan.orderedImageIds.size} images")
                        val uiModel = plan.toUiModel()
                        _uiState.value.copy(
                            isProcessing = false,
                            lastSequencePlan = uiModel,
                            errorMessage = null
                        )
                    },
                    onFailure = { error ->
                        Log.e("AiStudioVM", "❌ Sequence plan failed: ${error.message}", error)
                        System.err.println("❌ FAILED: ${error.message}")
                        _uiState.value.copy(
                            isProcessing = false,
                            errorMessage = "Failed: ${error.message}"
                        )
                    }
                )
                Log.d("AiStudioVM", "State updated after result")
            } catch (e: Exception) {
                Log.e("AiStudioVM", "❌ Exception in runSequencePlan", e)
                System.err.println("❌ EXCEPTION: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "Error: ${e.message}"
                )
            }
        }
    }

    fun runCritique(gallery: Gallery, images: List<GalleryImage>) {
        System.err.println("========== runCritique CALLED ==========")
        System.err.println("Gallery: ${gallery.name}, Images: ${images.size}")
        Log.d("AiStudioVM", "=== runCritique CALLED ===")
        Log.d("AiStudioVM", "Gallery: ${gallery.name}, Images: ${images.size}")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            Log.d("AiStudioVM", "State updated to processing")

            try {
                val result = AiOrchestrator.generateCritique(gallery, images)
                Log.d("AiStudioVM", "Orchestrator returned: success=${result.isSuccess}")

                _uiState.value = result.fold(
                    onSuccess = { report ->
                        Log.d("AiStudioVM", "✅ Critique success: overall=${report.overallScore}")
                        System.err.println("✅ SUCCESS: Overall ${report.overallScore}")
                        val uiModel = report.toUiModel()
                        _uiState.value.copy(
                            isProcessing = false,
                            lastCritiqueReport = uiModel,
                            errorMessage = null
                        )
                    },
                    onFailure = { error ->
                        Log.e("AiStudioVM", "❌ Critique failed: ${error.message}", error)
                        System.err.println("❌ FAILED: ${error.message}")
                        _uiState.value.copy(
                            isProcessing = false,
                            errorMessage = "Failed: ${error.message}"
                        )
                    }
                )
                Log.d("AiStudioVM", "State updated after result")
            } catch (e: Exception) {
                Log.e("AiStudioVM", "❌ Exception in runCritique", e)
                System.err.println("❌ EXCEPTION: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "Error: ${e.message}"
                )
            }
        }
    }

    /**
     * Test generation directly using SDK - bypasses orchestrator
     * This helps diagnose if the issue is with SDK or our wrapper
     */
    fun testGeneration(testPrompt: String = "Say hello in JSON format: {\"message\": \"your response here\"}") {
        System.err.println("========== testGeneration CALLED ==========")
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            try {
                Log.d("AiStudioVM", "=== DIRECT SDK TEST ===")

                val response = AiOrchestrator.testGeneration()

                Log.d("AiStudioVM", "✅ Test generation success")
                Log.d("AiStudioVM", "Response: $response")
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = if (response.isNotEmpty())
                        "✅ Test OK: Model works! Response: ${response.take(50)}..."
                    else
                        "❌ Test FAILED: Model returned empty response"
                )
            } catch (e: Exception) {
                Log.e("AiStudioVM", "❌ Test generation failed", e)
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "❌ Test FAILED: ${e.message}"
                )
            }
        }
    }

}
