package com.runanywhere.startup_hackathon20.data.remote

import android.content.Context
import com.runanywhere.startup_hackathon20.data.local.AppPreferences
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    
    // Base URL - Change this to your deployed backend URL
    // For local testing, use your computer's IP address (not localhost)
    // Example: "http://192.168.1.100:8000/" or deployed URL
    private const val BASE_URL = "http://192.168.1.6:8000/" // Your computer's IP: 192.168.1.6
    
    private var apiService: ApiService? = null
    
    fun getApiService(context: Context): ApiService {
        if (apiService == null) {
            apiService = createApiService(context)
        }
        return apiService!!
    }
    
    private fun createApiService(context: Context): ApiService {
        val appContext = context.applicationContext
        
        // Logging interceptor for debugging
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        
        // Auth interceptor to add JWT token to requests
        val authInterceptor = Interceptor { chain ->
            val originalRequest = chain.request()
            val requestBuilder = originalRequest.newBuilder()
            
            // Get token from preferences DYNAMICALLY on each request
            val prefs = AppPreferences(appContext)
            val token = prefs.authToken
            
            // Add Authorization header if token exists
            if (!token.isNullOrEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
                android.util.Log.d("ApiClient", "Using token: ${token.take(20)}...")
            } else {
                android.util.Log.w("ApiClient", "No auth token available!")
            }
            
            // Add other headers
            requestBuilder.addHeader("Accept", "application/json")
            
            val request = requestBuilder.build()
            chain.proceed(request)
        }
        
        // Build OkHttp client
        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
        
        // Build Retrofit instance
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        return retrofit.create(ApiService::class.java)
    }
    
    /**
     * Reset API service (useful when switching accounts or clearing token)
     */
    fun reset() {
        apiService = null
    }
    
    /**
     * Get base URL for direct image loading
     */
    fun getBaseUrl(): String = BASE_URL
}
