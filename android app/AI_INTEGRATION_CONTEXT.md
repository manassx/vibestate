# AI Integration Context for Vibestate Hackathon

## Project Overview

**Vibestate** is a creative portfolio platform combining a web app and Android companion app. The
unique feature is a cursor-based image trail where images appear as you move the cursor/finger
across the canvas. The goal is to win the hackathon by integrating **RunAnywhere SDK** (on-device
AI) in the most creative and impactful way possible.

## Current Tech Stack

### Android App (`D:/projects/CursorGallery/vibestate/android app`)

- **Language**: Kotlin + Jetpack Compose
- **Architecture**: MVVM with ViewModels, Coroutines, StateFlow
- **Backend**: Supabase (via Flask API proxy)
- **Auth**: Google Sign-In
- **Navigation**: Compose Navigation with routes for Splash, Auth, Dashboard, Create, Editor,
  Viewer, Settings
- **Theme**: Brutalist design with dark/light modes, bold sans-serif headings, serif body copy,
  grain textures, border accents
- **Key Screens**:
    - `DashboardScreen`: Shows portfolios, quick actions (Create, Edit, Your Collection, **AI Studio
      **)
    - `CreatePortfolioScreen`: Upload images, set title/description
    - `GalleryEditorScreen`: Edit threshold, transform images, adjust canvas, **AI Tools button**
    - `GalleryViewerScreen`: View the final cursor trail experience

### Web App

- **Frontend** (`D:/projects/CursorGallery/vibestate/frontend/`): React + Vite + Tailwind, Zustand
  state management
- **Backend** (`D:/projects/CursorGallery/vibestate/backend/`): Flask + Supabase
- **Features**: Dashboard, gallery editor, viewer, settings
- **Design**: Same brutalist aesthetic as Android app

## RunAnywhere SDK Integration (Current State)

### ✅ COMPLETED

#### 1. Core Infrastructure

**Location**: `app/src/main/java/com/cursorgallery/ai/`

- **`AiConfig.kt`**: Feature toggle (`AI_FEATURES_ENABLED = true`), model definitions (Qwen 2.5 0.5B
  Instruct, SmolLM2 360M, Llama 3.2 1B)
- **`RunAnywhereManager.kt`**: Singleton manager wrapping SDK initialization, model lifecycle (
  download, load, unload), state tracking via StateFlow
- **`AiOrchestrator.kt`**: High-level orchestration layer for running prompts, streaming responses,
  parsing JSON outputs (mood presets, sequence plans, critiques)
- **Initialization**: Wired into `CursorGalleryApp.onCreate()` so SDK initializes at app startup

#### 2. ViewModel Layer

**Location**: `app/src/main/java/com/cursorgallery/viewmodel/`

- **`AiStudioViewModel.kt`**:
    - Manages AI Studio UI state (model list, download progress, active model)
    - Exposes actions: `runMoodPreset()`, `runSequencePlan()`, `runCritique()`
    - Tracks processing state, results, and errors
- **`GalleryEditorViewModel.kt`**:
    - Updated with methods to apply AI outputs: `updateGalleryConfig()`, `applyImageOrdering()`

#### 3. UI Components

**AI Studio Screen** (`app/src/main/java/com/cursorgallery/ui/screens/ai/AiStudioBlueprint.kt`):

- Lists available models with download/load/unload controls
- Shows planned AI actions (Mood DJ, Sequence Oracle, Critique, etc.)
- Accessible from Dashboard via "AI Studio" card

**Gallery Editor Integration** (
`app/src/main/java/com/cursorgallery/ui/screens/portfolio/GalleryEditorScreen.kt`):

- **AI Tools button** in top-right toolbar (next to VIEW button)
- Opens a **ModalBottomSheet** with `AiCompanionPanel` containing:
    - Model status indicator
    - Atmosphere prompt text field
    - **"Compose Atmosphere"** button → generates mood presets (animation type, mood, color palette)
    - **"Sequence Oracle"** button → analyzes images and suggests optimal viewing order
    - **"Critique Portfolio"** button → scores composition/emotion/storytelling, provides
      highlights/recommendations
    - Result cards display AI outputs with "Apply" buttons
    - Loading indicators and error messages

