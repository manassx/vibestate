package com.cursorgallery.ai

import android.content.Context
import android.util.Log
import com.runanywhere.sdk.data.models.SDKEnvironment
import com.runanywhere.sdk.llm.llamacpp.LlamaCppServiceProvider
import com.runanywhere.sdk.models.ModelInfo
import com.runanywhere.sdk.public.RunAnywhere
import com.runanywhere.sdk.public.extensions.addModelFromURL
import com.runanywhere.sdk.public.extensions.listAvailableModels
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

internal object RunAnywhereManager {

    private const val TAG = "RunAnywhereManager"

    private val initializationState = MutableStateFlow<InitializationState>(InitializationState.Idle)
    val state: StateFlow<InitializationState> = initializationState.asStateFlow()

    private val availableModels = MutableStateFlow<List<ModelInfo>>(emptyList())
    val models: StateFlow<List<ModelInfo>> = availableModels.asStateFlow()

    private val activeModelId = MutableStateFlow<String?>(null)
    val currentModelId: StateFlow<String?> = activeModelId.asStateFlow()

    private var initializationJob: Job? = null
    private val loadMutex = Mutex()

    fun initialize(context: Context) {
        if (!AiFeatureToggle.isEnabled || initializationState.value is InitializationState.Initialized) {
            return
        }

        initializationJob?.cancel()

        initializationJob = CoroutineScope(Dispatchers.IO).launch {
            initializationState.value = InitializationState.Initializing
            try {
                RunAnywhere.initialize(
                    context = context,
                    apiKey = AiConfig.apiKey,
                    environment = SDKEnvironment.DEVELOPMENT
                )

                LlamaCppServiceProvider.register()
                registerModelsSafely()
                RunAnywhere.scanForDownloadedModels()

                availableModels.value = listAvailableModels()
                initializationState.value = InitializationState.Initialized
            } catch (throwable: Throwable) {
                Log.e(TAG, "RunAnywhere init failed", throwable)
                initializationState.value = InitializationState.Failed(throwable)
            }
        }
    }

    private suspend fun registerModelsSafely() {
        AiConfig.models.forEach { model ->
            try {
                addModelFromURL(
                    url = model.url,
                    name = model.name,
                    type = model.type
                )
            } catch (throwable: Throwable) {
                Log.w(TAG, "Model registration failed for ${model.name}", throwable)
            }
        }
    }

    suspend fun refreshModels(): List<ModelInfo> {
        if (!AiFeatureToggle.isEnabled) return emptyList()
        return try {
            RunAnywhere.scanForDownloadedModels()
            val updated = listAvailableModels()
            availableModels.value = updated
            updated
        } catch (throwable: Throwable) {
            Log.e(TAG, "Model refresh failed", throwable)
            availableModels.value
        }
    }

    suspend fun downloadModel(modelId: String, onProgress: (Float) -> Unit) {
        if (!AiFeatureToggle.isEnabled) return
        runCatching {
            RunAnywhere.downloadModel(modelId).collect { progress ->
                onProgress(progress)
            }
        }.onFailure { throwable ->
            Log.e(TAG, "Model download failed", throwable)
            throw throwable
        }
        refreshModels()
    }

    suspend fun loadModel(modelId: String): Boolean {
        if (!AiFeatureToggle.isEnabled) return false
        return loadMutex.withLock {
            runCatching {
                val success = RunAnywhere.loadModel(modelId)
                if (success) {
                    activeModelId.value = modelId
                }
                success
            }.getOrElse { throwable ->
                Log.e(TAG, "Model load failed", throwable)
                false
            }
        }
    }

    suspend fun unloadModel() {
        if (!AiFeatureToggle.isEnabled) return
        loadMutex.withLock {
            runCatching {
                RunAnywhere.unloadModel()
            }.onFailure { throwable ->
                Log.e(TAG, "Model unload failed", throwable)
            }
            activeModelId.value = null
        }
    }

    sealed interface InitializationState {
        data object Idle : InitializationState
        data object Initializing : InitializationState
        data object Initialized : InitializationState
        data class Failed(val cause: Throwable) : InitializationState
    }
}
