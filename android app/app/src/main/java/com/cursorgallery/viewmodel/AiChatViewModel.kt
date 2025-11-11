package com.cursorgallery.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cursorgallery.ai.AiOrchestrator
import com.cursorgallery.data.models.Gallery
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import android.util.Log

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

data class AiChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isTyping: Boolean = false,
    val error: String? = null
)

class AiChatViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(AiChatUiState())
    val uiState: StateFlow<AiChatUiState> = _uiState.asStateFlow()

    private val TAG = "AiChatViewModel"

    fun sendMessage(userMessage: String, gallery: Gallery) {
        if (userMessage.isBlank()) return

        Log.d(TAG, "Sending message: $userMessage")

        // Add user message
        val userChatMessage = ChatMessage(
            text = userMessage.trim(),
            isUser = true
        )
        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + userChatMessage,
            isTyping = true,
            error = null
        )

        // Generate AI response
        viewModelScope.launch {
            try {
                var aiResponse = ""
                var aiMessageId = ""

                AiOrchestrator.generateChatResponse(userMessage, gallery).collect { token ->
                    aiResponse += token

                    // Update or create AI message with streaming text
                    val currentMessages = _uiState.value.messages.toMutableList()
                    val existingAiMessageIndex = currentMessages.indexOfLast { it.id == aiMessageId }

                    if (existingAiMessageIndex != -1) {
                        // Update existing message
                        currentMessages[existingAiMessageIndex] = currentMessages[existingAiMessageIndex].copy(
                            text = aiResponse
                        )
                    } else {
                        // Create new AI message
                        aiMessageId = java.util.UUID.randomUUID().toString()
                        currentMessages.add(
                            ChatMessage(
                                id = aiMessageId,
                                text = aiResponse,
                                isUser = false
                            )
                        )
                    }

                    _uiState.value = _uiState.value.copy(messages = currentMessages)
                }

                // Final state update
                _uiState.value = _uiState.value.copy(
                    isTyping = false,
                    error = null
                )

                Log.d(TAG, "AI response complete: $aiResponse")

            } catch (e: Exception) {
                Log.e(TAG, "Error generating response", e)
                _uiState.value = _uiState.value.copy(
                    isTyping = false,
                    error = "Sorry, something went wrong. Please try again."
                )

                // Add error message
                val errorMessage = ChatMessage(
                    text = "Sorry, I encountered an error. Please try again.",
                    isUser = false
                )
                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + errorMessage
                )
            }
        }
    }

    fun clearChat() {
        _uiState.value = AiChatUiState()
    }
}
