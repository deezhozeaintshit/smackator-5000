import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COHOST_PERSONAS,
  CohostPersonaId,
  GameType,
  PadId,
  buildPersonaLine,
} from '../lib/streamEngine';
import { stageAudio } from '../lib/audioSynth';

export type MicPermissionState = 'prompt' | 'granted' | 'denied';
export type LiveConnectionState = 'idle' | 'connecting' | 'live' | 'error';
export type VisionSourceMode = 'none' | 'screen' | 'camera';

export interface LiveToolCallbacks {
  onFirePad: (padId: PadId, reason?: string) => void;
  onAdjustHype: (delta: number, milestoneAnnouncement?: string) => void;
  onGameAction: (gameType: GameType, action: string, winnerName?: string) => void;
  onAnnounceNextSong: () => void;
  onSaveClip: (funniestMoment?: string) => void;
}

function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToFloat32PCM(base64: string): Float32Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = bytes.byteLength / 2;
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 0x8000;
  }
  return float32;
}

export function useGeminiLiveSession(
  callbacks: LiveToolCallbacks,
  personaId: CohostPersonaId = 'beatshredder'
) {
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('idle');
  const [micPermission, setMicPermission] = useState<MicPermissionState>('prompt');
  const [micErrorText, setMicErrorText] = useState<string | null>(null);
  const [visionErrorText, setVisionErrorText] = useState<string | null>(null);
  const [apiErrorText, setApiErrorText] = useState<string | null>(null);
  const [isCohostSpeaking, setIsCohostSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [visionSource, setVisionSource] = useState<VisionSourceMode>('none');
  const [visionFramesSent, setVisionFramesSent] = useState<number>(0);
  const [isRecordingShow, setIsRecordingShow] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const [cohostTranscript, setCohostTranscript] = useState<string>(
    'Hands-free Gaming Mode ready! Tap GO LIVE + SHARE SCREEN so I can watch your Fortnite gameplay, hear your open mic with zero push-to-talk, and talk non-stop trash the whole match!'
  );
  const [streamerTranscript, setStreamerTranscript] = useState<string>('');
  const [cohostHistory, setCohostHistory] = useState<string[]>([]);

  const callbacksRef = useRef<LiveToolCallbacks>(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const personaIdRef = useRef<CohostPersonaId>(personaId);
  useEffect(() => {
    personaIdRef.current = personaId;
  }, [personaId]);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const visionStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const latestVideoFrameRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const outputBufferTextRef = useRef<string>('');
  const fallbackSpeakTimerRef = useRef<number | null>(null);

  // Automatically duck background beat volume by 15-20% whenever the AI co-host speaks
  useEffect(() => {
    stageAudio.setVoiceDucking(isCohostSpeaking);
  }, [isCohostSpeaking]);

  const speakWithBrowserFallback = useCallback((text: string, activePersonaId?: CohostPersonaId) => {
    if (typeof window === 'undefined') return;
    if (fallbackSpeakTimerRef.current) {
      window.clearTimeout(fallbackSpeakTimerRef.current);
      fallbackSpeakTimerRef.current = null;
    }

    setIsCohostSpeaking(true);
    const estimatedMs = Math.min(6000, Math.max(1800, text.split(/\s+/).length * 240));
    fallbackSpeakTimerRef.current = window.setTimeout(() => {
      setIsCohostSpeaking(false);
      fallbackSpeakTimerRef.current = null;
    }, estimatedMs);

    if (!('speechSynthesis' in window)) return;
    try {
      const persona =
        COHOST_PERSONAS[activePersonaId || personaIdRef.current] ??
        COHOST_PERSONAS.beatshredder;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = persona.speechRate;
      utter.pitch = persona.speechPitch;
      utter.onstart = () => setIsCohostSpeaking(true);
      utter.onend = () => {
        if (fallbackSpeakTimerRef.current) {
          window.clearTimeout(fallbackSpeakTimerRef.current);
          fallbackSpeakTimerRef.current = null;
        }
        setIsCohostSpeaking(false);
      };
      utter.onerror = () => {
        // Keep the timer-based ducking window if synthesis errors in headless browser
      };
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore speech synthesis errors in headless environments
    }
  }, []);

  const stopPlaybackQueue = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsCohostSpeaking(false);
  }, []);

  const playPcmChunk24k = useCallback((base64Data: string) => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }
    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const floatSamples = base64ToFloat32PCM(base64Data);
    if (floatSamples.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, floatSamples.length, 24000);
    audioBuffer.getChannelData(0).set(floatSamples);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    setIsCohostSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsCohostSpeaking(false);
      }
    };
  }, []);

  const stopVisionCapture = useCallback(() => {
    if (frameTimerRef.current) {
      window.clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (visionStreamRef.current) {
      visionStreamRef.current.getTracks().forEach((t) => t.stop());
      visionStreamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    latestVideoFrameRef.current = null;
    setVisionSource('none');
  }, []);

  /**
   * Starts 1 FPS JPEG capture from either Screen Share (for PC/Mac/Mobile screen gameplay)
   * or Camera (for pointing phone/webcam at TV or gaming monitor) and streams frames to Gemini Live.
   */
  const startVisionCapture = useCallback(
    async (mode: 'screen' | 'camera') => {
      setVisionErrorText(null);
      stopVisionCapture();

      try {
        let vStream: MediaStream;
        if (mode === 'screen') {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error(
              'Screen sharing is not supported in this browser context. Use Camera Vision to point at your monitor/TV, or open in a full desktop tab.'
            );
          }
          vStream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 15, max: 30 } },
            audio: true,
          });
        } else {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access is not available in this browser.');
          }
          vStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 360 } },
          });
        }

        visionStreamRef.current = vStream;
        setVisionSource(mode);

        if (videoElementRef.current) {
          videoElementRef.current.srcObject = vStream;
          videoElementRef.current.play().catch(() => {});
        }

        // Listen for user stopping screen share from browser native UI
        const videoTrack = vStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopVisionCapture();
          };
        }

        // 1 FPS JPEG frame extraction loop (strictly <= 1 FPS per Gemini Live API rules)
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 640;
        offscreenCanvas.height = 360;
        const ctx2d = offscreenCanvas.getContext('2d');

        frameTimerRef.current = window.setInterval(() => {
          const videoEl = videoElementRef.current;
          if (!videoEl || !ctx2d || videoEl.readyState < 2) return;

          ctx2d.drawImage(videoEl, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const dataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.65);
          const base64Jpeg = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
          if (!base64Jpeg) return;

          latestVideoFrameRef.current = base64Jpeg;
          setVisionFramesSent((c) => c + 1);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ video: base64Jpeg }));
          }
        }, 1000);

        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Screen or camera capture was cancelled or blocked.';
        setVisionErrorText(
          `${msg} Automatic trash-talk still runs hands-free via open mic and game timer!`
        );
        return false;
      }
    },
    [stopVisionCapture]
  );

  /**
   * Built-in Gameplay + AI Co-Host Recorder so the player can record their gameplay + AI trash-talk
   * and download the video file to livestream or post.
   */
  const startRecordingShow = useCallback(() => {
    setRecordedVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    recordedChunksRef.current = [];

    try {
      const tracks: MediaStreamTrack[] = [];
      if (visionStreamRef.current) {
        visionStreamRef.current.getTracks().forEach((t) => tracks.push(t));
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((t) => tracks.push(t));
      }

      if (tracks.length === 0) {
        setVisionErrorText(
          'Share your Game Screen, enable Camera Vision, or turn on Go Live Mic first to start recording your gameplay + AI show.'
        );
        return false;
      }

      const combinedStream = new MediaStream(tracks);
      const recorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecordingShow(false);
      };

      recorder.start(1000);
      setIsRecordingShow(true);
      return true;
    } catch {
      setVisionErrorText('Recording could not start in this browser environment.');
      return false;
    }
  }, []);

  const stopRecordingShow = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecordingShow(false);
  }, []);

  const cleanupSession = useCallback(() => {
    stopPlaybackQueue();
    stopVisionCapture();
    stopRecordingShow();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, [stopPlaybackQueue, stopRecordingShow, stopVisionCapture]);

  const startLiveSession = useCallback(
    async (withScreenShare = false) => {
      setMicErrorText(null);
      setApiErrorText(null);
      setConnectionState('connecting');

      if (withScreenShare) {
        await startVisionCapture('screen');
      }

      let stream: MediaStream | null = null;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone access is not available in this browser.');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        setMicPermission('granted');
      } catch {
        setMicPermission('denied');
        setConnectionState('idle');
        setMicErrorText(
          'Microphone access was denied or blocked. Shredder Live Cohost needs an always-on open mic (no push-to-talk) to hear you and talk trash while you play. Allow microphone access and tap Retry Microphone.'
        );
        return false;
      }

      const activePersona =
        COHOST_PERSONAS[personaIdRef.current] ?? COHOST_PERSONAS.beatshredder;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?persona=${encodeURIComponent(
        activePersona.id
      )}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const inputCtx = new AudioCtx({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;

          const source = inputCtx.createMediaStreamSource(stream!);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current) return;
            if (ws.readyState !== WebSocket.OPEN) return;
            const channelData = e.inputBuffer.getChannelData(0);
            const base64Audio = floatTo16BitPCMBase64(channelData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        } catch {
          // Continue with live session even if sampleRate is constrained
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'connected') {
            setConnectionState('live');
            const p = COHOST_PERSONAS[personaIdRef.current] ?? COHOST_PERSONAS.beatshredder;
            const introLine = `${p.name} locked in on your open mic & screen! Zero push-to-talk—drop into the match so I can roast every missed shot! ${p.catchphrase}`;
            setCohostTranscript(introLine);
            setCohostHistory((prev) => [...prev, introLine]);
          } else if (msg.type === 'audio' && msg.audio) {
            playPcmChunk24k(msg.audio);
          } else if (msg.type === 'inputTranscript' && msg.text) {
            setStreamerTranscript(msg.text);
          } else if (msg.type === 'outputTranscript' && msg.text) {
            outputBufferTextRef.current = `${outputBufferTextRef.current} ${msg.text}`.trim();
            const latest = outputBufferTextRef.current.slice(-240);
            setCohostTranscript(latest);
            setCohostHistory((prev) => [...prev.slice(-19), msg.text]);
          } else if (msg.type === 'interrupted') {
            stopPlaybackQueue();
            outputBufferTextRef.current = '';
          } else if (msg.type === 'toolCall') {
            const { name, args } = msg;
            if (name === 'fireBeatPad' && args?.padId) {
              callbacksRef.current.onFirePad(args.padId as PadId, args.reason);
            } else if (name === 'adjustHypeMeter' && typeof args?.delta === 'number') {
              callbacksRef.current.onAdjustHype(args.delta, args.milestoneAnnouncement);
            } else if (name === 'triggerGameAction' && args?.gameType) {
              callbacksRef.current.onGameAction(
                args.gameType as GameType,
                args.action || 'start',
                args.winnerName
              );
            } else if (name === 'announceNextSongRequest') {
              callbacksRef.current.onAnnounceNextSong();
            } else if (name === 'saveStreamClip') {
              callbacksRef.current.onSaveClip(args?.funniestMoment);
            }
          } else if (msg.type === 'error') {
            setApiErrorText(msg.message || 'Live voice connection encountered an issue.');
            setConnectionState('live');
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setConnectionState('live');
      };

      ws.onclose = () => {
        setConnectionState((prev) => (prev === 'live' ? 'idle' : prev));
      };

      return true;
    },
    [playPcmChunk24k, startVisionCapture, stopPlaybackQueue]
  );

  const stopLiveSession = useCallback(() => {
    cleanupSession();
    setConnectionState('idle');
  }, [cleanupSession]);

  const promptCohost = useCallback(
    async (instruction: string, fallbackLine: string, explicitPersonaId?: CohostPersonaId) => {
      const targetPersona = explicitPersonaId || personaIdRef.current;
      const styledFallback = buildPersonaLine(targetPersona, fallbackLine);
      outputBufferTextRef.current = '';

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const p = COHOST_PERSONAS[targetPersona] ?? COHOST_PERSONAS.beatshredder;
        wsRef.current.send(
          JSON.stringify({
            text: `[Persona: ${p.name} (${p.personalityLabel}) — Catchphrase: "${p.catchphrase}"] ${instruction}`,
          })
        );
        setCohostTranscript(styledFallback);
        setCohostHistory((prev) => [...prev.slice(-19), styledFallback]);
        return;
      }

      setCohostTranscript(styledFallback);
      setCohostHistory((prev) => [...prev.slice(-19), styledFallback]);
      speakWithBrowserFallback(styledFallback, targetPersona);

      try {
        const res = await fetch('/api/cohost/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: instruction,
            fallbackLine: styledFallback,
            persona: targetPersona,
            videoFrame: latestVideoFrameRef.current || undefined,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { text?: string };
          if (data.text) {
            setCohostTranscript(data.text);
            setCohostHistory((prev) => [...prev.slice(-19), data.text!]);
            speakWithBrowserFallback(data.text, targetPersona);
          }
        }
      } catch {
        // Fallback line is already displayed and spoken
      }
    },
    [speakWithBrowserFallback]
  );

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  return {
    connectionState,
    micPermission,
    micErrorText,
    visionErrorText,
    apiErrorText,
    isCohostSpeaking,
    isMuted,
    setIsMuted,
    visionSource,
    visionFramesSent,
    videoElementRef,
    isRecordingShow,
    recordedVideoUrl,
    cohostTranscript,
    streamerTranscript,
    cohostHistory,
    startLiveSession,
    stopLiveSession,
    startVisionCapture,
    stopVisionCapture,
    startRecordingShow,
    stopRecordingShow,
    promptCohost,
    speakWithBrowserFallback,
    advanceVisionFrames: (delta = 10) => setVisionFramesSent((c) => c + delta),
    clearMicError: () => setMicErrorText(null),
  };
}
