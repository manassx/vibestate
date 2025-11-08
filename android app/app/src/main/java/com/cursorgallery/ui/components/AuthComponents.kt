package com.cursorgallery.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.abs
import kotlin.random.Random

@Composable
fun FloatingLabelTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    backgroundColor: Color,
    borderColor: Color,
    textColor: Color,
    labelColor: Color,
    enabled: Boolean = true
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxSize(),
            label = { Text(label, fontSize = 14.sp) },
            keyboardOptions = keyboardOptions,
            singleLine = true,
            enabled = enabled,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = backgroundColor,
                unfocusedContainerColor = backgroundColor,
                disabledContainerColor = backgroundColor,
                focusedBorderColor = borderColor,
                unfocusedBorderColor = borderColor,
                focusedTextColor = textColor,
                unfocusedTextColor = textColor,
                focusedLabelColor = labelColor,
                unfocusedLabelColor = labelColor
            ),
            shape = RoundedCornerShape(8.dp)
        )
    }
}

@Composable
fun FloatingLabelPasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    passwordVisible: Boolean,
    onPasswordVisibilityChange: (Boolean) -> Unit,
    backgroundColor: Color,
    borderColor: Color,
    textColor: Color,
    labelColor: Color,
    enabled: Boolean = true
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxSize(),
            label = { Text(label, fontSize = 14.sp) },
            visualTransformation = if (passwordVisible)
                VisualTransformation.None
            else
                PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            trailingIcon = {
                IconButton(onClick = { onPasswordVisibilityChange(!passwordVisible) }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                        tint = labelColor
                    )
                }
            },
            singleLine = true,
            enabled = enabled,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = backgroundColor,
                unfocusedContainerColor = backgroundColor,
                disabledContainerColor = backgroundColor,
                focusedBorderColor = borderColor,
                unfocusedBorderColor = borderColor,
                focusedTextColor = textColor,
                unfocusedTextColor = textColor,
                focusedLabelColor = labelColor,
                unfocusedLabelColor = labelColor
            ),
            shape = RoundedCornerShape(8.dp)
        )
    }
}

@Composable
fun GoogleLogo(modifier: Modifier = Modifier) {
    // Official Google "G" logo - matching website's exact SVG implementation
    // Using the same 4-color approach from LoginPage.jsx
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height

        // Scale factor to fit the logo in the available space
        val scale = minOf(width, height) / 24f

        // Google Blue section (top-right)
        drawPath(
            path = Path().apply {
                moveTo(22.56f * scale, 12.25f * scale)
                cubicTo(
                    22.56f * scale, 11.47f * scale,
                    22.49f * scale, 10.72f * scale,
                    22.36f * scale, 10f * scale
                )
                lineTo(12f * scale, 10f * scale)
                lineTo(12f * scale, 14.26f * scale)
                lineTo(17.92f * scale, 14.26f * scale)
                cubicTo(
                    17.66f * scale, 15.63f * scale,
                    16.88f * scale, 16.79f * scale,
                    15.71f * scale, 17.57f * scale
                )
                lineTo(15.71f * scale, 20.34f * scale)
                lineTo(19.28f * scale, 20.34f * scale)
                cubicTo(
                    21.36f * scale, 18.42f * scale,
                    22.56f * scale, 15.6f * scale,
                    22.56f * scale, 12.25f * scale
                )
                close()
            },
            color = Color(0xFF4285F4), // Google Blue
            style = Fill
        )

        // Google Green section (bottom-right)
        drawPath(
            path = Path().apply {
                moveTo(12f * scale, 23f * scale)
                cubicTo(
                    14.97f * scale, 23f * scale,
                    17.46f * scale, 22.02f * scale,
                    19.28f * scale, 20.34f * scale
                )
                lineTo(15.71f * scale, 17.57f * scale)
                cubicTo(
                    14.73f * scale, 18.23f * scale,
                    13.48f * scale, 18.63f * scale,
                    12f * scale, 18.63f * scale
                )
                cubicTo(
                    9.14f * scale, 18.63f * scale,
                    6.71f * scale, 16.7f * scale,
                    5.84f * scale, 14.1f * scale
                )
                lineTo(2.18f * scale, 14.1f * scale)
                lineTo(2.18f * scale, 16.94f * scale)
                cubicTo(
                    3.99f * scale, 20.53f * scale,
                    7.7f * scale, 23f * scale,
                    12f * scale, 23f * scale
                )
                close()
            },
            color = Color(0xFF34A853), // Google Green
            style = Fill
        )

        // Google Yellow section (bottom-left)
        drawPath(
            path = Path().apply {
                moveTo(5.84f * scale, 14.09f * scale)
                cubicTo(
                    5.62f * scale, 13.43f * scale,
                    5.49f * scale, 12.73f * scale,
                    5.49f * scale, 12f * scale
                )
                cubicTo(
                    5.49f * scale, 11.27f * scale,
                    5.62f * scale, 10.57f * scale,
                    5.84f * scale, 9.91f * scale
                )
                lineTo(5.84f * scale, 7.07f * scale)
                lineTo(2.18f * scale, 7.07f * scale)
                cubicTo(
                    1.43f * scale, 8.55f * scale,
                    1f * scale, 10.22f * scale,
                    1f * scale, 12f * scale
                )
                cubicTo(
                    1f * scale, 13.78f * scale,
                    1.43f * scale, 15.45f * scale,
                    2.18f * scale, 16.93f * scale
                )
                lineTo(5.03f * scale, 14.71f * scale)
                lineTo(5.84f * scale, 14.09f * scale)
                close()
            },
            color = Color(0xFFFBBC05), // Google Yellow
            style = Fill
        )

        // Google Red section (top-left)
        drawPath(
            path = Path().apply {
                moveTo(12f * scale, 5.38f * scale)
                cubicTo(
                    13.62f * scale, 5.38f * scale,
                    15.06f * scale, 5.94f * scale,
                    16.21f * scale, 7.02f * scale
                )
                lineTo(19.36f * scale, 3.87f * scale)
                cubicTo(
                    17.45f * scale, 2.09f * scale,
                    14.97f * scale, 1f * scale,
                    12f * scale, 1f * scale
                )
                cubicTo(
                    7.7f * scale, 1f * scale,
                    3.99f * scale, 3.47f * scale,
                    2.18f * scale, 7.07f * scale
                )
                lineTo(5.84f * scale, 9.91f * scale)
                cubicTo(
                    6.71f * scale, 7.31f * scale,
                    9.14f * scale, 5.38f * scale,
                    12f * scale, 5.38f * scale
                )
                close()
            },
            color = Color(0xFFEA4335), // Google Red
            style = Fill
        )
    }
}
