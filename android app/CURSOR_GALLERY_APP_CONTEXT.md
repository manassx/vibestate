# 🎨 Cursor Gallery Android App - Complete Context Reference

**Last Updated:** January 2025  
**Project Status:** ✅ Fully Functional with Complete Dashboard Matching Web App  
**Platform:** Android (Native Kotlin + Jetpack Compose)

---

## 📋 PROJECT OVERVIEW

### What This Is:

A **native Android companion app** for the Cursor Gallery web application. The app allows users to:

- Create interactive photo galleries on their phone
- View galleries with a touch-based cursor trail effect
- Manage galleries locally with Room database
- Authenticate with demo mode (web backend integration pending)

### Tech Stack:

- **Language:** Kotlin
- **UI Framework:** Jetpack Compose (100% declarative UI)
- **Database:** Room (SQLite)
- **Image Loading:** Coil 2.5.0
- **Navigation:** Navigation Compose
- **Architecture:** MVVM (Model-View-ViewModel)
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 36

---

## 🗂️ PROJECT STRUCTURE

```
app/src/main/java/com/runanywhere/startup_hackathon20/
├── MainActivity.kt                          # Entry point, theme management
├── MyApplication.kt                         # App initialization (RunAnywhere SDK ready)
│
├── data/
│   ├── local/
│   │   ├── AppDatabase.kt                   # Room database singleton
│   │   ├── GalleryDao.kt                    # Database queries
│   │   ├── AppPreferences.kt                # SharedPreferences wrapper
│   │   └── entities/
│   │       ├── Gallery.kt                   # Gallery entity
│   │       ├── GalleryImage.kt              # Image entity (foreign key to Gallery)
│   │       └── GalleryWithImages.kt         # Relation wrapper
│   └── repository/
│       └── GalleryRepository.kt             # Data layer abstraction
│
├── viewmodel/
│   └── GalleryViewModel.kt                  # State management for galleries
│
├── ui/
│   ├── theme/
│   │   ├── Color.kt                         # Dark/Light theme colors
│   │   ├── Theme.kt                         # Material3 theme setup
│   │   └── Type.kt                          # Typography (default)
│   │
│   └── screens/
│       ├── WelcomeScreen.kt                 # First-time user onboarding
│       ├── LoginScreen.kt                   # Authentication (demo mode)
│       ├── SignupScreen.kt                  # User registration (demo mode)
│       ├── GalleryListScreen.kt             # Main dashboard, gallery cards
│       ├── CreateGalleryScreen.kt           # 2-step gallery creation
│       ├── GalleryDetailScreen.kt           # Grid view of gallery photos
│       └── PreviewScreen.kt                 # Touch-trail canvas + lightbox
│
└── navigation/
    └── NavGraph.kt                          # Navigation graph with auth flow
```

---

## 🎨 DESIGN SYSTEM (Matches Web App)

### Colors:

```kotlin
// Dark Theme (Default)
DarkBackground = Color(0xFF0A0A0A)        // #0a0a0a
DarkBackgroundAlt = Color(0xFF1A1A1A)     // #1a1a1a
DarkText = Color(0xFFE8E8E8)              // #e8e8e8
DarkTextDim = Color(0xFF9E9E9E)           // Muted text
DarkAccent = Color(0xFFD4C5B9)            // #d4c5b9 (beige accent)
DarkBorder = Color(0xFF2A2A2A)            // Subtle borders

// Light Theme (Ready but not UI-toggled yet)
LightBackground = Color(0xFFF5F3EF)       // #f5f3ef
LightText = Color(0xFF2A2520)             // #2a2520
LightAccent = Color(0xFFD4C5B9)           // Same accent
```

### Typography:

- **Headings:** Bold, uppercase, wide letter-spacing (like web app)
- **Body:** Normal weight, readable
- **Buttons:** Bold, uppercase, 2-3sp letter-spacing

### UI Patterns:

- Minimal design (clean, no clutter)
- Dark background, light text
- Rounded corners (8-24dp)
- Smooth transitions
- No heavy shadows

---

## 📱 APP FLOW

### First Launch:

```
WelcomeScreen
    ↓ [GET STARTED]
LoginScreen
    ↓ [LOGIN] (demo: any email/password works)
GalleryListScreen
```

### Returning User:

```
GalleryListScreen (auto-login via SharedPreferences)
```

### Gallery Creation Flow:

