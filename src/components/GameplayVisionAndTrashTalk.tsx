import React from 'react';
import {
  Camera,
  Crosshair,
  Download,
  Flame,
  Monitor,
  MonitorOff,
  Radio,
  Skull,
  Sparkles,
  TreePine,
  Trophy,
  Video,
  Zap,
} from 'lucide-react';
import {
  GAME_STREAM_PRESETS,
  GameStreamPresetId,
  GameplayMomentId,
  TrashTalkHeatLevel,
  getRoastAggressionProfile,
} from '../lib/streamEngine';
import { VisionSourceMode } from '../hooks/useGeminiLiveSession';
import { Badge, Button } from './ui/primitives';

interface GameplayVisionAndTrashTalkProps {
  visionSource: VisionSourceMode;
  visionFramesSent: number;
  visionErrorText: string | null;
  videoElementRef: React.RefObject<HTMLVideoElement | null>;
  onStartVision: (mode: 'screen' | 'camera') => void;
  onStopVision: () => void;
  isRecordingShow: boolean;
  recordedVideoUrl: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  gamePresetId: GameStreamPresetId;
  onChangeGamePreset: (id: GameStreamPresetId) => void;
  heatLevel: TrashTalkHeatLevel;
  onChangeHeatLevel: (level: TrashTalkHeatLevel) => void;
  roastAggression: number;
  onChangeRoastAggression: (score: number) => void;
  autoTalkEnabled: boolean;
  onToggleAutoTalk: () => void;
  autoTalkIntervalSec: number;
  onChangeAutoTalkInterval: (sec: number) => void;
  secondsUntilNextAutoRoast: number;
  onTriggerGameplayMoment: (moment: GameplayMomentId) => void;
  autoVisionMomentsEnabled?: boolean;
  onToggleAutoVisionMoments?: () => void;
  lastAutoMomentText?: string | null;
  onAdvanceVisionFrames?: (delta: number) => void;
}