**Dashboard Enhancement**:

- Large "AI Studio" card on left (hero position)
- Creative copy: "Palette Architect, Sequence Oracle, Offline Critic" instead of generic "mood"
  language
- Edit Portfolio and Your Collection cards stacked compactly on right

#### 4. Data Models

**Location**: `app/src/main/java/com/cursorgallery/ai/AiActionBlueprints.kt`

- `MoodPresetUiModel`: title, description, animationType, mood, colorPalette
- `SequencePlanUiModel`: ordered list of image IDs with rationales
- `CritiqueReportUiModel`: scores (overall, composition, emotion, storytelling), highlights,
  recommendations

#### 5. Model Strategy

- **Primary**: **Qwen 2.5 0.5B Instruct Q6_K** (~400 MB, strong reasoning, best quality)
- **Fallback**: **SmolLM2 360M Q8_0** (lightweight, for quick drafts or low-memory devices)
- **Premium**: **Llama 3.2 1B Instruct Q6_K** (optional, for demo "wow factor")

### 🎯 PLANNED AI FEATURES (Vision)

#### 1. **Atmosphere Architect (Mood DJ)** ✅ 50% DONE

**What**: User enters a vibe prompt (e.g., "nostalgic midnight city"), AI generates dynamic
animation/mood presets in real time  
**Current**: Prompt field + button exist, JSON parsing ready  
**Remaining**:

- Wire preset application to actually change canvas animation style
- Sync to backend so web dashboard displays the same mood
- Add visual preview in editor before applying

#### 2. **Intelligent Image Sequencing** ✅ 50% DONE

**What**: AI analyzes uploaded images (color, composition, emotion) and auto-reorders them for
maximum visual impact in the cursor trail  
**Current**: Sequence Oracle button exists, applies ordering to gallery  
**Remaining**:

- Extract lightweight metadata per image (dominant colors, brightness) on-device
- Feed metadata + thumbnail analysis to model
- Show before/after comparison UI
- Allow toggle to revert if user doesn't like AI ordering
- Sync sequence to backend/web

#### 3. **Personal AI Critic** ✅ 50% DONE

**What**: Offline critique mode—LLM reviews portfolio, scores composition/emotion, suggests which
images to feature  
**Current**: Critique button exists, displays score cards  
**Remaining**:

- Enhance prompts to provide more insightful feedback
- Store critique results to Supabase so web dashboard can display AI tips
- Add toggle for creators to show/hide AI recommendations publicly
- Cache critiques locally for offline review

#### 4. **Creator Workflow Automations** ❌ NOT STARTED

**What**: Quick actions that run entirely on-device:

- "Write gallery description"
- "Generate social post copy"
- "Draft email pitch"
  **Why**: Concrete productivity angle for hackathon judges  
  **How**: Add buttons in Create/Share flows, use simple text generation prompts, cache outputs
  locally

#### 5. **Contextual AI Chat for Viewers** ❌ NOT STARTED

**What**: In the share view, visitors can ask AI about the artist's story or specific pieces  
**Why**: Interactive experience, privacy-first (on-device), can cache responses per artwork  
**How**:

- Add chat interface in GalleryViewerScreen
- Feed gallery metadata + selected image context to model
- Store interesting Q&As to Supabase for public gallery page
- Show "AI Curator" badge

#### 6. **Offline Performance Mode** ✅ IMPLICIT

**What**: Spotlight that all AI features work without connectivity (RunAnywhere privacy story)  
**Current**: SDK is on-device by default  
**Enhancement**: Add visual indicator ("Offline AI Ready" badge), demo flow for judges

## Technical Architecture

### Key Integration Points

