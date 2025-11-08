package com.cursorgallery.ui.screens.auth

import android.app.Activity
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cursorgallery.data.api.ApiClient
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.data.models.GoogleAuthRequest
import com.cursorgallery.data.models.LoginRequest
import com.cursorgallery.ui.components.FloatingLabelPasswordField
import com.cursorgallery.ui.components.FloatingLabelTextField
import com.cursorgallery.ui.components.GoogleLogo
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    tokenManager: TokenManager,
    onNavigateToSignup: () -> Unit,
    onNavigateToDashboard: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var rememberMe by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    // Google Sign-In launcher
    val googleSignInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.d("GoogleSignIn", "Result received: resultCode=${result.resultCode}")

        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                val idToken = account.idToken
                val googleEmail = account.email
                val googleName = account.displayName

                Log.d(
                    "GoogleSignIn",
                    "Account retrieved: email=$googleEmail, hasToken=${idToken != null}"
                )

                if (idToken != null && googleEmail != null) {
                    scope.launch {
                        isLoading = true
                        errorMessage = null

                        try {
                            Log.d("GoogleSignIn", "Sending auth request to backend...")
                            val response = ApiClient.apiService.googleAuth(
                                GoogleAuthRequest(
                                    idToken = idToken,
                                    email = googleEmail,
                                    name = googleName ?: ""
                                )
                            )

                            Log.d("GoogleSignIn", "Response code: ${response.code()}")

                            if (response.isSuccessful && response.body() != null) {
                                val authResponse = response.body()!!
                                Log.d("GoogleSignIn", "Authentication successful")

                                tokenManager.saveToken(authResponse.token)
                                tokenManager.saveUser(
                                    userId = authResponse.user.id,
                                    email = authResponse.user.email,
                                    name = authResponse.user.name ?: ""
                                )

                                onNavigateToDashboard()
                            } else {
                                val errorBody = response.errorBody()?.string()
                                Log.e(
                                    "GoogleSignIn",
                                    "Auth failed: ${response.code()}, body: $errorBody"
                                )
                                errorMessage = "Google sign-in failed (${response.code()}): ${
                                    errorBody?.take(100) ?: "Unknown error"
                                }"
                            }
                        } catch (e: Exception) {
                            Log.e("GoogleSignIn", "Exception during auth", e)
                            errorMessage = "Network error: ${e.message}"
                        } finally {
                            isLoading = false
                        }
                    }
                } else {
                    Log.e("GoogleSignIn", "Missing idToken or email")
                    errorMessage = "Google sign-in incomplete - missing credentials"
                }
            } catch (e: ApiException) {
                Log.e("GoogleSignIn", "ApiException: statusCode=${e.statusCode}", e)
                errorMessage = "Google sign-in failed: ${e.message}"
            }
        } else if (result.resultCode == Activity.RESULT_CANCELED) {
            Log.d("GoogleSignIn", "User cancelled sign-in")
            errorMessage = "Sign-in cancelled"
        } else {
            Log.e("GoogleSignIn", "Unexpected result code: ${result.resultCode}")
            errorMessage = "Sign-in failed"
        }
    }

    // Theme colors matching web
    val backgroundColor = Color(0xFF0A0A0A)
    val cardBackgroundColor = Color(0xFF1A1A1A)
    val textColor = Color(0xFFE8E8E8)
    val textMutedColor = Color(0xFFA8A8A8)
    val textDimColor = Color(0xFF666666)
    val inputBackgroundColor = Color(0xFF1A1A1A)
    val inputBorderColor = Color(0xFF2A2A2A)
    val accentColor = Color(0xFFE8E8E8)
    val buttonBackgroundColor = Color(0xFFE8E8E8)
    val buttonTextColor = Color(0xFF0A0A0A)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header
            Text(
                text = "Sign In",
                fontSize = 40.sp,
                fontWeight = FontWeight.Black,
                color = textColor,
                letterSpacing = (-1).sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Subtitle with clickable link - only "Sign up" is clickable
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Don't have an account? ",
                    fontSize = 14.sp,
                    color = textMutedColor
                )
                Text(
                    text = "Sign up",
                    fontSize = 14.sp,
                    color = accentColor,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onNavigateToSignup() }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Card Container
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = cardBackgroundColor
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Email Field with Floating Label
                    FloatingLabelTextField(
                        value = email,
                        onValueChange = { 
                            email = it
                            errorMessage = null
                        },
                        label = "Email address",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        backgroundColor = inputBackgroundColor,
                        borderColor = inputBorderColor,
                        textColor = textColor,
                        labelColor = textDimColor,
                        enabled = !isLoading
                    )

                    // Password Field with Floating Label
                    FloatingLabelPasswordField(
                        value = password,
                        onValueChange = { 
                            password = it
                            errorMessage = null
                        },
                        label = "Password",
                        passwordVisible = passwordVisible,
                        onPasswordVisibilityChange = { passwordVisible = it },
                        backgroundColor = inputBackgroundColor,
                        borderColor = inputBorderColor,
                        textColor = textColor,
                        labelColor = textDimColor,
                        enabled = !isLoading
                    )

                    // Error Message
                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = Color(0xFFEF4444),
                            fontSize = 14.sp
                        )
                    }

                    // Remember me and Forgot password - Fixed layout
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f, fill = false)
                        ) {
                            Checkbox(
                                checked = rememberMe,
                                onCheckedChange = { rememberMe = it },
                                colors = CheckboxDefaults.colors(
                                    checkedColor = accentColor,
                                    uncheckedColor = textDimColor
                                )
                            )
                            Text(
                                text = "Remember me",
                                fontSize = 14.sp,
                                color = textMutedColor
                            )
                        }

                        TextButton(
                            onClick = { /* TODO: Implement forgot password */ },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                        ) {
                            Text(
                                text = "Forgot password?",
                                fontSize = 14.sp,
                                color = accentColor,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    // Sign In Button
                    Button(
                        onClick = {
                            scope.launch {
                                isLoading = true
                                errorMessage = null

                                try {
                                    val response = ApiClient.apiService.login(
                                        LoginRequest(email = email, password = password)
                                    )

                                    if (response.isSuccessful && response.body() != null) {
                                        val authResponse = response.body()!!

                                        tokenManager.saveToken(authResponse.token)
                                        tokenManager.saveUser(
                                            userId = authResponse.user.id,
                                            email = authResponse.user.email,
                                            name = authResponse.user.name ?: ""
                                        )

                                        onNavigateToDashboard()
                                    } else {
                                        errorMessage = "Invalid email or password"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = e.message ?: "Network error"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !isLoading && email.isNotEmpty() && password.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = buttonBackgroundColor,
                            contentColor = buttonTextColor
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = buttonTextColor
                            )
                        } else {
                            Text(
                                text = "Sign in",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    // Divider with OR
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(
                            modifier = Modifier.weight(1f),
                            color = inputBorderColor
                        )
                        Text(
                            text = "OR",
                            modifier = Modifier.padding(horizontal = 16.dp),
                            fontSize = 12.sp,
                            color = textDimColor
                        )
                        HorizontalDivider(
                            modifier = Modifier.weight(1f),
                            color = inputBorderColor
                        )
                    }

                    // Google Sign-In Button with Logo
                    OutlinedButton(
                        onClick = {
                            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                                .requestIdToken("80758309673-isqsdhs5fq1kdbff3evlrlg6ej5c8ngb.apps.googleusercontent.com")
                                .requestEmail()
                                .build()

                            val googleSignInClient =
                                GoogleSignIn.getClient(context as Activity, gso)

                            googleSignInClient.signOut().addOnCompleteListener {
                                val signInIntent = googleSignInClient.signInIntent
                                googleSignInLauncher.launch(signInIntent)
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !isLoading,
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = inputBackgroundColor,
                            contentColor = textColor
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, inputBorderColor),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // Google Logo
                            GoogleLogo(modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Sign in with Google",
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
