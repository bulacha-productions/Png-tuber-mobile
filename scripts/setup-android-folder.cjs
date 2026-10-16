const fs = require('fs');
const path = require('path');

const androidDir = path.resolve(__dirname, '../android');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(androidDir, relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relPath}`);
}

// 1. settings.gradle.kts
writeFile('settings.gradle.kts', `
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PNGTuberRecorder"
include(":app")
`);

// 2. build.gradle.kts
writeFile('build.gradle.kts', `
plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
}
`);

// 3. gradle-wrapper.properties
writeFile('gradle/wrapper/gradle-wrapper.properties', `
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

// 4. gradlew shell script
writeFile('gradlew', `#!/bin/sh
exec gradle "$@"
`);

// 5. app/build.gradle.kts
writeFile('app/build.gradle.kts', `
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.pngtuber.recorder"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.pngtuber.recorder"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0-alpha"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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
`);

// 6. app/src/main/AndroidManifest.xml
writeFile('app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
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
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="PNGTuber Recorder"
        android:roundIcon="@android:drawable/sym_def_app_icon"
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
`);

// 7. AudioVolumeDetector.kt
writeFile('app/src/main/java/com/pngtuber/recorder/audio/AudioVolumeDetector.kt', `package com.pngtuber.recorder.audio

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
    fun start(scope: CoroutineScope) {
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
`);

// 8. FloatingOverlayService.kt
writeFile('app/src/main/java/com/pngtuber/recorder/service/FloatingOverlayService.kt', `package com.pngtuber.recorder.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import androidx.compose.ui.platform.ComposeView
import com.pngtuber.recorder.audio.AudioVolumeDetector
import kotlinx.coroutines.*

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private val audioDetector = AudioVolumeDetector()
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        startForegroundNotification()
        audioDetector.start(serviceScope)
        setupOverlayView()
    }

    private fun setupOverlayView() {
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 200
        }

        val composeView = ComposeView(this).apply {
            // Render avatar state in overlay
        }

        composeView.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager.updateViewLayout(composeView, params)
                        return true
                    }
                }
                return false
            }
        })

        overlayView = composeView
        windowManager.addView(overlayView, params)
    }

    private fun startForegroundNotification() {
        val channelId = "pngtuber_overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "PNGTuber Overlay Ativo",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setContentTitle("PNGTuber Sobreposto")
                .setContentText("O avatar está ativo sobre seus jogos.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("PNGTuber Sobreposto")
                .setContentText("O avatar está ativo.")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .build()
        }

        startForeground(1001, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        audioDetector.stop()
        overlayView?.let { windowManager.removeView(it) }
        overlayView = null
    }
}
`);

// 9. ScreenRecordService.kt
writeFile('app/src/main/java/com/pngtuber/recorder/service/ScreenRecordService.kt', `package com.pngtuber.recorder.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.ContentValues
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.provider.MediaStore
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.FileDescriptor

class ScreenRecordService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaRecorder: MediaRecorder? = null
    private var isRecording = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_NOT_STICKY

        when (action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                if (resultData != null) {
                    startRecording(resultCode, resultData)
                }
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

        startForegroundNotification()

        val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)

        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val dpi = metrics.densityDpi

        val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, data)

        val contentValues = ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, "PNGTuber_\${System.currentTimeMillis()}.mp4")
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/PNGTuberRecorder")
        }

        val videoUri = contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)
        val fileDescriptor = contentResolver.openFileDescriptor(videoUri!!, "rw")?.fileDescriptor

        setupMediaRecorder(width, height, fileDescriptor)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenRecorder",
            width, height, dpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaRecorder?.surface,
            null, null
        )

        mediaRecorder?.start()
        isRecording = true
    }

    private fun setupMediaRecorder(width: Int, height: Int, fd: FileDescriptor?) {
        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(this)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setVideoEncodingBitRate(8 * 1000 * 1000)
            setVideoFrameRate(60)
            setVideoSize(width, height)
            setAudioSamplingRate(44100)
            setAudioEncodingBitRate(128000)
            setOutputFile(fd)
            prepare()
        }
    }

    private fun stopRecording() {
        if (!isRecording) return
        isRecording = false

        try {
            mediaRecorder?.stop()
            mediaRecorder?.reset()
        } catch (_: Exception) {}

        virtualDisplay?.release()
        mediaProjection?.stop()
        mediaRecorder?.release()

        virtualDisplay = null
        mediaProjection = null
        mediaRecorder = null
    }

    private fun startForegroundNotification() {
        val channelId = "screen_recording_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Gravação de Tela",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setContentTitle("Gravando Tela")
                .setContentText("A tela e o microfone estão sendo gravados.")
                .setSmallIcon(android.R.drawable.presence_video_online)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Gravando Tela")
                .setContentText("Gravando.")
                .setSmallIcon(android.R.drawable.presence_video_online)
                .build()
        }

        startForeground(2002, notification)
    }

    override fun onDestroy() {
        stopRecording()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.pngtuber.recorder.START"
        const val ACTION_STOP = "com.pngtuber.recorder.STOP"
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"
    }
}
`);

// 10. PngTuberCharacter.kt
writeFile('app/src/main/java/com/pngtuber/recorder/model/PngTuberCharacter.kt', `package com.pngtuber.recorder.model

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
)
`);

// 11. MainActivity.kt
writeFile('app/src/main/java/com/pngtuber/recorder/MainActivity.kt', `package com.pngtuber.recorder

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
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.pngtuber.recorder.service.FloatingOverlayService
import com.pngtuber.recorder.service.ScreenRecordService
import com.pngtuber.recorder.ui.HomeScreen

