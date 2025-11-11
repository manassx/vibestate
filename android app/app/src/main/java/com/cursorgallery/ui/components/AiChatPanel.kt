package com.cursorgallery.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cursorgallery.data.models.Gallery
import com.cursorgallery.viewmodel.AiChatUiState
import com.cursorgallery.viewmodel.ChatMessage

@Composable
fun AiChatPanel(
    gallery: Gallery,
    uiState: AiChatUiState,
    onSendMessage: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0a0a0a))
            .navigationBarsPadding()
    ) {
        // BRUTALIST HEADER
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0a0a0a))
                .border(
                    width = 1.dp,
                    color = Color(0xFF2a2a2a),
                    shape = RectangleShape
                )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "AI ASSISTANT",
                        style = TextStyle(
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp,
                            letterSpacing = 2.sp,
                            color = Color(0xFFe8e8e8)
                        )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = gallery.name,
                        style = TextStyle(
                            fontSize = 12.sp,
                            letterSpacing = 1.sp,
                            color = Color(0xFFa8a8a8)
                        )
                    )
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color(0xFFa8a8a8),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }

        // Messages List
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            if (uiState.messages.isEmpty()) {
                // Suggested Prompts (when empty)
                SuggestedPrompts(
                    onPromptClick = { prompt ->
                        onSendMessage(prompt)
                    },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp)
                )
            } else {
                // Message List
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.messages, key = { it.id }) { message ->
                        ChatMessageBubble(message)
                    }

                    // Typing indicator
                    if (uiState.isTyping) {
                        item {
                            TypingIndicator()
                        }
                    }
                }
            }
        }

        // BRUTALIST INPUT FIELD
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0a0a0a))
                .border(
                    width = 1.dp,
                    color = Color(0xFF2a2a2a),
                    shape = RectangleShape
                )
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                BasicTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            color = Color(0xFF1a1a1a),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = Color(0xFF2a2a2a),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    textStyle = TextStyle(
                        fontSize = 14.sp,
                        letterSpacing = 0.3.sp,
                        color = Color(0xFFe8e8e8)
                    ),
                    decorationBox = { innerTextField ->
                        if (inputText.isEmpty()) {
                            Text(
                                "Ask about your portfolio...",
                                style = TextStyle(
                                    fontSize = 14.sp,
                                    letterSpacing = 0.3.sp,
                                    color = Color(0xFF666666)
                                )
                            )
                        }
                        innerTextField()
                    },
                    enabled = !uiState.isTyping,
                    maxLines = 3
                )

                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(
                            color = if (inputText.isNotBlank() && !uiState.isTyping)
                                Color(0xFFa89c8e)
                            else
                                Color(0xFF1a1a1a),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = Color(0xFF2a2a2a),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .clickable(enabled = inputText.isNotBlank() && !uiState.isTyping) {
                            if (inputText.isNotBlank()) {
                                onSendMessage(inputText)
                                inputText = ""
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Send,
                        contentDescription = "Send",
                        tint = if (inputText.isNotBlank() && !uiState.isTyping)
                            Color(0xFF0a0a0a)
                        else
                            Color(0xFF666666),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ChatMessageBubble(message: ChatMessage) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isUser) Arrangement.End else Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .padding(
                    start = if (message.isUser) 64.dp else 0.dp,
                    end = if (message.isUser) 0.dp else 64.dp
                )
                .background(
                    color = if (message.isUser)
                        Color(0xFF1a1a1a)
                    else
                        Color(0xFF0a0a0a),
                    shape = RoundedCornerShape(4.dp)
                )
                .border(
                    width = 1.dp,
                    color = Color(0xFF2a2a2a),
                    shape = RoundedCornerShape(4.dp)
                )
                .padding(16.dp)
        ) {
            Column {
                Text(
                    text = if (message.isUser) "YOU" else "AI",
                    style = TextStyle(
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                        color = Color(0xFF666666)
                    ),
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                Text(
                    text = message.text,
                    style = TextStyle(
                        fontSize = 14.sp,
                        lineHeight = 20.sp,
                        letterSpacing = 0.3.sp,
                        color = Color(0xFFe8e8e8)
                    )
                )
            }
        }
    }
}

@Composable
private fun TypingIndicator() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .background(
                    color = Color(0xFF0a0a0a),
                    shape = RoundedCornerShape(4.dp)
                )
                .border(
                    width = 1.dp,
                    color = Color(0xFF2a2a2a),
                    shape = RoundedCornerShape(4.dp)
                )
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "AI",
                    style = TextStyle(
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                        color = Color(0xFF666666)
                    )
                )
                Text(
                    text = "THINKING",
                    style = TextStyle(
                        fontSize = 11.sp,
                        letterSpacing = 1.sp,
                        color = Color(0xFF666666)
                    )
                )
                AnimatedDots()
            }
        }
    }
}

@Composable
private fun AnimatedDots() {
    val infiniteTransition = rememberInfiniteTransition(label = "dots")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Text(
        text = "...",
        style = TextStyle(
            fontSize = 11.sp,
            color = Color(0xFF666666).copy(alpha = alpha)
        )
    )
}

@Composable
private fun SuggestedPrompts(
    onPromptClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val suggestedPrompts = listOf(
        "Suggest a creative title",
        "What threshold value works best?",
        "How can I improve this portfolio?",
        "Write a short description"
    )

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "PORTFOLIO ASSISTANT",
            style = TextStyle(
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 3.sp,
                color = Color(0xFFe8e8e8)
            )
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Ask about titles, settings, or creative ideas",
            style = TextStyle(
                fontSize = 13.sp,
                letterSpacing = 0.5.sp,
                color = Color(0xFFa8a8a8)
            ),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        suggestedPrompts.forEach { prompt ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .background(
                        color = Color(0xFF1a1a1a),
                        shape = RoundedCornerShape(4.dp)
                    )
                    .border(
                        width = 1.dp,
                        color = Color(0xFF2a2a2a),
                        shape = RoundedCornerShape(4.dp)
                    )
                    .clickable { onPromptClick(prompt) }
                    .padding(16.dp)
            ) {
                Text(
                    prompt,
                    style = TextStyle(
                        fontSize = 14.sp,
                        letterSpacing = 0.5.sp,
                        color = Color(0xFFe8e8e8)
                    )
                )
            }
        }
    }
}
