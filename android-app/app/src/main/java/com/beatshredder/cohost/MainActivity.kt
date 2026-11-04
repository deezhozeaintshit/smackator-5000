package com.beatshredder.cohost

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Rational
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

/**
 * MainActivity for Shredder Live Cohost (Beatshredder) Android APK.
 *
 * - Hosts the bundled React + Web Audio stage app via WebViewAssetLoader
 *   (https://appassets.androidplatform.net/assets/public/index.html) or live Cloud Run URL.
 * - Exposes `window.BeatshredderAndroidBridge` (@JavascriptInterface) so the UI can
 *   trigger native Android SYSTEM_ALERT_WINDOW overlays, MediaProjection screen capture,
 *   and Picture-in-Picture mode directly from JavaScript.
 * - Requests RECORD_AUDIO (continuous hands-free open mic) and SYSTEM_ALERT_WINDOW
 *   ("Draw over other apps") so the AI co-host floats over Fortnite and mobile games.
 */
class MainActivity : Activity() {

    companion object {
        private const val REQ_OVERLAY_PERMISSION = 2001
        private const val REQ_SCREEN_CAPTURE = 2002
        private const val REQ_RUNTIME_PERMISSIONS = 2003
    }

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true

            addJavascriptInterface(BeatshredderJsBridge(), "BeatshredderAndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        request.grant(request.resources)
                    }
                }
            }
        }

        setContentView(webView)
        loadStageApplication()
        requestAudioAndNotificationPermissions()
    }

    private fun loadStageApplication() {
        val hasBundledWebAssets = try {
            assets.list("public")?.contains("index.html") == true
        } catch (_: Exception) {
            false
        }

        if (hasBundledWebAssets) {
            webView.loadUrl("https://appassets.androidplatform.net/assets/public/index.html")
        } else {
            webView.loadUrl(BuildConfig.DEFAULT_SERVER_URL)
        }
    }

    private fun requestAudioAndNotificationPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val needed = mutableListOf<String>()
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.RECORD_AUDIO)
            }
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.CAMERA)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
            if (needed.isNotEmpty()) {
                requestPermissions(needed.toTypedArray(), REQ_RUNTIME_PERMISSIONS)
            }
        }
    }

    fun ensureOverlayAndStartCapture() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivityForResult(intent, REQ_OVERLAY_PERMISSION)
            return
        }
        requestGameplayScreenCapture()
    }

    private fun requestGameplayScreenCapture() {
        val projectionManager =
            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(
            projectionManager.createScreenCaptureIntent(),
            REQ_SCREEN_CAPTURE
        )
    }

    fun enterGamePipOverlay() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            enterPictureInPictureMode(params)
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Automatically enter Picture-in-Picture overlay when switching to Fortnite
        enterGamePipOverlay()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_OVERLAY_PERMISSION) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)) {
                requestGameplayScreenCapture()
            }
        } else if (requestCode == REQ_SCREEN_CAPTURE && resultCode == RESULT_OK && data != null) {
            val serviceIntent = Intent(this, FloatingOverlayService::class.java).apply {
                putExtra("RESULT_CODE", resultCode)
                putExtra("RESULT_DATA", data)
                putExtra("SERVER_URL", BuildConfig.DEFAULT_SERVER_URL)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        }
    }

    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    inner class BeatshredderJsBridge {
        @JavascriptInterface
        fun isNativeAndroidApk(): Boolean = true

        @JavascriptInterface
        fun canDrawOverlays(): Boolean {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this@MainActivity)
        }

        @JavascriptInterface
        fun startFloatingOverlay() {
            runOnUiThread {
                ensureOverlayAndStartCapture()
            }
        }

        @JavascriptInterface
        fun stopFloatingOverlay() {
            runOnUiThread {
                stopService(Intent(this@MainActivity, FloatingOverlayService::class.java))
            }
        }

        @JavascriptInterface
        fun enterPipMode() {
            runOnUiThread {
                enterGamePipOverlay()
            }
        }
    }
}
