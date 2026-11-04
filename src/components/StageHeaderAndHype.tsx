import React from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Scissors,
  Sparkles,
  Volume2,
  AlertTriangle,
  Flame,
  Plus,
  Minus,
  Settings,
} from 'lucide-react';
import { LiveConnectionState } from '../hooks/useGeminiLiveSession';
import {
  COHOST_PERSONAS,
  CohostPersonaId,
  GAME_STREAM_PRESETS,
  GameStreamPresetId,
  getRoastAggressionProfile,
} from '../lib/streamEngine';
import { Badge, Button } from './ui/primitives';

interface StageHeaderAndHypeProps {
  connectionState: LiveConnectionState;
  isMuted: boolean;
  onToggleMute: () => void;
  onGoLive: () => void;
  onEndStream: () => void;
  onClipIt: () => void;
  onHypeIntro: () => void;
  isCohostSpeaking: boolean;
  cohostTranscript: string;
  streamerTranscript: string;
  micErrorText: string | null;
  apiErrorText: string | null;
  onRetryMic: () => void;
  hypeLevel: number;
  hypeMultiplier?: number;
  hypeStreak?: number;
  hypeMultiplierLabel?: string;
  milestoneBanner: string | null;
  onAdjustHype: (delta: number) => void;
  elapsedSeconds: number;
  peakViewers: number;
  onChangePeakViewers: (val: number) => void;
  selectedPersonaId?: CohostPersonaId;
  onSelectPersona?: (id: CohostPersonaId) => void;
  gamePresetId?: GameStreamPresetId;
  onChangeGamePreset?: (id: GameStreamPresetId) => void;
  roastAggression?: number;
  onOpenSettings?: () => void;
}

