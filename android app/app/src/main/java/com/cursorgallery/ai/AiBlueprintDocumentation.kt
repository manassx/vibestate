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
        return """
Gallery: ${gallery.name}
Request: $userPrompt

Create a mood preset. Return only JSON:
{
  "title": "2-3 word title",
  "description": "short description",
  "animationType": "fade",
  "mood": "one word",
  "colorPaletteHex": ["#HEX1", "#HEX2", "#HEX3"]
}
""".trimIndent()
    }

    fun critiquePromptTemplate(gallery: Gallery, images: List<GalleryImage>): String {
        return """
Portfolio: ${gallery.name} (${images.size} images)

Rate this portfolio 0-100 and give feedback. Return only JSON:
{
  "overallScore": 85,
  "compositionScore": 80,
  "emotionScore": 90,
  "storytellingScore": 85,
  "highlights": ["strength 1", "strength 2"],
  "recommendations": ["tip 1", "tip 2"]
}
""".trimIndent()
    }

    fun sequencingPromptTemplate(gallery: Gallery, images: List<GalleryImage>): String {
        val ids = images.map { it.id }
        return """
Reorder these image IDs for best visual flow: ${ids.joinToString(", ")}

Return only JSON with ALL IDs:
{
  "orderedImageIds": [${ids.joinToString(", ") { "\"$it\"" }}],
  "rationale": ["reason 1", "reason 2", "reason 3"]
}
""".trimIndent()
    }

    /**
     * Generate creative description for a gallery based on its images and title
     */
    fun descriptionGeneratorPrompt(galleryTitle: String, imageCount: Int): String {
        return buildString {
            appendLine("You are a creative writer helping artists describe their visual portfolios.")
            appendLine()
            appendLine("Gallery Title: $galleryTitle")
            appendLine("Number of Images: $imageCount")
            appendLine()
            appendLine("Write a compelling, concise description (30-50 words) that:")
            appendLine("1. Captures the essence and mood of the gallery")
            appendLine("2. Invites viewers to explore")
            appendLine("3. Is professional yet creative")
            appendLine()
            appendLine("Respond ONLY with the description text (no JSON, no extra formatting).")
        }
    }

    /**
     * Generate social media captions for sharing the gallery
     */
    fun socialCaptionPrompt(gallery: Gallery, platform: String): String {
        return buildString {
            appendLine("You are a social media expert creating engaging captions.")
            appendLine()
            appendLine("Gallery: ${gallery.name}")
            appendLine("Description: ${gallery.description ?: "Visual collection"}")
            appendLine("Platform: $platform")
            appendLine("Images: ${gallery.images?.size ?: 0}")
            appendLine()
            appendLine("Create a $platform caption that:")
            when (platform) {
                "Twitter" -> appendLine("- Is under 280 characters\n- Uses 2-3 relevant hashtags\n- Is punchy and shareable")
                "Instagram" -> appendLine("- Is engaging and visual\n- Uses 5-10 relevant hashtags\n- Includes call-to-action")
                "LinkedIn" -> appendLine("- Is professional\n- Highlights creative work\n- Uses 3-5 industry hashtags")
                else -> appendLine("- Is engaging and platform-appropriate")
            }
            appendLine()
            appendLine("Respond ONLY with the caption text (no JSON, include hashtags).")
        }
    }

    /**
     * Answer visitor questions about the gallery (contextual chat)
     */
    fun contextualChatPrompt(gallery: Gallery, visitorQuestion: String): String {
        val imageInfo = gallery.images?.take(5)?.mapIndexed { index, img ->
            "Image ${index + 1}: ${img.metadata?.width}x${img.metadata?.height}"
        }?.joinToString("\n") ?: "No images"

        return buildString {
            appendLine("You are a knowledgeable gallery assistant helping visitors understand the work.")
            appendLine()
            appendLine("Gallery: ${gallery.name}")
            appendLine("Description: ${gallery.description ?: "Creative portfolio"}")
            appendLine("Images: ${gallery.images?.size ?: 0}")
            appendLine()
            appendLine("Sample Images:")
            appendLine(imageInfo)
            appendLine()
            appendLine("Visitor asks: $visitorQuestion")
            appendLine()
            appendLine("Provide a helpful, friendly response (2-3 sentences) that:")
            appendLine("- Answers their question based on available information")
            appendLine("- Is conversational and welcoming")
            appendLine("- Encourages further exploration if appropriate")
            appendLine()
            appendLine("Respond ONLY with your answer (no JSON, no formatting).")
        }
    }

    /**
     * Generate artist statement or portfolio introduction
     */
    fun artistStatementPrompt(gallery: Gallery): String {
        return buildString {
            appendLine("You are helping an artist write a professional statement about their work.")
            appendLine()
            appendLine("Portfolio: ${gallery.name}")
            appendLine("Description: ${gallery.description ?: "Visual work"}")
            appendLine("Collection Size: ${gallery.images?.size ?: 0} pieces")
            appendLine()
            appendLine("Write a brief artist statement (40-60 words) that:")
            appendLine("1. Explains the creative vision or theme")
            appendLine("2. Describes the artistic approach")
            appendLine("3. Conveys the emotional or conceptual intent")
            appendLine("4. Is professional but authentic")
            appendLine()
            appendLine("Respond ONLY with the statement text (no JSON, no labels).")
        }
    }
}
