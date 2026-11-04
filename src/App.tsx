import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Disc3, Gamepad2, Scissors, Settings } from 'lucide-react';
import {
  ActiveGameState,
  BEAT_PADS,
  COHOST_PERSONAS,
  ChatComment,
  CohostPersonaId,
  CommentType,
  GAME_STREAM_PRESETS,
  GUESS_BEAT_ROUNDS,
  GameStreamPresetId,
  GameType,
  GameplayMomentId,
  LYRIC_CHALLENGES,
  PadId,
  SavedClip,
  SessionRecap,
  SongRequestItem,
  StreamOverlayConfig,
  TRIVIA_BANK,
  TrashTalkHeatLevel,
  FloatingScreenOverlayConfig,
  addSongRequest,
  advanceGiftRace,
  advanceSongQueue,
  awardGameScore,
  analyzeVisionFramesForAutoMoment,
  buildAutoVisionTickPrompt,
  buildSessionRecap,
  buildThirtySecondClip,
  calculateHypeUpdate,
  createDefaultFloatingOverlayConfig,
  createDefaultOverlayConfig,
  createInitialGameState,
  declareGameWinner,
  generateGameplayTrashTalk,
  generateLightRoast,
  getRoastAggressionProfile,
  parseRawChatInput,
  timeoutUsername,
  toggleHideComment,
  toggleOverlayElement,
  togglePinComment,
} from './lib/streamEngine';
import { stageAudio } from './lib/audioSynth';
import { useGeminiLiveSession } from './hooks/useGeminiLiveSession';
import { useVoiceSoundboard } from './hooks/useVoiceSoundboard';
import { StageHeaderAndHype } from './components/StageHeaderAndHype';
import { AndroidOverlayDrawer } from './components/AndroidOverlayDrawer';
import { GameplayVisionAndTrashTalk } from './components/GameplayVisionAndTrashTalk';
import { VisualizerAndOverlays } from './components/VisualizerAndOverlays';
import { ChatAndModPanel } from './components/ChatAndModPanel';
import { BeatBoardAndQueue } from './components/BeatBoardAndQueue';
import { GamesArena } from './components/GamesArena';
import { ClipsAndRecapVault } from './components/ClipsAndRecapVault';
import { SettingsSheet } from './components/SettingsSheet';
import { Button } from './components/ui/primitives';

type MobileDeckTab = 'beats' | 'games' | 'clips';

