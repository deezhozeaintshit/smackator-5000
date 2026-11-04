import React, { useEffect, useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Layers,
  ListMusic,
  MessageSquare,
  Mic2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  ActiveGameState,
  COHOST_PERSONAS,
  ChatComment,
  CohostPersonaId,
  OverlayLayoutMode,
  SongRequestItem,
  StreamOverlayConfig,
  VisualizerMode,
  computeVisualizerBars,
} from '../lib/streamEngine';
import { stageAudio } from '../lib/audioSynth';
import { Badge, Button } from './ui/primitives';

interface VisualizerAndOverlaysProps {
  selectedPersonaId: CohostPersonaId;
  onSelectPersona: (id: CohostPersonaId) => void;
  onPreviewPersonaVoice: (id: CohostPersonaId) => void;
  overlayConfig: StreamOverlayConfig;
  onToggleOverlayKey: (
    key:
      | 'showVisualizer'
      | 'showHypeOverlay'
      | 'showGameScoreOverlay'
      | 'showSongQueueOverlay'
      | 'showPinnedChatOverlay'
  ) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onChangeOverlayLayout: (layout: OverlayLayoutMode) => void;
  hypeLevel: number;
  milestoneBanner: string | null;
  chatPulseEnergy: number;
  isAudioActive: boolean;
  activePadLabel: string | null;
  game: ActiveGameState;
  songQueue: SongRequestItem[];
  comments: ChatComment[];
}

