package com.pngtuber.recorder.service

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.MediaStore
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import android.widget.Toast
import com.pngtuber.recorder.model.ProSettings
import java.io.File
import java.io.FileDescriptor

class ScreenRecordService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false
    private var isPaused = false
    private var videoUri: Uri? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        try {
            updateForegroundNotification(isPaused = false)
        } catch (e: Exception) {
            Log.w("ScreenRecordService", "Inicialização preventiva de notificação: ${e.message}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_NOT_STICKY

        when (action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
                val resultData = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(EXTRA_RESULT_DATA)
                }

                if (resultCode != 0 && resultData != null) {
                    startRecording(resultCode, resultData)
                } else {
                    Log.e("ScreenRecordService", "ResultData ou ResultCode inválido!")
                    stopSelf()
                }
            }
            ACTION_PAUSE -> {
                pauseRecording()
            }
            ACTION_RESUME -> {
                resumeRecording()
            }
            ACTION_STOP -> {
                stopRecording()
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun startRecording(resultCode: Int, data: Intent) {
        if (isRecording) return

        try {
            updateForegroundNotification(isPaused = false)

            val proSettings = ProSettings.loadFromPrefs(this)
            val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(metrics)

            var width = (metrics.widthPixels / 16) * 16
            var height = (metrics.heightPixels / 16) * 16
            if (width <= 0) width = 720
            if (height <= 0) height = 1280

            // Aplica resolução definida pelo usuário na aba Premium (720p / 1080p / 1440p)
            val maxTargetWidth = when (proSettings.resolution) {
                "720p" -> 720
                "1440p" -> 1440
                else -> 1080
            }

            if (width > maxTargetWidth) {
                val ratio = maxTargetWidth.toFloat() / width
                width = maxTargetWidth
                height = ((height * ratio) / 16).toInt() * 16
            }
            val dpi = metrics.densityDpi

            val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, data)

            mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() {
                    Log.d("ScreenRecordService", "MediaProjection encerrada pelo sistema Android")
                    stopRecording()
                    stopSelf()
                }
            }, Handler(Looper.getMainLooper()))

            val contentValues = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, "PNGTuber_${System.currentTimeMillis()}.mp4")
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/PNGTuberRecorder")
                }
            }

            videoUri = try {
                contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
            } catch (e: Exception) {
                Log.w("ScreenRecordService", "Fallback de inserção MediaStore: ${e.message}")
                null
            }

            val pfd = videoUri?.let {
                try { contentResolver.openFileDescriptor(it, "rw") } catch (_: Exception) { null }
            }
            val fileDescriptor = pfd?.fileDescriptor

            setupMediaRecorder(width, height, fileDescriptor, proSettings)

            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "PNGTuberScreenRecorder",
                width, height, dpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                mediaRecorder?.surface,
                null, null
            )

            mediaRecorder?.start()
            isRecording = true
            isPaused = false

            sendBroadcast(Intent(ACTION_STATE_CHANGED).apply {
                putExtra(EXTRA_IS_RECORDING, true)
                putExtra(EXTRA_IS_PAUSED, false)
            })

            Handler(Looper.getMainLooper()).post {
                Toast.makeText(applicationContext, "🔴 Gravação iniciada com sucesso!", Toast.LENGTH_SHORT).show()
            }

        } catch (e: Exception) {
            Log.e("ScreenRecordService", "Erro fatal ao iniciar gravação: ${e.message}", e)
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(applicationContext, "Erro ao iniciar gravação: ${e.localizedMessage ?: "Verifique as permissões"}", Toast.LENGTH_LONG).show()
            }
            stopRecording()
            stopSelf()
        }
    }

    private fun setupMediaRecorder(width: Int, height: Int, fd: FileDescriptor?, proSettings: ProSettings) {
        val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }

        var isAudioConfigured = false
        val hasMicPerm = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        if (hasMicPerm) {
            try {
                recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
                isAudioConfigured = true
            } catch (e: Exception) {
                Log.w("ScreenRecordService", "Aviso microfone gravador: ${e.message}")
                isAudioConfigured = false
            }
        }

        recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE)
        recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264)

        if (isAudioConfigured) {
            try {
                recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                recorder.setAudioSamplingRate(44100)
                recorder.setAudioEncodingBitRate(proSettings.audioBitrateKbps * 1000)
            } catch (e: Exception) {
                Log.w("ScreenRecordService", "Aviso encoder de áudio: ${e.message}")
            }
        }

        // Aplica taxa de bits e taxa de quadros configuradas na aba Premium
        recorder.setVideoEncodingBitRate(proSettings.videoBitrateMbps * 1000 * 1000)
        recorder.setVideoFrameRate(proSettings.fps)
        recorder.setVideoSize(width, height)

        if (fd != null) {
            recorder.setOutputFile(fd)
        } else {
            val moviesDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: filesDir
            val fallbackFile = File(moviesDir, "PNGTuber_${System.currentTimeMillis()}.mp4")
            recorder.setOutputFile(fallbackFile.absolutePath)
        }

        recorder.prepare()
        mediaRecorder = recorder
    }

    private fun pauseRecording() {
        if (!isRecording || isPaused) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                mediaRecorder?.pause()
                isPaused = true
                updateForegroundNotification(isPaused = true)
                sendBroadcast(Intent(ACTION_STATE_CHANGED).apply {
                    putExtra(EXTRA_IS_RECORDING, true)
                    putExtra(EXTRA_IS_PAUSED, true)
                })
                Toast.makeText(applicationContext, "⏸️ Gravação pausada", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e("ScreenRecordService", "Erro ao pausar: ${e.message}")
            }
        }
    }

    private fun resumeRecording() {
        if (!isRecording || !isPaused) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                mediaRecorder?.resume()
                isPaused = false
                updateForegroundNotification(isPaused = false)
                sendBroadcast(Intent(ACTION_STATE_CHANGED).apply {
                    putExtra(EXTRA_IS_RECORDING, true)
                    putExtra(EXTRA_IS_PAUSED, false)
                })
                Toast.makeText(applicationContext, "▶️ Gravação retomada", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e("ScreenRecordService", "Erro ao retomar: ${e.message}")
            }
        }
    }

    private fun stopRecording() {
        isRecording = false
        isPaused = false

        try {
            mediaRecorder?.stop()
            mediaRecorder?.reset()
        } catch (e: Exception) {
            Log.e("ScreenRecordService", "Erro ao parar gravador: ${e.message}")
        }

        try {
            virtualDisplay?.release()
            mediaProjection?.stop()
            mediaRecorder?.release()
        } catch (e: Exception) {
            Log.e("ScreenRecordService", "Erro ao liberar recursos: ${e.message}")
        }

        virtualDisplay = null
        mediaProjection = null
        mediaRecorder = null

        sendBroadcast(Intent(ACTION_STATE_CHANGED).apply {
            putExtra(EXTRA_IS_RECORDING, false)
            putExtra(EXTRA_IS_PAUSED, false)
        })

        sendBroadcast(Intent(ACTION_RECORDING_FINISHED))

        Handler(Looper.getMainLooper()).post {
            Toast.makeText(applicationContext, "🎬 Gravação salva com sucesso na galeria!", Toast.LENGTH_LONG).show()
        }
    }

    private fun updateForegroundNotification(isPaused: Boolean) {
        val channelId = "screen_recording_channel_v2"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Gravação de Tela Ativa",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controles persistentes durante a gravação de vídeo"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val pauseResumeIntent = Intent(this, ScreenRecordService::class.java).apply {
            action = if (isPaused) ACTION_RESUME else ACTION_PAUSE
        }
        val pauseResumePendingIntent = PendingIntent.getService(
            this,
            1,
            pauseResumeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val stopIntent = Intent(this, ScreenRecordService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            2,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val title = if (isPaused) "⏸️ Gravação Pausada" else "🔴 Gravando Tela..."
        val text = if (isPaused) "Toque em Retomar para continuar" else "Seu PNGTuber e tela estão sendo gravados"
        val pauseLabel = if (isPaused) "▶️ Retomar" else "⏸️ Pausar"

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        builder.setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_media_pause, pauseLabel, pauseResumePendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "⏹️ Finalizar", stopPendingIntent)

        val notification = builder.build()

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (se: SecurityException) {
            Log.w("ScreenRecordService", "SecurityException ao iniciar FGS: ${se.message}")
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (e: Exception) {
                Log.e("ScreenRecordService", "Erro fatal startForeground: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        stopRecording()
        super.onDestroy()
    }

    companion object {
        const val NOTIFICATION_ID = 2002
        const val ACTION_START = "com.pngtuber.recorder.START"
        const val ACTION_PAUSE = "com.pngtuber.recorder.PAUSE"
        const val ACTION_RESUME = "com.pngtuber.recorder.RESUME"
        const val ACTION_STOP = "com.pngtuber.recorder.STOP"
        const val ACTION_STATE_CHANGED = "com.pngtuber.recorder.STATE_CHANGED"
        const val ACTION_RECORDING_FINISHED = "com.pngtuber.recorder.RECORDING_FINISHED"
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"
        const val EXTRA_IS_RECORDING = "extra_is_recording"
        const val EXTRA_IS_PAUSED = "extra_is_paused"
    }
}
