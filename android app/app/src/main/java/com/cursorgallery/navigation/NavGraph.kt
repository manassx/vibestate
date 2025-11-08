package com.cursorgallery.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cursorgallery.data.local.TokenManager
import com.cursorgallery.ui.screens.auth.LoginScreen
import com.cursorgallery.ui.screens.auth.SignupScreen
import com.cursorgallery.ui.screens.home.DashboardScreen
import com.cursorgallery.ui.screens.splash.SplashScreen

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Signup : Screen("signup")
    object Dashboard : Screen("dashboard")
    object Gallery : Screen("gallery/{galleryId}")
    object Editor : Screen("editor/{galleryId}")
    object Settings : Screen("settings")
    object Share : Screen("share/{galleryId}")
}

@Composable
fun NavGraph(
    tokenManager: TokenManager,
    navController: NavHostController = rememberNavController()
) {
    val token by tokenManager.getToken().collectAsState(initial = null)

    val startDestination = if (token.isNullOrEmpty()) {
        Screen.Splash.route
    } else {
        Screen.Dashboard.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateToLogin = { navController.navigate(Screen.Login.route) },
                onNavigateToDashboard = { navController.navigate(Screen.Dashboard.route) }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                tokenManager = tokenManager,
                onNavigateToSignup = { navController.navigate(Screen.Signup.route) },
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Signup.route) {
            SignupScreen(
                tokenManager = tokenManager,
                onNavigateToLogin = { navController.popBackStack() },
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Signup.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                tokenManager = tokenManager,
                navController = navController,
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // TODO: Add other screens (Gallery, Editor, Settings, Share)
    }
}