```
CursorGalleryApp
  └─ RunAnywhereManager.initialize()

DashboardScreen
  ├─ AI Studio Card → AiStudioScreen
  └─ Quick Actions

GalleryEditorScreen
  ├─ AI Tools Button → ModalBottomSheet
  │   └─ AiCompanionPanel
  │       ├─ AiStudioViewModel (AI actions)
  │       └─ GalleryEditorViewModel (apply results)
  └─ Canvas (TouchTrailCanvas)

AiStudioScreen
  └─ Model Management UI
      ├─ Download models
      ├─ Load/Unload
      └─ Show planned actions
```

### Data Flow

1. User taps "AI Tools" in editor
2. Bottom sheet opens, shows model status
3. User enters prompt / taps action button
4. `AiStudioViewModel` calls `AiOrchestrator`
5. Orchestrator runs prompt via `RunAnywhereManager`
6. Model streams response (JSON)
7. Orchestrator parses JSON → UI model
8. ViewModel updates state → UI shows result card
9. User taps "Apply" → `GalleryEditorViewModel` updates gallery
10. Gallery patches to backend → syncs to web

### Reversibility (Critical for Hackathon Safety)

- **Feature toggle**: Set `AiConfig.AI_FEATURES_ENABLED = false` to disable all AI instantly
- **Isolated package**: All AI code in `com.cursorgallery.ai/`, easy to remove
- **No modifications to core flows**: Existing screens work unchanged without AI
- **Optional UI**: AI Tools button/panel only appears when feature is enabled

## Current Progress: ~60% Complete

### What Works Right Now

✅ SDK initialized and models registered  
✅ AI Studio screen accessible from Dashboard  
✅ AI Tools button in Gallery Editor  
✅ Bottom sheet panel with all three actions  
✅ Mood preset generation and display  
✅ Sequence ordering suggestion and application  
✅ Portfolio critique scoring and display  
✅ Loading states and error handling  
✅ Theme-consistent UI matching brutalist design  
✅ Google auto-login (no re-sign-in every launch)

### What's Missing for Hackathon Win

🔲 **Model download UI polish**: Show progress, handle errors gracefully  
🔲 **Actual model inference**: Currently buttons exist but no model is loaded/tested  
🔲 **Enhanced prompts**: Current prompts are placeholders, need creative tuning  
🔲 **Image metadata extraction**: For sequencing, need to analyze actual image properties  
🔲 **Backend sync**: AI outputs need to POST to Flask API → Supabase  
🔲 **Web dashboard display**: Show AI insights (critique, mood, sequence) on website  
🔲 **Workflow automations**: "Write description", "Generate social copy", etc.  
🔲 **Viewer chat**: Contextual Q&A for visitors  
🔲 **Visual polish**: Animations, transitions, before/after comparisons  
🔲 **Demo script**: Prepared walkthrough highlighting AI features for judges

## Hackathon Strategy: How to Win

### 1. **Privacy-First Narrative**

- RunAnywhere = on-device, no data leaves phone
- Perfect for creative professionals worried about IP theft
- Offline-first means curators can work anywhere

### 2. **Creative Differentiation**

- Don't just add generic chatbots
- Focus on **creative tools**: atmosphere architect, sequence oracle, AI critic
- Language matters: "Palette Architect" not "Color Picker", "Sequence Oracle" not "Auto Sort"

### 3. **Concrete Productivity**

- Judges love measurable value: "Save 2 hours writing gallery descriptions"
- Show before/after: manual sequencing vs AI-sequenced trail

### 4. **Cross-Platform Sync**

- AI insights generated on mobile → visible on web dashboard
- Unique selling point: mobile AI brain, web consumption

### 5. **Polish Over Features**

- Better to have 3 features that work beautifully than 10 half-broken ones
- Focus on: Mood DJ + Sequencing + Critique (core trio)

### 6. **Live Demo Magic**

- Prepare a portfolio with dramatic sequencing improvement
- Show critique scores live
- Generate atmosphere presets on stage

## Models to Use

### Primary: Qwen 2.5 0.5B Instruct Q6_K

- **Size**: ~380 MB
- **Strengths**: Strong instruction following, good creative writing, handles JSON well
- **Use for**: Mood presets, critiques, workflow automations
- **Download**: Via RunAnywhere ModelCatalog

