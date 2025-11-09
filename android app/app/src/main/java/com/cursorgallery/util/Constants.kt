package com.cursorgallery.util

object Constants {
    // API Configuration
    // FOR PHYSICAL DEVICE: Replace with your computer's IP address
    // To find your IP on Windows: Open Command Prompt and type "ipconfig"
    // Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x)
    // 
    // FOR EMULATOR: Use "10.0.2.2:8000"
    // FOR PHYSICAL DEVICE: Use "192.168.x.x:8000" (replace with your computer's IP)
    const val API_BASE_URL = "http://192.168.1.6:8000"

    // Gallery Configuration
    const val MAX_IMAGES_PER_GALLERY = 50
    const val MIN_IMAGES_FOR_GALLERY = 1
    const val MAX_FILE_SIZE = 10 * 1024 * 1024L // 10MB

    // Supported Image Formats
    val SUPPORTED_IMAGE_FORMATS = listOf(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    )

    // Threshold Configuration
    const val DEFAULT_THRESHOLD = 80
    const val MIN_THRESHOLD = 20
    const val MAX_THRESHOLD = 200
    val THRESHOLD_VALUES = listOf(20, 40, 80, 140, 200)

    // Animation Types
    object AnimationType {
        const val FADE = "fade"
        const val SLIDE = "slide"
        const val ZOOM = "zoom"
        const val BURST = "burst"
    }

    // Mood Types
    object MoodType {
        const val CALM = "calm"
        const val ENERGETIC = "energetic"
        const val DRAMATIC = "dramatic"
        const val PLAYFUL = "playful"
        const val ELEGANT = "elegant"
        const val MYSTERIOUS = "mysterious"
    }

    // Gallery Status
    object GalleryStatus {
        const val DRAFT = "draft"
        const val PROCESSING = "processing"
        const val PUBLISHED = "published"
    }

    // Error Messages
    object ErrorMessages {
        const val NETWORK_ERROR = "Network error. Please check your connection."
        const val UNAUTHORIZED = "Please log in to continue."
        const val FORBIDDEN = "You do not have permission to perform this action."
        const val NOT_FOUND = "The requested resource was not found."
        const val SERVER_ERROR = "Something went wrong. Please try again later."
        const val VALIDATION_ERROR = "Please check your input and try again."
        const val FILE_TOO_LARGE = "File is too large. Maximum size is 10MB."
        const val INVALID_FILE_TYPE = "Invalid file type. Please upload JPEG, PNG, or WebP images."
        const val TOO_MANY_FILES = "Too many files. Maximum is 50 images per gallery."
    }
}
