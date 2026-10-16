package com.pngtuber.recorder.ui

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
                        "${proSettings.videoBitrateMbps} Mbps",
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
                        "${proSettings.audioBitrateKbps} kbps",
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