### Fallback: SmolLM2 360M Q8_0

- **Size**: ~220 MB
- **Strengths**: Fast, tiny, good for quick drafts
- **Use for**: Low-memory devices, speed demonstrations
- **Download**: Via RunAnywhere ModelCatalog

### Premium (Optional): Llama 3.2 1B Q6_K

- **Size**: ~700 MB
- **Strengths**: Best quality, most coherent long-form text
- **Use for**: "High fidelity" mode toggle, demo wow factor
- **Download**: Via RunAnywhere ModelCatalog

## Prompt Templates (Ready to Use)

### Mood Preset

```kotlin
"""
Analyze this portfolio context and create an atmospheric preset.

Portfolio title: ${gallery.title}
Description: ${gallery.description}
Number of images: ${images.size}
User vibe request: "$userPrompt"

Generate a JSON response with this structure:
{
  "title": "Short evocative preset name",
  "description": "One sentence capturing the essence",
  "animationType": "float|fade|glide|pulse|orbit",
  "mood": "nostalgic|energetic|serene|dramatic|playful",
  "colorPalette": ["#hex1", "#hex2", "#hex3"]
}
"""
```

### Sequence Plan

```kotlin
"""
Analyze these images and suggest optimal viewing order for maximum visual impact.

Images:
${images.mapIndexed { idx, img -> "$idx. ${img.url} - ${img.description}" }.joinToString("\n")}

Consider: color harmony, emotional progression, composition flow.

Return JSON:
{
  "entries": [
    {"imageId": "uuid", "rationale": "Why this position"},
    ...
  ]
}
"""
```

### Portfolio Critique

```kotlin
"""
Review this creative portfolio and provide constructive feedback.

Title: ${gallery.title}
Description: ${gallery.description}
Images: ${images.size} pieces

Evaluate on:
- Composition (technical quality)
- Emotional resonance
- Storytelling coherence

Return JSON:
{
  "overallScore": 0-100,
  "compositionScore": 0-100,
  "emotionScore": 0-100,
  "storytellingScore": 0-100,
  "highlights": ["strength 1", "strength 2"],
  "recommendations": ["improvement 1", "improvement 2"]
}
"""
```

## Files Reference (For Next Agent)

### Core AI Files (Already Exist)

- `app/src/main/java/com/cursorgallery/ai/AiConfig.kt`
- `app/src/main/java/com/cursorgallery/ai/RunAnywhereManager.kt`
- `app/src/main/java/com/cursorgallery/ai/AiOrchestrator.kt`
- `app/src/main/java/com/cursorgallery/ai/AiActionBlueprints.kt`
- `app/src/main/java/com/cursorgallery/viewmodel/AiStudioViewModel.kt`
- `app/src/main/java/com/cursorgallery/ui/screens/ai/AiStudioBlueprint.kt`
- `app/src/main/java/com/cursorgallery/ui/screens/portfolio/GalleryEditorScreen.kt`

### Integration Points to Modify

- `app/src/main/java/com/cursorgallery/viewmodel/GalleryEditorViewModel.kt` (apply AI results)
- `app/src/main/java/com/cursorgallery/data/remote/ApiClient.kt` (sync AI to backend)
- `backend/app.py` (receive AI payloads)
- `frontend/src/pages/Dashboard.jsx` (display AI insights)

## Next Steps (Priority Order for Next Agent)

### Phase 1: Get Models Working (3-4 hours)

1. **Test model download flow**: Load Qwen 2.5 0.5B in AI Studio, verify no crashes
2. **Wire actual inference**: Make "Compose Atmosphere" button call real model, parse response
3. **Debug prompts**: Ensure JSON outputs match expected structure
4. **Apply presets**: Hook mood presets to actual canvas config changes

### Phase 2: Complete Core Features (4-5 hours)

