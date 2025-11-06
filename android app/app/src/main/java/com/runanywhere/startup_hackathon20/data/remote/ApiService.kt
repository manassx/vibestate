package com.runanywhere.startup_hackathon20.data.remote

import com.runanywhere.startup_hackathon20.data.remote.models.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ==================== Authentication ====================

    @POST("api/auth/signup")
    suspend fun signup(@Body request: SignupRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/auth/logout")
    suspend fun logout(): Response<MessageResponse>

    // ==================== Galleries ====================

    @GET("api/galleries")
    suspend fun getGalleries(): Response<List<GalleryResponse>>

    @POST("api/galleries")
    suspend fun createGallery(@Body request: CreateGalleryRequest): Response<GalleryResponse>

    @GET("api/galleries/{id}")
    suspend fun getGallery(@Path("id") id: String): Response<GalleryDetailResponse>

    @PUT("api/galleries/{id}")
    suspend fun updateGallery(
        @Path("id") id: String,
        @Body request: UpdateGalleryRequest
    ): Response<GalleryResponse>

    @PATCH("api/galleries/{id}")
    suspend fun patchGallery(
        @Path("id") id: String,
        @Body request: Map<String, Any>
    ): Response<GalleryResponse>

    @DELETE("api/galleries/{id}")
    suspend fun deleteGallery(@Path("id") id: String): Response<MessageResponse>

    @Multipart
    @POST("api/galleries/{id}/upload")
    suspend fun uploadImages(
        @Path("id") id: String,
        @Part images: List<MultipartBody.Part>
    ): Response<UploadImagesResponse>

    @POST("api/galleries/{id}/analyze")
    suspend fun analyzeGallery(@Path("id") id: String): Response<AnalyzeResponse>

    // ==================== Public Access ====================

    @GET("api/gallery/{id}")
    suspend fun getPublicGallery(@Path("id") id: String): Response<PublicGalleryResponse>
}
