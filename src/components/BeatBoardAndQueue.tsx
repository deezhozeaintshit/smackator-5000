import React, { useState } from 'react';
import {
  Disc3,
  Volume2,
  Square,
  ListMusic,
  Plus,
  Megaphone,
  Trash2,
  Mic,
  MicOff,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  BEAT_PADS,
  DEFAULT_VOICE_KEYWORDS,
  PadId,
  SongRequestItem,
  computeAudioDuckingTarget,
} from '../lib/streamEngine';
import { VoiceSoundboardEvent } from '../hooks/useVoiceSoundboard';
import { Badge, Button, Input } from './ui/primitives';

interface BeatBoardAndQueueProps {
  activePadId: PadId | null;
  runningLoopIds: PadId[];
  onTriggerPad: (padId: PadId) => void;
  onStopAllAudio: () => void;
  isCohostSpeaking?: boolean;
  duckReductionPercent?: number;
  onChangeDuckReductionPercent?: (percent: number) => void;
  voiceSoundboardEnabled: boolean;
  onToggleVoiceSoundboard: () => void;
  isListeningSpeechApi: boolean;
  lastHeardSpeech: string;
  lastVoiceEvent: VoiceSoundboardEvent | null;
  customVoiceTriggers: Partial<Record<PadId, string>>;
  onUpdateCustomVoiceTrigger: (padId: PadId, keywords: string) => void;
  onTestVoicePhrase: (phrase: string) => void;
  songQueue: SongRequestItem[];
  onAddSongRequest: (requester: string, beatStyle: string, vibeNote: string) => void;
  onAnnounceNextSong: () => void;
  onRemoveSongRequest: (id: string) => void;
}