```
GalleryListScreen
    ↓ [+ FAB]
CreateGalleryScreen (Step 1: Name + Description)
    ↓ [CONTINUE]
CreateGalleryScreen (Step 2: Pick Photos - min 10)
    ↓ [CREATE GALLERY]
GalleryDetailScreen (shows grid of photos)
    ↓ [PREVIEW GALLERY]
PreviewScreen (touch-trail canvas)
```

---

## 🔑 KEY FILES EXPLAINED

### 1. **AppPreferences.kt**

Manages app settings using SharedPreferences:

- `isDarkTheme`: Boolean (default: true)
- `isLoggedIn`: Boolean
- `userEmail`: String?
- `userName`: String?
- `isFirstTime`: Boolean (for welcome screen)

### 2. **GalleryViewModel.kt**

Central state management:

- `galleries`: Flow<List<GalleryWithImages>>
- `currentGallery`: StateFlow<GalleryWithImages?>
- `isLoading`: StateFlow<Boolean>
- Methods: `createGallery()`, `loadGallery()`, `deleteGallery()`

### 3. **PreviewScreen.kt** (The Star of the Show)

Touch-based cursor trail implementation:

- **Drag gestures:** Place images on finger movement
- **Threshold:** Distance required between placements (default: 40px)
- **Max images:** 3-8 based on threshold
- **Image sizing:** Min 200px, max 80vw/55vh
- **Tap images:** Opens fullscreen lightbox
- **Lightbox:** Swipe navigation, close button, image counter

**Key Logic:**

```kotlin
// Distance check
val shouldPlace = lastPosition?.let { last ->
    abs(position.x - last.x) > threshold || 
    abs(position.y - last.y) > threshold
} ?: true

// Image sizing (mobile-optimized)
val minWidth = 200.dp.toPx()
val maxWidth = screenWidth * 0.8f
val maxHeight = screenHeight * 0.55f
```

### 4. **NavGraph.kt**

Handles all navigation and authentication flow:

- Determines start destination based on `AppPreferences`
- Manages auth state (login/signup → gallery list)
- Passes theme state throughout app

---

## 🎯 CURRENT FEATURES

### ✅ Implemented:

1. **Authentication System**
    - Welcome screen (first-time only)
    - Login/Signup screens (demo mode)
    - Persistent login state
    - Auto-login on app restart

2. **Gallery Management**
    - Create galleries (name, description, min 10 photos)
    - View gallery list
    - View gallery details (grid)
    - Local storage (Room database)

3. **Touch-Trail Preview**
    - Drag to place images
    - Adjustable threshold (20-80)
    - Fullscreen lightbox
    - Swipe navigation in lightbox
    - Image counter

4. **Theme System**
    - Dark mode (default)
    - Light mode (ready, needs UI toggle)
    - Theme persists across sessions

5. **Image Picker**
    - Pick multiple photos (max 50)
    - Grid preview with remove button
    - Minimum 10 photos required

### ❌ Not Yet Implemented:

- Theme toggle UI (button in dashboard/settings)
- Delete gallery functionality
- Edit gallery name/description
- Share gallery
- Settings screen
- Logout button
- Backend API integration
- AI features (RunAnywhere SDK ready but not integrated)

---

## 🚀 HOW TO BUILD/RUN

### Prerequisites:

- Android Studio (latest)
- JDK 17
- Android emulator or physical device (API 24+)

### Build Steps:

1. Open project: `D:/projects/CursorGallery/vibestate/android app`
2. Sync Gradle files
3. Click Run ▶️
4. Select emulator/device
5. Wait for installation (~30 seconds)

### First Run Experience:

1. Welcome screen appears
2. Tap "GET STARTED"
3. Enter any email/password (demo mode)
4. Tap "LOGIN"
5. Create your first gallery!

---

## 🔧 COMMON TASKS

### To Add a New Screen:

1. Create `XxxScreen.kt` in `ui/screens/`
2. Add route to `Screen` sealed class in `NavGraph.kt`
3. Add composable to `NavHost` in `NavGraph.kt`
4. Navigate using `navController.navigate(Screen.Xxx.route)`

### To Add Theme Toggle:

```kotlin
// In any screen with access to onThemeChange:
IconButton(onClick = { onThemeChange(!isDarkTheme) }) {
    Icon(
        if (isDarkTheme) Icons.Default.LightMode 
        else Icons.Default.DarkMode,
        contentDescription = "Toggle Theme"
    )
}
```