export const StageHeaderAndHype: React.FC<StageHeaderAndHypeProps> = ({
  connectionState,
  isMuted,
  onToggleMute,
  onGoLive,
  onEndStream,
  onClipIt,
  onHypeIntro,
  isCohostSpeaking,
  cohostTranscript,
  streamerTranscript,
  micErrorText,
  apiErrorText,
  onRetryMic,
  hypeLevel,
  hypeMultiplier = 1,
  hypeStreak = 0,
  hypeMultiplierLabel = '1.0x Base Gain',
  milestoneBanner,
  onAdjustHype,
  elapsedSeconds,
  peakViewers,
  onChangePeakViewers,
  selectedPersonaId = 'beatshredder',
  onSelectPersona,
  gamePresetId = 'fortnite_br',
  onChangeGamePreset,
  roastAggression = 85,
  onOpenSettings,
}) => {
  const isLive = connectionState === 'live';
  const isConnecting = connectionState === 'connecting';

  const activePersona = COHOST_PERSONAS[selectedPersonaId] ?? COHOST_PERSONAS.beatshredder;
  const activePreset = GAME_STREAM_PRESETS[gamePresetId] ?? GAME_STREAM_PRESETS.fortnite_br;
  const roastProfile = getRoastAggressionProfile(roastAggression);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section
      aria-label="Beatshredder Stage Control and Hype Meter"
      className="w-full space-y-3 signature-stage-transition"
    >
      {/* Top Studio Identity Bar — Sells the brand in one glance */}
      <header className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="type-display text-[#F5F3FF]">Beatshredder</h1>
            <span className="type-caption text-[#F59E0B] uppercase tracking-wider">
              Shred Them Beats Boy.
            </span>
          </div>
          <p className="type-caption text-[#B6B0CC] font-normal">
            Motto: <strong className="text-[#F5F3FF] font-semibold">Be Unique, Be You.</strong>
          </p>
        </div>

        {/* Stream Timer & Quiet Settings Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge tone={isLive ? 'success' : 'neutral'} className="min-h-[48px] px-2.5 font-mono-tabular">
            <Radio className="w-4 h-4" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </Badge>

          {onOpenSettings && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onOpenSettings}
              aria-label="Open Studio Settings"
              data-testid="open-settings-btn"
            >
              <Settings className="w-5 h-5 text-[#F59E0B]" />
            </Button>
          )}
        </div>
      </header>

      {/* Microphone Error State Banner */}
      {micErrorText && (
        <div
          role="alert"
          className="surface-card border-[#F59E0B]/60 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B] mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="type-title text-[#F59E0B]">
                Microphone Permission Required for Hands-Free Listening
              </p>
              <p className="type-body text-[#F5F3FF]">{micErrorText}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="gold" onClick={onRetryMic}>
              Retry Microphone
            </Button>
            <Button type="button" variant="secondary" onClick={onHypeIntro}>
              Run Cohost in Tap-to-Talk Mode
            </Button>
          </div>
        </div>
      )}

      {apiErrorText && (
        <div
          role="status"
          className="surface-inset px-3.5 py-2.5 type-caption text-[#F5F3FF] border-[#F59E0B]/40"
        >
          Stage Audio Notice: {apiErrorText} (Hands-free synth and Beatshredder voice deck remain active.)
        </div>
      )}

      {/* Hero Stage Surface: Dominant Go Live Action + Session Setup in One Glance */}
      <div className="surface-hero p-3.5 sm:p-5 space-y-3">
        {/* Dominant Primary Action + Secondary Stage Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {!isLive ? (
            <Button
              type="button"
              variant="gold"
              size="lg"
              onClick={onGoLive}
              disabled={isConnecting}
              className="flex-1 w-full"
            >
              <Radio className="w-5 h-5" />
              <span>
                {isConnecting ? 'Connecting Live Mic + Vision...' : 'Go Live (Open Mic + Vision)'}
              </span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={onEndStream}
              className="flex-1 w-full"
            >
              <Radio className="w-5 h-5" />
              <span>End Stream & Recap</span>
            </Button>
          )}

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            {isLive && (
              <Button
                type="button"
                variant={isMuted ? 'danger' : 'secondary'}
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-[#F59E0B]" />
                )}
                <span>{isMuted ? 'Mic Muted' : 'Open Mic Hot'}</span>
              </Button>
            )}

            <Button type="button" variant="secondary" onClick={onHypeIntro}>
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Roast Me Now</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClipIt}
              className="border-[#F59E0B]/50 text-[#F59E0B]"
            >
              <Scissors className="w-4 h-4" />
              <span>Clip It (30s)</span>
            </Button>
          </div>
        </div>

        {/* One-Glance Session Setup Strip (Persona, Game Preset, Roast Heat, Peak Viewers) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              if (!onSelectPersona) return;
              const ids = Object.keys(COHOST_PERSONAS) as CohostPersonaId[];
              const next = ids[(ids.indexOf(selectedPersonaId) + 1) % ids.length];
              onSelectPersona(next);
            }}
            aria-label="Cycle Co-Host Persona"
            className="motion-interactive min-h-[52px] p-2.5 rounded-xl bg-[#0D0B14] hover:bg-[#161322] border border-white/10 text-left flex flex-col justify-between cursor-pointer active:scale-[0.98]"
          >
            <span className="type-caption text-[#B6B0CC] uppercase">Persona</span>
            <span className="type-caption text-[#F5F3FF] font-bold">
              {activePersona.name}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!onChangeGamePreset) return;
              const ids = Object.keys(GAME_STREAM_PRESETS) as GameStreamPresetId[];
              const next = ids[(ids.indexOf(gamePresetId) + 1) % ids.length];
              onChangeGamePreset(next);
            }}
            aria-label="Cycle Game Preset"
            className="motion-interactive min-h-[52px] p-2.5 rounded-xl bg-[#0D0B14] hover:bg-[#161322] border border-white/10 text-left flex flex-col justify-between cursor-pointer active:scale-[0.98]"
          >
            <span className="type-caption text-[#B6B0CC] uppercase">Game Mode</span>
            <span className="type-caption text-[#F5F3FF] font-bold">
              {activePreset.label.split('/')[0].trim()}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Tune Roast Heat in Settings"
            className="motion-interactive min-h-[52px] p-2.5 rounded-xl bg-[#0D0B14] hover:bg-[#161322] border border-white/10 text-left flex flex-col justify-between cursor-pointer active:scale-[0.98]"
          >
            <span className="type-caption text-[#B6B0CC] uppercase">Roast Heat</span>
            <span className="type-caption text-[#F59E0B] font-mono-tabular font-bold">
              {roastProfile.score}% {roastProfile.label.split(' ')[0]}
            </span>
          </button>

          <label className="min-h-[52px] p-2.5 rounded-xl bg-[#0D0B14] border border-white/10 flex items-center justify-between gap-1.5">
            <span className="type-caption text-[#B6B0CC] uppercase">Peak Viewers</span>
            <input
              type="number"
              min={0}
              max={999999}
              aria-label="Peak Viewers Count"
              value={peakViewers}
              onChange={(e) =>
                onChangePeakViewers(Math.max(0, parseInt(e.target.value || '0', 10)))
              }
              className="w-14 min-h-[36px] px-1.5 py-0.5 rounded-lg bg-[#12101B] border border-white/15 text-[#F5F3FF] type-caption text-center font-mono-tabular focus:outline-none focus:border-[#F59E0B]"
            />
          </label>
        </div>

        {/* Always-Visible Co-Host Status & Caption Monitor */}
        <div className="surface-inset p-3 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Volume2
                className={`w-4 h-4 ${
                  isCohostSpeaking ? 'text-[#F59E0B]' : 'text-[#B6B0CC]'
                }`}
              />
              <span className="type-caption text-[#F5F3FF] uppercase tracking-wider">
                {activePersona.name} Co-Host{' '}
                {isCohostSpeaking ? 'Speaking Live' : 'Hands-Free'}
              </span>
            </div>
            <Badge tone={isLive ? 'success' : 'gold'} className="font-mono-tabular">
              {isLive ? 'Open Mic Live' : 'Auto Roast Armed'}
            </Badge>
          </div>

          <p
            data-testid="cohost-transcript"
            className="type-body text-[#F5F3FF] break-words [overflow-wrap:anywhere]"
          >
            “{cohostTranscript}”
          </p>

          {streamerTranscript && (
            <p className="type-caption text-[#B6B0CC] break-words [overflow-wrap:anywhere]">
              You said: <span className="text-[#F5F3FF]">“{streamerTranscript}”</span>
            </p>
          )}
        </div>

        {/* Always-Visible Live Hype Meter with Dynamic Multiplier */}
        <div className="surface-inset p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Flame className="w-4 h-4 text-[#F59E0B]" />
              <span className="type-title text-[#F5F3FF]">Live Hype Meter</span>
              <span
                data-testid="hype-meter-value"
                className="type-title text-[#F59E0B] font-mono-tabular"
              >
                {hypeLevel}%
              </span>
              <span
                data-testid="hype-multiplier-badge"
                className={`px-2 py-0.5 rounded-lg font-mono-tabular type-caption border ${
                  hypeMultiplier > 1
                    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#FBBF24]'
                    : 'bg-[#12101B] border-white/15 text-[#B6B0CC]'
                }`}
              >
                {hypeMultiplierLabel}
                {hypeStreak > 0 ? ` / Streak x${hypeStreak}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => onAdjustHype(-10)}
                aria-label="Lower Hype Meter"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onAdjustHype(15)}
                aria-label="Boost Hype Meter"
                className="border-[#F59E0B]/50 text-[#F59E0B]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            role="progressbar"
            aria-valuenow={hypeLevel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Stream Hype Energy Percentage"
            className="w-full h-3 rounded-full bg-[#09080D] border border-white/15 overflow-hidden p-0.5"
          >
            <div
              className="motion-interactive h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] origin-left"
              style={{ transform: `scaleX(${Math.max(0.02, hypeLevel / 100)})` }}
            />
          </div>

          {milestoneBanner && (
            <div
              role="status"
              data-testid="milestone-banner"
              className="rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/60 px-3 py-2 type-caption text-[#FBBF24] flex items-center justify-between gap-2 break-words"
            >
              <span>MILESTONE CALLOUT: {milestoneBanner}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
