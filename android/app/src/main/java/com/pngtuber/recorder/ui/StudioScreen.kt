package com.pngtuber.recorder.ui

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