5. **Image metadata extraction**: For sequencing, analyze colors/brightness per image
6. **Sequence validation**: Test oracle with real portfolios, refine rationale prompts
7. **Critique enhancement**: Improve scoring logic, add more insightful recommendations
8. **Workflow automations**: Add "Write description" button in CreatePortfolioScreen

### Phase 3: Backend Sync (2-3 hours)

9. **API endpoints**: POST AI results to Flask (`/api/galleries/{id}/ai-insights`)
10. **Supabase schema**: Add `ai_insights` JSONB column to galleries table
11. **Web display**: Show critique/mood/sequence on gallery detail page

### Phase 4: Polish & Demo (2-3 hours)

12. **UI animations**: Smooth transitions, loading states, success feedback
13. **Error handling**: Graceful degradation if model fails
14. **Demo portfolio**: Create a showcase portfolio with before/after examples
15. **Walkthrough script**: Document the demo flow for judges

## Testing Checklist

### Must Test Before Submission

- [ ] Download Qwen 2.5 0.5B without crashes
- [ ] Load model successfully (check RunAnywhereManager state)
- [ ] Generate mood preset with valid JSON
- [ ] Apply preset to gallery, see config change
- [ ] Run sequence oracle, verify reordering
- [ ] Run critique, see score card
- [ ] Apply sequence, confirm images reorder on canvas
- [ ] Sync results to backend, check Supabase
- [ ] View AI insights on web dashboard
- [ ] Test offline (airplane mode), confirm AI still works
- [ ] Low-memory fallback (try SmolLM2)
- [ ] Google auto-login works after app restart

## Common Issues & Solutions

### Model Won't Load

- Check storage permissions in AndroidManifest.xml
- Verify model file downloaded to correct directory
- Check RunAnywhere logs for initialization errors

### JSON Parsing Fails

- Wrap orchestrator calls in try-catch
- Add fallback to regex extraction if JSON malformed
- Log raw model output for debugging

### UI Freezes During Inference

- Ensure all model calls inside `viewModelScope.launch`
- Use `Dispatchers.Default` for CPU-bound work
- Show loading indicator immediately on button tap

### Backend Sync Issues

- Check TokenManager has valid JWT
- Verify Flask CORS allows POST from Android
- Log full API response for debugging

## Winning Pitch (For Judges)

> "Vibestate brings AI creativity tools directly to your fingertips—no cloud, no privacy concerns,
completely offline. Our Palette Architect turns vibe prompts into dynamic gallery atmospheres in
seconds. The Sequence Oracle analyzes your images and reorders them for maximum emotional impact,
turning a random collection into a curated visual journey. And our AI Critic provides instant,
constructive feedback on composition, emotion, and storytelling—all without sending a single pixel
to the cloud. This is what privacy-first creative AI looks like."

---

## For Next Agent: What You Need to Do

**Read this document fully.** Then:

1. **Start with model loading**: Get Qwen 2.5 0.5B downloaded and loaded in AI Studio screen. Test
   by tapping "Compose Atmosphere" in gallery editor with a simple prompt. Confirm you get a real
   response (even if it's not perfect).

2. **Fix prompts**: The current prompts in `AiOrchestrator.kt` are placeholders. Replace them with
   the templates above and tune until JSON parses correctly.

3. **Wire outputs**: Make sure mood presets actually change the gallery animation type, sequence
   oracle actually reorders images, and critique scores persist.

4. **Sync to backend**: POST AI results to Flask API, store in Supabase, display on web dashboard.

5. **Polish UI**: Animations, error states, loading indicators—make it feel production-ready.

6. **Test end-to-end**: From dashboard → editor → AI tools → apply → view on web.

**Do NOT**:

- Create unnecessary documentation files
- Modify files without understanding existing architecture
- Break existing functionality (test after every change)
- Make Git commits without user permission
- Waste time on over-engineering—ship features that work

**Remember**: The goal is to **WIN the hackathon**. That means creative, polished, demo-ready AI
features that judges can see and understand in 5 minutes. Focus on impact over complexity. Make the
Palette Architect, Sequence Oracle, and AI Critic shine. Good luck! 🚀
