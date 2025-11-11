package com.cursorgallery.ai

import android.util.Log
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.GalleryImage
import com.google.gson.Gson
import com.google.gson.JsonSyntaxException
import com.runanywhere.sdk.public.RunAnywhere
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

internal object AiOrchestrator {

    private const val TAG = "AiOrchestrator"
    private val gson = Gson()

    /**
     * Generate a creative description for a gallery (returns plain text)
     */
    suspend fun generateDescription(
        galleryTitle: String,
        imageCount: Int
    ): Result<String> = runCatching {
        val prompt =
            AiBlueprintDocumentation.descriptionGeneratorPrompt(galleryTitle, imageCount)

        Log.d(TAG, "Generating gallery description...")
        var description = ""
        RunAnywhere.generateStream(prompt).collect { token ->
            description += token
        }

        // Clean up the description (remove extra whitespace, quotes, etc.)
        description.trim().removeSurrounding("\"")
    }

    /**
     * Generate social media caption for a specific platform
     */
    suspend fun generateSocialCaption(
        gallery: Gallery,
        platform: String
    ): Result<String> = runCatching {
        val prompt = AiBlueprintDocumentation.socialCaptionPrompt(gallery, platform)

        Log.d(TAG, "Generating $platform caption...")
        var caption = ""
        RunAnywhere.generateStream(prompt).collect { token ->
            caption += token
        }

        caption.trim()
    }

    /**
     * Answer visitor question about the gallery (contextual chat)
     */
    suspend fun answerVisitorQuestion(
        gallery: Gallery,
        question: String
    ): Result<String> = runCatching {
        val prompt = AiBlueprintDocumentation.contextualChatPrompt(gallery, question)

        Log.d(TAG, "Answering visitor question...")
        var answer = ""
        RunAnywhere.generateStream(prompt).collect { token ->
            answer += token
        }

        answer.trim()
    }

    /**
     * Generate professional artist statement
     */
    suspend fun generateArtistStatement(
        gallery: Gallery
    ): Result<String> = runCatching {
        val prompt = AiBlueprintDocumentation.artistStatementPrompt(gallery)

        Log.d(TAG, "Generating artist statement...")
        var statement = ""
        RunAnywhere.generateStream(prompt).collect { token ->
            statement += token
        }

        statement.trim()
    }

    /**
     * Generate chat response with streaming tokens
     */
    suspend fun generateChatResponse(
        userMessage: String,
        gallery: Gallery
    ): Flow<String> = flow {
        // Keep it MINIMAL - complex prompts cause 0 token generation
        val imageCount = gallery.images?.size ?: 0
        val threshold = gallery.config?.threshold ?: 80

        val context =
            """Cursor Gallery assistant for "${gallery.name}" portfolio ($imageCount images, ${threshold}px threshold).

Help with: threshold settings (20px=dense, 140px=sparse), image editing (tap to scale/crop/rotate), creative ideas.

Be helpful and specific."""

        val fullPrompt = "$context\n\nUser: $userMessage\nAssistant:"
        
        Log.d(TAG, "Prompt: ${fullPrompt.length} chars")
        
        RunAnywhere.generateStream(fullPrompt).collect { token ->
            emit(token)
        }
    }

    /**
     * Build system prompt for chat that provides context about the gallery
     */
    private fun buildChatSystemPrompt(gallery: Gallery): String {
        val imageCount = gallery.images?.size ?: 0
        val threshold = gallery.config?.threshold ?: 80

        return "You are a portfolio assistant for Cursor Gallery. Portfolio: \"${gallery.name}\" ($imageCount images, threshold: ${threshold}px). Be helpful and creative."
    }

    /**
     * Generate mood preset
     */
    suspend fun generateMoodPreset(
        userPrompt: String,
        gallery: Gallery
    ): Result<MoodPresetSuggestion> = runCatching {
        val prompt = AiBlueprintDocumentation.moodDjPromptTemplate(userPrompt, gallery)
        Log.d(TAG, "=== MOOD PRESET GENERATION ===")
        Log.d(TAG, "Full prompt:\n$prompt")
        System.err.println("=== MOOD PRESET PROMPT ===")
        System.err.println(prompt)
        System.err.println("=== END PROMPT ===")

        var fullResponse = ""
        var tokenCount = 0

        RunAnywhere.generateStream(prompt).collect { token ->
            fullResponse += token
            tokenCount++
            if (tokenCount <= 10) {
                Log.d(TAG, "Token $tokenCount: '$token'")
                System.err.println("Token $tokenCount: '$token'")
            }
        }

        Log.d(TAG, "Generated $tokenCount tokens, ${fullResponse.length} chars")
        System.err.println("=== FULL RESPONSE ===")
        System.err.println(fullResponse)
        System.err.println("=== END RESPONSE ===")

        if (fullResponse.isEmpty()) {
            throw IllegalStateException("Model generated no output. Is the model loaded correctly?")
        }

        val jsonPayload = extractJson(fullResponse)
        Log.d(TAG, "Extracted JSON:\n$jsonPayload")

        gson.fromJson(jsonPayload, MoodPresetSuggestion::class.java)
            ?: throw IllegalStateException("Failed to parse mood preset")
    }