export const GameplayVisionAndTrashTalk: React.FC<GameplayVisionAndTrashTalkProps> = ({
  visionSource,
  visionFramesSent,
  visionErrorText,
  videoElementRef,
  onStartVision,
  onStopVision,
  isRecordingShow,
  recordedVideoUrl,
  onStartRecording,
  onStopRecording,
  gamePresetId,
  onChangeGamePreset,
  onChangeHeatLevel,
  roastAggression,
  onChangeRoastAggression,
  autoTalkEnabled,
  onToggleAutoTalk,
  autoTalkIntervalSec,
  onChangeAutoTalkInterval,
  secondsUntilNextAutoRoast,
  onTriggerGameplayMoment,
  autoVisionMomentsEnabled = true,
  onToggleAutoVisionMoments,
  lastAutoMomentText = null,
  onAdvanceVisionFrames,
}) => {
  const activePreset = GAME_STREAM_PRESETS[gamePresetId] ?? GAME_STREAM_PRESETS.fortnite_br;
  const aggressionProfile = getRoastAggressionProfile(roastAggression);

  return (
    <section
      aria-label="Gameplay Screen Vision, Hands-Free Auto Trash-Talk, and Show Recorder"
      className="surface-card p-4 sm:p-5 space-y-5"
    >
      {/* Composed Header with Clear Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="type-title text-[#F5F3FF]">
              Gameplay Vision & Non-Stop Trash-Talk Deck
            </h2>
          </div>
          <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
            Hands-Free Open Mic + 1 FPS Screen Vision / Zero Push-To-Talk / Built for Fortnite & Livestream Recording
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={autoTalkEnabled ? 'gold' : 'outline'}
            aria-pressed={autoTalkEnabled}
            data-testid="toggle-auto-trash-talk"
            onClick={onToggleAutoTalk}
          >
            <Zap className="w-4 h-4" />
            <span>
              {autoTalkEnabled
                ? `Auto Trash-Talk ON (Next in ${secondsUntilNextAutoRoast}s)`
                : 'Auto Trash-Talk Paused'}
            </span>
          </Button>

          <div
            role="group"
            aria-label="Automatic Trash-Talk Frequency"
            className="flex items-center gap-1.5"
          >
            {[15, 25, 40].map((sec) => (
              <Button
                key={sec}
                type="button"
                variant="outline"
                active={autoTalkIntervalSec === sec}
                onClick={() => onChangeAutoTalkInterval(sec)}
                className="min-h-[48px] px-3 font-mono-tabular"
              >
                {sec}s
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Live Gameplay Screen/Camera Feed + Game & Trash-Talk Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 6 cols: Live Screen Share / Camera Vision Monitor & Recorder */}
        <div className="lg:col-span-6 flex flex-col justify-between surface-inset p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="type-caption text-[#F5F3FF] uppercase">
              {visionSource === 'screen'
                ? 'Sharing Game Screen (1 FPS Vision Active)'
                : visionSource === 'camera'
                  ? 'Camera Vision Active (Pointed at Screen)'
                  : 'Screen / Camera Vision Feed'}
            </span>
            <Badge tone="gold" className="font-mono-tabular">
              Frames Analyzed: {visionFramesSent}
            </Badge>
          </div>

          {/* Live Video Element */}
          <div className="relative w-full aspect-video rounded-xl bg-[#12101B] border border-white/10 overflow-hidden flex items-center justify-center">
            <video
              ref={videoElementRef}
              muted
              playsInline
              autoPlay
              data-testid="gameplay-vision-video"
              className={`w-full h-full object-contain ${
                visionSource === 'none' ? 'hidden' : 'block'
              }`}
            />
            {visionSource === 'none' && (
              <div className="p-4 text-center space-y-2 max-w-sm">
                <Monitor className="w-6 h-6 text-[#F59E0B] mx-auto" />
                <p className="type-title text-[#F5F3FF]">
                  Connect Your Fortnite or Game Screen
                </p>
                <p className="type-caption text-[#B6B0CC] font-normal">
                  Tap <strong className="text-[#F5F3FF]">Share Game Screen</strong> on desktop or{' '}
                  <strong className="text-[#F5F3FF]">Point Camera at TV</strong> on mobile so Beatshredder spots every missed shot, bush camp, and clutch in real time.
                </p>
              </div>
            )}
          </div>

          {visionErrorText && (
            <p
              role="status"
              className="type-caption text-[#FBBF24] bg-[#12101B] border border-[#F59E0B]/50 rounded-xl px-3.5 py-2.5"
            >
              {visionErrorText}
            </p>
          )}

          {/* Automatic Vision-Frame Moment Detector (Victory Clutch & Elimination) */}
          <div className="rounded-xl bg-[#12101B] border border-white/10 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span className="type-caption text-[#F5F3FF]">
                  Auto-Moment Vision Analyzer:
                </span>
                <span
                  data-testid="auto-vision-moment-status"
                  className="type-caption font-mono-tabular text-[#10B981]"
                >
                  {lastAutoMomentText ||
                    (autoVisionMomentsEnabled
                      ? 'Watching Frames for Clutch / Elimination'
                      : 'Paused')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onToggleAutoVisionMoments && (
                  <Button
                    type="button"
                    variant={autoVisionMomentsEnabled ? 'success' : 'outline'}
                    aria-pressed={autoVisionMomentsEnabled}
                    data-testid="toggle-auto-vision-moments"
                    onClick={onToggleAutoVisionMoments}
                  >
                    {autoVisionMomentsEnabled ? 'Auto-Detect ON' : 'Auto-Detect OFF'}
                  </Button>
                )}

                {onAdvanceVisionFrames && (
                  <Button
                    type="button"
                    variant="gold"
                    data-testid="simulate-vision-frames-btn"
                    onClick={() => onAdvanceVisionFrames(10)}
                    className="font-mono-tabular"
                  >
                    +10 Vision Frames
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Screen Share, Camera & Record Gameplay Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {visionSource === 'none' ? (
              <>
                <Button
                  type="button"
                  variant="gold"
                  onClick={() => onStartVision('screen')}
                  className="w-full"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Share Game Screen</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onStartVision('camera')}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 text-[#F59E0B]" />
                  <span>Point Camera at TV</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={onStopVision}
                className="w-full"
              >
                <MonitorOff className="w-4 h-4" />
                <span>Stop Screen/Camera Feed</span>
              </Button>
            )}

            {!isRecordingShow ? (
              <Button
                type="button"
                variant="outline"
                onClick={onStartRecording}
                className="w-full border-[#F59E0B]/50 text-[#F59E0B]"
              >
                <Video className="w-4 h-4" />
                <span>Record Gameplay + AI</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={onStopRecording}
                className="w-full"
              >
                <Radio className="w-4 h-4" />
                <span>Stop Recording</span>
              </Button>
            )}

            {recordedVideoUrl && (
              <a
                href={recordedVideoUrl}
                download={`shredder-gameplay-show-${Date.now()}.webm`}
                className="motion-interactive min-h-[48px] px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-black type-caption font-bold flex items-center justify-center gap-2 col-span-full"
              >
                <Download className="w-4 h-4" />
                <span>Download Recording</span>
              </a>
            )}
          </div>
        </div>

        {/* Right 6 cols: Game Preset, Trash-Talk Heat & Instant Roast Callouts */}
        <div className="lg:col-span-6 flex flex-col justify-between surface-inset p-4 space-y-4">
          {/* 1. Game Mode Preset Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="type-caption text-[#F59E0B] uppercase">
                1. Game Vision Preset
              </span>
              <span className="type-caption text-[#B6B0CC]">
                {activePreset.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.values(GAME_STREAM_PRESETS) as (typeof GAME_STREAM_PRESETS)[GameStreamPresetId][]).map(
                (preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    active={gamePresetId === preset.id}
                    data-testid={`game-preset-${preset.id}`}
                    onClick={() => onChangeGamePreset(preset.id)}
                    className="w-full justify-start text-left"
                  >
                    <span>{preset.label}</span>
                  </Button>
                )
              )}
            </div>
            <p className="type-caption text-[#B6B0CC] font-normal">
              {activePreset.shortDesc}
            </p>
          </div>

          {/* 2. Dynamic Roast Aggression Slider (Playful Banter -> Savage Insults) */}
          <div className="space-y-3 rounded-xl bg-[#12101B] border border-white/10 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="roast-aggression-slider"
                className="type-caption text-[#F59E0B] uppercase"
              >
                2. Roast Aggression Slider (No Push-To-Talk)
              </label>
              <Badge
                data-testid="roast-aggression-readout"
                tone={
                  aggressionProfile.tierId === 'savage_insults'
                    ? 'danger'
                    : aggressionProfile.tierId === 'playful_banter'
                      ? 'success'
                      : 'gold'
                }
                className="font-mono-tabular"
              >
                {aggressionProfile.score}% · {aggressionProfile.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <input
                id="roast-aggression-slider"
                data-testid="roast-aggression-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={aggressionProfile.score}
                onChange={(e) => {
                  const nextScore = Number(e.target.value);
                  onChangeRoastAggression(nextScore);
                  onChangeHeatLevel(getRoastAggressionProfile(nextScore).heatEquivalent);
                }}
                aria-label="Roast Aggression Level from Playful Banter to Savage Insults"
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-[#09080D] border border-white/20 accent-[#F59E0B]"
              />
              <div className="flex items-center justify-between gap-2 type-caption font-mono-tabular text-[#B6B0CC]">
                <span>0% Playful Banter</span>
                <span className="hidden sm:inline">50% Spicy Backseat</span>
                <span className="text-[#F59E0B]">100% Savage Insults</span>
              </div>
            </div>

            {/* Quick-Snap Aggression Stops (48px touch targets) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Playful Banter', score: 15, heat: 'playful_banter' as TrashTalkHeatLevel },
                { label: 'Spicy Backseat', score: 45, heat: 'hype_and_roast' as TrashTalkHeatLevel },
                { label: 'Ruthless Roast', score: 75, heat: 'ruthless_roast' as TrashTalkHeatLevel },
                { label: 'Savage Insults', score: 100, heat: 'ruthless_roast' as TrashTalkHeatLevel },
              ].map((stop) => {
                const isSelected = aggressionProfile.label === stop.label;
                return (
                  <Button
                    key={stop.label}
                    type="button"
                    variant="outline"
                    active={isSelected}
                    data-testid={`roast-tier-${stop.label.toLowerCase().replace(/\s+/g, '_')}`}
                    onClick={() => {
                      onChangeRoastAggression(stop.score);
                      onChangeHeatLevel(stop.heat);
                    }}
                    className="w-full px-2 text-center"
                  >
                    <span>{stop.label}</span>
                  </Button>
                );
              })}
            </div>

            <p className="type-caption text-[#B6B0CC] font-normal">
              <strong className="text-[#F5F3FF]">Tone Preview:</strong> “{aggressionProfile.sampleRoast}”
            </p>
          </div>

          {/* 3. Instant Gameplay Roast Callouts */}
          <div className="space-y-2">
            <span className="type-caption text-[#F59E0B] uppercase block">
              3. Instant Gameplay Roast Reactions (Voice + Soundboard)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                data-testid="roast-moment-whiffed_shot"
                onClick={() => onTriggerGameplayMoment('whiffed_shot')}
                className="w-full"
              >
                <Crosshair className="w-4 h-4 text-[#F59E0B]" />
                <span>Whiffed Shot</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                data-testid="roast-moment-bush_camping"
                onClick={() => onTriggerGameplayMoment('bush_camping')}
                className="w-full"
              >
                <TreePine className="w-4 h-4 text-[#10B981]" />
                <span>Bush Camping</span>
              </Button>

              <Button
                type="button"
                variant="danger"
                data-testid="roast-moment-sent_to_lobby"
                onClick={() => onTriggerGameplayMoment('sent_to_lobby')}
                className="w-full"
              >
                <Skull className="w-4 h-4" />
                <span>Sent To Lobby</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                data-testid="roast-moment-terrible_drop"
                onClick={() => onTriggerGameplayMoment('terrible_drop')}
                className="w-full"
              >
                <Flame className="w-4 h-4 text-[#F59E0B]" />
                <span>Bad Drop / Loot</span>
              </Button>

              <Button
                type="button"
                variant="gold"
                data-testid="roast-moment-victory_clutch"
                onClick={() => onTriggerGameplayMoment('victory_clutch')}
                className="col-span-2 sm:col-span-2 w-full"
              >
                <Trophy className="w-4 h-4" />
                <span>Clutch / Victory Royale</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
