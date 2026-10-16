package com.pngtuber.recorder.ui

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
                            "Total: ${videoList.size} vídeo(s) salvos em Movies/PNGTuberRecorder",
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
                    "Deseja excluir permanentemente o vídeo '${video.title}'?",
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
                            Toast.makeText(context, "Erro ao excluir: ${e.message}", Toast.LENGTH_SHORT).show()
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
                                Toast.makeText(context, "Erro ao renomear: ${e.message}", Toast.LENGTH_SHORT).show()
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
