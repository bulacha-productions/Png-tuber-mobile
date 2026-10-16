package com.pngtuber.recorder.ui

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
                Toast.makeText(context, "Erro ao carregar imagem: ${e.message}", Toast.LENGTH_SHORT).show()
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
                    "Escala do Avatar: ${(character.scale * 100).toInt()}%",
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
                    "Intensidade do Saltinho ao Falar: ${character.bounceStrengthDp.toInt()} px",
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
