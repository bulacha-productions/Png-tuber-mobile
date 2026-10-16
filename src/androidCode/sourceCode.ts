/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AndroidFile {
  path: string;
  language: string;
  title: string;
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    title: "AndroidManifest.xml",
    description: "Declaração de permissões de microfone, sobreposição de tela e serviços em primeiro plano para gravação.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.pngtuber.recorder">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="PNGTuber Recorder"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize"
            android:theme="@android:style/Theme.Material.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.FloatingOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <service
            android:name=".service.ScreenRecordService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaProjection|microphone" />

    </application>
</manifest>
`
  },
  {
    path: "app/build.gradle.kts",
    language: "kotlin",
    title: "app/build.gradle.kts",
    description: "Dependências do Jetpack Compose, Material 3, Ícones estendidos e Coil para renderização de imagens.",
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.pngtuber.recorder"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pngtuber.recorder"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-alpha"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            val keystoreFile = file("\${project.rootDir}/release.jks")
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = "android"
                keyAlias = "pngtuber"
                keyPassword = "android"
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
                enableV4Signing = true
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val releaseConfig = signingConfigs.findByName("release")
            if (releaseConfig?.storeFile?.exists() == true) {
                signingConfig = releaseConfig
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            val releaseConfig = signingConfigs.findByName("release")
            if (releaseConfig?.storeFile?.exists() == true) {
                signingConfig = releaseConfig
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/audio/AudioVolumeDetector.kt",
    language: "kotlin",
    title: "AudioVolumeDetector.kt",
    description: "Capturador de áudio via AudioRecord para cálculo de RMS e decibéis sem uso de Inteligência Artificial.",
    content: `package com.pngtuber.recorder.audio

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
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/service/FloatingOverlayService.kt",
    language: "kotlin",
    title: "FloatingOverlayService.kt",
    description: "Serviço de sobreposição flutuante (SYSTEM_ALERT_WINDOW) com dock de gravação, modo de pintura e avatar 2D.",
    content: `package com.pngtuber.recorder.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.*
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.pngtuber.recorder.MainActivity
import com.pngtuber.recorder.audio.AudioVolumeDetector
import com.pngtuber.recorder.model.PngTuberCharacter
import kotlinx.coroutines.*
import java.io.File

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var avatarWindowView: View? = null
    private var drawCanvasOverlayView: DrawingCanvasView? = null
    private var isDrawingEnabled = false

    private val audioDetector = AudioVolumeDetector()
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private var isSpeaking = false
    private var isBlinking = false
    private var isRecording = false
    private var isPaused = false

    private var character: PngTuberCharacter = PngTuberCharacter()
    private var avatarSizeDp = 130
    private var avatarImageView: ImageView? = null
    private var toolsPanel: LinearLayout? = null
    private var isToolsExpanded = false

    // Bitmaps carregados para cada estado de animação
    private var bmpIdle: Bitmap? = null
    private var bmpTalking: Bitmap? = null
    private var bmpBlinkIdle: Bitmap? = null
    private var bmpBlinkTalking: Bitmap? = null

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ScreenRecordService.ACTION_STATE_CHANGED) {
                isRecording = intent.getBooleanExtra(ScreenRecordService.EXTRA_IS_RECORDING, false)
                isPaused = intent.getBooleanExtra(ScreenRecordService.EXTRA_IS_PAUSED, false)
                updateToolsUi()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Carrega sprites salvos
        loadCharacterData()

        startForegroundNotification()

        // Registra listener de status da gravação
        val filter = IntentFilter(ScreenRecordService.ACTION_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(stateReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stateReceiver, filter)
        }

        // Inicia detector de áudio para animação da boca
        audioDetector.start(serviceScope) { volume ->
            val speaking = volume >= character.sensitivityThreshold
            if (speaking != isSpeaking) {
                isSpeaking = speaking
                updateAvatarSprite()
            }
        }

        // Loop automático para piscar os olhos realisticamente
        startBlinkLoop()

        // Monta a interface flutuante (Avatar + Botões de Controle)
        setupFloatingAvatarWindow()
    }

    private fun loadCharacterData() {
        character = PngTuberCharacter.loadFromPrefs(this)
        // Carrega imagens de arquivos locais se existirem
        bmpIdle = loadSlotBitmap(0)
        bmpTalking = loadSlotBitmap(1)
        bmpBlinkIdle = loadSlotBitmap(2)
        bmpBlinkTalking = loadSlotBitmap(3)
    }

    private fun loadSlotBitmap(slot: Int): Bitmap? {
        val file = File(filesDir, "avatar_slot_$slot.png")
        return if (file.exists()) {
            BitmapFactory.decodeFile(file.absolutePath)
        } else null
    }

    private fun startBlinkLoop() {
        serviceScope.launch {
            while (isActive) {
                delay((3000..6000).random().toLong())
                isBlinking = true
                updateAvatarSprite()
                delay(150)
                isBlinking = false
                updateAvatarSprite()
            }
        }
    }

    private fun setupFloatingAvatarWindow() {
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val density = resources.displayMetrics.density
        val sizePx = (avatarSizeDp * density).toInt()

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 80
            y = 220
        }

        // Container vertical: Avatar em cima, Painel de Ferramentas embaixo
        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
        }

        // View do Avatar
        val avatarContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(sizePx, sizePx)
        }

        avatarImageView = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            scaleType = ImageView.ScaleType.FIT_CENTER
        }
        updateAvatarSprite()
        avatarContainer.addView(avatarImageView)

        // Painel Flutuante de Ferramentas (Pausar, Finalizar, Desenhar, etc.)
        toolsPanel = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(16, 10, 16, 10)
            background = createRoundedBackground(Color.parseColor("#EE1E1B4B"), 40f)
            visibility = View.VISIBLE
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 12
            }
        }

        buildToolsButtons(toolsPanel!!)
        rootLayout.addView(avatarContainer)
        rootLayout.addView(toolsPanel)

        // Sistema de arrastar e soltar (Drag and Drop) no Avatar
        avatarContainer.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isClick = true

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isClick = true
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - initialTouchX
                        val dy = event.rawY - initialTouchY
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            isClick = false
                        }
                        params.x = initialX + dx.toInt()
                        params.y = initialY + dy.toInt()
                        windowManager.updateViewLayout(rootLayout, params)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (isClick) {
                            // Toque simples: alterna expansão do menu de ferramentas
                            isToolsExpanded = !isToolsExpanded
                            toolsPanel?.visibility = if (isToolsExpanded) View.VISIBLE else View.GONE
                        }
                        return true
                    }
                }
                return false
            }
        })

        avatarWindowView = rootLayout
        windowManager.addView(avatarWindowView, params)
    }

    private fun buildToolsButtons(panel: LinearLayout) {
        panel.removeAllViews()

        // 1. Botão Pausar / Retomar Vídeo
        val pauseBtn = createQuickButton(
            text = if (isPaused) "▶️" else "⏸️",
            tooltip = if (isPaused) "Retomar" else "Pausar"
        ) {
            val intent = Intent(this, ScreenRecordService::class.java).apply {
                action = if (isPaused) ScreenRecordService.ACTION_RESUME else ScreenRecordService.ACTION_PAUSE
            }
            startService(intent)
        }
        panel.addView(pauseBtn)

        // 2. Botão Finalizar Vídeo
        val stopBtn = createQuickButton(text = "⏹️", tooltip = "Finalizar") {
            val intent = Intent(this, ScreenRecordService::class.java).apply {
                action = ScreenRecordService.ACTION_STOP
            }
            startService(intent)
        }
        panel.addView(stopBtn)

        // 3. Botão Pincel / Desenhar na Tela
        val drawBtn = createQuickButton(
            text = if (isDrawingEnabled) "🧹" else "🎨",
            tooltip = if (isDrawingEnabled) "Fechar Pincel" else "Desenhar"
        ) {
            toggleDrawingOverlay()
        }
        panel.addView(drawBtn)

        // 4. Botão Alternar Tamanho do Avatar
        val sizeBtn = createQuickButton(text = "↕️", tooltip = "Tamanho") {
            avatarSizeDp = when (avatarSizeDp) {
                100 -> 140
                140 -> 180
                else -> 100
            }
            val density = resources.displayMetrics.density
            val px = (avatarSizeDp * density).toInt()
            avatarImageView?.layoutParams = FrameLayout.LayoutParams(px, px)
            Toast.makeText(this, "Tamanho: \${avatarSizeDp}dp", Toast.LENGTH_SHORT).show()
        }
        panel.addView(sizeBtn)

        // 5. Botão Ocultar / Fechar Avatar
        val closeBtn = createQuickButton(text = "✖️", tooltip = "Fechar") {
            stopSelf()
        }
        panel.addView(closeBtn)
    }

    private fun updateToolsUi() {
        toolsPanel?.let { buildToolsButtons(it) }
    }

    private fun createQuickButton(text: String, tooltip: String, onClick: () -> Unit): TextView {
        val tv = TextView(this).apply {
            this.text = text
            textSize = 18f
            gravity = Gravity.CENTER
            setPadding(20, 10, 20, 10)
            setOnClickListener { onClick() }
        }
        return tv
    }

    private fun toggleDrawingOverlay() {
        isDrawingEnabled = !isDrawingEnabled
        if (isDrawingEnabled) {
            // Cria camada transparente de desenho por cima de toda a tela
            val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
            )

            drawCanvasOverlayView = DrawingCanvasView(this)
            windowManager.addView(drawCanvasOverlayView, params)
            Toast.makeText(this, "🎨 Modo Desenho Ativo! Desenhe na tela com o dedo", Toast.LENGTH_SHORT).show()
        } else {
            drawCanvasOverlayView?.let { windowManager.removeView(it) }
            drawCanvasOverlayView = null
            Toast.makeText(this, "Pincel desativado", Toast.LENGTH_SHORT).show()
        }
        updateToolsUi()
    }

    private fun updateAvatarSprite() {
        val targetBmp = when {
            isBlinking && isSpeaking -> bmpBlinkTalking ?: bmpTalking ?: bmpIdle
            isBlinking && !isSpeaking -> bmpBlinkIdle ?: bmpIdle
            !isBlinking && isSpeaking -> bmpTalking ?: bmpIdle
            else -> bmpIdle
        }

        Handler(Looper.getMainLooper()).post {
            if (targetBmp != null) {
                avatarImageView?.setImageBitmap(targetBmp)
            } else {
                // Desenha avatar procedural de fallback se não houver imagens
                avatarImageView?.setImageBitmap(createProceduralAvatar(isSpeaking, isBlinking))
            }
        }
    }

    private fun createProceduralAvatar(speaking: Boolean, blinking: Boolean): Bitmap {
        val size = 256
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)

        // Corpo / Cabelo roxo
        paint.color = Color.parseColor("#4F46E5")
        canvas.drawCircle(size / 2f, size / 2f, size * 0.42f, paint)

        // Rosto
        paint.color = Color.parseColor("#FFF1F2")
        canvas.drawCircle(size / 2f, size * 0.52f, size * 0.32f, paint)

        // Olhos
        paint.color = Color.parseColor("#1E1B4B")
        if (blinking) {
            paint.strokeWidth = 6f
            paint.style = Paint.Style.STROKE
            canvas.drawLine(size * 0.36f, size * 0.50f, size * 0.44f, size * 0.50f, paint)
            canvas.drawLine(size * 0.56f, size * 0.50f, size * 0.64f, size * 0.50f, paint)
            paint.style = Paint.Style.FILL
        } else {
            canvas.drawOval(RectF(size * 0.37f, size * 0.45f, size * 0.43f, size * 0.53f), paint)
            canvas.drawOval(RectF(size * 0.57f, size * 0.45f, size * 0.63f, size * 0.53f), paint)
        }

        // Bochechas
        paint.color = Color.parseColor("#FDA4AF")
        canvas.drawOval(RectF(size * 0.30f, size * 0.56f, size * 0.38f, size * 0.61f), paint)
        canvas.drawOval(RectF(size * 0.62f, size * 0.56f, size * 0.70f, size * 0.61f), paint)

        // Boca (Animada com a fala)
        paint.color = Color.parseColor("#E11D48")
        if (speaking) {
            canvas.drawOval(RectF(size * 0.45f, size * 0.58f, size * 0.55f, size * 0.68f), paint)
        } else {
            paint.strokeWidth = 6f
            paint.style = Paint.Style.STROKE
            canvas.drawArc(RectF(size * 0.46f, size * 0.58f, size * 0.54f, size * 0.63f), 0f, 180f, false, paint)
        }

        return bitmap
    }

    private fun createRoundedBackground(color: Int, radius: Float): android.graphics.drawable.GradientDrawable {
        return android.graphics.drawable.GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius
        }
    }

    private fun startForegroundNotification() {
        val channelId = "pngtuber_overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "PNGTuber Flutuante",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setContentTitle("PNGTuber Sobreposto")
                .setContentText("Avatar ativo sobre a tela. Toque no avatar para ferramentas.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentIntent(pendingIntent)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("PNGTuber Sobreposto")
                .setContentText("Avatar ativo.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentIntent(pendingIntent)
                .build()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(1001, notification)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(stateReceiver)
        } catch (_: Exception) {}

        serviceScope.cancel()
        audioDetector.stop()

        avatarWindowView?.let { windowManager.removeView(it) }
        drawCanvasOverlayView?.let { windowManager.removeView(it) }
        avatarWindowView = null
        drawCanvasOverlayView = null
    }

    // View do Canvas de Desenho por cima da tela
    class DrawingCanvasView(context: Context) : View(context) {
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#FF0055")
            strokeWidth = 12f
            style = Paint.Style.STROKE
            strokeJoin = Paint.Join.ROUND
            strokeCap = Paint.Cap.ROUND
        }
        private val paths = mutableListOf<Path>()
        private var currentPath = Path()

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            paths.forEach { canvas.drawPath(it, paint) }
            canvas.drawPath(currentPath, paint)
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            val x = event.x
            val y = event.y
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    currentPath = Path()
                    currentPath.moveTo(x, y)
                    invalidate()
                    return true
                }
                MotionEvent.ACTION_MOVE -> {
                    currentPath.lineTo(x, y)
                    invalidate()
                    return true
                }
                MotionEvent.ACTION_UP -> {
                    paths.add(currentPath)
                    invalidate()
                    return true
                }
            }
            return super.onTouchEvent(event)
        }

        fun clearCanvas() {
            paths.clear()
            currentPath.reset()
            invalidate()
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/service/ScreenRecordService.kt",
    language: "kotlin",
    title: "ScreenRecordService.kt",
    description: "Serviço de gravação de tela com MediaProjection, MediaRecorder, suporte a Android 14 FGS e ProSettings.",
    content: `package com.pngtuber.recorder.service

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
            Log.w("ScreenRecordService", "Inicialização preventiva de notificação: \${e.message}")
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
                put(MediaStore.Video.Media.DISPLAY_NAME, "PNGTuber_\${System.currentTimeMillis()}.mp4")
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/PNGTuberRecorder")
                }
            }

            videoUri = try {
                contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
            } catch (e: Exception) {
                Log.w("ScreenRecordService", "Fallback de inserção MediaStore: \${e.message}")
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
            Log.e("ScreenRecordService", "Erro fatal ao iniciar gravação: \${e.message}", e)
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(applicationContext, "Erro ao iniciar gravação: \${e.localizedMessage ?: "Verifique as permissões"}", Toast.LENGTH_LONG).show()
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
                Log.w("ScreenRecordService", "Aviso microfone gravador: \${e.message}")
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
                Log.w("ScreenRecordService", "Aviso encoder de áudio: \${e.message}")
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
            val fallbackFile = File(moviesDir, "PNGTuber_\${System.currentTimeMillis()}.mp4")
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
                Log.e("ScreenRecordService", "Erro ao pausar: \${e.message}")
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
                Log.e("ScreenRecordService", "Erro ao retomar: \${e.message}")
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
            Log.e("ScreenRecordService", "Erro ao parar gravador: \${e.message}")
        }

        try {
            virtualDisplay?.release()
            mediaProjection?.stop()
            mediaRecorder?.release()
        } catch (e: Exception) {
            Log.e("ScreenRecordService", "Erro ao liberar recursos: \${e.message}")
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
            Log.w("ScreenRecordService", "SecurityException ao iniciar FGS: \${se.message}")
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (e: Exception) {
                Log.e("ScreenRecordService", "Erro fatal startForeground: \${e.message}")
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
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/model/PngTuberCharacter.kt",
    language: "kotlin",
    title: "PngTuberCharacter.kt",
    description: "Modelo de dados com os 4 sprites PNG transparentes, tamanho e calibração do avatar.",
    content: `package com.pngtuber.recorder.model

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
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/model/ProSettings.kt",
    language: "kotlin",
    title: "ProSettings.kt",
    description: "Configurações Pro de gravação (resolução 720p/1080p/1440p, 30/60 FPS, bitrates e aceleração de hardware).",
    content: `package com.pngtuber.recorder.model

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
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/MainActivity.kt",
    language: "kotlin",
    title: "MainActivity.kt",
    description: "Activity principal com Scaffold em Material 3, barra de navegação inferior em 5 abas e permissões.",
    content: `package com.pngtuber.recorder

import android.Manifest
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pngtuber.recorder.model.PngTuberCharacter
import com.pngtuber.recorder.service.FloatingOverlayService
import com.pngtuber.recorder.service.ScreenRecordService
import com.pngtuber.recorder.ui.*

@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {

    private lateinit var projectionManager: MediaProjectionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        setContent {
            val darkNavy = Color(0xFF0B1020)
            val cardBg = Color(0xFF12182B)
            val purpleAccent = Color(0xFF6C63FF)
            val textPrimary = Color(0xFFF5F5FF)
            val textSecondary = Color(0xFFA9AEC5)

            // Tipografia limpa sem serifa para todo o aplicativo Android
            val modernTypography = Typography(
                headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, color = textPrimary),
                titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, color = textPrimary),
                bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, color = textSecondary),
                bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, color = textSecondary)
            )

            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = darkNavy,
                    surface = cardBg,
                    primary = purpleAccent,
                    onPrimary = Color.White,
                    onBackground = textPrimary,
                    onSurface = textPrimary
                ),
                typography = modernTypography
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = darkNavy
                ) {
                    var currentTab by remember { mutableStateOf("studio") }
                    var isRecording by remember { mutableStateOf(false) }
                    var character by remember { mutableStateOf(PngTuberCharacter.loadFromPrefs(this)) }

                    val permissionLauncher = rememberLauncherForActivityResult(
                        ActivityResultContracts.RequestMultiplePermissions()
                    ) { permissions ->
                        val micGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
                        if (!micGranted) {
                            Toast.makeText(this, "Permissão de microfone necessária para animar a boca", Toast.LENGTH_LONG).show()
                        }
                    }

                    val screenCaptureLauncher = rememberLauncherForActivityResult(
                        ActivityResultContracts.StartActivityForResult()
                    ) { result ->
                        if (result.resultCode == RESULT_OK && result.data != null) {
                            val intent = Intent(this, ScreenRecordService::class.java).apply {
                                action = ScreenRecordService.ACTION_START
                                putExtra(ScreenRecordService.EXTRA_RESULT_CODE, result.resultCode)
                                putExtra(ScreenRecordService.EXTRA_RESULT_DATA, result.data)
                            }
                            startForegroundService(intent)
                            isRecording = true
                            Toast.makeText(this, "🔴 Gravação de tela iniciada!", Toast.LENGTH_SHORT).show()
                        }
                    }

                    LaunchedEffect(Unit) {
                        val perms = mutableListOf(Manifest.permission.RECORD_AUDIO)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            perms.add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        permissionLauncher.launch(perms.toTypedArray())
                    }

                    Scaffold(
                        topBar = {
                            TopAppBar(
                                title = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(34.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(purpleAccent),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Default.Videocam,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                "PNGTuber Recorder",
                                                fontFamily = FontFamily.SansSerif,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 17.sp,
                                                color = textPrimary
                                            )
                                            Text(
                                                when (currentTab) {
                                                    "studio" -> "Estúdio de Gravação"
                                                    "avatar" -> "Sprites & Animação"
                                                    "voice" -> "Calibração de Voz"
                                                    "videos" -> "Galeria dos Vídeos"
                                                    else -> "Configurações Pro"
                                                },
                                                fontFamily = FontFamily.SansSerif,
                                                fontSize = 11.sp,
                                                color = textSecondary
                                            )
                                        }
                                    }
                                },
                                colors = TopAppBarDefaults.topAppBarColors(
                                    containerColor = darkNavy,
                                    titleContentColor = textPrimary
                                )
                            )
                        },
                        bottomBar = {
                            // Barra de Navegação Inferior Nativa em 5 Abas
                            NavigationBar(
                                containerColor = Color(0xFF090D1A),
                                contentColor = textPrimary,
                                tonalElevation = 8.dp
                            ) {
                                NavigationBarItem(
                                    selected = currentTab == "studio",
                                    onClick = { currentTab = "studio" },
                                    icon = { Icon(Icons.Default.Videocam, contentDescription = "Estúdio") },
                                    label = { Text("Estúdio", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = if (currentTab == "studio") FontWeight.Bold else FontWeight.Normal) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = purpleAccent,
                                        selectedTextColor = purpleAccent,
                                        unselectedIconColor = textSecondary,
                                        unselectedTextColor = textSecondary,
                                        indicatorColor = purpleAccent.copy(alpha = 0.15f)
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == "avatar",
                                    onClick = { currentTab = "avatar" },
                                    icon = { Icon(Icons.Default.Person, contentDescription = "Avatar") },
                                    label = { Text("Avatar", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = if (currentTab == "avatar") FontWeight.Bold else FontWeight.Normal) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = purpleAccent,
                                        selectedTextColor = purpleAccent,
                                        unselectedIconColor = textSecondary,
                                        unselectedTextColor = textSecondary,
                                        indicatorColor = purpleAccent.copy(alpha = 0.15f)
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == "voice",
                                    onClick = { currentTab = "voice" },
                                    icon = { Icon(Icons.Default.Mic, contentDescription = "Voz") },
                                    label = { Text("Voz", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = if (currentTab == "voice") FontWeight.Bold else FontWeight.Normal) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = purpleAccent,
                                        selectedTextColor = purpleAccent,
                                        unselectedIconColor = textSecondary,
                                        unselectedTextColor = textSecondary,
                                        indicatorColor = purpleAccent.copy(alpha = 0.15f)
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == "videos",
                                    onClick = { currentTab = "videos" },
                                    icon = { Icon(Icons.Default.Movie, contentDescription = "Vídeos") },
                                    label = { Text("Vídeos", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = if (currentTab == "videos") FontWeight.Bold else FontWeight.Normal) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = purpleAccent,
                                        selectedTextColor = purpleAccent,
                                        unselectedIconColor = textSecondary,
                                        unselectedTextColor = textSecondary,
                                        indicatorColor = purpleAccent.copy(alpha = 0.15f)
                                    )
                                )
                                NavigationBarItem(
                                    selected = currentTab == "premium",
                                    onClick = { currentTab = "premium" },
                                    icon = { Icon(Icons.Default.AutoAwesome, contentDescription = "Premium") },
                                    label = { Text("Premium", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, fontWeight = if (currentTab == "premium") FontWeight.Bold else FontWeight.Normal) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = purpleAccent,
                                        selectedTextColor = purpleAccent,
                                        unselectedIconColor = textSecondary,
                                        unselectedTextColor = textSecondary,
                                        indicatorColor = purpleAccent.copy(alpha = 0.15f)
                                    )
                                )
                            }
                        },
                        containerColor = darkNavy
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            when (currentTab) {
                                "studio" -> {
                                    StudioScreen(
                                        character = character,
                                        isRecording = isRecording,
                                        onStartOverlay = {
                                            if (!checkOverlayPermission()) {
                                                requestOverlayPermission()
                                            } else {
                                                val intent = Intent(this@MainActivity, FloatingOverlayService::class.java)
                                                startService(intent)
                                                Toast.makeText(this@MainActivity, "Avatar sobreposto ativado!", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        onStartRecording = {
                                            screenCaptureLauncher.launch(projectionManager.createScreenCaptureIntent())
                                        },
                                        onStopRecording = {
                                            val intent = Intent(this@MainActivity, ScreenRecordService::class.java).apply {
                                                action = ScreenRecordService.ACTION_STOP
                                            }
                                            startService(intent)
                                            isRecording = false
                                            Toast.makeText(this@MainActivity, "Gravação finalizada e salva em Vídeos!", Toast.LENGTH_LONG).show()
                                        },
                                        onNavigateToAvatar = {
                                            currentTab = "avatar"
                                        },
                                        onResetStudio = {
                                            Toast.makeText(this@MainActivity, "Configurações do Estúdio restauradas!", Toast.LENGTH_SHORT).show()
                                        }
                                    )
                                }
                                "avatar" -> {
                                    AvatarScreen(
                                        character = character,
                                        onUpdateCharacter = { updated ->
                                            character = updated
                                        },
                                        onResetAvatar = {
                                            character = character.copy(
                                                eyesOpenMouthClosedUri = null,
                                                eyesOpenMouthOpenUri = null,
                                                eyesClosedMouthClosedUri = null,
                                                eyesClosedMouthOpenUri = null,
                                                scale = 1.0f,
                                                bounceStrengthDp = 12f
                                            ).also { it.saveToPrefs(this@MainActivity) }
                                            Toast.makeText(this@MainActivity, "Avatar restaurado para o padrão!", Toast.LENGTH_SHORT).show()
                                        }
                                    )
                                }
                                "voice" -> {
                                    VoiceScreen(
                                        character = character,
                                        onUpdateCharacter = { updated ->
                                            character = updated
                                        },
                                        onResetVoice = {
                                            character = character.copy(sensitivityThreshold = 18).also { it.saveToPrefs(this@MainActivity) }
                                            Toast.makeText(this@MainActivity, "Sensibilidade de voz restaurada!", Toast.LENGTH_SHORT).show()
                                        }
                                    )
                                }
                                "videos" -> {
                                    VideosScreen()
                                }
                                "premium" -> {
                                    PremiumScreen(
                                        onResetPro = {
                                            Toast.makeText(this@MainActivity, "Configurações Pro restauradas!", Toast.LENGTH_SHORT).show()
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else true
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/StudioScreen.kt",
    language: "kotlin",
    title: "StudioScreen.kt",
    description: "Aba Estúdio: prévia ao vivo do avatar, botões de gravação e sobreposição sem quebra de texto, gravações recentes.",
    content: `package com.pngtuber.recorder.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pngtuber.recorder.model.PngTuberCharacter
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudioScreen(
    character: PngTuberCharacter,
    isRecording: Boolean,
    onStartOverlay: () -> Unit,
    onStartRecording: () -> Unit,
    onStopRecording: () -> Unit,
    onNavigateToAvatar: () -> Unit,
    onResetStudio: () -> Unit
) {
    val context = LocalContext.current
    var showResetDialog by remember { mutableStateOf(false) }
    var recentVideos by remember { mutableStateOf<List<RecordedVideo>>(emptyList()) }

    // Simulação sutil de respiração e piscar do avatar na tela do estúdio
    var isBlinking by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        while (true) {
            delay((3000..5000).random().toLong())
            isBlinking = true
            delay(150)
            isBlinking = false
        }
    }

    LaunchedEffect(isRecording) {
        recentVideos = loadPngTuberVideos(context).take(3)
    }

    val activeSpriteUri = if (isBlinking) {
        character.eyesClosedMouthClosedUri ?: character.eyesOpenMouthClosedUri
    } else {
        character.eyesOpenMouthClosedUri
    }

    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)
    val recordRed = Color(0xFFF04444)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkNavy)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Live Preview Viewport Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (isRecording) recordRed else Color(0xFF22C55E))
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (isRecording) "Gravando agora" else "Prévia do Avatar",
                            fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = textPrimary
                        )
                    }

                    IconButton(onClick = onNavigateToAvatar, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Tune, contentDescription = "Configurar", tint = textSecondary, modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Avatar Display Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0xFF070B16))
                        .clickable(onClick = onNavigateToAvatar),
                    contentAlignment = Alignment.Center
                ) {
                    if (activeSpriteUri != null) {
                        AsyncImage(
                            model = activeSpriteUri,
                            contentDescription = "Avatar PNGTuber",
                            modifier = Modifier
                                .size(150.dp)
                                .padding(8.dp)
                        )
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Face,
                                contentDescription = null,
                                tint = textSecondary,
                                modifier = Modifier.size(54.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Toque para adicionar sprites",
                                fontFamily = FontFamily.SansSerif,
                                color = textSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }

                    // Indicator Tag
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(10.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF1E2640).copy(alpha = 0.85f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            if (isBlinking) "Piscando" else "Repouso",
                            fontFamily = FontFamily.SansSerif,
                            color = textSecondary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        // 2. Painel Principal de Gravação (com botões que NÃO quebram texto "Sobrep or")
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "Controles de Gravação",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Text(
                            if (isRecording) "🔴 Gravando tela e avatar..." else "Pronto para iniciar gravação",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isRecording) recordRed else textSecondary
                        )
                    }

                    IconButton(onClick = { showResetDialog = true }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Refresh, contentDescription = "Restaurar", tint = textSecondary, modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Linha de Botões com tamanho adequado e sem quebra feia de palavra
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Botão Sobrepor Avatar
                    Button(
                        onClick = onStartOverlay,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E2640))
                    ) {
                        Icon(
                            Icons.Default.Layers,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = purpleAccent
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "Sobrepor",
                            fontFamily = FontFamily.SansSerif,
                            color = textPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Botão Oficial de Gravação (2 Estados)
                    Button(
                        onClick = {
                            if (isRecording) onStopRecording() else onStartRecording()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isRecording) recordRed else purpleAccent
                        ),
                        modifier = Modifier
                            .weight(1.3f)
                            .height(48.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(
                            if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (isRecording) "Parar gravação" else "Começar gravação",
                            fontFamily = FontFamily.SansSerif,
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        // 3. Vídeos Recentes Gravados no Estúdio
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Movie, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Gravações Recentes",
                            fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = textPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (recentVideos.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF0B1020))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Nenhum vídeo gravado ainda. Inicie sua primeira gravação acima!",
                            fontFamily = FontFamily.SansSerif,
                            color = textSecondary,
                            fontSize = 12.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        recentVideos.forEach { video ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF0B1020))
                                    .clickable {
                                        val playIntent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(video.uri, "video/mp4")
                                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                                        }
                                        try {
                                            context.startActivity(playIntent)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Erro ao abrir vídeo", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                    .padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF1E2640)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        video.title,
                                        fontFamily = FontFamily.SansSerif,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = textPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        "Salvo na galeria",
                                        fontFamily = FontFamily.SansSerif,
                                        fontSize = 10.sp,
                                        color = textSecondary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal de confirmação Restaurar Padrão do Estúdio
    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = {
                Text(
                    "Restaurar Estúdio?",
                    fontFamily = FontFamily.SansSerif,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary
                )
            },
            text = {
                Text(
                    "Deseja restaurar as configurações padrão do Estúdio? Suas outras seções (Avatar, Voz e Premium) não serão afetadas.",
                    fontFamily = FontFamily.SansSerif,
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onResetStudio()
                        showResetDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Restaurar Padrão", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/AvatarScreen.kt",
    language: "kotlin",
    title: "AvatarScreen.kt",
    description: "Aba Avatar: gerenciador dos 4 estados de sprites PNG transparentes, escala e intensidade de saltinho.",
    content: `package com.pngtuber.recorder.ui

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pngtuber.recorder.model.PngTuberCharacter
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AvatarScreen(
    character: PngTuberCharacter,
    onUpdateCharacter: (PngTuberCharacter) -> Unit,
    onResetAvatar: () -> Unit
) {
    val context = LocalContext.current
    var selectedSlot by remember { mutableStateOf(0) }
    var showResetDialog by remember { mutableStateOf(false) }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                val file = File(context.filesDir, "avatar_slot_$selectedSlot.png")
                context.contentResolver.openInputStream(uri)?.use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                val localUri = Uri.fromFile(file)
                val updated = when (selectedSlot) {
                    0 -> character.copy(eyesOpenMouthClosedUri = localUri)
                    1 -> character.copy(eyesOpenMouthOpenUri = localUri)
                    2 -> character.copy(eyesClosedMouthClosedUri = localUri)
                    3 -> character.copy(eyesClosedMouthOpenUri = localUri)
                    else -> character
                }
                updated.saveToPrefs(context)
                onUpdateCharacter(updated)
                Toast.makeText(context, "Sprite atualizado com sucesso!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Erro ao carregar imagem: \${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkNavy)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Cabeçalho da Seção de Sprites
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "Sprites do Avatar (PNG)",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        Text(
                            "PNGs transparentes para cada estado de fala e olhos",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.bodySmall,
                            color = textSecondary
                        )
                    }

                    IconButton(onClick = { showResetDialog = true }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Restaurar", tint = textSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Grid 2x2 dos 4 slots de sprites
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SpriteSlotCard(
                        title = "Repouso",
                        subtitle = "Olhos A / Boca F",
                        uri = character.eyesOpenMouthClosedUri,
                        cardBg = Color(0xFF0B1020),
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        modifier = Modifier.weight(1f)
                    ) {
                        selectedSlot = 0
                        imagePicker.launch("image/*")
                    }

                    SpriteSlotCard(
                        title = "Falando",
                        subtitle = "Olhos A / Boca A",
                        uri = character.eyesOpenMouthOpenUri,
                        cardBg = Color(0xFF0B1020),
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        modifier = Modifier.weight(1f)
                    ) {
                        selectedSlot = 1
                        imagePicker.launch("image/*")
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SpriteSlotCard(
                        title = "Piscando",
                        subtitle = "Olhos F / Boca F",
                        uri = character.eyesClosedMouthClosedUri,
                        cardBg = Color(0xFF0B1020),
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        modifier = Modifier.weight(1f)
                    ) {
                        selectedSlot = 2
                        imagePicker.launch("image/*")
                    }

                    SpriteSlotCard(
                        title = "Piscando Falando",
                        subtitle = "Olhos F / Boca A",
                        uri = character.eyesClosedMouthOpenUri,
                        cardBg = Color(0xFF0B1020),
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        modifier = Modifier.weight(1f)
                    ) {
                        selectedSlot = 3
                        imagePicker.launch("image/*")
                    }
                }
            }
        }

        // Calibração de Escala e Animação
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Calibração de Tamanho & Saltinho",
                    fontFamily = FontFamily.SansSerif,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = textPrimary
                )
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "Escala do Avatar: \${(character.scale * 100).toInt()}%",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 12.sp,
                    color = textSecondary
                )
                Slider(
                    value = character.scale,
                    onValueChange = {
                        val updated = character.copy(scale = it)
                        updated.saveToPrefs(context)
                        onUpdateCharacter(updated)
                    },
                    valueRange = 0.5f..2.0f,
                    colors = SliderDefaults.colors(
                        thumbColor = purpleAccent,
                        activeTrackColor = purpleAccent
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    "Intensidade do Saltinho ao Falar: \${character.bounceStrengthDp.toInt()} px",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 12.sp,
                    color = textSecondary
                )
                Slider(
                    value = character.bounceStrengthDp,
                    onValueChange = {
                        val updated = character.copy(bounceStrengthDp = it)
                        updated.saveToPrefs(context)
                        onUpdateCharacter(updated)
                    },
                    valueRange = 0f..30f,
                    colors = SliderDefaults.colors(
                        thumbColor = purpleAccent,
                        activeTrackColor = purpleAccent
                    )
                )
            }
        }
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = {
                Text("Restaurar Sprites do Avatar?", fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, color = textPrimary)
            },
            text = {
                Text(
                    "Deseja restaurar as configurações padrão do avatar? Suas outras personalizações de Voz e Gravação continuarão intactas.",
                    fontFamily = FontFamily.SansSerif,
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onResetAvatar()
                        showResetDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Restaurar Padrão", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/VoiceScreen.kt",
    language: "kotlin",
    title: "VoiceScreen.kt",
    description: "Aba Voz: medidor de intensidade sonora em tempo real e calibração de sensibilidade.",
    content: `package com.pngtuber.recorder.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pngtuber.recorder.model.PngTuberCharacter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceScreen(
    character: PngTuberCharacter,
    onUpdateCharacter: (PngTuberCharacter) -> Unit,
    onResetVoice: () -> Unit
) {
    val context = LocalContext.current
    var showResetDialog by remember { mutableStateOf(false) }

    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkNavy)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Medidor de Áudio e Sensibilidade
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Mic, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Calibração de Voz",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                    }

                    IconButton(onClick = { showResetDialog = true }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Restaurar", tint = textSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    "O avatar abre a boca automaticamente quando a intensidade da sua voz ultrapassa o limiar definido abaixo.",
                    fontFamily = FontFamily.SansSerif,
                    style = MaterialTheme.typography.bodySmall,
                    color = textSecondary
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Visualizador de Volume em Barra
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Sensibilidade da Boca:", fontFamily = FontFamily.SansSerif, fontSize = 12.sp, color = textSecondary)
                        Text(
                            "\${character.sensitivityThreshold}%",
                            fontFamily = FontFamily.SansSerif,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = purpleAccent
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Slider(
                        value = character.sensitivityThreshold.toFloat(),
                        onValueChange = {
                            val updated = character.copy(sensitivityThreshold = it.toInt())
                            updated.saveToPrefs(context)
                            onUpdateCharacter(updated)
                        },
                        valueRange = 5f..60f,
                        colors = SliderDefaults.colors(
                            thumbColor = purpleAccent,
                            activeTrackColor = purpleAccent
                        )
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Sensível (Fala baixo)", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, color = textSecondary)
                        Text("Menos sensível (Ambiente com ruído)", fontFamily = FontFamily.SansSerif, fontSize = 10.sp, color = textSecondary)
                    }
                }
            }
        }

        // Informações de Isolamento Acústico
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.GraphicEq, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Dicas para Gravação sem Ruídos",
                        fontFamily = FontFamily.SansSerif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = textPrimary
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    "• Se a boca do avatar ficar abrindo sozinha com ruído ambiente, aumente o limiar para cerca de 25% a 30%.\\n• Fones de ouvido com microfone integrado oferecem a sincronia mais precisa e evitam que o som do jogo reative a boca do PNGTuber.",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 12.sp,
                    color = textSecondary,
                    lineHeight = 18.sp
                )
            }
        }
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = {
                Text("Restaurar Configurações de Voz?", fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, color = textPrimary)
            },
            text = {
                Text(
                    "Deseja restaurar a sensibilidade padrão do microfone para 18%? Suas personalizações em outras seções continuarão salvas.",
                    fontFamily = FontFamily.SansSerif,
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onResetVoice()
                        showResetDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Restaurar Padrão", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/VideosScreen.kt",
    language: "kotlin",
    title: "VideosScreen.kt",
    description: "Aba Vídeos: galeria exclusiva de vídeos gravados pelo app com reprodução, compartilhamento, renomear e excluir.",
    content: `package com.pngtuber.recorder.ui

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideosScreen() {
    val context = LocalContext.current
    var videoList by remember { mutableStateOf<List<RecordedVideo>>(emptyList()) }
    var videoToDelete by remember { mutableStateOf<RecordedVideo?>(null) }
    var videoToRename by remember { mutableStateOf<RecordedVideo?>(null) }
    var renameInputText by remember { mutableStateOf("") }

    fun refreshVideos() {
        videoList = loadPngTuberVideos(context)
    }

    LaunchedEffect(Unit) {
        refreshVideos()
    }

    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)
    val recordRed = Color(0xFFF04444)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkNavy)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Cabeçalho da Galeria
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Movie, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Galeria dos Vídeos Gravados",
                                fontFamily = FontFamily.SansSerif,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                        }
                        Text(
                            "Total: \${videoList.size} vídeo(s) salvos em Movies/PNGTuberRecorder",
                            fontFamily = FontFamily.SansSerif,
                            style = MaterialTheme.typography.bodySmall,
                            color = textSecondary
                        )
                    }

                    IconButton(onClick = { refreshVideos() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Recarregar", tint = textSecondary)
                    }
                }
            }
        }

        // Lista de Vídeos ou Estado Vazio
        if (videoList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(cardBg)
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.VideoLibrary,
                        contentDescription = null,
                        tint = textSecondary,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "Nenhum vídeo gravado ainda",
                        fontFamily = FontFamily.SansSerif,
                        color = textPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Grave suas gameplays ou reações com seu avatar na aba Estúdio para encontrá-los aqui!",
                        fontFamily = FontFamily.SansSerif,
                        color = textSecondary,
                        fontSize = 12.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                videoList.forEach { video ->
                    VideoItemCard(
                        video = video,
                        textPrimary = textPrimary,
                        textSecondary = textSecondary,
                        purpleAccent = purpleAccent,
                        onPlay = {
                            val playIntent = Intent(Intent.ACTION_VIEW).apply {
                                setDataAndType(video.uri, "video/mp4")
                                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            try {
                                context.startActivity(playIntent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Não foi possível abrir o reprodutor de vídeo", Toast.LENGTH_SHORT).show()
                            }
                        },
                        onShare = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "video/mp4"
                                putExtra(Intent.EXTRA_STREAM, video.uri)
                                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Compartilhar vídeo"))
                        },
                        onRename = {
                            videoToRename = video
                            renameInputText = video.title.removeSuffix(".mp4")
                        },
                        onDelete = {
                            videoToDelete = video
                        }
                    )
                }
            }
        }
    }

    // Modal de Confirmação de Exclusão
    videoToDelete?.let { video ->
        AlertDialog(
            onDismissRequest = { videoToDelete = null },
            title = {
                Text("Excluir vídeo?", fontFamily = FontFamily.SansSerif, color = textPrimary, fontWeight = FontWeight.Bold)
            },
            text = {
                Text(
                    "Deseja excluir permanentemente o vídeo '\${video.title}'?",
                    fontFamily = FontFamily.SansSerif,
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        try {
                            context.contentResolver.delete(video.uri, null, null)
                            Toast.makeText(context, "Vídeo excluído com sucesso!", Toast.LENGTH_SHORT).show()
                            refreshVideos()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Erro ao excluir: \${e.message}", Toast.LENGTH_SHORT).show()
                        }
                        videoToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = recordRed)
                ) {
                    Text("Sim, excluir", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { videoToDelete = null }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }

    // Modal de Renomeação
    videoToRename?.let { video ->
        AlertDialog(
            onDismissRequest = { videoToRename = null },
            title = {
                Text("Renomear Vídeo", fontFamily = FontFamily.SansSerif, color = textPrimary, fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text("Digite o novo nome para o vídeo:", fontFamily = FontFamily.SansSerif, color = textSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = renameInputText,
                        onValueChange = { renameInputText = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = purpleAccent,
                            unfocusedBorderColor = Color(0xFF1E2640),
                            focusedTextColor = textPrimary,
                            unfocusedTextColor = textPrimary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (renameInputText.isNotBlank()) {
                            try {
                                val newName = if (renameInputText.endsWith(".mp4")) renameInputText else "$renameInputText.mp4"
                                val values = ContentValues().apply {
                                    put(MediaStore.Video.Media.DISPLAY_NAME, newName)
                                }
                                context.contentResolver.update(video.uri, values, null, null)
                                Toast.makeText(context, "Vídeo renomeado!", Toast.LENGTH_SHORT).show()
                                refreshVideos()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Erro ao renomear: \${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                        videoToRename = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Salvar", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { videoToRename = null }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/PremiumScreen.kt",
    language: "kotlin",
    title: "PremiumScreen.kt",
    description: "Aba Premium: configurações avançadas de vídeo (resolução, FPS, bitrates, aceleração por GPU e restauração).",
    content: `package com.pngtuber.recorder.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pngtuber.recorder.model.ProSettings

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PremiumScreen(
    onResetPro: () -> Unit
) {
    val context = LocalContext.current
    var proSettings by remember { mutableStateOf(ProSettings.loadFromPrefs(context)) }
    var showResetDialog by remember { mutableStateOf(false) }

    fun updateSettings(newSettings: ProSettings) {
        proSettings = newSettings
        newSettings.saveToPrefs(context)
    }

    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkNavy)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Banner Superior Pro
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(purpleAccent.copy(alpha = 0.2f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "RECURSOS PRO & STUDIO",
                            fontFamily = FontFamily.SansSerif,
                            color = purpleAccent,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    IconButton(onClick = { showResetDialog = true }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Restaurar", tint = textSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    "Configurações Avançadas de Gravação",
                    fontFamily = FontFamily.SansSerif,
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = textPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Defina resolução, bitrate e taxa de quadros aplicadas diretamente pelo gravador de tela do Android.",
                    fontFamily = FontFamily.SansSerif,
                    fontSize = 12.sp,
                    color = textSecondary
                )
            }
        }

        // 1. Resolução de Vídeo
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Tv, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Resolução de Vídeo",
                        fontFamily = FontFamily.SansSerif,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("720p" to "HD", "1080p" to "Full HD", "1440p" to "2K Ultra").forEach { (res, label) ->
                        val isSelected = proSettings.resolution == res
                        Button(
                            onClick = { updateSettings(proSettings.copy(resolution = res)) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) purpleAccent else Color(0xFF0B1020)
                            )
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    res,
                                    fontFamily = FontFamily.SansSerif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = if (isSelected) Color.White else textPrimary
                                )
                                Text(
                                    label,
                                    fontFamily = FontFamily.SansSerif,
                                    fontSize = 9.sp,
                                    color = if (isSelected) Color.White.copy(alpha = 0.8f) else textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // 2. Taxa de Quadros (FPS)
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Speed, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Taxa de Quadros (FPS)",
                        fontFamily = FontFamily.SansSerif,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    listOf(30 to "Padrão Estável", 60 to "Ultra-fluido").forEach { (fps, desc) ->
                        val isSelected = proSettings.fps == fps
                        Button(
                            onClick = { updateSettings(proSettings.copy(fps = fps)) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) purpleAccent else Color(0xFF0B1020)
                            )
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    "$fps FPS",
                                    fontFamily = FontFamily.SansSerif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = if (isSelected) Color.White else textPrimary
                                )
                                Text(
                                    desc,
                                    fontFamily = FontFamily.SansSerif,
                                    fontSize = 10.sp,
                                    color = if (isSelected) Color.White.copy(alpha = 0.8f) else textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // 3. Taxa de Bits de Vídeo (Bitrate)
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Tune, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Qualidade do Vídeo (Bitrate)",
                        fontFamily = FontFamily.SansSerif,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = textPrimary
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Taxa de Bits:", fontFamily = FontFamily.SansSerif, fontSize = 12.sp, color = textSecondary)
                    Text(
                        "\${proSettings.videoBitrateMbps} Mbps",
                        fontFamily = FontFamily.SansSerif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = purpleAccent
                    )
                }

                Slider(
                    value = proSettings.videoBitrateMbps.toFloat(),
                    onValueChange = { updateSettings(proSettings.copy(videoBitrateMbps = it.toInt())) },
                    valueRange = 4f..16f,
                    steps = 5,
                    colors = SliderDefaults.colors(
                        thumbColor = purpleAccent,
                        activeTrackColor = purpleAccent
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Bitrate de Áudio (AAC):", fontFamily = FontFamily.SansSerif, fontSize = 12.sp, color = textSecondary)
                    Text(
                        "\${proSettings.audioBitrateKbps} kbps",
                        fontFamily = FontFamily.SansSerif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = purpleAccent
                    )
                }

                Slider(
                    value = proSettings.audioBitrateKbps.toFloat(),
                    onValueChange = { updateSettings(proSettings.copy(audioBitrateKbps = it.toInt())) },
                    valueRange = 96f..256f,
                    steps = 4,
                    colors = SliderDefaults.colors(
                        thumbColor = purpleAccent,
                        activeTrackColor = purpleAccent
                    )
                )
            }
        }

        // 4. Aceleração por Hardware GPU
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = cardBg)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Memory, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                "Aceleração por Hardware",
                                fontFamily = FontFamily.SansSerif,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = textPrimary
                            )
                            Text(
                                "Codificador H.264 da GPU",
                                fontFamily = FontFamily.SansSerif,
                                fontSize = 11.sp,
                                color = textSecondary
                            )
                        }
                    }

                    Switch(
                        checked = proSettings.hardwareAcceleration,
                        onCheckedChange = { updateSettings(proSettings.copy(hardwareAcceleration = it)) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = purpleAccent
                        )
                    )
                }
            }
        }
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = {
                Text("Restaurar Configurações Pro?", fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, color = textPrimary)
            },
            text = {
                Text(
                    "Deseja restaurar as configurações padrão de vídeo (1080p, 30 FPS, 8 Mbps)? Suas outras personalizações continuarão intactas.",
                    fontFamily = FontFamily.SansSerif,
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val defaultSettings = ProSettings()
                        updateSettings(defaultSettings)
                        onResetPro()
                        showResetDialog = false
                        Toast.makeText(context, "Configurações Pro restauradas!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Restaurar Padrão", color = Color.White, fontFamily = FontFamily.SansSerif)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancelar", color = textSecondary, fontFamily = FontFamily.SansSerif)
                }
            },
            containerColor = cardBg
        )
    }
}
`
  },
  {
    path: "app/src/main/java/com/pngtuber/recorder/ui/HomeScreen.kt",
    language: "kotlin",
    title: "HomeScreen.kt",
    description: "Componentes compartilhados de vídeo (consulta ao MediaStore, cartões de vídeo e slots de sprites).",
    content: `package com.pngtuber.recorder.ui