const STORAGE_KEYS = {
  clips: 'beatshredder_saved_clips_v1',
  recaps: 'beatshredder_saved_recaps_v1',
  queue: 'beatshredder_song_queue_v1',
  timedOut: 'beatshredder_timed_out_v1',
  persona: 'beatshredder_persona_v1',
  overlays: 'beatshredder_overlays_v1',
  gamePreset: 'beatshredder_game_preset_v1',
  heatLevel: 'beatshredder_heat_level_v1',
  roastAggression: 'beatshredder_roast_aggression_v1',
  voiceSoundboard: 'beatshredder_voice_soundboard_v1',
  customVoiceTriggers: 'beatshredder_custom_voice_triggers_v1',
  floatingOverlay: 'beatshredder_floating_overlay_v1',
  motionEnabled: 'beatshredder_motion_enabled_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeDeck, setActiveDeck] = useState<MobileDeckTab>('beats');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Reduced Motion is the default unless the user explicitly enables Full Motion
  const [motionEnabled, setMotionEnabled] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.motionEnabled, false)
  );

  // Co-Host Persona, Game Preset, Trash-Talk Heat, Roast Aggression Slider & Overlay Config
  const [selectedPersonaId, setSelectedPersonaId] = useState<CohostPersonaId>(() =>
    loadFromStorage<CohostPersonaId>(STORAGE_KEYS.persona, 'beatshredder')
  );
  const [gamePresetId, setGamePresetId] = useState<GameStreamPresetId>(() =>
    loadFromStorage<GameStreamPresetId>(STORAGE_KEYS.gamePreset, 'fortnite_br')
  );
  const [heatLevel, setHeatLevel] = useState<TrashTalkHeatLevel>(() =>
    loadFromStorage<TrashTalkHeatLevel>(STORAGE_KEYS.heatLevel, 'ruthless_roast')
  );
  const [roastAggression, setRoastAggression] = useState<number>(() =>
    loadFromStorage<number>(STORAGE_KEYS.roastAggression, 85)
  );
  const [voiceSoundboardEnabled, setVoiceSoundboardEnabled] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.voiceSoundboard, true)
  );
  const [duckReductionPercent, setDuckReductionPercent] = useState<number>(18);
  const [customVoiceTriggers, setCustomVoiceTriggers] = useState<Partial<Record<PadId, string>>>(() =>
    loadFromStorage<Partial<Record<PadId, string>>>(STORAGE_KEYS.customVoiceTriggers, {})
  );
  const [overlayConfig, setOverlayConfig] = useState<StreamOverlayConfig>(() =>
    loadFromStorage<StreamOverlayConfig>(STORAGE_KEYS.overlays, createDefaultOverlayConfig())
  );
  const [floatingConfig, setFloatingConfig] = useState<FloatingScreenOverlayConfig>(() =>
    loadFromStorage<FloatingScreenOverlayConfig>(
      STORAGE_KEYS.floatingOverlay,
      createDefaultFloatingOverlayConfig()
    )
  );

  // Hands-Free Automatic Trash-Talk Loop (ON by default — no push-to-talk needed)
  const [autoTalkEnabled, setAutoTalkEnabled] = useState<boolean>(true);
  const [autoTalkIntervalSec, setAutoTalkIntervalSec] = useState<number>(25);
  const [secondsUntilNextAutoRoast, setSecondsUntilNextAutoRoast] = useState<number>(25);

  // Stream & Hype state — zero fake viewers, zero fake comments
  const [hypeLevel, setHypeLevel] = useState<number>(35);
  const [peakHype, setPeakHype] = useState<number>(35);
  const [hypeMultiplier, setHypeMultiplier] = useState<number>(1.0);
  const [hypeStreak, setHypeStreak] = useState<number>(0);
  const [hypeMultiplierLabel, setHypeMultiplierLabel] = useState<string>('1.0x Base Gain');
  const hypeStreakRef = useRef<number>(0);
  const [milestoneBanner, setMilestoneBanner] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [giftCount, setGiftCount] = useState<number>(0);
  const [peakViewers, setPeakViewers] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [padsFiredCount, setPadsFiredCount] = useState<number>(0);
  const [chatPulseEnergy, setChatPulseEnergy] = useState<number>(0);

  // Real viewer chat state
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [timedOutUsers, setTimedOutUsers] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.timedOut, [])
  );

  // Beat Board & Song Request Queue
  const [activePadId, setActivePadId] = useState<PadId | null>(null);
  const [runningLoopIds, setRunningLoopIds] = useState<PadId[]>([]);
  const [songQueue, setSongQueue] = useState<SongRequestItem[]>(() =>
    loadFromStorage<SongRequestItem[]>(STORAGE_KEYS.queue, [])
  );

  // Interactive LIVE Games
  const [game, setGame] = useState<ActiveGameState>(() =>
    createInitialGameState('trivia_sprint')
  );
  const [gamesPlayedHistory, setGamesPlayedHistory] = useState<string[]>([]);

  // Local Storage Clips & Session Recaps
  const [clips, setClips] = useState<SavedClip[]>(() =>
    loadFromStorage<SavedClip[]>(STORAGE_KEYS.clips, [])
  );
  const [recaps, setRecaps] = useState<SessionRecap[]>(() =>
    loadFromStorage<SessionRecap[]>(STORAGE_KEYS.recaps, [])
  );

  // Sync motion attribute on root element (Reduced Motion by default)
  useEffect(() => {
    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const activeMotion = motionEnabled && !prefersReduce ? 'full' : 'reduced';
    document.documentElement.setAttribute('data-motion', activeMotion);
    try {
      window.localStorage.setItem(STORAGE_KEYS.motionEnabled, JSON.stringify(motionEnabled));
    } catch {
      // ignore
    }
  }, [motionEnabled]);

  // Persist local storage items
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.clips, JSON.stringify(clips));
    } catch {
      // ignore
    }
  }, [clips]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.recaps, JSON.stringify(recaps));
    } catch {
      // ignore
    }
  }, [recaps]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(songQueue));
    } catch {
      // ignore
    }
  }, [songQueue]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.timedOut, JSON.stringify(timedOutUsers));
    } catch {
      // ignore
    }
  }, [timedOutUsers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.persona, JSON.stringify(selectedPersonaId));
    } catch {
      // ignore
    }
  }, [selectedPersonaId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.overlays, JSON.stringify(overlayConfig));
    } catch {
      // ignore
    }
  }, [overlayConfig]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.gamePreset, JSON.stringify(gamePresetId));
    } catch {
      // ignore
    }
  }, [gamePresetId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.heatLevel, JSON.stringify(heatLevel));
    } catch {
      // ignore
    }
  }, [heatLevel]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.roastAggression, JSON.stringify(roastAggression));
    } catch {
      // ignore
    }
  }, [roastAggression]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.voiceSoundboard, JSON.stringify(voiceSoundboardEnabled));
    } catch {
      // ignore
    }
  }, [voiceSoundboardEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.customVoiceTriggers,
        JSON.stringify(customVoiceTriggers)
      );
    } catch {
      // ignore
    }
  }, [customVoiceTriggers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.floatingOverlay, JSON.stringify(floatingConfig));
    } catch {
      // ignore
    }
  }, [floatingConfig]);

  // Smooth decay for chatPulseEnergy
  useEffect(() => {
    if (chatPulseEnergy <= 0) return;
    const timer = window.setInterval(() => {
      setChatPulseEnergy((prev) => Math.max(0, prev - 10));
    }, 350);
    return () => window.clearInterval(timer);
  }, [chatPulseEnergy]);

  const syncRunningLoops = useCallback(() => {
    const active: PadId[] = [];
    if (stageAudio.isLoopRunning('shred_beat')) active.push('shred_beat');
    if (stageAudio.isLoopRunning('boom_bap')) active.push('boom_bap');
    setRunningLoopIds(active);
  }, []);

  const handleAdjustHype = useCallback(
    (
      delta: number,
      explicitMilestone?: string,
      nextFollowers = followerCount,
      nextGifts = giftCount,
      chatBurstCount = 0
    ) => {
      setHypeLevel((prev) => {
        const {
          nextHype,
          milestoneCallout,
          hypeMultiplier: nextMult,
          nextStreakCount,
          multiplierLabel,
        } = calculateHypeUpdate(prev, delta, nextFollowers, nextGifts, {
          streakCount: hypeStreakRef.current,
          chatBurstCount,
          chatPulseEnergy,
        });
        hypeStreakRef.current = nextStreakCount;
        setHypeStreak(nextStreakCount);
        setHypeMultiplier(nextMult);
        setHypeMultiplierLabel(multiplierLabel);
        setPeakHype((p) => Math.max(p, nextHype));
        const banner = explicitMilestone || milestoneCallout;
        if (banner) {
          setMilestoneBanner(banner);
        }
        return nextHype;
      });
    },
    [chatPulseEnergy, followerCount, giftCount]
  );

  const handleTriggerPad = useCallback(
    (padId: PadId) => {
      stageAudio.triggerPad(padId, syncRunningLoops);
      syncRunningLoops();
      setActivePadId(padId);
      setPadsFiredCount((c) => c + 1);
      setTimeout(() => {
        setActivePadId((curr) => (curr === padId ? null : curr));
      }, 650);
    },
    [syncRunningLoops]
  );

  const handleStopAllAudio = useCallback(() => {
    stageAudio.stopAllLoops();
    syncRunningLoops();
    setActivePadId(null);
  }, [syncRunningLoops]);

  const liveCallbacks = useMemo(
    () => ({
      onFirePad: (padId: PadId) => {
        handleTriggerPad(padId);
      },
      onAdjustHype: (delta: number, milestoneAnnouncement?: string) => {
        handleAdjustHype(delta, milestoneAnnouncement);
      },
      onGameAction: (gameType: GameType, action: string, winnerName?: string) => {
        setActiveDeck('games');
        setGame((prev) => {
          let updated = prev.type === gameType ? { ...prev } : createInitialGameState(gameType);
          updated.isActive = true;
          if (action === 'reveal_answer') {
            updated.triviaRevealed = true;
            updated.lyricRevealed = true;
            updated.guessBeatRevealed = true;
          } else if (action === 'declare_winner') {
            updated = declareGameWinner(updated, winnerName);
          } else if (action === 'add_gift_points') {
            updated = advanceGiftRace(updated, 25);
          }
          return updated;
        });
      },
      onAnnounceNextSong: () => {
        setSongQueue((prev) => advanceSongQueue(prev).updatedQueue);
      },
      onSaveClip: () => {},
    }),
    [handleAdjustHype, handleTriggerPad]
  );

  const {
    connectionState,
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
    advanceVisionFrames,
  } = useGeminiLiveSession(liveCallbacks, selectedPersonaId);

  const [autoVisionMomentsEnabled, setAutoVisionMomentsEnabled] = useState<boolean>(true);
  const [lastAutoMomentText, setLastAutoMomentText] = useState<string | null>(null);
  const lastAutoMomentFrameRef = useRef<number>(0);

  const {
    isListeningSpeechApi,
    lastHeardSpeech,
    lastVoiceEvent,
    triggerSimulatedVoiceCommand,
  } = useVoiceSoundboard({
    enabled: voiceSoundboardEnabled,
    customTriggers: customVoiceTriggers,
    streamerLiveTranscript: streamerTranscript,
    onFirePad: handleTriggerPad,
    onStopAllAudio: handleStopAllAudio,
  });

  // Run session timer when live
  useEffect(() => {
    if (connectionState !== 'live') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [connectionState]);

  // Dynamically duck background beat volume by 15-20% whenever the AI co-host speaks
  useEffect(() => {
    stageAudio.setVoiceDucking(isCohostSpeaking, duckReductionPercent);
  }, [isCohostSpeaking, duckReductionPercent]);

  // Hands-Free Automatic Unprompted Trash-Talk Pacer (No Push-To-Talk)
  useEffect(() => {
    if (!autoTalkEnabled) return;
    const timer = window.setInterval(() => {
      setSecondsUntilNextAutoRoast((prev) => {
        if (prev <= 1) {
          if (connectionState === 'live' || visionSource !== 'none') {
            const tick = buildAutoVisionTickPrompt({
              presetId: gamePresetId,
              heatLevel,
              personaId: selectedPersonaId,
              roastAggression,
            });
            promptCohost(tick.prompt, tick.fallbackLine, selectedPersonaId);
          }
          return autoTalkIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    autoTalkEnabled,
    autoTalkIntervalSec,
    connectionState,
    gamePresetId,
    heatLevel,
    promptCohost,
    roastAggression,
    selectedPersonaId,
    visionSource,
  ]);

  const handleSelectPersona = useCallback(
    (personaId: CohostPersonaId) => {
      setSelectedPersonaId(personaId);
      const p = COHOST_PERSONAS[personaId] ?? COHOST_PERSONAS.beatshredder;
      promptCohost(
        `Switch to persona ${p.name} (${p.personalityLabel}) and roast the streamer's gameplay using your catchphrase "${p.catchphrase}".`,
        `${p.name} stepping up to the co-host mic—watching your screen closely!`,
        personaId
      );
    },
    [promptCohost]
  );

  const handlePreviewPersonaVoice = useCallback(
    (personaId: CohostPersonaId) => {
      const p = COHOST_PERSONAS[personaId] ?? COHOST_PERSONAS.beatshredder;
      promptCohost(
        `Give a 1-sentence gaming trash-talk check in the voice of ${p.name} (${p.personalityLabel}) with catchphrase "${p.catchphrase}".`,
        `Mic check one-two! ${p.name} locked on your gameplay screen—${p.catchphrase}`,
        personaId
      );
    },
    [promptCohost]
  );

  const handleTriggerGameplayMoment = useCallback(
    (moment: GameplayMomentId) => {
      const { prompt, fallbackLine, padToFire } = generateGameplayTrashTalk(
        moment,
        gamePresetId,
        selectedPersonaId,
        roastAggression
      );
      handleTriggerPad(padToFire);
      handleAdjustHype(moment === 'victory_clutch' ? 18 : 8);
      setChatPulseEnergy((prev) => Math.min(100, prev + 45));
      setSecondsUntilNextAutoRoast(autoTalkIntervalSec);
      promptCohost(prompt, fallbackLine, selectedPersonaId);
    },
    [
      autoTalkIntervalSec,
      gamePresetId,
      handleAdjustHype,
      handleTriggerPad,
      promptCohost,
      roastAggression,
      selectedPersonaId,
    ]
  );

  // Automatically analyze visionFramesSent to trigger 'victory_clutch' or 'elimination' without manual button presses
  useEffect(() => {
    const analysis = analyzeVisionFramesForAutoMoment({
      visionFramesSent,
      lastTriggeredFrame: lastAutoMomentFrameRef.current,
      autoDetectEnabled: autoVisionMomentsEnabled,
    });

    if (analysis.shouldTrigger && analysis.moment) {
      lastAutoMomentFrameRef.current = visionFramesSent;
      const label = analysis.moment === 'victory_clutch' ? 'Victory Clutch' : 'Elimination';
      setLastAutoMomentText(`Frame #${visionFramesSent} → Auto-Triggered ${label}`);
      handleTriggerGameplayMoment(analysis.moment);
    }
  }, [autoVisionMomentsEnabled, handleTriggerGameplayMoment, visionFramesSent]);

  const handleGoLive = useCallback(async () => {
    handleTriggerPad('air_horn');
    handleAdjustHype(15);
    await startLiveSession(false);
  }, [handleAdjustHype, handleTriggerPad, startLiveSession]);

  const handleHypeIntro = useCallback(() => {
    const preset = GAME_STREAM_PRESETS[gamePresetId] ?? GAME_STREAM_PRESETS.fortnite_br;
    handleTriggerPad('rimshot_roast');
    handleAdjustHype(10);
    promptCohost(
      `[${preset.label}] Talk savage, funny trash to the streamer right now about their gameplay, drop spot, or aim!`,
      `I am watching your ${preset.label} screen right now—stop looting grey weapons in the corner and go take a fight before the storm eats you alive!`
    );
  }, [gamePresetId, handleAdjustHype, handleTriggerPad, promptCohost]);

  const handleClipIt = useCallback(() => {
    const activePadObj = BEAT_PADS.find((p) => p.id === activePadId);
    const newClip = buildThirtySecondClip({
      comments,
      cohostLines: cohostHistory.length > 0 ? cohostHistory : [cohostTranscript],
      hypeLevel,
      activeGame: game,
      activePadLabel: activePadObj?.label ?? null,
    });
    setClips((prev) => [newClip, ...prev]);
    setActiveDeck('clips');
    handleTriggerPad('laser_hype');
    promptCohost(
      `We just clipped the last 30 seconds of gameplay & trash-talk at ${hypeLevel}% hype! Shout out that clip in 1 short sentence.`,
      `CLIPPED IT! Last 30 seconds of gameplay & roast locked into the vault at ${hypeLevel}% Hype—post that straight to TikTok!`
    );
  }, [
    activePadId,
    cohostHistory,
    cohostTranscript,
    comments,
    game,
    handleTriggerPad,
    hypeLevel,
    promptCohost,
  ]);

  const handleEndStreamAndRecap = useCallback(() => {
    stopLiveSession();
    stageAudio.stopAllLoops();
    syncRunningLoops();

    const recap = buildSessionRecap({
      elapsedSeconds: Math.max(elapsedSeconds, 30),
      peakViewers,
      comments,
      gamesPlayed: [
        GAME_STREAM_PRESETS[gamePresetId]?.label || 'Fortnite / Battle Royale',
        ...gamesPlayedHistory,
      ],
      clips,
      padsFiredCount,
      peakHype,
    });

    setRecaps((prev) => [recap, ...prev]);
    setActiveDeck('clips');
    handleTriggerPad('victory_fanfare');
    promptCohost(
      `The gameplay stream just ended. Read this recap out loud: ${recap.spokenScript}`,
      recap.spokenScript
    );
  }, [
    clips,
    comments,
    elapsedSeconds,
    gamePresetId,
    gamesPlayedHistory,
    handleTriggerPad,
    padsFiredCount,
    peakHype,
    peakViewers,
    promptCohost,
    stopLiveSession,
    syncRunningLoops,
  ]);

  // Chat & Moderation Handlers
  const handleAddComments = useCallback(
    (rawText: string, defaultUser: string, explicitType?: CommentType) => {
      const parsed = parseRawChatInput(rawText, defaultUser, explicitType);
      if (parsed.length === 0) return;

      const processed = parsed.map((c) =>
        timedOutUsers.includes(c.username.toLowerCase()) ? { ...c, hidden: true } : c
      );

      let newFollowers = followerCount;
      let newGifts = giftCount;
      let hypeDelta = 0;

      for (const item of processed) {
        if (item.hidden) continue;
        if (item.type === 'follower') {
          newFollowers += 1;
          hypeDelta += 8;
        } else if (item.type === 'gift') {
          newGifts += 1;
          hypeDelta += 12;
        } else {
          hypeDelta += 4;
        }
      }

      const visibleBurstCount = processed.filter((c) => !c.hidden).length;
      setFollowerCount(newFollowers);
      setGiftCount(newGifts);
      setChatPulseEnergy((prev) => Math.min(100, prev + Math.max(35, processed.length * 30)));
      setComments((prev) => [...processed, ...prev]);
      handleAdjustHype(hypeDelta, undefined, newFollowers, newGifts, visibleBurstCount);

      const firstVisible = processed.find((c) => !c.hidden);
      if (!firstVisible) return;

      if (firstVisible.type === 'follower') {
        handleTriggerPad('crowd_roar');
        promptCohost(
          `New follower alert! Shout out @${firstVisible.username} by name!`,
          `BIG SHOUTOUT to @${firstVisible.username} for following the stream! Welcome to the Beatshredder crew!`
        );
      } else if (firstVisible.type === 'gift') {
        handleTriggerPad('air_horn');
        setGame((prev) =>
          prev.type === 'gift_race' ? advanceGiftRace(prev, 20) : prev
        );
        promptCohost(
          `Viewer @${firstVisible.username} just dropped a gift ("${firstVisible.text}")! Hype them up out loud!`,
          `YO! @${firstVisible.username} coming through with the gift energy! Put some gold in the chat for @${firstVisible.username}!`
        );
      } else if (firstVisible.type === 'heckle') {
        const roast = generateLightRoast(
          firstVisible.username,
          firstVisible.text,
          selectedPersonaId
        );
        setComments((prev) =>
          prev.map((c) => (c.id === firstVisible.id ? { ...c, roastReply: roast } : c))
        );
        handleTriggerPad('rimshot_roast');
        promptCohost(
          `Viewer @${firstVisible.username} left a cheeky heckle: "${firstVisible.text}". Roast them lightly and playfully in 1-2 sentences without ever getting mean.`,
          roast
        );
      } else if (firstVisible.type === 'question') {
        promptCohost(
          `Viewer @${firstVisible.username} asked in chat: "${firstVisible.text}". Read their question out loud and answer it!`,
          `Yo @${firstVisible.username} is asking: "${firstVisible.text}" — great question fam, we are cooking everything live from scratch right here on the deck!`
        );
      } else {
        promptCohost(
          `Read out loud and react to this viewer comment from @${firstVisible.username}: "${firstVisible.text}"`,
          `Shoutout @${firstVisible.username} in the chat saying "${firstVisible.text}"—I see you locked in with us!`
        );
      }
    },
    [
      followerCount,
      giftCount,
      handleAdjustHype,
      handleTriggerPad,
      promptCohost,
      selectedPersonaId,
      timedOutUsers,
    ]
  );

  const handleReadOutLoud = useCallback(
    (comment: ChatComment) => {
      setChatPulseEnergy((prev) => Math.min(100, prev + 30));
      promptCohost(
        `Read @${comment.username}'s comment out loud and hype it up: "${comment.text}"`,
        `Yo, listen to @${comment.username} in the chat: "${comment.text}" — real talk right there!`
      );
    },
    [promptCohost]
  );

  const handleRoastComment = useCallback(
    (comment: ChatComment) => {
      const roast = generateLightRoast(
        comment.username,
        comment.text,
        selectedPersonaId
      );
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, roastReply: roast } : c))
      );
      setChatPulseEnergy((prev) => Math.min(100, prev + 35));
      handleTriggerPad('rimshot_roast');
      promptCohost(
        `Lightly and playfully roast @${comment.username} for saying "${comment.text}" without being mean.`,
        roast
      );
    },
    [handleTriggerPad, promptCohost, selectedPersonaId]
  );

  // Song Request Queue Handlers
  const handleAddSongRequest = useCallback(
    (requester: string, beatStyle: string, vibeNote: string) => {
      setSongQueue((prev) => addSongRequest(prev, requester, beatStyle, vibeNote));
      handleAdjustHype(6);
      promptCohost(
        `Viewer @${requester.replace(/^@/, '')} just requested a "${beatStyle}" beat with vibe "${vibeNote}". Acknowledge the request!`,
        `Locked in! @${requester.replace(/^@/, '')} just queued up "${beatStyle}" (${vibeNote}) on the Beatshredder request deck!`
      );
    },
    [handleAdjustHype, promptCohost]
  );

  const handleAnnounceNextSong = useCallback(() => {
    const { updatedQueue, nowPlaying } = advanceSongQueue(songQueue);
    setSongQueue(updatedQueue);
    if (nowPlaying) {
      handleTriggerPad('drop_it');
      promptCohost(
        `Announce the next song request coming up now: "${nowPlaying.beatStyle}" (${nowPlaying.vibeNote}) requested by @${nowPlaying.requester}!`,
        `COMING UP NEXT on the Beatshredder stage: "${nowPlaying.beatStyle}" with that ${nowPlaying.vibeNote} energy, requested by @${nowPlaying.requester}!`
      );
    }
  }, [handleTriggerPad, promptCohost, songQueue]);

  // Interactive Game Handlers
  const handleSelectGame = useCallback((type: GameType) => {
    setGame((prev) => ({
      ...createInitialGameState(type),
      scores: prev.scores,
    }));
  }, []);

  const handleStartOrExplainGame = useCallback(() => {
    const labelMap: Record<GameType, string> = {
      trivia_sprint: 'Trivia Sprint',
      either_or: 'Either-Or Poll',
      finish_lyric: 'Finish The Lyric',
      guess_beat: 'Guess The Beat',
      gift_race: 'Gift-Goal Race',
    };
    const title = labelMap[game.type];
    setGamesPlayedHistory((prev) => [...prev, title]);
    setGame((prev) => ({ ...prev, isActive: true, winner: null }));
    handleTriggerPad('laser_hype');

    let detailPrompt = game.rulesSummary;
    if (game.type === 'trivia_sprint') {
      const q = TRIVIA_BANK[game.triviaIndex % TRIVIA_BANK.length];
      detailPrompt += ` First question: "${q.prompt}"`;
    } else if (game.type === 'either_or') {
      detailPrompt += ` Option A is "${game.poll.optionA}" vs Option B "${game.poll.optionB}".`;
    } else if (game.type === 'finish_lyric') {
      const l = LYRIC_CHALLENGES[game.lyricIndex % LYRIC_CHALLENGES.length];
      detailPrompt += ` Setup bar: "${l.setupLine}"`;
    }

    promptCohost(
      `Explain the rules and kick off "${title}" out loud right now: ${detailPrompt}`,
      `GAME TIME! We are running ${title}! ${detailPrompt}`
    );
  }, [game, handleTriggerPad, promptCohost]);

  const handleRevealGameAnswer = useCallback(() => {
    handleTriggerPad('drop_it');
    if (game.type === 'trivia_sprint') {
      const q = TRIVIA_BANK[game.triviaIndex % TRIVIA_BANK.length];
      setGame((prev) => ({ ...prev, triviaRevealed: true }));
      promptCohost(
        `Reveal the trivia answer out loud: "${q.answer}"`,
        `Time is up! The official answer is ${q.answer}! Who called it first in the chat?`
      );
    } else if (game.type === 'finish_lyric') {
      const l = LYRIC_CHALLENGES[game.lyricIndex % LYRIC_CHALLENGES.length];
      setGame((prev) => ({ ...prev, lyricRevealed: true }));
      promptCohost(
        `Drop the punchline bar out loud: "${l.setupLine} ... ${l.missingLine}"`,
        `${l.setupLine} ${l.missingLine} — That bar goes crazy!`
      );
    } else if (game.type === 'guess_beat') {
      const g = GUESS_BEAT_ROUNDS[game.guessBeatIndex % GUESS_BEAT_ROUNDS.length];
      setGame((prev) => ({ ...prev, guessBeatRevealed: true }));
      promptCohost(
        `Reveal the mystery beat answer out loud: "${g.answerLabel}"`,
        `Mystery beat revealed! That was the "${g.answerLabel}" pad on the Beatshredder board!`
      );
    }
  }, [game, handleTriggerPad, promptCohost]);

  const handleNextGameRound = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      roundNumber: prev.roundNumber + 1,
      triviaIndex: prev.triviaIndex + 1,
      triviaRevealed: false,
      lyricIndex: prev.lyricIndex + 1,
      lyricRevealed: false,
      guessBeatIndex: prev.guessBeatIndex + 1,
      guessBeatRevealed: false,
      winner: null,
    }));
  }, []);

  const handleDeclareWinner = useCallback(
    (explicitWinner?: string) => {
      const updated = declareGameWinner(game, explicitWinner);
      setGame(updated);
      handleTriggerPad('victory_fanfare');
      handleAdjustHype(15);
      promptCohost(
        `Declare @${updated.winner} the official winner of the LIVE game!`,
        `CROWN ON THE HEAD! Official game winner is @${updated.winner}! Make some noise in the chat!`
      );
    },
    [game, handleAdjustHype, handleTriggerPad, promptCohost]
  );

  const activePadObj = BEAT_PADS.find((p) => p.id === activePadId) ?? null;
  const isAudioActive =
    Boolean(activePadId) || runningLoopIds.length > 0 || isCohostSpeaking;

  return (
    <div className="min-h-screen bg-[#09080D] text-[#F5F3FF] pb-24 lg:pb-10">
      {/* Main Responsive Stage Container */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-3.5 space-y-4">
        {/* Top Stage Header, Go Live Hero CTA, Session Setup Strip, Co-Host Monitor & Live Hype Meter */}
        <StageHeaderAndHype
          connectionState={connectionState}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((m) => !m)}
          onGoLive={handleGoLive}
          onEndStream={handleEndStreamAndRecap}
          onClipIt={handleClipIt}
          onHypeIntro={handleHypeIntro}
          isCohostSpeaking={isCohostSpeaking}
          cohostTranscript={cohostTranscript}
          streamerTranscript={streamerTranscript}
          micErrorText={micErrorText}
          apiErrorText={apiErrorText}
          onRetryMic={handleGoLive}
          hypeLevel={hypeLevel}
          hypeMultiplier={hypeMultiplier}
          hypeStreak={hypeStreak}
          hypeMultiplierLabel={hypeMultiplierLabel}
          milestoneBanner={milestoneBanner}
          onAdjustHype={(delta) => handleAdjustHype(delta)}
          elapsedSeconds={elapsedSeconds}
          peakViewers={peakViewers}
          onChangePeakViewers={setPeakViewers}
          selectedPersonaId={selectedPersonaId}
          onSelectPersona={handleSelectPersona}
          gamePresetId={gamePresetId}
          onChangeGamePreset={setGamePresetId}
          roastAggression={roastAggression}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Android Draw-Over-Screen Floating Overlay Bubble, Always-On-Top PiP & APK Setup */}
        <AndroidOverlayDrawer
          floatingConfig={floatingConfig}
          onChangeFloatingConfig={setFloatingConfig}
          personaId={selectedPersonaId}
          gamePresetId={gamePresetId}
          hypeLevel={hypeLevel}
          isLive={connectionState === 'live'}
          isCohostSpeaking={isCohostSpeaking}
          visionActive={visionSource !== 'none'}
          visionFramesSent={visionFramesSent}
          cohostTranscript={cohostTranscript}
          secondsUntilNextAutoRoast={secondsUntilNextAutoRoast}
          onStartLiveAndVision={() => startVisionCapture('screen')}
          onTriggerGameplayMoment={handleTriggerGameplayMoment}
          onClipIt={handleClipIt}
        />

        {/* Primary Gaming Vision, Hands-Free Auto Trash-Talk & Show Recorder Deck */}
        <GameplayVisionAndTrashTalk
          visionSource={visionSource}
          visionFramesSent={visionFramesSent}
          visionErrorText={visionErrorText}
          videoElementRef={videoElementRef}
          onStartVision={startVisionCapture}
          onStopVision={stopVisionCapture}
          isRecordingShow={isRecordingShow}
          recordedVideoUrl={recordedVideoUrl}
          onStartRecording={startRecordingShow}
          onStopRecording={stopRecordingShow}
          gamePresetId={gamePresetId}
          onChangeGamePreset={setGamePresetId}
          heatLevel={heatLevel}
          onChangeHeatLevel={setHeatLevel}
          roastAggression={roastAggression}
          onChangeRoastAggression={setRoastAggression}
          autoTalkEnabled={autoTalkEnabled}
          onToggleAutoTalk={() => setAutoTalkEnabled((v) => !v)}
          autoTalkIntervalSec={autoTalkIntervalSec}
          onChangeAutoTalkInterval={(sec) => {
            setAutoTalkIntervalSec(sec);
            setSecondsUntilNextAutoRoast(sec);
          }}
          secondsUntilNextAutoRoast={secondsUntilNextAutoRoast}
          onTriggerGameplayMoment={handleTriggerGameplayMoment}
          autoVisionMomentsEnabled={autoVisionMomentsEnabled}
          onToggleAutoVisionMoments={() => setAutoVisionMomentsEnabled((v) => !v)}
          lastAutoMomentText={lastAutoMomentText}
          onAdvanceVisionFrames={advanceVisionFrames}
        />

        {/* Co-Host Persona Selector + Integrated Music & Chat Reactive Visualizer + Toggleable On-Screen Overlays */}
        <VisualizerAndOverlays
          selectedPersonaId={selectedPersonaId}
          onSelectPersona={handleSelectPersona}
          onPreviewPersonaVoice={handlePreviewPersonaVoice}
          overlayConfig={overlayConfig}
          onToggleOverlayKey={(key) =>
            setOverlayConfig((prev) => toggleOverlayElement(prev, key))
          }
          onChangeVisualizerMode={(mode) =>
            setOverlayConfig((prev) => ({ ...prev, visualizerMode: mode }))
          }
          onChangeOverlayLayout={(layout) =>
            setOverlayConfig((prev) => ({ ...prev, overlayLayout: layout }))
          }
          hypeLevel={hypeLevel}
          milestoneBanner={milestoneBanner}
          chatPulseEnergy={chatPulseEnergy}
          isAudioActive={isAudioActive}
          activePadLabel={activePadObj?.label ?? null}
          game={game}
          songQueue={songQueue}
          comments={comments}
        />

        {/* Two-Column Stage Workspace on Desktop / Vertical One-Handed Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column (5 cols on lg): Always-Visible Live Chat & One-Tap Mod Tools */}
          <div className="lg:col-span-5">
            <ChatAndModPanel
              comments={comments}
              timedOutUsers={timedOutUsers}
              onAddComments={handleAddComments}
              onReadOutLoud={handleReadOutLoud}
              onRoastComment={handleRoastComment}
              onTogglePin={(id) => setComments((prev) => togglePinComment(prev, id))}
              onToggleHide={(id) => setComments((prev) => toggleHideComment(prev, id))}
              onTimeoutUser={(username) => {
                const res = timeoutUsername(comments, timedOutUsers, username);
                setComments(res.updatedComments);
                setTimedOutUsers(res.updatedTimedOutUsers);
              }}
              onRestoreUser={(username) => {
                setTimedOutUsers((prev) => prev.filter((u) => u !== username));
              }}
            />
          </div>

          {/* Right Column (7 cols on lg): Interactive Stage Deck (Beat Board + Queue, LIVE Games, Clips & Recaps) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Desktop Deck Switcher */}
            <div
              role="navigation"
              aria-label="Stage Deck Modules"
              className="hidden lg:grid grid-cols-3 gap-2 p-2 surface-card"
            >
              <Button
                type="button"
                variant="outline"
                active={activeDeck === 'beats'}
                onClick={() => setActiveDeck('beats')}
                className="w-full"
              >
                <Disc3 className="w-4 h-4" />
                <span>Beat Board & Queue</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                active={activeDeck === 'games'}
                onClick={() => setActiveDeck('games')}
                className="w-full"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>LIVE Games Arena</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                active={activeDeck === 'clips'}
                onClick={() => setActiveDeck('clips')}
                className="w-full"
              >
                <Scissors className="w-4 h-4" />
                <span>Clips & Recaps ({clips.length + recaps.length})</span>
              </Button>
            </div>

            {activeDeck === 'beats' && (
              <BeatBoardAndQueue
                activePadId={activePadId}
                runningLoopIds={runningLoopIds}
                onTriggerPad={handleTriggerPad}
                onStopAllAudio={handleStopAllAudio}
                isCohostSpeaking={isCohostSpeaking}
                duckReductionPercent={duckReductionPercent}
                onChangeDuckReductionPercent={(pct) => {
                  setDuckReductionPercent(pct);
                  stageAudio.setVoiceDucking(isCohostSpeaking, pct);
                }}
                voiceSoundboardEnabled={voiceSoundboardEnabled}
                onToggleVoiceSoundboard={() => setVoiceSoundboardEnabled((v) => !v)}
                isListeningSpeechApi={isListeningSpeechApi}
                lastHeardSpeech={lastHeardSpeech}
                lastVoiceEvent={lastVoiceEvent}
                customVoiceTriggers={customVoiceTriggers}
                onUpdateCustomVoiceTrigger={(padId, keywords) =>
                  setCustomVoiceTriggers((prev) => ({ ...prev, [padId]: keywords }))
                }
                onTestVoicePhrase={(phrase) => {
                  const res = triggerSimulatedVoiceCommand(phrase);
                  if (res.matchedPadId && res.matchedPadId !== 'stop_all') {
                    const profile = getRoastAggressionProfile(roastAggression);
                    promptCohost(
                      `The streamer just used a voice command ("${phrase}") to fire "${res.padLabel}" on the Voice-Activated Soundboard! React in 1 short sentence at ${profile.label} (${profile.score}%) intensity!`,
                      `Heard you loud and clear! Fired "${res.padLabel}" on the voice soundboard—let us go!`
                    );
                  }
                }}
                songQueue={songQueue}
                onAddSongRequest={handleAddSongRequest}
                onAnnounceNextSong={handleAnnounceNextSong}
                onRemoveSongRequest={(id) =>
                  setSongQueue((prev) => prev.filter((item) => item.id !== id))
                }
              />
            )}

            {activeDeck === 'games' && (
              <GamesArena
                game={game}
                onSelectGame={handleSelectGame}
                onStartOrExplainGame={handleStartOrExplainGame}
                onNextRound={handleNextGameRound}
                onRevealAnswer={handleRevealGameAnswer}
                onVotePoll={(side) =>
                  setGame((prev) => ({
                    ...prev,
                    poll: {
                      ...prev.poll,
                      votesA: side === 'A' ? prev.poll.votesA + 1 : prev.poll.votesA,
                      votesB: side === 'B' ? prev.poll.votesB + 1 : prev.poll.votesB,
                    },
                  }))
                }
                onUpdatePollOptions={(optionA, optionB) =>
                  setGame((prev) => ({
                    ...prev,
                    poll: { ...prev.poll, optionA, optionB },
                  }))
                }
                onPlayMysteryBeat={(padId) => handleTriggerPad(padId)}
                onBoostGiftRace={(pts) => {
                  setGame((prev) => advanceGiftRace(prev, pts));
                  handleAdjustHype(8);
                }}
                onAwardScore={(username, pts) =>
                  setGame((prev) => awardGameScore(prev, username, pts))
                }
                onDeclareWinner={handleDeclareWinner}
              />
            )}

            {activeDeck === 'clips' && (
              <ClipsAndRecapVault
                clips={clips}
                recaps={recaps}
                onClipNow={handleClipIt}
                onGenerateRecapNow={handleEndStreamAndRecap}
                onSpeakRecap={(recap) =>
                  promptCohost(
                    `Read this session recap out loud: ${recap.spokenScript}`,
                    recap.spokenScript
                  )
                }
                onDeleteClip={(id) =>
                  setClips((prev) => prev.filter((c) => c.id !== id))
                }
                onDeleteRecap={(id) =>
                  setRecaps((prev) => prev.filter((r) => r.id !== id))
                }
              />
            )}
          </div>
        </div>
      </main>

      {/* Grouped, Quiet Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        motionEnabled={motionEnabled}
        onChangeMotionEnabled={setMotionEnabled}
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        autoTalkEnabled={autoTalkEnabled}
        onToggleAutoTalk={() => setAutoTalkEnabled((v) => !v)}
        autoTalkIntervalSec={autoTalkIntervalSec}
        onChangeAutoTalkInterval={(sec) => {
          setAutoTalkIntervalSec(sec);
          setSecondsUntilNextAutoRoast(sec);
        }}
        voiceSoundboardEnabled={voiceSoundboardEnabled}
        onToggleVoiceSoundboard={() => setVoiceSoundboardEnabled((v) => !v)}
        duckReductionPercent={duckReductionPercent}
        onChangeDuckReductionPercent={(pct) => {
          setDuckReductionPercent(pct);
          stageAudio.setVoiceDucking(isCohostSpeaking, pct);
        }}
        overlayConfig={overlayConfig}
        onToggleOverlayKey={(key) =>
          setOverlayConfig((prev) => toggleOverlayElement(prev, key))
        }
      />

      {/* Fixed Bottom Thumb Bar on Mobile — Inside Thumb Reach, 48px Touch Targets */}
      <nav
        aria-label="Mobile Bottom Thumb Controls"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#09080D]/95 backdrop-blur-md border-t border-white/15 grid grid-cols-4 items-center px-2 gap-1"
      >
        <button
          type="button"
          onClick={() => setActiveDeck('beats')}
          className={`motion-interactive min-h-[48px] rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
            activeDeck === 'beats' && !settingsOpen
              ? 'text-[#F59E0B] bg-[#F59E0B]/10'
              : 'text-[#B6B0CC]'
          }`}
        >
          <Disc3 className="w-5 h-5" />
          <span className="type-caption mt-0.5">Beats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDeck('games')}
          className={`motion-interactive min-h-[48px] rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
            activeDeck === 'games' && !settingsOpen
              ? 'text-[#F59E0B] bg-[#F59E0B]/10'
              : 'text-[#B6B0CC]'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="type-caption mt-0.5">LIVE Games</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDeck('clips')}
          className={`motion-interactive min-h-[48px] rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
            activeDeck === 'clips' && !settingsOpen
              ? 'text-[#F59E0B] bg-[#F59E0B]/10'
              : 'text-[#B6B0CC]'
          }`}
        >
          <Scissors className="w-5 h-5" />
          <span className="type-caption mt-0.5">
            Clips ({clips.length + recaps.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          data-testid="mobile-settings-tab"
          className={`motion-interactive min-h-[48px] rounded-xl flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
            settingsOpen
              ? 'text-[#F59E0B] bg-[#F59E0B]/10'
              : 'text-[#B6B0CC]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="type-caption mt-0.5">Settings</span>
        </button>
      </nav>
    </div>
  );
}
