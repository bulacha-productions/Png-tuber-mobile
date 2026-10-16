package com.pngtuber.recorder.service

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
            Toast.makeText(this, "Tamanho: ${avatarSizeDp}dp", Toast.LENGTH_SHORT).show()
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
