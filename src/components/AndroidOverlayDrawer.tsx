import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Smartphone,
  Layers,
  PictureInPicture2,
  Minimize2,
  Maximize2,
  Download,
  Code2,
  Eye,
  Mic,
  Flame,
  Crosshair,
  Skull,
  Scissors,
  Move,
  CheckCircle2,
  Copy,
  X,
  Zap,
} from 'lucide-react';
import {
  COHOST_PERSONAS,
  CohostPersonaId,
  FloatingOverlayAnchor,
  FloatingScreenOverlayConfig,
  GAME_STREAM_PRESETS,
  GameStreamPresetId,
  GameplayMomentId,
  buildFloatingHudStatus,
  getAndroidApkProjectManifest,
} from '../lib/streamEngine';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Badge, Button, Dialog } from './ui/primitives';

declare global {
  interface Window {
    BeatshredderAndroidBridge?: {
      isNativeAndroidApk?: () => boolean;
      canDrawOverlays?: () => boolean;
      startFloatingOverlay?: () => void;
      stopFloatingOverlay?: () => void;
      enterPipMode?: () => void;
    };
  }
}

interface AndroidOverlayDrawerProps {
  floatingConfig: FloatingScreenOverlayConfig;
  onChangeFloatingConfig: React.Dispatch<React.SetStateAction<FloatingScreenOverlayConfig>>;
  personaId: CohostPersonaId;
  gamePresetId: GameStreamPresetId;
  hypeLevel: number;
  isLive: boolean;
  isCohostSpeaking: boolean;
  visionActive: boolean;
  visionFramesSent: number;
  cohostTranscript: string;
  secondsUntilNextAutoRoast: number;
  onStartLiveAndVision: () => void;
  onTriggerGameplayMoment: (moment: GameplayMomentId) => void;
  onClipIt: () => void;
}

const APK_CODE_TABS: Record<
  'overlay_service' | 'main_activity' | 'build_gradle' | 'manifest',
  { label: string; filePath: string; snippet: string }
> = {
  overlay_service: {
    label: 'FloatingOverlayService.kt',
    filePath: '/android-app/app/src/main/java/com/beatshredder/cohost/FloatingOverlayService.kt',
    snippet: `// FloatingOverlayService.kt — WindowManager Overlay + Touch Pass-Through + 1 FPS Vision
val params = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or // Game touches pass straight to Fortnite!
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
    PixelFormat.TRANSLUCENT
)
windowManager.addView(container, params)`,
  },
  main_activity: {
    label: 'MainActivity.kt',
    filePath: '/android-app/app/src/main/java/com/beatshredder/cohost/MainActivity.kt',
    snippet: `// MainActivity.kt — WebViewAssetLoader + BeatshredderAndroidBridge + Auto-PiP
val assetLoader = WebViewAssetLoader.Builder()
    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
    .build()
webView.addJavascriptInterface(BeatshredderJsBridge(), "BeatshredderAndroidBridge")
webView.loadUrl("https://appassets.androidplatform.net/assets/public/index.html")`,
  },
  build_gradle: {
    label: 'app/build.gradle.kts',
    filePath: '/android-app/app/build.gradle.kts',
    snippet: `// android-app/app/build.gradle.kts — SDK 26-34 + Automatic Web Bundle Sync
android {
    namespace = "com.beatshredder.cohost"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.beatshredder.cohost"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
}
// Automatically syncs ../dist into src/main/assets/public before building APK
tasks.named("preBuild") { dependsOn("syncWebDistAssets") }`,
  },
  manifest: {
    label: 'AndroidManifest.xml',
    filePath: '/android-app/app/src/main/AndroidManifest.xml',
    snippet: `<!-- AndroidManifest.xml — Draw Over Other Apps + MediaProjection + Open Mic -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />`,
  },
};

