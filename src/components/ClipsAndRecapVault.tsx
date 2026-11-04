import React, { useState } from 'react';
import {
  Scissors,
  Award,
  Volume2,
  Copy,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { SavedClip, SessionRecap } from '../lib/streamEngine';
import { Badge, Button } from './ui/primitives';

interface ClipsAndRecapVaultProps {
  clips: SavedClip[];
  recaps: SessionRecap[];
  onClipNow: () => void;
  onGenerateRecapNow: () => void;
  onSpeakRecap: (recap: SessionRecap) => void;
  onDeleteClip: (id: string) => void;
  onDeleteRecap: (id: string) => void;
}

export const ClipsAndRecapVault: React.FC<ClipsAndRecapVaultProps> = ({
  clips,
  recaps,
  onClipNow,
  onGenerateRecapNow,
  onSpeakRecap,
  onDeleteClip,
  onDeleteRecap,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Saved 30-Second Clips Section */}
      <section
        aria-label="Saved 30-Second Stream Clips"
        className="surface-card p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Scissors className="w-5 h-5 text-[#F59E0B]" />
            <div className="min-w-0">
              <h2 className="type-title text-[#F5F3FF]">
                30-Second Clips Vault ({clips.length})
              </h2>
              <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
                Saved locally on your device — session summary, funniest moment & chat highlight
              </p>
            </div>
          </div>

          <Button type="button" variant="gold" onClick={onClipNow}>
            <Scissors className="w-4 h-4" />
            <span>Save 30s Clip Now</span>
          </Button>
        </div>

        {clips.length === 0 ? (
          <div className="surface-inset p-5 text-center space-y-1">
            <p className="type-title text-[#F5F3FF]">No 30s Clips Saved Yet</p>
            <p className="type-caption text-[#B6B0CC] font-normal">
              Tap “Clip It (30s)” anytime a clutch play, savage roast, or chat highlight drops.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip) => (
              <div
                key={clip.id}
                data-testid="saved-clip-card"
                className="surface-inset p-4 space-y-3 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="gold" className="font-mono-tabular">
                    Last {clip.durationSeconds}s Capture / Hype {clip.hypeLevelAtClip}%
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleCopy(
                          clip.id,
                          `Beatshredder 30s Clip:\nSummary: ${clip.sessionSummary}\nFunniest Moment: ${clip.funniestMoment}\nChat Highlight: ${clip.chatHighlight}`
                        )
                      }
                      aria-label="Copy clip summary"
                    >
                      {copiedId === clip.id ? (
                        <Check className="w-4 h-4 text-[#F59E0B]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copiedId === clip.id ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onDeleteClip(clip.id)}
                      aria-label="Delete clip"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 type-body">
                  <p className="text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
                    <strong className="text-[#F59E0B]">Summary:</strong> {clip.sessionSummary}
                  </p>
                  <p className="text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
                    <strong className="text-[#FBBF24]">Funniest Moment:</strong> “{clip.funniestMoment}”
                  </p>
                  <p className="text-[#B6B0CC] break-words [overflow-wrap:anywhere]">
                    <strong className="text-[#F5F3FF]">Chat Highlight:</strong> {clip.chatHighlight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* End-of-Stream Session Recaps Section */}
      <section
        aria-label="Saved Session Recaps"
        className="surface-card p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Award className="w-5 h-5 text-[#F59E0B]" />
            <div className="min-w-0">
              <h2 className="type-title text-[#F5F3FF]">
                Session Recaps ({recaps.length})
              </h2>
              <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
                Spoken and written breakdown of peak viewers, best moment, games played & what worked
              </p>
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={onGenerateRecapNow}>
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Create & Speak Recap</span>
          </Button>
        </div>

        {recaps.length === 0 ? (
          <div className="surface-inset p-5 text-center space-y-1">
            <p className="type-title text-[#F5F3FF]">No Session Recaps Yet</p>
            <p className="type-caption text-[#B6B0CC] font-normal">
              Tap “End Stream & Recap” or “Create & Speak Recap” to generate a spoken and written show breakdown.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recaps.map((recap) => (
              <div
                key={recap.id}
                data-testid="session-recap-card"
                className="surface-inset border-[#F59E0B]/50 p-4 space-y-3 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2 type-caption text-[#B6B0CC] font-mono-tabular">
                    <strong className="text-[#F59E0B]">Duration: {recap.durationFormatted}</strong>
                    <span aria-hidden="true">/</span>
                    <span>Peak Viewers: {recap.peakViewers}</span>
                    <span aria-hidden="true">/</span>
                    <span>Comments: {recap.totalComments}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="gold"
                      onClick={() => onSpeakRecap(recap)}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Speak Recap</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onDeleteRecap(recap.id)}
                      aria-label="Delete session recap"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 type-body">
                  <p className="text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
                    <strong className="text-[#F59E0B]">Spoken Outro Script:</strong> “{recap.spokenScript}”
                  </p>
                  <p className="text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
                    <strong className="text-[#FBBF24]">Best Moment:</strong> {recap.bestMoment}
                  </p>
                  <p className="text-[#F5F3FF] break-words">
                    <strong className="text-[#F59E0B]">Games Played:</strong>{' '}
                    {recap.gamesPlayed.join(' / ')}
                  </p>
                  <div className="space-y-1">
                    <strong className="text-[#F5F3FF] type-caption uppercase">What Worked:</strong>
                    <ul className="list-disc list-inside text-[#B6B0CC] type-caption font-normal space-y-1">
                      {recap.whatWorked.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