import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pngtuber.recorder.model.PngTuberCharacter
import com.pngtuber.recorder.service.ScreenRecordService
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class RecordedVideo(
    val id: Long,
    val title: String,
    val uri: Uri,
    val durationMs: Long,
    val sizeBytes: Long,
    val dateAddedSec: Long
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    isRecording: Boolean,
    onStartOverlay: () -> Unit,
    onStartRecording: () -> Unit,
    onStopRecording: () -> Unit
) {
    val context = LocalContext.current
    var character by remember { mutableStateOf(PngTuberCharacter.loadFromPrefs(context)) }
    var selectedSlot by remember { mutableStateOf(0) }
    var resetSectionTarget by remember { mutableStateOf<String?>(null) }

    // Galeria de vídeos locais gravados pelo app
    var videoList by remember { mutableStateOf<List<RecordedVideo>>(emptyList()) }
    var videoToDelete by remember { mutableStateOf<RecordedVideo?>(null) }
    var videoToRename by remember { mutableStateOf<RecordedVideo?>(null) }
    var renameInputText by remember { mutableStateOf("") }

    fun refreshVideos() {
        videoList = loadPngTuberVideos(context)
    }

    // Carrega vídeos na inicialização e ouve broadcast de gravação concluída
    LaunchedEffect(Unit) {
        refreshVideos()
    }

    DisposableEffect(context) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (intent?.action == ScreenRecordService.ACTION_RECORDING_FINISHED) {
                    refreshVideos()
                }
            }
        }
        val filter = IntentFilter(ScreenRecordService.ACTION_RECORDING_FINISHED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        onDispose {
            try {
                context.unregisterReceiver(receiver)
            } catch (_: Exception) {}
        }
    }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            try {
                val file = File(context.filesDir, "avatar_slot_$selectedSlot.png")
                context.contentResolver.openInputStream(uri)?.use { input ->
                    file.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }
                val localUri = Uri.fromFile(file)
                character = when (selectedSlot) {
                    0 -> character.copy(eyesOpenMouthClosedUri = localUri)
                    1 -> character.copy(eyesOpenMouthOpenUri = localUri)
                    2 -> character.copy(eyesClosedMouthClosedUri = localUri)
                    3 -> character.copy(eyesClosedMouthOpenUri = localUri)
                    else -> character
                }.also { it.saveToPrefs(context) }
                Toast.makeText(context, "Sprite atualizado com sucesso!", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Erro ao carregar imagem: \${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Paleta oficial
    val darkNavy = Color(0xFF0B1020)
    val cardBg = Color(0xFF12182B)
    val purpleAccent = Color(0xFF6C63FF)
    val textPrimary = Color(0xFFF5F5FF)
    val textSecondary = Color(0xFFA9AEC5)
    val recordRed = Color(0xFFF04444)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(purpleAccent),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Videocam,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            "PNGTuber Recorder",
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp,
                            color = textPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = darkNavy,
                    titleContentColor = textPrimary
                )
            )
        },
        containerColor = darkNavy
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Card Principal: Status & Ação de Gravação
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Painel de Gravação",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                            Text(
                                if (isRecording) "🔴 Gravando tela agora..." else "Pronto para começar",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (isRecording) recordRed else textSecondary
                            )
                        }

                        // Botão Restaurar Padrão da Seção Estúdio
                        IconButton(onClick = { resetSectionTarget = "studio" }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Restaurar", tint = textSecondary)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Botão Sobrepor (Avatar Flutuante)
                        Button(
                            onClick = onStartOverlay,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E2640))
                        ) {
                            Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(18.dp), tint = purpleAccent)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sobrepor", color = textPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }

                        // Botão Oficial com 2 Estados (Começar gravação / Parar gravação)
                        Button(
                            onClick = {
                                if (isRecording) onStopRecording() else onStartRecording()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isRecording) recordRed else purpleAccent
                            ),
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(
                                if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = Color.White
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                if (isRecording) "Parar gravação" else "Começar gravação",
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Seção de Sprites do Avatar
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Sprites do Avatar (PNG)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        IconButton(onClick = { resetSectionTarget = "avatar" }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Restaurar Avatar", tint = textSecondary)
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SpriteSlotCard(
                            title = "Repouso",
                            subtitle = "Olhos A / Boca F",
                            uri = character.eyesOpenMouthClosedUri,
                            cardBg = Color(0xFF0B1020),
                            textPrimary = textPrimary,
                            textSecondary = textSecondary,
                            modifier = Modifier.weight(1f)
                        ) {
                            selectedSlot = 0
                            imagePicker.launch("image/*")
                        }

                        SpriteSlotCard(
                            title = "Falando",
                            subtitle = "Olhos A / Boca A",
                            uri = character.eyesOpenMouthOpenUri,
                            cardBg = Color(0xFF0B1020),
                            textPrimary = textPrimary,
                            textSecondary = textSecondary,
                            modifier = Modifier.weight(1f)
                        ) {
                            selectedSlot = 1
                            imagePicker.launch("image/*")
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        SpriteSlotCard(
                            title = "Piscando",
                            subtitle = "Olhos F / Boca F",
                            uri = character.eyesClosedMouthClosedUri,
                            cardBg = Color(0xFF0B1020),
                            textPrimary = textPrimary,
                            textSecondary = textSecondary,
                            modifier = Modifier.weight(1f)
                        ) {
                            selectedSlot = 2
                            imagePicker.launch("image/*")
                        }

                        SpriteSlotCard(
                            title = "Piscando Falando",
                            subtitle = "Olhos F / Boca A",
                            uri = character.eyesClosedMouthOpenUri,
                            cardBg = Color(0xFF0B1020),
                            textPrimary = textPrimary,
                            textSecondary = textSecondary,
                            modifier = Modifier.weight(1f)
                        ) {
                            selectedSlot = 3
                            imagePicker.launch("image/*")
                        }
                    }
                }
            }

            // Sensibilidade de Voz
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Sensibilidade da Voz (Sem IA)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = textPrimary
                        )
                        IconButton(onClick = { resetSectionTarget = "audio" }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Restaurar Voz", tint = textSecondary)
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Ajuste o limiar para abrir a boca ao falar. Limiar atual: \${character.sensitivityThreshold}%",
                        style = MaterialTheme.typography.bodySmall,
                        color = textSecondary
                    )
                    Slider(
                        value = character.sensitivityThreshold.toFloat(),
                        onValueChange = {
                            character = character.copy(sensitivityThreshold = it.toInt()).also { c -> c.saveToPrefs(context) }
                        },
                        valueRange = 5f..60f,
                        colors = SliderDefaults.colors(
                            thumbColor = purpleAccent,
                            activeTrackColor = purpleAccent
                        )
                    )
                }
            }

            // Galeria dos Vídeos Gravados (Item 5)
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = cardBg)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Movie, contentDescription = null, tint = purpleAccent, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Galeria dos Vídeos Gravados",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = textPrimary
                            )
                        }
                        IconButton(onClick = { refreshVideos() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Recarregar", tint = textSecondary)
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Salvos em Movies/PNGTuberRecorder no celular.",
                        style = MaterialTheme.typography.bodySmall,
                        color = textSecondary
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    if (videoList.isEmpty()) {
                        // Mensagem amigável quando vazia
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF0B1020))
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.VideoLibrary, contentDescription = null, tint = textSecondary, modifier = Modifier.size(36.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "Nenhum vídeo gravado ainda.",
                                    color = textPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "Toque em 'Começar gravação' acima para criar seu primeiro vídeo com seu avatar!",
                                    color = textSecondary,
                                    fontSize = 12.sp,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            videoList.forEach { video ->
                                VideoItemCard(
                                    video = video,
                                    textPrimary = textPrimary,
                                    textSecondary = textSecondary,
                                    purpleAccent = purpleAccent,
                                    onPlay = {
                                        val playIntent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(video.uri, "video/mp4")
                                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                                        }
                                        try {
                                            context.startActivity(playIntent)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Não foi possível abrir o reprodutor de vídeo", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    onShare = {
                                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                            type = "video/mp4"
                                            putExtra(Intent.EXTRA_STREAM, video.uri)
                                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                                        }
                                        context.startActivity(Intent.createChooser(shareIntent, "Compartilhar vídeo"))
                                    },
                                    onRename = {
                                        videoToRename = video
                                        renameInputText = video.title.removeSuffix(".mp4")
                                    },
                                    onDelete = {
                                        videoToDelete = video
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal de confirmação para Restaurar Padrão de Seção (Item 7)
    resetSectionTarget?.let { section ->
        val sectionName = when (section) {
            "avatar" -> "Avatar & Sprites"
            "audio" -> "Sensibilidade da Voz"
            else -> "Painel do Estúdio"
        }

        AlertDialog(
            onDismissRequest = { resetSectionTarget = null },
            title = { Text("Restaurar $sectionName", color = textPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "Deseja restaurar as configurações originais de $sectionName? Suas outras configurações não serão apagadas.",
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        when (section) {
                            "avatar" -> {
                                character = character.copy(
                                    eyesOpenMouthClosedUri = null,
                                    eyesOpenMouthOpenUri = null,
                                    eyesClosedMouthClosedUri = null,
                                    eyesClosedMouthOpenUri = null
                                ).also { it.saveToPrefs(context) }
                            }
                            "audio" -> {
                                character = character.copy(sensitivityThreshold = 18).also { it.saveToPrefs(context) }
                            }
                            "studio" -> {
                                // Default studio settings
                            }
                        }
                        resetSectionTarget = null
                        Toast.makeText(context, "$sectionName restaurado para o padrão!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Confirmar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { resetSectionTarget = null }) {
                    Text("Cancelar", color = textSecondary)
                }
            },
            containerColor = cardBg
        )
    }

    // Modal de Exclusão de Vídeo com confirmação
    videoToDelete?.let { video ->
        AlertDialog(
            onDismissRequest = { videoToDelete = null },
            title = { Text("Excluir vídeo?", color = textPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "Deseja excluir permanentemente o vídeo '\${video.title}'?",
                    color = textSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        try {
                            context.contentResolver.delete(video.uri, null, null)
                            Toast.makeText(context, "Vídeo excluído com sucesso!", Toast.LENGTH_SHORT).show()
                            refreshVideos()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Erro ao excluir: \${e.message}", Toast.LENGTH_SHORT).show()
                        }
                        videoToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = recordRed)
                ) {
                    Text("Sim, excluir", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { videoToDelete = null }) {
                    Text("Cancelar", color = textSecondary)
                }
            },
            containerColor = cardBg
        )
    }

    // Modal de Renomear Vídeo
    videoToRename?.let { video ->
        AlertDialog(
            onDismissRequest = { videoToRename = null },
            title = { Text("Renomear Vídeo", color = textPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Digite o novo nome para o vídeo:", color = textSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = renameInputText,
                        onValueChange = { renameInputText = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = purpleAccent,
                            unfocusedBorderColor = Color(0xFF1E2640),
                            focusedTextColor = textPrimary,
                            unfocusedTextColor = textPrimary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (renameInputText.isNotBlank()) {
                            try {
                                val newName = if (renameInputText.endsWith(".mp4")) renameInputText else "$renameInputText.mp4"
                                val values = ContentValues().apply {
                                    put(MediaStore.Video.Media.DISPLAY_NAME, newName)
                                }
                                context.contentResolver.update(video.uri, values, null, null)
                                Toast.makeText(context, "Vídeo renomeado!", Toast.LENGTH_SHORT).show()
                                refreshVideos()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Erro ao renomear: \${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                        videoToRename = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = purpleAccent)
                ) {
                    Text("Salvar", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { videoToRename = null }) {
                    Text("Cancelar", color = textSecondary)
                }
            },
            containerColor = cardBg
        )
    }
}

fun loadPngTuberVideos(context: Context): List<RecordedVideo> {
    val list = mutableListOf<RecordedVideo>()
    val projection = arrayOf(
        MediaStore.Video.Media._ID,
        MediaStore.Video.Media.DISPLAY_NAME,
        MediaStore.Video.Media.DURATION,
        MediaStore.Video.Media.SIZE,
        MediaStore.Video.Media.DATE_ADDED
    )
    val selection = "\${MediaStore.Video.Media.DISPLAY_NAME} LIKE ?"
    val selectionArgs = arrayOf("PNGTuber_%")
    val sortOrder = "\${MediaStore.Video.Media.DATE_ADDED} DESC"

    try {
        context.contentResolver.query(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            sortOrder
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
            val durCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)
            val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE)
            val dateCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATE_ADDED)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val name = cursor.getString(nameCol) ?: "PNGTuber Video"
                val duration = cursor.getLong(durCol)
                val size = cursor.getLong(sizeCol)
                val dateAdded = cursor.getLong(dateCol)
                val uri = Uri.withAppendedPath(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id.toString())

                list.add(RecordedVideo(id, name, uri, duration, size, dateAdded))
            }
        }
    } catch (e: Exception) {
        Log.w("HomeScreen", "Aviso ao consultar MediaStore: \${e.message}")
    }
    return list
}

@Composable
fun VideoItemCard(
    video: RecordedVideo,
    textPrimary: Color,
    textSecondary: Color,
    purpleAccent: Color,
    onPlay: () -> Unit,
    onShare: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    val dateFormatted = try {
        val sdf = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
        sdf.format(Date(video.dateAddedSec * 1000L))
    } catch (_: Exception) {
        "Recente"
    }

    val sizeFormatted = if (video.sizeBytes < 1024 * 1024) {
        "\${video.sizeBytes / 1024} KB"
    } else {
        String.format(Locale.US, "%.1f MB", video.sizeBytes.toFloat() / (1024 * 1024))
    }

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0B1020))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Botão Play com miniatura
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFF1E2640))
                    .clickable(onClick = onPlay),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Reproduzir", tint = purpleAccent, modifier = Modifier.size(28.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    video.title,
                    color = textPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    "$dateFormatted • $sizeFormatted",
                    color = textSecondary,
                    fontSize = 11.sp
                )
            }

            // Ações rápidas: Compartilhar, Renomear, Excluir
            IconButton(onClick = onShare, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Share, contentDescription = "Compartilhar", tint = textSecondary, modifier = Modifier.size(16.dp))
            }
            IconButton(onClick = onRename, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Edit, contentDescription = "Renomear", tint = textSecondary, modifier = Modifier.size(16.dp))
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Delete, contentDescription = "Excluir", tint = Color(0xFFF04444), modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun SpriteSlotCard(
    title: String,
    subtitle: String,
    uri: Uri?,
    cardBg: Color,
    textPrimary: Color,
    textSecondary: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = cardBg)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(68.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF12182B)),
                contentAlignment = Alignment.Center
            ) {
                if (uri != null) {
                    AsyncImage(
                        model = uri,
                        contentDescription = title,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = textSecondary)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = textPrimary)
            Text(subtitle, fontSize = 10.sp, color = textSecondary)
        }
    }
}
`
  },
  {
    path: ".github/workflows/build-apk.yml",
    language: "yaml",
    title: "build-apk.yml (Gerador Automático de APK)",
    description: "Ação do GitHub para compilar o APK na nuvem gratuitamente e gerar o link de download direto.",
    content: `name: Compilar APK Android

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Gerar APK Assinado
    runs-on: ubuntu-latest

    steps:
    - name: Checkout do Repositório
      uses: actions/checkout@v4

    - name: Configurar JDK 17
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'

    - name: Aceitar Licenças do Android SDK
      run: |
        yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses 2>/dev/null || yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses 2>/dev/null || true

    - name: Gerar Chave de Assinatura (Keystore)
      run: |
        TARGET_DIR="."
        if [ -d "android" ]; then
          TARGET_DIR="android"
        fi
        cd $TARGET_DIR
        keytool -genkeypair -v \\
          -keystore release.jks \\
          -alias pngtuber \\
          -keyalg RSA \\
          -keysize 2048 \\
          -validity 10000 \\
          -storepass android \\
          -keypass android \\
          -dname "CN=PNGTuberRecorder, OU=MobileApp, O=App, L=SaoPaulo, ST=SP, C=BR"

    - name: Compilar APKs Assinados
      run: |
        TARGET_DIR="."
        if [ -d "android" ]; then
          TARGET_DIR="android"
        fi
        cd $TARGET_DIR
        chmod +x gradlew
        ./gradlew assembleDebug --stacktrace --no-daemon

    - name: Publicar APK para Download
      uses: actions/upload-artifact@v4
      with:
        name: PNGTuber-Recorder-APK
        path: |
          android/app/build/outputs/apk/*/*.apk
          app/build/outputs/apk/*/*.apk
        retention-days: 14
`
  },
];
