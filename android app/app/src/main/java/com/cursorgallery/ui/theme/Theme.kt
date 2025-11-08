package com.cursorgallery.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = DarkAccent,
    onPrimary = DarkBackground,
    primaryContainer = DarkBackgroundAlt,
    onPrimaryContainer = DarkText,

    secondary = DarkTextMuted,
    onSecondary = DarkBackground,
    secondaryContainer = DarkBorderAlt,
    onSecondaryContainer = DarkText,

    tertiary = DarkTextDim,
    onTertiary = DarkText,

    error = ErrorRed,
    onError = Color.White,
    errorContainer = ErrorRed.copy(alpha = 0.2f),
    onErrorContainer = ErrorRed,

    background = DarkBackground,
    onBackground = DarkText,

    surface = DarkBackgroundAlt,
    onSurface = DarkText,
    surfaceVariant = DarkBorderAlt,
    onSurfaceVariant = DarkTextMuted,

    outline = DarkBorder,
    outlineVariant = DarkBorderAlt,

    scrim = Color.Black.copy(alpha = 0.7f),

    inverseSurface = LightBackground,
    inverseOnSurface = LightText,
    inversePrimary = LightAccent
)

private val LightColorScheme = lightColorScheme(
    primary = LightAccent,
    onPrimary = LightBackground,
    primaryContainer = LightBackgroundAlt,
    onPrimaryContainer = LightText,

    secondary = LightTextMuted,
    onSecondary = LightBackground,
    secondaryContainer = LightBorderAlt,
    onSecondaryContainer = LightText,

    tertiary = LightTextDim,
    onTertiary = LightText,

    error = ErrorRed,
    onError = Color.White,
    errorContainer = ErrorRed.copy(alpha = 0.1f),
    onErrorContainer = ErrorRed,

    background = LightBackground,
    onBackground = LightText,

    surface = LightBackgroundAlt,
    onSurface = LightText,
    surfaceVariant = LightBorderAlt,
    onSurfaceVariant = LightTextMuted,

    outline = LightBorder,
    outlineVariant = LightBorderAlt,

    scrim = Color.Black.copy(alpha = 0.5f),

    inverseSurface = DarkBackground,
    inverseOnSurface = DarkText,
    inversePrimary = DarkAccent
)

@Composable
fun CursorGalleryTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as android.app.Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
