package com.cursorgallery.ai

import android.util.Log
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.GalleryImage
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import com.runanywhere.sdk.public.RunAnywhere
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext

internal object AiOrchestrator {

    private const val TAG = "AiOrchestrator"
    private val gson = Gson()

    suspend fun generateMoodPreset(
        userPrompt: String,
        gallery: Gallery
    ): Result<MoodPresetSuggestion> {
        if (!isModelReady()) {
            return Result.failure(IllegalStateException("No AI model is loaded"))
        }

        val prompt = AiBlueprintDocumentation.moodDjPromptTemplate(userPrompt, gallery)
        return executeJsonRequest(prompt) { json ->
            gson.fromJson(json, MoodPresetSuggestion::class.java)
        }
    }

    suspend fun generateSequencePlan(
        gallery: Gallery,
        images: List<GalleryImage>
    ): Result<ImageSequencePlan> {
        if (!isModelReady()) {
            return Result.failure(IllegalStateException("No AI model is loaded"))
        }
        if (images.isEmpty()) {
            return Result.failure(IllegalArgumentException("No images available for sequencing"))
        }

        val prompt = AiBlueprintDocumentation.sequencingPromptTemplate(gallery, images)
        return executeJsonRequest(prompt) { json ->
            gson.fromJson(json, ImageSequencePlan::class.java)
        }
    }

    suspend fun generateCritique(
        gallery: Gallery,
        images: List<GalleryImage>
    ): Result<CritiqueReport> {
        if (!isModelReady()) {
            return Result.failure(IllegalStateException("No AI model is loaded"))
        }
        if (images.isEmpty()) {
            return Result.failure(IllegalArgumentException("No images available for critique"))
        }

        val prompt = AiBlueprintDocumentation.critiquePromptTemplate(gallery, images)
        return executeJsonRequest(prompt) { json ->
            gson.fromJson(json, CritiqueReport::class.java)
        }
    }

    private suspend fun <T> executeJsonRequest(
        prompt: String,
        parse: (String) -> T
    ): Result<T> = withContext(Dispatchers.IO) {
        runCatching {
            val raw = RunAnywhere.generate(prompt)
            val jsonPayload = sanitizeResponse(raw)
            parse(jsonPayload)
        }.onFailure { throwable ->
            if (throwable is JsonSyntaxException) {
                Log.e(TAG, "Failed to parse AI response", throwable)
            } else {
                Log.e(TAG, "AI execution failed", throwable)
            }
        }
    }

    private suspend fun isModelReady(): Boolean {
        if (!AiFeatureToggle.isEnabled) return false
        return RunAnywhereManager.currentModelId.first() != null
    }

    private fun sanitizeResponse(rawResponse: String): String {
        val trimmed = rawResponse.trim()
        val withoutFences = trimmed
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()

        val startIndex = withoutFences.indexOf('{')
        val endIndex = withoutFences.lastIndexOf('}')
        return if (startIndex >= 0 && endIndex > startIndex) {
            withoutFences.substring(startIndex, endIndex + 1)
        } else {
            withoutFences
        }
    }
}
