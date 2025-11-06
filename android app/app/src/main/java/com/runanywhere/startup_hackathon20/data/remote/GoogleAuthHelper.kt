package com.runanywhere.startup_hackathon20.data.remote

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import java.security.MessageDigest
import java.util.UUID

/**
 * Google Sign-In Helper using Credential Manager API
 * 
 * Setup Required:
 * 1. Get Web Client ID from Google Cloud Console
 * 2. Configure OAuth consent screen
 * 3. Add SHA-1 fingerprint to Firebase/Google Cloud
 */
class GoogleAuthHelper(private val context: Context) {

    // Web Client ID from Google Cloud Console
    private val webClientId =
        "80758309673-isqsdhs5fq1kdbff3evlrlg6ej5c8ngb.apps.googleusercontent.com"
    
    private val credentialManager = CredentialManager.create(context)
    
    /**
     * Sign in with Google using Credential Manager
     * Returns Google ID token on success
     */
    suspend fun signInWithGoogle(): Result<GoogleSignInResult> {
        return try {
            // Generate nonce for security
            val nonce = generateNonce()
            
            // Build Google ID option
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false) // Allow any Google account
                .setServerClientId(webClientId)
                .setNonce(nonce)
                .build()
            
            // Build credential request
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()
            
            // Get credential
            val result = credentialManager.getCredential(
                request = request,
                context = context
            )
            
            // Handle the response
            handleSignInResult(result)
        } catch (e: Exception) {
            Log.e("GoogleAuthHelper", "Sign-in failed", e)
            Result.failure(e)
        }
    }
    
    /**
     * Handle credential response and extract Google ID token
     */
    private fun handleSignInResult(result: GetCredentialResponse): Result<GoogleSignInResult> {
        return try {
            when (val credential = result.credential) {
                is CustomCredential -> {
                    if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                        try {
                            // Extract Google ID token credential
                            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                            
                            val signInResult = GoogleSignInResult(
                                idToken = googleIdTokenCredential.idToken,
                                email = googleIdTokenCredential.id,
                                displayName = googleIdTokenCredential.displayName ?: "",
                                profilePictureUri = googleIdTokenCredential.profilePictureUri?.toString()
                            )
                            
                            Result.success(signInResult)
                        } catch (e: GoogleIdTokenParsingException) {
                            Log.e("GoogleAuthHelper", "Invalid Google ID token", e)
                            Result.failure(e)
                        }
                    } else {
                        Log.e("GoogleAuthHelper", "Unexpected credential type: ${credential.type}")
                        Result.failure(Exception("Unexpected credential type"))
                    }
                }
                else -> {
                    Log.e("GoogleAuthHelper", "Unexpected credential class: ${credential::class.java.name}")
                    Result.failure(Exception("Unexpected credential class"))
                }
            }
        } catch (e: Exception) {
            Log.e("GoogleAuthHelper", "Failed to handle sign-in result", e)
            Result.failure(e)
        }
    }
    
    /**
     * Generate random nonce for security
     */
    private fun generateNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}

/**
 * Result data class for Google Sign-In
 */
data class GoogleSignInResult(
    val idToken: String,
    val email: String,
    val displayName: String,
    val profilePictureUri: String?
)