### To Add Delete Gallery:

1. In `GalleryViewModel.kt`: (already has `deleteGallery()`)
2. In `GalleryDetailScreen.kt`: Add delete button
3. Show confirmation dialog
4. Call `viewModel.deleteGallery(gallery) { navController.popBackStack() }`

---

## 📦 DEPENDENCIES

### Core:

```kotlin
// Jetpack Compose
implementation("androidx.compose.material3:material3")
implementation("androidx.navigation:navigation-compose:2.8.5")

// Room Database
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")
ksp("androidx.room:room-compiler:2.6.1")

// Image Loading
implementation("io.coil-kt:coil-compose:2.5.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
```

### RunAnywhere SDK (Ready but not used yet):

```kotlin
// Local AARs in app/libs/
implementation(files("libs/RunAnywhereKotlinSDK-release.aar"))
implementation(files("libs/runanywhere-llm-llamacpp-release.aar"))
// + Ktor, OkHttp, Retrofit, Gson, WorkManager, Security dependencies
```

---

## 🐛 KNOWN ISSUES / LIMITATIONS

1. **Demo Mode Only:** Login accepts any credentials (no backend validation)
2. **No Cloud Sync:** Galleries only stored locally
3. **No Theme Toggle UI:** Theme changes persist but no button to toggle
4. **No Delete Feature:** Can't delete galleries from UI
5. **No Edit Feature:** Can't edit gallery name/description after creation
6. **Image URIs:** Stored as strings (ContentProvider URIs - may break if phone restarts)

---

## 🎯 NEXT STEPS (User Requested)

### High Priority:

1. **Theme Toggle Button** - Add to dashboard/settings
2. **Delete Gallery** - Long-press or menu in gallery detail
3. **Settings Screen** - Profile, theme, logout
4. **Logout Button** - Clear auth state

### Future:

5. **Edit Gallery** - Rename, add/remove photos
6. **Share Gallery** - Generate link (needs backend)
7. **AI Integration** - RunAnywhere SDK for captions/naming
8. **Backend API** - Sync with web app

---

## 💬 WEB APP REFERENCE

The Android app is designed to complement the web app located at:
`D:/projects/CursorGallery/vibestate/frontend/`

### Key Web App Features to Match:

- **Cursor Trail:** ✅ Implemented (touch-based)
- **Threshold Control:** ✅ Implemented
- **Dark Theme:** ✅ Implemented
- **Lightbox:** ✅ Implemented
- **Authentication:** ✅ Implemented (demo mode)

### Web App Tech Stack:

- React 18
- Vite
- Framer Motion
- React Router
- Zustand (state management)
- TailwindCSS

---

## 🔑 IMPORTANT NOTES FOR NEW AI AGENTS

### When User Says:

- **"Add [feature]"** → Modify existing screens, don't create new files unless necessary
- **"Fix the preview"** → Refer to `PreviewScreen.kt` (lines for touch trail logic)
- **"Change theme"** → Modify `Color.kt` and ensure `isDarkTheme` is passed correctly
- **"Database issue"** → Check `GalleryDao.kt`, `GalleryRepository.kt`, `GalleryViewModel.kt`
- **"Navigation bug"** → Check `NavGraph.kt` routes and navigation calls

### Always Remember:

1. **KSP Version:** Must match Kotlin version (currently 2.0.21 → ksp 2.0.21-1.0.27)
2. **Coil Version:** Use 2.5.0 (not 3.x) - imports are `coil.compose.*`
3. **Theme:** Dark by default, always respect `isDarkTheme` boolean
4. **Min Photos:** 10 required for gallery creation (enforced in UI)
5. **Image Sizing:** Min 200px, max 80vw/55vh (mobile-optimized)

### File Locations:

- **Screens:** `app/src/main/java/.../ui/screens/`
- **ViewModels:** `app/src/main/java/.../viewmodel/`
- **Database:** `app/src/main/java/.../data/local/`
- **Theme:** `app/src/main/java/.../ui/theme/`
- **Navigation:** `app/src/main/java/.../navigation/`

---

## 📞 CONTACT INFO (FROM WEB APP)

- **Creator:** manas. (saxenamanas04@gmail.com)
- **Instagram:** @manas.sx
- **Project:** Cursor Gallery
- **Hackathon:** Startup Hackathon 2020 (RunAnywhere SDK Track)

---

**End of Context Reference**

*This file should be read entirely by new AI agents before making any changes to the project.*
