package com.cursorgallery.data.api

import com.cursorgallery.data.models.*
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ==================== Auth Endpoints ====================

    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("/api/auth/signup")
    suspend fun signup(@Body request: SignupRequest): Response<AuthResponse>

    @POST("/api/auth/google")
    suspend fun googleAuth(@Body request: GoogleAuthRequest): Response<AuthResponse>

    @POST("/api/auth/logout")
    suspend fun logout(): Response<Map<String, String>>

    @GET("/api/auth/me")
    suspend fun getCurrentUser(): Response<Map<String, User>>

    // ==================== Gallery Endpoints ====================

    @GET("/api/galleries")
    suspend fun getGalleries(): Response<List<Gallery>>

    @POST("/api/galleries")
    suspend fun createGallery(@Body request: CreateGalleryRequest): Response<Gallery>

    @GET("/api/galleries/{id}")
    suspend fun getGallery(@Path("id") galleryId: String): Response<Gallery>

    @PUT("/api/galleries/{id}")
    suspend fun updateGallery(
        @Path("id") galleryId: String,
        @Body request: UpdateGalleryRequest
    ): Response<Gallery>

    @PATCH("/api/galleries/{id}")
    suspend fun patchGallery(
        @Path("id") galleryId: String,
        @Body request: UpdateGalleryRequest
    ): Response<Gallery>

    @DELETE("/api/galleries/{id}")
    suspend fun deleteGallery(@Path("id") galleryId: String): Response<Map<String, String>>

    @Multipart
    @POST("/api/galleries/{id}/upload")
    suspend fun uploadImages(
        @Path("id") galleryId: String,
        @Part images: List<MultipartBody.Part>
    ): Response<UploadResponse>

    @POST("/api/galleries/{id}/analyze")
    suspend fun analyzeGallery(@Path("id") galleryId: String): Response<Map<String, Any>>

    @PATCH("/api/galleries/{id}/branding")
    suspend fun updateGalleryBranding(
        @Path("id") galleryId: String,
        @Body branding: Map<String, String?>
    ): Response<Map<String, Any>>

    // ==================== Image Endpoints ====================

    @PATCH("/api/images/{id}/transform")
    suspend fun updateImageTransform(
        @Path("id") imageId: String,
        @Body transform: ImageTransform
    ): Response<Map<String, Any>>

    // ==================== User Settings Endpoints ====================

    @GET("/api/user/settings")
    suspend fun getUserSettings(): Response<UserSettings>

    @PUT("/api/user/profile")
    suspend fun updateProfile(@Body profile: UpdateProfileRequest): Response<Map<String, Any>>

    @PUT("/api/user/preferences")
    suspend fun updatePreferences(@Body preferences: Preferences): Response<Map<String, Any>>

    @POST("/api/user/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<Map<String, String>>

    @GET("/api/user/export-data")
    suspend fun exportData(): Response<ResponseBody>

    @DELETE("/api/user/account")
    suspend fun deleteAccount(): Response<Map<String, String>>

    // ==================== Public Gallery Endpoints ====================

    @GET("/api/gallery/{id}")
    suspend fun getPublicGallery(@Path("id") galleryId: String): Response<Gallery>
}
