package com.cursorgallery.ai

import androidx.compose.runtime.Immutable
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.data.models.GalleryImage

internal object AiActionBlueprints {

    val actions: List<AiActionDescriptor> = listOf(
        AiActionDescriptor(
            id = "mood_dj",
            title = "Mood DJ",
            description = "Crafts animation presets from vibe prompts",
            type = AiActionType.GalleryEnhancement
        ),
        AiActionDescriptor(
            id = "image_sequencer",
            title = "Sequence Optimizer",
            description = "Reorders images for maximum visual flow",
            type = AiActionType.GalleryEnhancement
        ),
        AiActionDescriptor(
            id = "ai_critic",
            title = "Personal Critic",
            description = "Scores composition, emotion, storytelling",
            type = AiActionType.Analysis
        ),
        AiActionDescriptor(
            id = "contextual_chat",
            title = "Contextual Chat",
            description = "Answers visitor questions about this gallery",
            type = AiActionType.Interactive
        ),
        AiActionDescriptor(
            id = "workflow_automation",
            title = "Creator Automations",
            description = "Generates copy for captions, socials, and outreach",
            type = AiActionType.Automation
        )
    )
}

@Immutable
internal data class AiActionDescriptor(
    val id: String,
    val title: String,
    val description: String,
    val type: AiActionType
)

internal enum class AiActionType {
    GalleryEnhancement,
    Analysis,
    Interactive,
    Automation
}

// Made fields nullable with defaults to handle incomplete JSON
internal data class MoodPresetSuggestion(
    val title: String = "Untitled Preset",
    val description: String = "Generated atmosphere preset",
    val animationType: String = "fade",
    val mood: String = "calm",
    val colorPaletteHex: List<String> = listOf("#FFFFFF", "#EEEEEE", "#DDDDDD")
)

// Made fields nullable with defaults
internal data class ImageSequencePlan(
    val orderedImageIds: List<String> = emptyList(),
    val rationale: List<String> = emptyList()
)

// Made fields nullable with defaults to handle incomplete JSON
internal data class CritiqueReport(
    val overallScore: Int = 0,
    val compositionScore: Int = 0,
    val emotionScore: Int = 0,
    val storytellingScore: Int = 0,
    val highlights: List<String> = emptyList(),
    val recommendations: List<String> = emptyList()
)

internal data class ViewerChatContext(
    val gallery: Gallery,
    val featuredImages: List<GalleryImage>
)