export const VisualizerAndOverlays: React.FC<VisualizerAndOverlaysProps> = ({
  selectedPersonaId,
  onSelectPersona,
  onPreviewPersonaVoice,
  overlayConfig,
  onToggleOverlayKey,
  onChangeVisualizerMode,
  onChangeOverlayLayout,
  hypeLevel,
  milestoneBanner,
  chatPulseEnergy,
  isAudioActive,
  activePadLabel,
  game,
  songQueue,
  comments,
}) => {
  const [freqBins, setFreqBins] = useState<number[]>(() => new Array(16).fill(0));
  const activePersona = COHOST_PERSONAS[selectedPersonaId] ?? COHOST_PERSONAS.beatshredder;

  useEffect(() => {
    const interval = window.setInterval(() => {
      const bins = stageAudio.getFrequencyBins(16);
      setFreqBins(bins);
    }, 120);
    return () => window.clearInterval(interval);
  }, []);

  const vizFrame = computeVisualizerBars({
    frequencyBins: freqBins,
    chatPulseEnergy,
    hypeLevel,
    isAudioPlaying: isAudioActive,
    barCount: 16,
  });

  const scoreEntries = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
  const topScorerText =
    game.winner
      ? `Winner: @${game.winner}`
      : scoreEntries.length > 0
        ? `Leader: @${scoreEntries[0][0]} (${scoreEntries[0][1]} pts)`
        : game.type === 'either_or'
          ? `${game.poll.optionA} (${game.poll.votesA}) vs ${game.poll.optionB} (${game.poll.votesB})`
          : game.type === 'gift_race'
            ? `Goal: ${game.giftRace.currentPoints}/${game.giftRace.targetPoints} pts`
            : `Round #${game.roundNumber} Active`;

  const nowPlayingItem = songQueue.find((q) => q.status === 'playing') ?? null;
  const nextQueuedItem = songQueue.find((q) => q.status === 'queued') ?? null;

  const visibleComments = comments.filter((c) => !c.hidden);
  const spotlightComment =
    visibleComments.find((c) => c.pinned) ??
    visibleComments[0] ??
    null;

  const anyOverlayVisible =
    overlayConfig.showVisualizer ||
    overlayConfig.showHypeOverlay ||
    overlayConfig.showGameScoreOverlay ||
    overlayConfig.showSongQueueOverlay ||
    overlayConfig.showPinnedChatOverlay;

  return (
    <section
      aria-label="Co-Host Personas, Music & Chat Visualizer, and On-Screen Overlays"
      className="surface-card p-4 sm:p-5 space-y-5 overflow-hidden"
    >
      {/* 1. Co-Host Persona Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Mic2 className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="type-title text-[#F5F3FF]">Co-Host Persona Selector</h2>
            <Badge
              tone="gold"
              data-testid="active-persona-badge"
            >
              {activePersona.name} ({activePersona.voiceName} Voice)
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onPreviewPersonaVoice(selectedPersonaId)}
            className="border-[#F59E0B]/50 text-[#F59E0B]"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Persona Voice</span>
          </Button>
        </div>

        <div
          role="radiogroup"
          aria-label="Select Co-Host Persona"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          {(Object.values(COHOST_PERSONAS) as (typeof COHOST_PERSONAS)[CohostPersonaId][]).map(
            (persona) => {
              const isSelected = persona.id === selectedPersonaId;
              return (
                <button
                  key={persona.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`persona-option-${persona.id}`}
                  onClick={() => onSelectPersona(persona.id)}
                  className={`motion-interactive min-h-[76px] p-3.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
                    isSelected
                      ? 'bg-[#191426] border-[#F59E0B] text-[#F5F3FF]'
                      : 'bg-[#0D0B14] hover:bg-[#161321] border-white/10 text-[#F5F3FF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="type-title text-[#F5F3FF] truncate">
                      {persona.name}
                    </span>
                    <span className="type-caption font-mono-tabular text-[#F59E0B]">
                      {persona.voiceName}
                    </span>
                  </div>
                  <div className="type-caption text-[#B6B0CC] font-normal truncate mt-1">
                    {persona.personalityLabel}
                  </div>
                </button>
              );
            }
          )}
        </div>

        <div className="surface-inset px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="type-caption text-[#F5F3FF]">
            <strong className="text-[#F59E0B]">Catchphrase:</strong> “{activePersona.catchphrase}”
          </span>
          <span className="type-caption text-[#B6B0CC] font-normal">
            {activePersona.description}
          </span>
        </div>
      </div>

      {/* 2. Customizable On-Screen Overlays & Visualizer Controls */}
      <div className="border-t border-white/10 pt-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="type-title text-[#F5F3FF]">
              Live Stage Visualizer & On-Screen Overlays
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'spectrum', label: 'Spectrum' },
                { id: 'waveform', label: 'Waveform' },
                { id: 'pulse', label: 'Beat Pulse' },
              ] as const
            ).map((mode) => (
              <Button
                key={mode.id}
                type="button"
                variant="outline"
                active={overlayConfig.visualizerMode === mode.id}
                onClick={() => onChangeVisualizerMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onChangeOverlayLayout(
                  overlayConfig.overlayLayout === 'stage_hud' ? 'compact_strip' : 'stage_hud'
                )
              }
            >
              Layout: {overlayConfig.overlayLayout === 'stage_hud' ? 'Stage HUD' : 'Compact Strip'}
            </Button>
          </div>
        </div>

        {/* Streamer Toggle Buttons for Overlay Elements */}
        <div
          role="group"
          aria-label="Toggle On-Screen Overlay Widgets"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2"
        >
          {(
            [
              {
                key: 'showVisualizer',
                label: 'Visualizer',
                active: overlayConfig.showVisualizer,
              },
              {
                key: 'showHypeOverlay',
                label: 'Hype Meter HUD',
                active: overlayConfig.showHypeOverlay,
              },
              {
                key: 'showGameScoreOverlay',
                label: 'Game Score HUD',
                active: overlayConfig.showGameScoreOverlay,
              },
              {
                key: 'showSongQueueOverlay',
                label: 'Song Queue HUD',
                active: overlayConfig.showSongQueueOverlay,
              },
              {
                key: 'showPinnedChatOverlay',
                label: 'Chat Highlight HUD',
                active: overlayConfig.showPinnedChatOverlay,
              },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              type="button"
              variant="outline"
              active={item.active}
              aria-pressed={item.active}
              data-testid={`toggle-overlay-${item.key}`}
              onClick={() => onToggleOverlayKey(item.key)}
              className="w-full px-2.5 text-center"
            >
              {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Live On-Screen Broadcast Overlay Canvas */}
        {!anyOverlayVisible ? (
          <div
            data-testid="overlays-all-hidden"
            className="surface-inset p-4 text-center type-caption text-[#B6B0CC] font-normal"
          >
            All on-screen overlay elements are currently hidden. Tap any toggle above to display it on stage.
          </div>
        ) : (
          <div
            data-testid="live-stream-overlay-canvas"
            data-layout={overlayConfig.overlayLayout}
            className="surface-inset p-3.5 space-y-3 overflow-hidden"
          >
            {/* Reactive Music + Chat Visualizer Surface */}
            {overlayConfig.showVisualizer && (
              <div
                data-testid="reactive-visualizer"
                data-driver={vizFrame.dominantDriver}
                className="rounded-xl bg-[#12101B] border border-white/10 p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <Activity className="w-4 h-4 text-[#F59E0B]" />
                    <span className="type-caption text-[#F5F3FF]">
                      Music & Chat Reactive Visualizer
                    </span>
                    <span aria-hidden="true" className="text-[#B6B0CC]">/</span>
                    <span className="type-caption text-[#FBBF24] font-mono-tabular">
                      {vizFrame.dominantDriver === 'music'
                        ? `Music Active (${activePadLabel || 'Beat Synth'})`
                        : vizFrame.dominantDriver === 'chat'
                          ? 'Chat Activity Surge'
                          : 'Stage Standby Pulse'}
                    </span>
                  </div>
                  <span className="type-caption font-mono-tabular text-[#B6B0CC]">
                    Energy: <strong className="text-[#F5F3FF]">{vizFrame.peakEnergy}%</strong> / Mode:{' '}
                    <span className="uppercase text-[#F59E0B]">{overlayConfig.visualizerMode}</span>
                  </span>
                </div>

                {overlayConfig.visualizerMode === 'spectrum' && (
                  <div
                    aria-label="Audio and chat frequency spectrum"
                    className="h-14 flex items-end justify-between gap-1.5 pt-2 px-1"
                  >
                    {vizFrame.bars.map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-full bg-[#1C172B] rounded-t overflow-hidden flex items-end"
                      >
                        <div
                          className="motion-interactive w-full h-full rounded-t bg-gradient-to-t from-[#7C3AED] to-[#F59E0B] origin-bottom"
                          style={{ transform: `scaleY(${val})` }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {overlayConfig.visualizerMode === 'waveform' && (
                  <svg
                    viewBox="0 0 320 48"
                    className="w-full h-14 overflow-visible"
                    aria-label="Audio and chat reactive waveform"
                  >
                    <polyline
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={vizFrame.bars
                        .map((v, i) => {
                          const x = (i / (vizFrame.bars.length - 1)) * 320;
                          const y = 24 + (i % 2 === 0 ? -1 : 1) * v * 20;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                )}

                {overlayConfig.visualizerMode === 'pulse' && (
                  <div className="h-14 flex items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="motion-interactive w-10 h-10 rounded-full border-2 border-[#F59E0B] bg-[#7C3AED]/20 flex items-center justify-center shrink-0"
                        style={{
                          transform: `scale(${0.85 + (vizFrame.peakEnergy / 100) * 0.35})`,
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-[#FBBF24]" />
                      </div>
                      <div className="min-w-0">
                        <div className="type-caption text-[#F5F3FF] truncate">
                          Stage Beat & Crowd Pulse Ring
                        </div>
                        <div className="type-caption text-[#B6B0CC] font-normal">
                          Hype {hypeLevel}% / Chat Burst {chatPulseEnergy}%
                        </div>
                      </div>
                    </div>
                    <div className="type-title font-mono-tabular text-[#F59E0B]">
                      {vizFrame.peakEnergy} dB
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toggleable On-Screen HUD Cards */}
            <div
              className={
                overlayConfig.overlayLayout === 'stage_hud'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5'
                  : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
              }
            >
              {overlayConfig.showHypeOverlay && (
                <div
                  data-testid="overlay-widget-hype"
                  className="rounded-xl bg-[#12101B] border border-white/10 p-3 space-y-1 min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 type-caption">
                    <span className="text-[#B6B0CC] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#F59E0B]" />
                      <span>Hype HUD</span>
                    </span>
                    <strong className="font-mono-tabular text-[#F59E0B]">{hypeLevel}%</strong>
                  </div>
                  <p className="type-caption text-[#F5F3FF] truncate">
                    {milestoneBanner || (hypeLevel >= 80 ? 'Overdrive Mode' : 'Live Crowd Gauge')}
                  </p>
                </div>
              )}

              {overlayConfig.showGameScoreOverlay && (
                <div
                  data-testid="overlay-widget-game"
                  className="rounded-xl bg-[#12101B] border border-white/10 p-3 space-y-1 min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 type-caption">
                    <span className="text-[#B6B0CC] flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-[#F59E0B]" />
                      <span>Game Score</span>
                    </span>
                    <span className="font-mono-tabular text-[#FBBF24] uppercase">
                      {game.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="type-caption text-[#F5F3FF] truncate">{topScorerText}</p>
                </div>
              )}

              {overlayConfig.showSongQueueOverlay && (
                <div
                  data-testid="overlay-widget-queue"
                  className="rounded-xl bg-[#12101B] border border-white/10 p-3 space-y-1 min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 type-caption">
                    <span className="text-[#B6B0CC] flex items-center gap-1.5">
                      <ListMusic className="w-4 h-4 text-[#F59E0B]" />
                      <span>Song Queue</span>
                    </span>
                    <span className="font-mono-tabular text-[#F5F3FF]">
                      {songQueue.filter((q) => q.status === 'queued').length} Waiting
                    </span>
                  </div>
                  <p className="type-caption text-[#F5F3FF] truncate">
                    {nowPlayingItem
                      ? `Now: ${nowPlayingItem.beatStyle} (@${nowPlayingItem.requester})`
                      : nextQueuedItem
                        ? `Next: ${nextQueuedItem.beatStyle} (@${nextQueuedItem.requester})`
                        : 'Open for viewer beat requests'}
                  </p>
                </div>
              )}

              {overlayConfig.showPinnedChatOverlay && (
                <div
                  data-testid="overlay-widget-chat"
                  className="rounded-xl bg-[#12101B] border border-white/10 p-3 space-y-1 min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 type-caption">
                    <span className="text-[#B6B0CC] flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
                      <span>Chat Spotlight</span>
                    </span>
                    <span className="font-mono-tabular text-[#F59E0B]">
                      {spotlightComment?.pinned ? 'Pinned' : 'Latest'}
                    </span>
                  </div>
                  <p className="type-caption text-[#F5F3FF] truncate">
                    {spotlightComment
                      ? `@${spotlightComment.username}: ${spotlightComment.text}`
                      : 'Waiting for live chat input'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
