package com.runanywhere.startup_hackathon20.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "galleries")
data class Gallery(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val description: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val imageCount: Int = 0,

    // Cloud sync fields
    val cloudId: String? = null,  // UUID from backend
    val syncStatus: String = "local",  // local, syncing, synced, error
    val isPublished: Boolean = false,

    // Gallery config
    val threshold: Int = 80,  // Cursor trail threshold (20-200)
    val animationType: String = "fade",
    val mood: String = "calm"
)