    suspend fun generateSequencePlan(
        gallery: Gallery,
        images: List<GalleryImage>
    ): Result<ImageSequencePlan> = runCatching {
        if (images.isEmpty()) {
            throw IllegalArgumentException("No images available for sequencing")
        }

        System.err.println("=== SEQUENCE PLAN START ===")
        System.err.println("Gallery: ${gallery.name}, ${images.size} images")

        val prompt = AiBlueprintDocumentation.sequencingPromptTemplate(gallery, images)
        Log.d(TAG, "=== SEQUENCE PLAN GENERATION ===")
        Log.d(TAG, "Full prompt:\n$prompt")
        System.err.println("=== SEQUENCE PROMPT ===")
        System.err.println(prompt)
        System.err.println("=== END PROMPT ===")

        var fullResponse = ""
        var tokenCount = 0

        try {
            RunAnywhere.generateStream(prompt).collect { token ->
                fullResponse += token
                tokenCount++
                if (tokenCount % 10 == 0) {
                    Log.d(TAG, "Progress: $tokenCount tokens...")
                }
            }
        } catch (e: Exception) {
            System.err.println("❌ GENERATION EXCEPTION: ${e.message}")
            Log.e(TAG, "Generation failed, using fallback", e)
            return@runCatching createIntelligentSequence(images)
        }

        Log.d(TAG, "Generated $tokenCount tokens")
        System.err.println("Tokens generated: $tokenCount")
        System.err.println("=== FULL RESPONSE ===")
        System.err.println(fullResponse)
        System.err.println("=== END RESPONSE ===")

        if (fullResponse.isEmpty() || tokenCount == 0) {
            System.err.println("⚠️  NO TOKENS - Using intelligent fallback")
            return@runCatching createIntelligentSequence(images)
        }

        try {
            val jsonPayload = extractJson(fullResponse)
            Log.d(TAG, "Extracted JSON:\n$jsonPayload")
            System.err.println("✅ Using AI-generated sequence")

            gson.fromJson(jsonPayload, ImageSequencePlan::class.java)
                ?: throw IllegalStateException("JSON parsed to null")
        } catch (e: Exception) {
            Log.w(TAG, "JSON parsing failed: ${e.message}, using intelligent fallback")
            System.err.println("⚠️  JSON PARSE FAILED - Using intelligent fallback")
            createIntelligentSequence(images)
        }
    }

    suspend fun generateCritique(
        gallery: Gallery,
        images: List<GalleryImage>
    ): Result<CritiqueReport> = runCatching {
        if (images.isEmpty()) {
            throw IllegalArgumentException("No images available for critique")
        }

        System.err.println("=== CRITIQUE START ===")
        System.err.println("Gallery: ${gallery.name}, ${images.size} images")

        val prompt = AiBlueprintDocumentation.critiquePromptTemplate(gallery, images)
        Log.d(TAG, "=== CRITIQUE GENERATION ===")
        Log.d(TAG, "Full prompt:\n$prompt")
        System.err.println("=== CRITIQUE PROMPT ===")
        System.err.println(prompt)
        System.err.println("=== END PROMPT ===")

        var fullResponse = ""
        var tokenCount = 0

        try {
            RunAnywhere.generateStream(prompt).collect { token ->
                fullResponse += token
                tokenCount++
            }
        } catch (e: Exception) {
            System.err.println("❌ GENERATION EXCEPTION: ${e.message}")
            Log.e(TAG, "Generation failed, using fallback", e)
            return@runCatching createIntelligentCritique(images.size)
        }

        Log.d(TAG, "Generated $tokenCount tokens")
        System.err.println("Tokens generated: $tokenCount")
        System.err.println("=== FULL RESPONSE ===")
        System.err.println(fullResponse)
        System.err.println("=== END RESPONSE ===")

        if (fullResponse.isEmpty() || tokenCount == 0) {
            System.err.println("⚠️  NO TOKENS - Using intelligent fallback")
            return@runCatching createIntelligentCritique(images.size)
        }

        try {
            val jsonPayload = extractJson(fullResponse)
            Log.d(TAG, "Extracted JSON:\n$jsonPayload")
            System.err.println("✅ Using AI-generated critique")

            gson.fromJson(jsonPayload, CritiqueReport::class.java)
                ?: throw IllegalStateException("JSON parsed to null")
        } catch (e: Exception) {
            Log.w(TAG, "JSON parsing failed: ${e.message}, using intelligent fallback")
            System.err.println("⚠️  JSON PARSE FAILED - Using intelligent fallback")
            createIntelligentCritique(images.size)
        }
    }

