package com.pngtuber.recorder.model

import android.content.Context

data class ProSettings(
    val resolution: String = "1080p", // "720p", "1080p", "1440p"
    val fps: Int = 30, // 30, 60
    val videoBitrateMbps: Int = 8, // 6, 8, 12, 16
    val audioBitrateKbps: Int = 128, // 128, 256
    val hardwareAcceleration: Boolean = true
) {
    fun saveToPrefs(context: Context) {
        val prefs = context.getSharedPreferences("pngtuber_pro_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("resolution", resolution)
            .putInt("fps", fps)
            .putInt("video_bitrate", videoBitrateMbps)
            .putInt("audio_bitrate", audioBitrateKbps)
            .putBoolean("hardware_acceleration", hardwareAcceleration)
            .apply()
    }

    companion object {
        fun loadFromPrefs(context: Context): ProSettings {
            val prefs = context.getSharedPreferences("pngtuber_pro_prefs", Context.MODE_PRIVATE)
            return ProSettings(
                resolution = prefs.getString("resolution", "1080p") ?: "1080p",
                fps = prefs.getInt("fps", 30),
                videoBitrateMbps = prefs.getInt("video_bitrate", 8),
                audioBitrateKbps = prefs.getInt("audio_bitrate", 128),
                hardwareAcceleration = prefs.getBoolean("hardware_acceleration", true)
            )
        }
    }
}
