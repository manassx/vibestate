package com.cursorgallery.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String?,
    @SerializedName("createdAt") val createdAt: String?
)

data class AuthResponse(
    @SerializedName("user") val user: User,
    @SerializedName("token") val token: String,
    @SerializedName("message") val message: String? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class SignupRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("name") val name: String
)

data class GoogleAuthRequest(
    @SerializedName("idToken") val idToken: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String
)
