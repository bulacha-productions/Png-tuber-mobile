package com.pngtuber.recorder

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
