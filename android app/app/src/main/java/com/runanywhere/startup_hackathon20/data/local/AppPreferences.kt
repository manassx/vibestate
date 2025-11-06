package com.runanywhere.startup_hackathon20.data.local

import android.content.Context
import android.content.SharedPreferences

class AppPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("cursor_gallery_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_IS_DARK_THEME = "is_dark_theme"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_FIRST_TIME = "first_time"
    }

    var isDarkTheme: Boolean
        get() = prefs.getBoolean(KEY_IS_DARK_THEME, true) // Default dark
        set(value) = prefs.edit().putBoolean(KEY_IS_DARK_THEME, value).apply()

    var isLoggedIn: Boolean
        get() = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_LOGGED_IN, value).apply()

    var userEmail: String?
        get() = prefs.getString(KEY_USER_EMAIL, null)
        set(value) = prefs.edit().putString(KEY_USER_EMAIL, value).apply()

    var userName: String?
        get() = prefs.getString(KEY_USER_NAME, null)
        set(value) = prefs.edit().putString(KEY_USER_NAME, value).apply()

    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(value) = prefs.edit().putString(KEY_USER_ID, value).apply()

    var authToken: String?
        get() = prefs.getString(KEY_AUTH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_AUTH_TOKEN, value).apply()

    var isFirstTime: Boolean
        get() = prefs.getBoolean(KEY_FIRST_TIME, true)
        set(value) = prefs.edit().putBoolean(KEY_FIRST_TIME, value).apply()

    fun logout() {
        isLoggedIn = false
        userEmail = null
        userName = null
        userId = null
        authToken = null
    }
}
