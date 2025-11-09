package com.cursorgallery.ai

import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.GalleryImage

internal object AiBlueprintDocumentation {

    private val heroDescription = buildString {
        appendLine("CursorGallery AI elevates galleries without cloud calls.")
        appendLine("All intelligence runs on-device using RunAnywhere models.")
    }

    val architectureOverview: String = heroDescription + "\n" + buildString {
        appendLine("1. RunAnywhereManager bootstraps SDK state on app launch.")
        appendLine("2. AiActionBlueprints catalog UI actions and payload contracts.")
        appendLine("3. ViewModels orchestrate streaming replies via RunAnywhere APIs.")
        appendLine("4. Results sync to Supabase using existing ApiClient endpoints.")
    }

    fun moodDjPromptTemplate(userPrompt: String, gallery: Gallery): String {
        return buildString {
            appendLine("System: You design animation presets for cursor-driven art galleries.")
            appendLine("Gallery name: ${gallery.name}")
            appendLine("Gallery mood setting: ${gallery.config?.mood ?: "calm"}")
            appendLine("User vibe request: $userPrompt")
            appendLine("Respond with JSON containing title, description, animationType, mood, colorPaletteHex[].")
        }
    }

    fun critiquePromptTemplate(gallery: Gallery, images: List<GalleryImage>): String {
        return buildString {
            appendLine("System: You are an art curator evaluating a portfolio.")
            appendLine("Gallery: ${gallery.name}")
            appendLine("Expect JSON with overallScore, compositionScore, emotionScore, storytellingScore, highlights[], recommendations[].")
            appendLine("Images summary:")
            images.forEachIndexed { index, image ->
                appendLine("${index + 1}. id=${image.id}, notes=${image.metadata?.format ?: "unknown"}")
            }
        }
    }

    fun sequencingPromptTemplate(gallery: Gallery, images: List<GalleryImage>): String {
        return buildString {
            appendLine("System: Reorder images for best narrative flow.")
            appendLine("Gallery: ${gallery.name}")
            appendLine("Return JSON with orderedImageIds[], rationale[].")
            appendLine("Image cues:")
            images.forEach { image ->
                appendLine("- id=${image.id}, dims=${image.metadata?.width}x${image.metadata?.height}, order=${image.orderIndex}")
            }
        }
    }
}
