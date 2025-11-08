package com.cursorgallery.data.models

import com.google.gson.annotations.SerializedName

data class UserSettings(
    @SerializedName("profile") val profile: Profile,
    @SerializedName("preferences") val preferences: Preferences
)

data class Profile(
    @SerializedName("name") val name: String? = null,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("website") val website: String? = null,
    @SerializedName("location") val location: String? = null
)

data class Preferences(
    @SerializedName("emailNotifications") val emailNotifications: Boolean = true,
    @SerializedName("browserNotifications") val browserNotifications: Boolean = false,
    @SerializedName("galleryUpdates") val galleryUpdates: Boolean = true,
    @SerializedName("marketingEmails") val marketingEmails: Boolean = false,
    @SerializedName("defaultGalleryVisibility") val defaultGalleryVisibility: String = "private",
    @SerializedName("autoSave") val autoSave: Boolean = true,
    @SerializedName("compressImages") val compressImages: Boolean = true,
    @SerializedName("defaultThreshold") val defaultThreshold: Int = 80,
    @SerializedName("language") val language: String = "en"
)

data class UpdateProfileRequest(
    @SerializedName("name") val name: String? = null,
    @SerializedName("bio") val bio: String? = null,
    @SerializedName("website") val website: String? = null,
    @SerializedName("location") val location: String? = null
)

data class UpdatePreferencesRequest(
    @SerializedName("emailNotifications") val emailNotifications: Boolean? = null,
    @SerializedName("browserNotifications") val browserNotifications: Boolean? = null,
    @SerializedName("galleryUpdates") val galleryUpdates: Boolean? = null,
    @SerializedName("marketingEmails") val marketingEmails: Boolean? = null,
    @SerializedName("defaultGalleryVisibility") val defaultGalleryVisibility: String? = null,
    @SerializedName("autoSave") val autoSave: Boolean? = null,
    @SerializedName("compressImages") val compressImages: Boolean? = null,
    @SerializedName("defaultThreshold") val defaultThreshold: Int? = null,
    @SerializedName("language") val language: String? = null
)

data class ChangePasswordRequest(
    @SerializedName("currentPassword") val currentPassword: String,
    @SerializedName("newPassword") val newPassword: String
)
