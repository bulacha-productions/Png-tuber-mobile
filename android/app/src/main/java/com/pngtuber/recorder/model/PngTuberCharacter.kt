package com.pngtuber.recorder.model

import android.content.Context
import android.net.Uri

data class PngTuberCharacter(
    val name: String = "Meu PNGTuber",
    val eyesOpenMouthClosedUri: Uri? = null,
    val eyesOpenMouthOpenUri: Uri? = null,
    val eyesClosedMouthClosedUri: Uri? = null,
    val eyesClosedMouthOpenUri: Uri? = null,
    val scale: Float = 1.0f,
    val positionXPercent: Float = 75f,
    val positionYPercent: Float = 70f,
    val sensitivityThreshold: Int = 18,
    val bounceEnabled: Boolean = true,
    val bounceStrengthDp: Float = 12f
) {
    fun saveToPrefs(context: Context) {
        val prefs = context.getSharedPreferences("pngtuber_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("name", name)
            .putString("eyesOpenMouthClosed", eyesOpenMouthClosedUri?.toString())
            .putString("eyesOpenMouthOpen", eyesOpenMouthOpenUri?.toString())
            .putString("eyesClosedMouthClosed", eyesClosedMouthClosedUri?.toString())
            .putString("eyesClosedMouthOpen", eyesClosedMouthOpenUri?.toString())
            .putFloat("scale", scale)
            .putInt("sensitivity", sensitivityThreshold)
            .putBoolean("bounceEnabled", bounceEnabled)
            .putFloat("bounceStrengthDp", bounceStrengthDp)
            .apply()
    }

    companion object {
        fun loadFromPrefs(context: Context): PngTuberCharacter {
            val prefs = context.getSharedPreferences("pngtuber_prefs", Context.MODE_PRIVATE)
            return PngTuberCharacter(
                name = prefs.getString("name", "Meu PNGTuber") ?: "Meu PNGTuber",
                eyesOpenMouthClosedUri = prefs.getString("eyesOpenMouthClosed", null)?.let { Uri.parse(it) },
                eyesOpenMouthOpenUri = prefs.getString("eyesOpenMouthOpen", null)?.let { Uri.parse(it) },
                eyesClosedMouthClosedUri = prefs.getString("eyesClosedMouthClosed", null)?.let { Uri.parse(it) },
                eyesClosedMouthOpenUri = prefs.getString("eyesClosedMouthOpen", null)?.let { Uri.parse(it) },
                scale = prefs.getFloat("scale", 1.0f),
                sensitivityThreshold = prefs.getInt("sensitivity", 18),
                bounceEnabled = prefs.getBoolean("bounceEnabled", true),
                bounceStrengthDp = prefs.getFloat("bounceStrengthDp", 12f)
            )
        }
    }
}
