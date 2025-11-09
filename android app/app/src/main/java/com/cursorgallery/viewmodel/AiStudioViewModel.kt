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
        viewModelScope.launch {
            val refreshed = RunAnywhereManager.refreshModels()
            _uiState.value = _uiState.value.copy(models = refreshed)
        }
        viewModelScope.launch {
            RunAnywhereManager.currentModelId.collect { modelId ->
                _uiState.value = _uiState.value.copy(currentModelId = modelId)
            }
        }
    }

    fun refreshModels() {
        viewModelScope.launch {
            val refreshed = RunAnywhereManager.refreshModels()
            _uiState.value = _uiState.value.copy(models = refreshed)
        }
    }

    fun downloadModel(modelId: String) {
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
        viewModelScope.launch {
            val success = RunAnywhereManager.loadModel(modelId)
            if (success) {
                _uiState.value = _uiState.value.copy(currentModelId = modelId)
            }
        }
    }

    fun unloadModel() {
        viewModelScope.launch {
            RunAnywhereManager.unloadModel()
            _uiState.value = _uiState.value.copy(currentModelId = null)
        }
    }

    fun runMoodPreset(prompt: String, gallery: Gallery) {
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
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            val result = AiOrchestrator.generateSequencePlan(gallery, images)
            _uiState.value = result.fold(
                onSuccess = { plan ->
                    val uiModel = plan.toUiModel()
                    _uiState.value.copy(
                        isProcessing = false,
                        lastSequencePlan = uiModel,
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

    fun runCritique(gallery: Gallery, images: List<GalleryImage>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)
            val result = AiOrchestrator.generateCritique(gallery, images)
            _uiState.value = result.fold(
                onSuccess = { report ->
                    val uiModel = report.toUiModel()
                    _uiState.value.copy(
                        isProcessing = false,
                        lastCritiqueReport = uiModel,
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
}