class MainActivity : ComponentActivity() {

    private lateinit var projectionManager: MediaProjectionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var isRecording by remember { mutableStateOf(false) }

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
                            Toast.makeText(this, "Gravação iniciada!", Toast.LENGTH_SHORT).show()
                        }
                    }

                    LaunchedEffect(Unit) {
                        val perms = mutableListOf(Manifest.permission.RECORD_AUDIO)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            perms.add(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        permissionLauncher.launch(perms.toTypedArray())
                    }

                    HomeScreen(
                        isRecording = isRecording,
                        onStartOverlay = {
                            if (!checkOverlayPermission()) {
                                requestOverlayPermission()
                            } else {
                                val intent = Intent(this, FloatingOverlayService::class.java)
                                startService(intent)
                                Toast.makeText(this, "Avatar sobreposto ativado!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        onStartRecording = {
                            screenCaptureLauncher.launch(projectionManager.createScreenCaptureIntent())
                        },
                        onStopRecording = {
                            val intent = Intent(this, ScreenRecordService::class.java).apply {
                                action = ScreenRecordService.ACTION_STOP
                            }
                            startService(intent)
                            isRecording = false
                            Toast.makeText(this, "Gravação finalizada e salva em Vídeos!", Toast.LENGTH_LONG).show()
                        }
                    )
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
`);

// 12. HomeScreen.kt
writeFile('app/src/main/java/com/pngtuber/recorder/ui/HomeScreen.kt', `package com.pngtuber.recorder.ui

import android.net.Uri
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.pngtuber.recorder.model.PngTuberCharacter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    isRecording: Boolean,
    onStartOverlay: () -> Unit,
    onStartRecording: () -> Unit,
    onStopRecording: () -> Unit
) {
    var character by remember { mutableStateOf(PngTuberCharacter()) }
    var selectedSlot by remember { mutableStateOf(0) }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            character = when (selectedSlot) {
                0 -> character.copy(eyesOpenMouthClosedUri = uri)
                1 -> character.copy(eyesOpenMouthOpenUri = uri)
                2 -> character.copy(eyesClosedMouthClosedUri = uri)
                3 -> character.copy(eyesClosedMouthOpenUri = uri)
                else -> character
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "PNGTuber Recorder",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Gravação de Tela & Sobreposição",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Sobreponha seu avatar 2D na tela enquanto joga no celular e grave o vídeo com áudio sincronizado.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onStartOverlay,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sobrepor na Tela")
                        }
                        Button(
                            onClick = {
                                if (isRecording) onStopRecording() else onStartRecording()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isRecording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                            ),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                if (isRecording) Icons.Default.Stop else Icons.Default.FiberManualRecord,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (isRecording) "Parar Gravação" else "Gravar Tela")
                        }
                    }
                }
            }

            Text(
                "Sprites do Avatar (PNG com Transparência)",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SpriteSlotCard(
                    title = "Repouso",
                    subtitle = "Olhos A / Boca F",
                    uri = character.eyesOpenMouthClosedUri,
                    modifier = Modifier.weight(1f)
                ) {
                    selectedSlot = 0
                    imagePicker.launch("image/png")
                }
                SpriteSlotCard(
                    title = "Falando",
                    subtitle = "Olhos A / Boca A",
                    uri = character.eyesOpenMouthOpenUri,
                    modifier = Modifier.weight(1f)
                ) {
                    selectedSlot = 1
                    imagePicker.launch("image/png")
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SpriteSlotCard(
                    title = "Piscando",
                    subtitle = "Olhos F / Boca F",
                    uri = character.eyesClosedMouthClosedUri,
                    modifier = Modifier.weight(1f)
                ) {
                    selectedSlot = 2
                    imagePicker.launch("image/png")
                }
                SpriteSlotCard(
                    title = "Piscando Falando",
                    subtitle = "Olhos F / Boca A",
                    uri = character.eyesClosedMouthOpenUri,
                    modifier = Modifier.weight(1f)
                ) {
                    selectedSlot = 3
                    imagePicker.launch("image/png")
                }
            }

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Sensibilidade da Voz (Sem IA)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        "Ajuste o limiar para abrir a boca ao falar. Limiar atual: \${character.sensitivityThreshold}%",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Slider(
                        value = character.sensitivityThreshold.toFloat(),
                        onValueChange = { character = character.copy(sensitivityThreshold = it.toInt()) },
                        valueRange = 5f..60f
                    )
                }
            }
        }
    }
}

@Composable
fun SpriteSlotCard(
    title: String,
    subtitle: String,
    uri: Uri?,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.DarkGray),
                contentAlignment = Alignment.Center
            ) {
                if (uri != null) {
                    AsyncImage(
                        model = uri,
                        contentDescription = title,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = Color.LightGray)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Text(subtitle, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
`);

console.log('Complete Android native project tree populated in /android!');
