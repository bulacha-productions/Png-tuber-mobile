package com.pngtuber.recorder.ui

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
                Toast.makeText(context, "Erro ao carregar imagem: ${e.message}", Toast.LENGTH_SHORT).show()
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
                        "Ajuste o limiar para abrir a boca ao falar. Limiar atual: ${character.sensitivityThreshold}%",
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
                    "Deseja excluir permanentemente o vídeo '${video.title}'?",
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
                                Toast.makeText(context, "Erro ao renomear: ${e.message}", Toast.LENGTH_SHORT).show()
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
    val selection = "${MediaStore.Video.Media.DISPLAY_NAME} LIKE ?"
    val selectionArgs = arrayOf("PNGTuber_%")
    val sortOrder = "${MediaStore.Video.Media.DATE_ADDED} DESC"

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
        Log.w("HomeScreen", "Aviso ao consultar MediaStore: ${e.message}")
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
        "${video.sizeBytes / 1024} KB"
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
