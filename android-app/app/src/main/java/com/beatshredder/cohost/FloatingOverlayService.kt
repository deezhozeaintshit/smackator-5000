package com.beatshredder.cohost

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.ImageReader
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.Timer
import java.util.TimerTask
import java.util.concurrent.TimeUnit

/**
 * Beatshredder Native Android Draw-Over-Screen Floating Overlay Service.
 *
 * - Draws a draggable floating overlay HUD over Fortnite or any mobile game using
 *   WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY with FLAG_NOT_FOCUSABLE
 *   so all game touch inputs pass directly through to the game.
 * - Captures 1 FPS JPEG gameplay frames via MediaProjection + VirtualDisplay.
 * - Streams continuous 16kHz PCM open-mic audio (zero push-to-talk) and 1 FPS
 *   vision frames to the Beatshredder Gemini Live WebSocket (`/live`) so the
 *   AI co-host talks trash non-stop while the user plays and records their screen.
 */
class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var statusTextView: TextView? = null
    private var captionTextView: TextView? = null

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var visionTimer: Timer? = null
    private var audioRecord: AudioRecord? = null
    private var audioThread: Thread? = null
    private var liveWebSocket: WebSocket? = null
    private var framesSentCount: Int = 0
    @Volatile private var isStreamingLive = false

    private val mainHandler = Handler(Looper.getMainLooper())
    private val httpClient by lazy {
        OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .pingInterval(15, TimeUnit.SECONDS)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createFloatingOverlayWindow()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val resultCode = intent?.getIntExtra("RESULT_CODE", 0) ?: 0
        @Suppress("DEPRECATION")
        val resultData = intent?.getParcelableExtra<Intent>("RESULT_DATA")
        val serverUrl = intent?.getStringExtra("SERVER_URL") ?: BuildConfig.DEFAULT_SERVER_URL

        connectGeminiLiveWebSocket(serverUrl)

        if (resultCode != 0 && resultData != null) {
            startGameplayScreenCapture(resultCode, resultData)
            startHandsFreeOpenMic()
        }
        return START_STICKY
    }

    private fun connectGeminiLiveWebSocket(serverUrl: String) {
        val wsUrl = serverUrl
            .replaceFirst("^https://".toRegex(), "wss://")
            .replaceFirst("^http://".toRegex(), "ws://")
            .trimEnd('/') + "/live"

        val request = Request.Builder().url(wsUrl).build()
        liveWebSocket = httpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                val setupPayload = JSONObject().apply {
                    put("type", "setup")
                    put("personaId", "beatshredder")
                    put("gamePresetId", "fortnite_br")
                    put("roastAggression", 75)
                }
                webSocket.send(setupPayload.toString())
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val transcript = json.optString("text", "")
                    if (transcript.isNotBlank()) {
                        mainHandler.post {
                            captionTextView?.text = transcript
                        }
                    }
                } catch (_: Exception) {
                    // Ignore non-JSON frames
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                mainHandler.post {
                    statusTextView?.text = "BEATSHREDDER • LOCAL OVERLAY (RECONNECTING...)"
                }
            }
        })
    }

    private fun createFloatingOverlayWindow() {
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        // FLAG_NOT_FOCUSABLE ensures Fortnite / game touch controls work without interruption
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 24
            y = 120
        }

        val backgroundDrawable = GradientDrawable().apply {
            setColor(Color.parseColor("#EA09080D"))
            cornerRadius = 28f
            setStroke(3, Color.parseColor("#F59E0B"))
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = backgroundDrawable
            setPadding(32, 22, 32, 22)
        }

        statusTextView = TextView(this).apply {
            text = "BEATSHREDDER • LIVE OVERLAY (OPEN MIC + VISION)"
            setTextColor(Color.parseColor("#F59E0B"))
            textSize = 11f
        }

        captionTextView = TextView(this).apply {
            text = "Watching your Fortnite screen... Shred Them Beats Boy!"
            setTextColor(Color.parseColor("#F5F3FF"))
            textSize = 13f
            maxWidth = 680
        }

        container.addView(statusTextView)
        container.addView(captionTextView)

        // Allow dragging the floating overlay bubble anywhere over the game screen
        var initialX = 0
        var initialY = 0
        var touchX = 0f
        var touchY = 0f

        container.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    touchX = event.rawX
                    touchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX - (event.rawX - touchX).toInt()
                    params.y = initialY + (event.rawY - touchY).toInt()
                    windowManager.updateViewLayout(container, params)
                    true
                }
                else -> false
            }
        }

        overlayView = container
        windowManager.addView(container, params)
    }

    private fun startGameplayScreenCapture(resultCode: Int, resultData: Intent) {
        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

        val width = 640
        val height = 360
        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "BeatshredderGameVision",
            width,
            height,
            resources.displayMetrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            mainHandler
        )

        // Stream 1 FPS JPEG frames to Gemini Live API WebSocket
        visionTimer = Timer()
        visionTimer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                val image = imageReader?.acquireLatestImage() ?: return
                try {
                    val planes = image.planes
                    val buffer = planes[0].buffer
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    bitmap.copyPixelsFromBuffer(buffer)
                    val out = ByteArrayOutputStream()
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 60, out)
                    val base64Jpeg = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
                    sendVideoFrameToGeminiLive(base64Jpeg)
                } finally {
                    image.close()
                }
            }
        }, 1000, 1000)
    }

    @SuppressLint("MissingPermission")
    private fun startHandsFreeOpenMic() {
        val sampleRate = 16000
        val minBuffer = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        if (minBuffer <= 0) return

        audioRecord = AudioRecord(
            MediaRecorder.AudioSource.VOICE_COMMUNICATION,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            minBuffer
        )
        isStreamingLive = true
        audioRecord?.startRecording()

        audioThread = Thread {
            val pcmBuffer = ByteArray(minBuffer)
            while (isStreamingLive) {
                val readBytes = audioRecord?.read(pcmBuffer, 0, pcmBuffer.size) ?: 0
                if (readBytes > 0) {
                    val base64Pcm = Base64.encodeToString(pcmBuffer, 0, readBytes, Base64.NO_WRAP)
                    val payload = JSONObject().apply {
                        put("type", "audio")
                        put("data", base64Pcm)
                        put("mimeType", "audio/pcm;rate=16000")
                    }
                    liveWebSocket?.send(payload.toString())
                }
            }
        }.apply {
            name = "BeatshredderOpenMicThread"
            start()
        }
    }

    private fun sendVideoFrameToGeminiLive(base64Jpeg: String) {
        framesSentCount += 1
        val payload = JSONObject().apply {
            put("type", "video")
            put("data", base64Jpeg)
            put("mimeType", "image/jpeg")
        }
        liveWebSocket?.send(payload.toString())

        mainHandler.post {
            statusTextView?.text = "BEATSHREDDER • VISION (${framesSentCount}f) • OPEN MIC"
        }
    }

    private fun startForegroundNotification() {
        val channelId = "beatshredder_overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                getString(R.string.overlay_channel_name),
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setContentTitle(getString(R.string.overlay_notification_title))
                .setContentText(getString(R.string.overlay_notification_text))
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Shredder Live Cohost Overlay Active")
                .setContentText("Watching gameplay & talking trash hands-free")
                .build()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                1001,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(1001, notification)
        }
    }

    override fun onDestroy() {
        isStreamingLive = false
        visionTimer?.cancel()
        try {
            audioThread?.join(300)
        } catch (_: Exception) {
        }
        audioRecord?.stop()
        audioRecord?.release()
        virtualDisplay?.release()
        mediaProjection?.stop()
        liveWebSocket?.close(1000, "Overlay closed")
        overlayView?.let { windowManager.removeView(it) }
        super.onDestroy()
    }
}
