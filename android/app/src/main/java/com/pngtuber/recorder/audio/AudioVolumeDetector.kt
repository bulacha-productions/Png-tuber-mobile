package com.pngtuber.recorder.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.sqrt

class AudioVolumeDetector {
    private var audioRecord: AudioRecord? = null
    private var isRecording = false
    private var job: Job? = null

    private val _volumeLevel = MutableStateFlow(0)
    val volumeLevel: StateFlow<Int> = _volumeLevel.asStateFlow()

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    var sensitivityThreshold: Int = 18
    var smoothingMs: Long = 140L

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

    @SuppressLint("MissingPermission")
    fun start(scope: CoroutineScope, onVolumeChange: ((Int) -> Unit)? = null) {
        if (isRecording) return

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                return
            }

            audioRecord?.startRecording()
            isRecording = true

            job = scope.launch(Dispatchers.Default) {
                val audioBuffer = ShortArray(bufferSize / 2)
                var lastSpokeTime = 0L

                while (isActive && isRecording) {
                    val readCount = audioRecord?.read(audioBuffer, 0, audioBuffer.size) ?: 0
                    if (readCount > 0) {
                        var sum = 0.0
                        for (i in 0 until readCount) {
                            val sample = audioBuffer[i]
                            sum += sample * sample
                        }
                        val rms = sqrt(sum / readCount)
                        val volume = (rms / 32767.0 * 200.0).toInt().coerceIn(0, 100)
                        _volumeLevel.value = volume
                        onVolumeChange?.invoke(volume)

                        val now = System.currentTimeMillis()
                        if (volume >= sensitivityThreshold) {
                            lastSpokeTime = now
                            _isSpeaking.value = true
                        } else {
                            if (now - lastSpokeTime > smoothingMs) {
                                _isSpeaking.value = false
                            }
                        }
                    }
                    delay(30)
                }
            }
        } catch (_: Exception) {
            stop()
        }
    }

    fun stop() {
        isRecording = false
        job?.cancel()
        job = null
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (_: Exception) {}
        audioRecord = null
        _volumeLevel.value = 0
        _isSpeaking.value = false
    }
}
