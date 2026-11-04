# Shredder Live Cohost (Beatshredder) — Android APK Build Guide

This repository contains the complete, self-contained Android Studio / Gradle project (`/android-app`), Capacitor configuration (`/capacitor.config.json`), and Trusted Web Activity manifest (`/twa-manifest.json`) required to compile **Shredder Live Cohost** into an installable `.apk` file with native Draw-Over-Screen (`SYSTEM_ALERT_WINDOW`) gaming overlay support.

---

## 1. Sync Web Bundle into Android APK Assets

Run the following command at the project root to build the production React + Web Audio bundle (`dist/`) and copy it directly into `/android-app/app/src/main/assets/public/`:

```bash
npm run apk:sync
```

> **Note:** `/android-app/app/build.gradle.kts` also registers a `syncWebDistAssets` preBuild task that automatically syncs `../dist` into `src/main/assets/public` whenever Gradle builds the APK.

---

## 2. Build the `.apk` File (3 Options)

### Option A: Android Studio (Recommended)
1. Open **Android Studio** and select **Open** -> choose the `/android-app` folder.
2. Wait for Gradle Sync to complete.
3. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Your installable APK is generated at:
   - Debug APK: `android-app/app/build/outputs/apk/debug/app-debug.apk`
   - Release APK: `android-app/app/build/outputs/apk/release/app-release.apk`

### Option B: Command-Line Gradle
From the project root (with Android SDK & Java 17 installed):

```bash
npm run apk:sync
cd android-app
./gradlew assembleDebug
```

Install directly onto a connected Android phone via ADB:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Option C: Bubblewrap TWA CLI (Play Store / Standalone PWA APK)
Using the included `/twa-manifest.json`:

```bash
npx @bubblewrap/cli build
```

---

## 3. Included Android APK Architecture

| File Path | Purpose |
| :--- | :--- |
| `android-app/settings.gradle.kts` | Configures Google & MavenCentral repositories and includes `:app` |
| `android-app/build.gradle.kts` | Top-level Android Application (`8.5.2`) & Kotlin (`1.9.24`) Gradle plugins |
| `android-app/gradle.properties` | AndroidX, JVM memory, and non-transitive R class flags |
| `android-app/gradle/wrapper/gradle-wrapper.properties` | Locks Gradle `8.7` distribution |
| `android-app/app/build.gradle.kts` | Module config (`com.beatshredder.cohost`, SDK 26–34, `WebViewAssetLoader`, `OkHttp`, `syncWebDistAssets`) |
| `android-app/app/proguard-rules.pro` | Preserves `@JavascriptInterface` (`BeatshredderAndroidBridge`) and OkHttp in release APKs |
| `android-app/app/src/main/AndroidManifest.xml` | Declares `SYSTEM_ALERT_WINDOW`, `RECORD_AUDIO`, `FOREGROUND_SERVICE_MEDIA_PROJECTION`, `FOREGROUND_SERVICE_MICROPHONE`, and PiP |
| `android-app/app/src/main/java/com/beatshredder/cohost/MainActivity.kt` | Hosts bundled `assets/public/index.html` via `WebViewAssetLoader`, exposes `BeatshredderAndroidBridge`, and enters PiP on game switch |
| `android-app/app/src/main/java/com/beatshredder/cohost/FloatingOverlayService.kt` | Draws the `TYPE_APPLICATION_OVERLAY` touch-passthrough HUD over Fortnite/games and streams 1 FPS screen vision + 16kHz PCM open mic |
| `android-app/app/src/main/res/**` | Dark stage theme (`#09080D`), strings, colors, cleartext/HTTPS network security config, and adaptive vector launcher icons |
| `capacitor.config.json` & `twa-manifest.json` | Ready-to-use Capacitor and Bubblewrap TWA project manifests |
