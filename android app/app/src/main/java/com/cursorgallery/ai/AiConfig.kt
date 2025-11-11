package com.cursorgallery.ai

import androidx.annotation.VisibleForTesting

internal object AiFeatureToggle {
    @Volatile
    var isEnabled: Boolean = true
        private set

    fun disable() {
        isEnabled = false
    }

    fun enable() {
        isEnabled = true
    }
}

internal object AiConfig {
    const val apiKey: String = "dev"

    /**
     * DEMO MODE: Enable this if model generation fails
     * This will return mock AI responses instead of real generation
     * Perfect for hackathon demos when time is limited!
     */
    const val DEMO_MODE = false  // Set to true for guaranteed working demo

    val models: List<AiModelDefinition> = listOf(
        AiModelDefinition(
            name = "Qwen 2.5 0.5B Instruct Q6_K",
            type = "LLM",
            url = "https://huggingface.co/Triangle104/Qwen2.5-0.5B-Instruct-Q6_K-GGUF/resolve/main/qwen2.5-0.5b-instruct-q6_k.gguf"
        ),
        AiModelDefinition(
            name = "SmolLM2 360M Q8_0",
            type = "LLM",
            url = "https://huggingface.co/prithivMLmods/SmolLM2-360M-GGUF/resolve/main/SmolLM2-360M.Q8_0.gguf"
        ),
        AiModelDefinition(
            name = "Llama 3.2 1B Instruct Q6_K",
            type = "LLM",
            url = "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K_L.gguf"
        )
    )
}

internal data class AiModelDefinition(
    val name: String,
    val type: String,
    val url: String
)

@VisibleForTesting
internal fun resetAiFeatureToggle() {
    AiFeatureToggle.enable()
}