export const BeatBoardAndQueue: React.FC<BeatBoardAndQueueProps> = ({
  activePadId,
  runningLoopIds,
  onTriggerPad,
  onStopAllAudio,
  isCohostSpeaking = false,
  duckReductionPercent = 18,
  onChangeDuckReductionPercent,
  voiceSoundboardEnabled,
  onToggleVoiceSoundboard,
  isListeningSpeechApi,
  lastHeardSpeech,
  lastVoiceEvent,
  customVoiceTriggers,
  onUpdateCustomVoiceTrigger,
  onTestVoicePhrase,
  songQueue,
  onAddSongRequest,
  onAnnounceNextSong,
  onRemoveSongRequest,
}) => {
  const [requester, setRequester] = useState('');
  const [beatStyle, setBeatStyle] = useState('');
  const [vibeNote, setVibeNote] = useState('');
  const [queueError, setQueueError] = useState<string | null>(null);
  const [testPhraseInput, setTestPhraseInput] = useState('');
  const [showTriggerEditor, setShowTriggerEditor] = useState(false);

  const duckingState = computeAudioDuckingTarget({
    isCohostSpeaking,
    reductionPercent: duckReductionPercent,
  });

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beatStyle.trim()) {
      setQueueError('Enter a beat style or vibe request before adding to the stage queue.');
      return;
    }
    setQueueError(null);
    onAddSongRequest(
      requester || 'viewer',
      beatStyle,
      vibeNote || 'High Energy Stage Vibe'
    );
    setBeatStyle('');
    setVibeNote('');
  };

  const handleVoicePhraseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhraseInput.trim()) return;
    onTestVoicePhrase(testPhraseInput.trim());
    setTestPhraseInput('');
  };

  return (
    <div className="space-y-4">
      {/* Hero Beat Board + Voice-Activated Soundboard Deck */}
      <section
        aria-label="Beatshredder Web Audio Beat Board"
        className="surface-hero p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="type-title text-[#F5F3FF]">
                Beatshredder MPC Deck & Voice Soundboard
              </h2>
            </div>
            <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
              Hit any physical pad mid-performance or speak a trigger cue out loud
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={voiceSoundboardEnabled ? 'success' : 'outline'}
              aria-pressed={voiceSoundboardEnabled}
              data-testid="toggle-voice-soundboard"
              onClick={onToggleVoiceSoundboard}
            >
              {voiceSoundboardEnabled ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
              <span>
                {voiceSoundboardEnabled
                  ? isListeningSpeechApi
                    ? 'Voice Trigger: Listening Live'
                    : 'Voice Trigger: Armed'
                  : 'Voice Trigger: Paused'}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              active={showTriggerEditor}
              onClick={() => setShowTriggerEditor((v) => !v)}
              data-testid="toggle-voice-keywords-editor"
            >
              <Sliders className="w-4 h-4 text-[#F59E0B]" />
              <span>{showTriggerEditor ? 'Hide Voice Keywords' : 'Custom Voice Keywords'}</span>
            </Button>

            {runningLoopIds.length > 0 && (
              <Button
                type="button"
                variant="danger"
                onClick={onStopAllAudio}
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Beat Loop</span>
              </Button>
            )}
          </div>
        </div>

        {/* Physical 2x4 Hardware Drum Pad Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BEAT_PADS.map((pad) => {
            const isFiring = activePadId === pad.id;
            const isLooping = runningLoopIds.includes(pad.id);
            const isHighlight = isFiring || isLooping;
            const customPhrase = customVoiceTriggers[pad.id]?.split(',')[0]?.trim();

            return (
              <button
                key={pad.id}
                type="button"
                onClick={() => onTriggerPad(pad.id)}
                data-testid={`beat-pad-${pad.id}`}
                data-active={isHighlight ? 'true' : 'false'}
                aria-pressed={isLooping}
                className={`motion-interactive beat-pad-surface min-h-[108px] p-3.5 rounded-2xl border text-left flex flex-col justify-between cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
                  isHighlight
                    ? 'bg-[#F59E0B] border-[#FBBF24] text-black'
                    : pad.category === 'beat'
                      ? 'bg-[#1A1629] hover:bg-[#231D36] border-[#F59E0B]/40 text-[#F5F3FF]'
                      : 'bg-[#0D0B14] hover:bg-[#171422] border-white/15 text-[#F5F3FF]'
                }`}
              >
                {/* Top Pad LED Indicator & Voice Cue */}
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-8 rounded-full ${
                        isHighlight
                          ? 'bg-black'
                          : pad.category === 'beat'
                            ? 'bg-[#F59E0B]'
                            : 'bg-white/25'
                      }`}
                    />
                    {pad.isLoop ? (
                      <Disc3
                        className={`w-4 h-4 ${
                          isHighlight ? 'text-black' : 'text-[#F59E0B]'
                        }`}
                      />
                    ) : (
                      <Volume2
                        className={`w-4 h-4 ${
                          isHighlight ? 'text-black' : 'text-[#B6B0CC]'
                        }`}
                      />
                    )}
                  </div>

                  <div
                    className={`type-caption font-mono-tabular truncate ${
                      isHighlight ? 'text-black/80 font-bold' : 'text-[#B6B0CC]'
                    }`}
                  >
                    {customPhrase ? `“${customPhrase}”` : pad.voiceTrigger}
                  </div>
                </div>

                {/* Pad Title & Status */}
                <div className="mt-3">
                  <div className="type-title leading-tight">{pad.label}</div>
                  <div
                    className={`type-caption mt-0.5 ${
                      isHighlight ? 'text-black/85 font-bold' : 'text-[#B6B0CC] font-normal'
                    }`}
                  >
                    {isLooping ? 'Loop Playing (Tap to Stop)' : pad.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Voice Ducking & Voice Command Strip */}
        <div className="surface-inset p-3.5 space-y-3">
          {/* Dynamic Audio Ducking Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Volume2
                className={`w-4 h-4 ${
                  duckingState.isDucked ? 'text-[#F59E0B]' : 'text-[#B6B0CC]'
                }`}
              />
              <span className="type-caption text-[#F5F3FF]">Dynamic Voice Ducking:</span>
              <span
                data-testid="audio-ducking-status"
                className={`type-caption font-mono-tabular ${
                  duckingState.isDucked ? 'text-[#F59E0B]' : 'text-[#10B981]'
                }`}
              >
                {duckingState.statusLabel}
              </span>
            </div>

            {onChangeDuckReductionPercent && (
              <div
                role="group"
                aria-label="Audio Ducking Reduction Depth"
                className="flex items-center gap-1.5"
              >
                {[15, 18, 20].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant="outline"
                    active={duckReductionPercent === pct}
                    data-testid={`duck-depth-${pct}`}
                    onClick={() => onChangeDuckReductionPercent(pct)}
                    className="min-h-[48px] px-3 font-mono-tabular"
                  >
                    -{pct}%
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Soundboard Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span className="type-caption text-[#F5F3FF]">Voice Soundboard Status:</span>
              {lastVoiceEvent ? (
                <span
                  data-testid="voice-soundboard-last-fired"
                  className="type-caption font-mono-tabular text-[#10B981] truncate"
                >
                  Heard “{lastVoiceEvent.phrase}” / Fired {lastVoiceEvent.padLabel}
                </span>
              ) : lastHeardSpeech ? (
                <span className="type-caption font-mono-tabular text-[#B6B0CC] truncate">
                  Heard: “{lastHeardSpeech}” (no keyword match)
                </span>
              ) : (
                <span className="type-caption text-[#B6B0CC] font-normal">
                  Say “Drop it”, “Air horn”, “Roast sting”, “Shred beat”, or “Winner horn”
                </span>
              )}
            </div>
          </div>

          {/* Voice Command Test Bar */}
          <form onSubmit={handleVoicePhraseSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
            <label htmlFor="voice-command-test-input" className="sr-only">
              Speak or Type Voice Soundboard Command
            </label>
            <Input
              id="voice-command-test-input"
              data-testid="voice-command-input"
              type="text"
              value={testPhraseInput}
              onChange={(e) => setTestPhraseInput(e.target.value)}
              placeholder='Test voice phrase (e.g. "yo drop it right now" or "hit the air horn")...'
              className="flex-1"
            />
            <Button
              type="submit"
              variant="gold"
              data-testid="fire-voice-command-btn"
              className="shrink-0"
            >
              Trigger Voice Command
            </Button>
          </form>

          {/* Quick 1-Tap Spoken Phrase Cues */}
          <div className="space-y-1.5">
            <div className="type-caption text-[#B6B0CC] uppercase">Quick Voice Cues</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: '“Drop it!”', phrase: 'Yo drop it right now!' },
                { label: '“Air horn!”', phrase: 'Hit the air horn!' },
                { label: '“Emotional damage!”', phrase: 'That was emotional damage!' },
                { label: '“Shred beat!”', phrase: 'Start the shred beat!' },
                { label: '“Victory Royale!”', phrase: 'Victory royale winner horn!' },
              ].map((chip) => (
                <Button
                  key={chip.label}
                  type="button"
                  variant="secondary"
                  onClick={() => onTestVoicePhrase(chip.phrase)}
                  className="w-full"
                >
                  {chip.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Expandable Custom Voice Keyword Editor per Pad */}
          {showTriggerEditor && (
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BEAT_PADS.map((pad) => {
                const currentCustom =
                  customVoiceTriggers[pad.id] ??
                  DEFAULT_VOICE_KEYWORDS[pad.id].slice(0, 2).join(', ');
                return (
                  <div
                    key={pad.id}
                    className="p-3 rounded-xl bg-[#12101B] border border-white/10 flex flex-col gap-1.5"
                  >
                    <label
                      htmlFor={`custom-trigger-${pad.id}`}
                      className="type-caption text-[#F59E0B] flex items-center justify-between"
                    >
                      <span>{pad.label}</span>
                      <span className="font-mono-tabular text-[#B6B0CC] font-normal">
                        comma-separated
                      </span>
                    </label>
                    <Input
                      id={`custom-trigger-${pad.id}`}
                      type="text"
                      value={currentCustom}
                      onChange={(e) => onUpdateCustomVoiceTrigger(pad.id, e.target.value)}
                      className="font-mono-tabular"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Song / Beat Request Queue Section */}
      <section
        aria-label="Viewer Song and Beat Request Queue"
        className="surface-card p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ListMusic className="w-5 h-5 text-[#F59E0B]" />
            <div className="min-w-0">
              <h2 className="type-title text-[#F5F3FF]">Song & Beat Request Queue</h2>
              <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
                Queue viewer beat requests and let Beatshredder call out the next drop
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="gold"
            onClick={onAnnounceNextSong}
            disabled={songQueue.filter((q) => q.status === 'queued').length === 0}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announce Next Up</span>
          </Button>
        </div>

        <form onSubmit={handleAddRequest} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div>
            <label htmlFor="song-requester" className="sr-only">
              Viewer Username
            </label>
            <Input
              id="song-requester"
              type="text"
              placeholder="@viewer"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="song-beat-style" className="sr-only">
              Beat Style or Genre
            </label>
            <Input
              id="song-beat-style"
              type="text"
              placeholder="Beat style (e.g. Dark Phonk 808)"
              value={beatStyle}
              onChange={(e) => {
                setBeatStyle(e.target.value);
                if (queueError) setQueueError(null);
              }}
            />
          </div>

          <div>
            <label htmlFor="song-vibe-note" className="sr-only">
              Vibe Note
            </label>
            <Input
              id="song-vibe-note"
              type="text"
              placeholder="Vibe (e.g. Late night synth)"
              value={vibeNote}
              onChange={(e) => setVibeNote(e.target.value)}
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full">
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Add Request</span>
          </Button>
        </form>

        {queueError && (
          <p role="alert" className="type-caption text-[#F59E0B]">
            {queueError}
          </p>
        )}

        <div className="space-y-2.5">
          {songQueue.length === 0 ? (
            <div className="surface-inset p-5 text-center space-y-1">
              <p className="type-title text-[#F5F3FF]">Request Queue Open</p>
              <p className="type-caption text-[#B6B0CC] font-normal">
                Add a viewer beat style or vibe note above to line up the next performance.
              </p>
            </div>
          ) : (
            songQueue.map((item, idx) => (
              <div
                key={item.id}
                data-testid="song-queue-row"
                className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                  item.status === 'playing'
                    ? 'bg-[#191426] border-[#F59E0B]/60'
                    : item.status === 'done'
                      ? 'bg-[#0D0B14]/50 border-white/5 opacity-60'
                      : 'bg-[#0D0B14] border-white/10'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 type-caption text-[#B6B0CC]">
                    <span className="font-mono-tabular font-bold text-[#F59E0B]">
                      #{idx + 1}
                    </span>
                    <span aria-hidden="true">/</span>
                    <strong className="text-[#F5F3FF] break-words">{item.beatStyle}</strong>
                    <span aria-hidden="true">/</span>
                    <span className="truncate">@{item.requester}</span>
                    <Badge tone={item.status === 'playing' ? 'gold' : 'neutral'}>
                      {item.status === 'playing'
                        ? 'Now On Deck'
                        : item.status === 'done'
                          ? 'Played'
                          : 'Up Next'}
                    </Badge>
                  </div>
                  <p className="type-caption text-[#B6B0CC] font-normal break-words">
                    Vibe: {item.vibeNote}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveSongRequest(item.id)}
                  aria-label={`Remove request ${item.beatStyle}`}
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
