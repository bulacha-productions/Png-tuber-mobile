package com.pngtuber.recorder.ui

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
                            "${character.sensitivityThreshold}%",
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
                    "• Se a boca do avatar ficar abrindo sozinha com ruído ambiente, aumente o limiar para cerca de 25% a 30%.\n• Fones de ouvido com microfone integrado oferecem a sincronia mais precisa e evitam que o som do jogo reative a boca do PNGTuber.",
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