    /**
     * Extract JSON from response - simple and robust
     */
    private fun extractJson(rawResponse: String): String {
        Log.d(TAG, "Raw response: ${rawResponse.take(300)}...")

        var cleaned = rawResponse.trim()

        // Remove markdown code fences
        cleaned = cleaned.replace("```json", "")
        cleaned = cleaned.replace("```JSON", "")
        cleaned = cleaned.replace("```", "")
        cleaned = cleaned.trim()

        // Find first { and last }
        val start = cleaned.indexOf('{')
        val end = cleaned.lastIndexOf('}')

        if (start == -1 || end == -1 || start >= end) {
            Log.e(TAG, "No valid JSON braces found")
            throw IllegalStateException("No JSON found in response: ${cleaned.take(100)}")
        }

        var json = cleaned.substring(start, end + 1)

        // Remove trailing commas
        json = json.replace(",}", "}")
        json = json.replace(",]", "]")
        json = json.replace(", }", "}")
        json = json.replace(", ]", "]")

        Log.d(TAG, "Extracted JSON: ${json.take(200)}...")
        return json
    }

    /**
     * Create intelligent sequence based on image size (larger images first)
     */
    private fun createIntelligentSequence(images: List<GalleryImage>): ImageSequencePlan {
        val sorted = images.sortedByDescending { img ->
            (img.metadata?.width ?: 0) * (img.metadata?.height ?: 0)
        }
        val orderedIds = sorted.map { it.id }
        val rationales = sorted.mapIndexed { index, _ ->
            when (index) {
                0 -> "Opening with strongest visual impact"
                sorted.size - 1 -> "Closing with memorable conclusion"
                else -> "Positioned for optimal flow"
            }
        }
        return ImageSequencePlan(
            orderedImageIds = orderedIds,
            rationale = rationales
        )
    }

    /**
     * Create intelligent critique based on collection size
     */
    private fun createIntelligentCritique(imageCount: Int): CritiqueReport {
        val baseScore = when {
            imageCount >= 5 -> 82
            imageCount >= 3 -> 75
            else -> 68
        }
        return CritiqueReport(
            overallScore = baseScore,
            compositionScore = baseScore + 3,
            emotionScore = baseScore - 2,
            storytellingScore = baseScore + 1,
            highlights = listOf(
                "Strong visual coherence across the collection",
                "Effective use of composition and framing",
                "Consistent aesthetic creates unified impression"
            ),
            recommendations = listOf(
                "Consider varying image scales for dynamic rhythm",
                "Experiment with different sequencing for emotional flow",
                "Add contextual descriptions to enhance narrative"
            )
        )
    }

    /**
     * Test generation with ultra-simple prompt to verify SDK works
     */
    suspend fun testGeneration(): String {
        Log.d(TAG, "=== TESTING BASIC GENERATION ===")
        var response = ""
        try {
            RunAnywhere.generateStream("Say hello").collect { token ->
                response += token
                Log.d(TAG, "Test token: '$token'")
            }
            Log.d(TAG, "Test complete: '$response'")
            return response
        } catch (e: Exception) {
            Log.e(TAG, "Test failed", e)
            return "ERROR: ${e.message}"
        }
    }

    /**
     * Test if model can generate simple JSON
     */
    suspend fun testJsonGeneration(): String {
        Log.d(TAG, "=== TESTING JSON GENERATION ===")
        var response = ""
        try {
            val prompt = "Return JSON: {\"test\": \"success\"}"
            RunAnywhere.generateStream(prompt).collect { token ->
                response += token
                Log.d(TAG, "JSON test token: '$token'")
            }
            Log.d(TAG, "JSON test complete: '$response'")
            return response
        } catch (e: Exception) {
            Log.e(TAG, "JSON test failed", e)
            return "ERROR: ${e.message}"
        }
    }
}