export const AndroidOverlayDrawer: React.FC<AndroidOverlayDrawerProps> = ({
  floatingConfig,
  onChangeFloatingConfig,
  personaId,
  gamePresetId,
  hypeLevel,
  isLive,
  isCohostSpeaking,
  visionActive,
  visionFramesSent,
  cohostTranscript,
  secondsUntilNextAutoRoast,
  onStartLiveAndVision,
  onTriggerGameplayMoment,
  onClipIt,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<
    'overlay_service' | 'main_activity' | 'build_gradle' | 'manifest'
  >('overlay_service');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBuildCmd, setCopiedBuildCmd] = useState(false);
  const [isPipOpen, setIsPipOpen] = useState(false);
  const [pipStatusMsg, setPipStatusMsg] = useState<string | null>(null);
  const apkManifest = getAndroidApkProjectManifest();

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const hudStatus = buildFloatingHudStatus({
    personaId,
    presetId: gamePresetId,
    hypeLevel,
    visionActive,
    micLive: isLive,
    latestTranscript: cohostTranscript,
  });

  useEffect(() => {
    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const draw = () => {
      ctx.fillStyle = '#09080D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isCohostSpeaking ? '#F59E0B' : '#7C3AED';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

      ctx.fillStyle = '#12101B';
      ctx.fillRect(6, 6, canvas.width - 12, 46);

      ctx.beginPath();
      ctx.arc(28, 29, 8, 0, Math.PI * 2);
      ctx.fillStyle = isCohostSpeaking ? '#F59E0B' : '#10B981';
      ctx.fill();

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(hudStatus.badgeTitle.toUpperCase(), 46, 35);

      ctx.fillStyle = '#B6B0CC';
      ctx.font = '13px monospace';
      ctx.fillText(hudStatus.statusLine, 18, 76);

      ctx.fillStyle = '#F5F3FF';
      ctx.font = 'bold 17px sans-serif';
      const words = hudStatus.captionPreview.split(' ');
      let line = '';
      let y = 110;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > canvas.width - 36 && i > 0) {
          ctx.fillText(line, 18, y);
          line = words[i] + ' ';
          y += 24;
          if (y > 185) break;
        } else {
          line = testLine;
        }
      }
      if (y <= 185) {
        ctx.fillText(line, 18, y);
      }

      ctx.fillStyle = '#1A1726';
      ctx.fillRect(18, canvas.height - 26, canvas.width - 36, 12);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(
        18,
        canvas.height - 26,
        Math.max(12, ((canvas.width - 36) * hypeLevel) / 100),
        12
      );

      if (isPipOpen) {
        animId = window.requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [hudStatus, hypeLevel, isCohostSpeaking, isPipOpen]);

  const handleTogglePipWindow = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipOpen(false);
        setPipStatusMsg(null);
        return;
      }

      const canvas = pipCanvasRef.current;
      const video = pipVideoRef.current;
      if (!canvas || !video) return;

      const stream = canvas.captureStream(15);
      video.srcObject = stream;
      await video.play();

      if ('requestPictureInPicture' in video) {
        await video.requestPictureInPicture();
        setIsPipOpen(true);
        setPipStatusMsg(
          'Always-On-Top PiP Overlay active. Switch to Fortnite—the AI overlay stays on top of your game.'
        );
      } else {
        onChangeFloatingConfig((prev) => ({ ...prev, enabled: true, minimizedToOrb: false }));
        setPipStatusMsg(
          'Floating Screen Overlay Bubble activated on screen. Drag it to any corner while gaming.'
        );
      }
    } catch {
      onChangeFloatingConfig((prev) => ({ ...prev, enabled: true, minimizedToOrb: false }));
      setPipStatusMsg(
        'Floating Screen Overlay HUD activated. Drag or collapse to a corner orb while playing.'
      );
    }
  }, [onChangeFloatingConfig]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: dragOffset.x,
      origY: dragOffset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setDragOffset({
      x: dragStartRef.current.origX + dx,
      y: dragStartRef.current.origY + dy,
    });
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const anchorPositionClasses: Record<FloatingOverlayAnchor, string> = {
    top_right: 'top-3 right-3',
    top_left: 'top-3 left-3',
    bottom_right: 'bottom-20 right-3',
    bottom_left: 'bottom-20 left-3',
  };

  const persona = COHOST_PERSONAS[personaId] ?? COHOST_PERSONAS.beatshredder;
  const preset = GAME_STREAM_PRESETS[gamePresetId] ?? GAME_STREAM_PRESETS.fortnite_br;

  return (
    <>
      <canvas ref={pipCanvasRef} width={480} height={220} className="hidden" />
      <video ref={pipVideoRef} muted playsInline className="hidden" />

      {/* Composed Android & Draw-Over-Screen Overlay Control Card */}
      <section
        aria-label="Android App and Draw Over Screen Overlay Controls"
        className="surface-card p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold" className="font-mono-tabular">
                <Smartphone className="w-4 h-4" />
                <span>ANDROID OVERLAY & APK DECK</span>
              </Badge>
              <Badge tone="success" className="font-mono-tabular">
                SYSTEM_ALERT_WINDOW + PiP READY
              </Badge>
            </div>
            <h2 className="type-title text-[#F5F3FF]">
              Float Beatshredder Over Fortnite & Mobile Games
            </h2>
            <p className="type-caption text-[#B6B0CC] font-normal max-w-2xl">
              Launch the draggable <strong className="text-[#F5F3FF]">Floating Screen Overlay Bubble</strong> or pop out an{' '}
              <strong className="text-[#F59E0B]">Always-On-Top PiP Overlay Window</strong> so you can open Fortnite while{' '}
              {persona.name} watches your screen and talks trash hands-free.
            </p>
          </div>

          {/* Primary Action Buttons (48px Touch Targets) */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={floatingConfig.enabled ? 'success' : 'gold'}
              onClick={() => {
                setDragOffset({ x: 0, y: 0 });
                onChangeFloatingConfig((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                  minimizedToOrb: false,
                }));
              }}
            >
              <Layers className="w-4 h-4" />
              <span>
                {floatingConfig.enabled
                  ? 'Floating Overlay Active (Hide)'
                  : 'Launch Screen Overlay Bubble'}
              </span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              active={isPipOpen}
              onClick={handleTogglePipWindow}
            >
              <PictureInPicture2 className="w-4 h-4 text-[#F59E0B]" />
              <span>{isPipOpen ? 'Exit Always-On-Top PiP' : 'Pop Out Over Game (PiP)'}</span>
            </Button>

            {isInstallable && !isInstalled && (
              <Button
                type="button"
                variant="success"
                onClick={promptInstall}
              >
                <Download className="w-4 h-4" />
                <span>Install Android App</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              active={showAndroidModal}
              onClick={() => setShowAndroidModal((v) => !v)}
            >
              <Code2 className="w-4 h-4 text-[#F59E0B]" />
              <span>{showAndroidModal ? 'Hide Android Setup' : 'Android APK & Overlay Code'}</span>
            </Button>
          </div>
        </div>

        {/* Status feedback banner when PiP or Overlay mode changes */}
        {pipStatusMsg && (
          <div className="surface-inset border-[#10B981]/50 p-3 flex items-center justify-between gap-2">
            <span className="type-caption text-[#F5F3FF]">{pipStatusMsg}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPipStatusMsg(null)}
              aria-label="Dismiss overlay status"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Expandable Native Android APK & SYSTEM_ALERT_WINDOW Setup Drawer */}
        {showAndroidModal && (
          <div className="pt-4 border-t border-white/10 space-y-3.5" data-testid="android-apk-drawer">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="surface-inset p-3.5 space-y-1">
                <div className="type-caption text-[#F59E0B] uppercase">
                  1. Sync Web Bundle Into APK Assets
                </div>
                <p className="type-caption text-[#B6B0CC] font-normal">
                  Run <code className="text-[#10B981]">npm run apk:sync</code> to compile the Vite production app into{' '}
                  <code className="text-[#F5F3FF]">android-app/app/src/main/assets/public/</code>.
                </p>
              </div>
              <div className="surface-inset p-3.5 space-y-1">
                <div className="type-caption text-[#F59E0B] uppercase">
                  2. Build Installable .APK File
                </div>
                <p className="type-caption text-[#B6B0CC] font-normal">
                  Open <code className="text-[#F5F3FF]">/android-app</code> in Android Studio or run{' '}
                  <code className="text-[#10B981]">./gradlew assembleDebug</code> to output{' '}
                  <code className="text-[#F5F3FF]">app-debug.apk</code>.
                </p>
              </div>
              <div className="surface-inset p-3.5 space-y-1">
                <div className="type-caption text-[#F59E0B] uppercase">
                  3. Native Draw-Over-Screen Bridge
                </div>
                <p className="type-caption text-[#B6B0CC] font-normal">
                  Includes <code className="text-[#10B981]">{apkManifest.files.length} APK files</code>: Gradle 8.7 wrapper,{' '}
                  <code className="text-[#F5F3FF]">WebViewAssetLoader</code>, adaptive icons, Capacitor &amp; TWA manifests.
                </p>
              </div>
            </div>

            {/* One-Line APK Build Command Bar */}
            <div className="surface-inset border-[#10B981]/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0">
                <div className="type-caption text-[#10B981] uppercase font-mono-tabular">
                  APK BUILD PIPELINE ({apkManifest.packageId} / SDK {apkManifest.minSdk}–{apkManifest.targetSdk})
                </div>
                <code className="type-caption font-mono-tabular text-[#F5F3FF] block truncate">
                  {apkManifest.buildCommands.syncAssets} &amp;&amp; {apkManifest.buildCommands.gradleDebugApk}
                </code>
              </div>
              <Button
                type="button"
                variant="success"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(
                      `${apkManifest.buildCommands.syncAssets} && ${apkManifest.buildCommands.gradleDebugApk}`
                    )
                    ?.catch(() => {});
                  setCopiedBuildCmd(true);
                  setTimeout(() => setCopiedBuildCmd(false), 2000);
                }}
              >
                {copiedBuildCmd ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied Build Command</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy APK Build Command</span>
                  </>
                )}
              </Button>
            </div>

            {/* Complete APK Project File Tree Checklist */}
            <div className="surface-inset p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="type-caption text-[#F59E0B] uppercase">
                  Included Android APK Project Files ({apkManifest.files.length} Verified Files)
                </span>
                <Badge tone="success" className="font-mono-tabular">
                  ALL GRADLE + KOTLIN + MANIFEST FILES READY
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {apkManifest.files.map((file) => (
                  <div
                    key={file.path}
                    className="p-2.5 rounded-xl bg-[#12101B] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="type-caption font-mono-tabular text-[#F5F3FF] truncate">
                        {file.path}
                      </div>
                      <div className="type-caption text-[#B6B0CC] font-normal truncate">
                        {file.description}
                      </div>
                    </div>
                    <Badge tone="success" className="shrink-0">
                      READY
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Source Code Tabs */}
            <div className="surface-inset p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    Object.keys(APK_CODE_TABS) as Array<keyof typeof APK_CODE_TABS>
                  ).map((tabKey) => (
                    <Button
                      key={tabKey}
                      type="button"
                      variant="outline"
                      active={activeCodeTab === tabKey}
                      onClick={() => setActiveCodeTab(tabKey)}
                      className="font-mono-tabular"
                    >
                      {APK_CODE_TABS[tabKey].label}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(APK_CODE_TABS[activeCodeTab].snippet)
                      ?.catch(() => {});
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#F59E0B]" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="type-caption font-mono-tabular text-[#B6B0CC] truncate">
                {APK_CODE_TABS[activeCodeTab].filePath}
              </div>
              <pre className="type-caption font-mono-tabular text-[#F5F3FF] overflow-x-auto leading-relaxed">
                {APK_CODE_TABS[activeCodeTab].snippet}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* LIVE DRAW-OVER-SCREEN FLOATING OVERLAY WIDGET */}
      {floatingConfig.enabled && (
        <div
          role="dialog"
          aria-label="Beatshredder Floating Game Overlay"
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
            opacity: floatingConfig.opacity,
          }}
          className={`fixed z-50 ${anchorPositionClasses[floatingConfig.anchor]} select-none max-w-[calc(100vw-24px)]`}
        >
          {floatingConfig.minimizedToOrb ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChangeFloatingConfig((prev) => ({ ...prev, minimizedToOrb: false }))
                }
                title="Expand Beatshredder Game Overlay"
                aria-label="Expand Beatshredder Game Overlay"
                className={`w-14 h-14 rounded-full bg-[#09080D] border-2 ${
                  isCohostSpeaking ? 'border-[#F59E0B]' : 'border-white/30'
                } flex flex-col items-center justify-center cursor-pointer`}
              >
                <Zap className="w-5 h-5 text-[#F59E0B]" />
                <span className="type-caption font-mono-tabular text-[#F5F3FF]">
                  {hypeLevel}%
                </span>
              </button>

              {floatingConfig.touchPassThroughCaption && (
                <div className="pointer-events-none max-w-[220px] px-3 py-2 rounded-xl bg-[#09080D]/95 border border-[#F59E0B]/50 backdrop-blur-md">
                  <div className="type-caption font-mono-tabular uppercase text-[#F59E0B] truncate">
                    {persona.name} / {visionActive ? 'VISION ON' : 'OPEN MIC'}
                  </div>
                  <p className="type-caption text-[#F5F3FF] font-normal line-clamp-2">
                    {hudStatus.captionPreview}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-[320px] max-w-[calc(100vw-24px)] surface-sheet border-[#F59E0B]/70 overflow-hidden">
              {/* Draggable Top Bar */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="px-3 py-2 bg-[#12101B] border-b border-white/10 flex items-center justify-between gap-2 cursor-move touch-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Move className="w-4 h-4 text-[#F59E0B]" />
                  <span className="type-caption text-[#F59E0B] uppercase truncate">
                    {persona.name} Overlay / {hypeLevel}%
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDragOffset({ x: 0, y: 0 });
                      onChangeFloatingConfig((prev) => ({
                        ...prev,
                        anchor:
                          prev.anchor === 'top_right'
                            ? 'top_left'
                            : prev.anchor === 'top_left'
                              ? 'bottom_left'
                              : prev.anchor === 'bottom_left'
                                ? 'bottom_right'
                                : 'top_right',
                      }));
                    }}
                    title="Snap Overlay to Next Corner"
                    className="px-2.5"
                  >
                    Corner
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      onChangeFloatingConfig((prev) => ({ ...prev, minimizedToOrb: true }))
                    }
                    title="Minimize to Floating Corner Orb"
                    aria-label="Minimize to Floating Corner Orb"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      onChangeFloatingConfig((prev) => ({ ...prev, enabled: false }))
                    }
                    title="Close Floating Overlay"
                    aria-label="Close Floating Overlay"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="px-3 py-2 bg-[#0D0B14] border-b border-white/10 flex items-center justify-between gap-2 type-caption font-mono-tabular">
                <span className="flex items-center gap-1 text-[#10B981]">
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isLive ? 'OPEN MIC' : 'MIC READY'}</span>
                </span>
                <span className="flex items-center gap-1 text-[#F59E0B]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{visionActive ? `VISION (${visionFramesSent}f)` : preset.label.split(' ')[0]}</span>
                </span>
                <span className="text-[#B6B0CC]">Roast: {secondsUntilNextAutoRoast}s</span>
              </div>

              {/* Live AI Trash-Talk Caption Stream */}
              <div className="p-3 space-y-2.5">
                <div className="surface-inset p-2.5">
                  <div className="type-caption text-[#B6B0CC] uppercase mb-0.5">
                    LIVE OVER-GAME AI CALLOUT:
                  </div>
                  <p className="type-caption text-[#F5F3FF] font-normal line-clamp-3">
                    {hudStatus.captionPreview}
                  </p>
                </div>

                {/* Quick 1-Tap Over-Game Callout Triggers (48px Touch Targets) */}
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onTriggerGameplayMoment('whiffed_shot')}
                    className="w-full"
                  >
                    <Crosshair className="w-4 h-4 text-[#F59E0B]" />
                    <span>Whiffed</span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onTriggerGameplayMoment('bush_camping')}
                    className="w-full"
                  >
                    <Flame className="w-4 h-4 text-[#F59E0B]" />
                    <span>Camping</span>
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onTriggerGameplayMoment('sent_to_lobby')}
                    className="w-full"
                  >
                    <Skull className="w-4 h-4" />
                    <span>Lobby</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClipIt}
                    className="w-full border-[#F59E0B]/50 text-[#F59E0B]"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Clip 30s</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {!visionActive && (
                    <Button
                      type="button"
                      variant="gold"
                      onClick={onStartLiveAndVision}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Share Screen</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTogglePipWindow}
                    className="flex-1"
                  >
                    <Maximize2 className="w-4 h-4 text-[#F59E0B]" />
                    <span>Pop Out PiP</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
