#!/usr/bin/env node
/**
 * Prepares and verifies the Shredder Live Cohost (Beatshredder) Android APK project.
 *
 * 1. Copies compiled Vite production web assets (`dist/`) into
 *    `android-app/app/src/main/assets/public/` so the APK works standalone.
 * 2. Verifies that every Gradle, AndroidManifest, Kotlin, resource, adaptive icon,
 *    and Capacitor/TWA manifest file required to build an `.apk` is present.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const androidAssetsPublicDir = path.join(
  rootDir,
  'android-app',
  'app',
  'src',
  'main',
  'assets',
  'public'
);

const REQUIRED_APK_FILES = [
  'android-app/settings.gradle.kts',
  'android-app/build.gradle.kts',
  'android-app/gradle.properties',
  'android-app/gradle/wrapper/gradle-wrapper.properties',
  'android-app/gradlew',
  'android-app/gradlew.bat',
  'android-app/app/build.gradle.kts',
  'android-app/app/proguard-rules.pro',
  'android-app/app/src/main/AndroidManifest.xml',
  'android-app/app/src/main/java/com/beatshredder/cohost/MainActivity.kt',
  'android-app/app/src/main/java/com/beatshredder/cohost/FloatingOverlayService.kt',
  'android-app/app/src/main/res/values/strings.xml',
  'android-app/app/src/main/res/values/colors.xml',
  'android-app/app/src/main/res/values/themes.xml',
  'android-app/app/src/main/res/xml/network_security_config.xml',
  'android-app/app/src/main/res/drawable/ic_launcher_background.xml',
  'android-app/app/src/main/res/drawable/ic_launcher_foreground.xml',
  'android-app/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
  'android-app/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  'capacitor.config.json',
  'twa-manifest.json',
];

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(distDir)) {
  fs.rmSync(androidAssetsPublicDir, { recursive: true, force: true });
  copyDirRecursive(distDir, androidAssetsPublicDir);
  console.log('[APK Prep] Synced dist/ -> android-app/app/src/main/assets/public/');
} else {
  console.log('[APK Prep] Note: dist/ not built yet; run `npm run build` before `npm run apk:sync`.');
}

// Ensure gradlew is executable
const gradlewPath = path.join(rootDir, 'android-app', 'gradlew');
if (fs.existsSync(gradlewPath)) {
  fs.chmodSync(gradlewPath, 0o755);
}

let missing = [];
for (const relPath of REQUIRED_APK_FILES) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
    missing.push(relPath);
  }
}

if (missing.length > 0) {
  console.error('[APK Prep] Missing required APK files:', missing);
  process.exit(1);
}

console.log(
  `[APK Prep] Verified all ${REQUIRED_APK_FILES.length} required Android APK project files are present and ready.`
);
