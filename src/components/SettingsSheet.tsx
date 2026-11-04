import React from 'react';
import {
  COHOST_PERSONAS,
  CohostPersonaId,
  StreamOverlayConfig,
} from '../lib/streamEngine';
import { Badge, Button, Sheet, SwitchRow } from './ui/primitives';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motionEnabled: boolean;
  onChangeMotionEnabled: (enabled: boolean) => void;
  selectedPersonaId: CohostPersonaId;
  onSelectPersona: (id: CohostPersonaId) => void;
  autoTalkEnabled: boolean;
  onToggleAutoTalk: () => void;
  autoTalkIntervalSec: number;
  onChangeAutoTalkInterval: (sec: number) => void;
  voiceSoundboardEnabled: boolean;
  onToggleVoiceSoundboard: () => void;
  duckReductionPercent: number;
  onChangeDuckReductionPercent: (pct: number) => void;
  overlayConfig: StreamOverlayConfig;
  onToggleOverlayKey: (
    key:
      | 'showVisualizer'
      | 'showHypeOverlay'
      | 'showGameScoreOverlay'
      | 'showSongQueueOverlay'
      | 'showPinnedChatOverlay'
  ) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onOpenChange,
  motionEnabled,
  onChangeMotionEnabled,
  selectedPersonaId,
  onSelectPersona,
  autoTalkEnabled,
  onToggleAutoTalk,
  autoTalkIntervalSec,
  onChangeAutoTalkInterval,
  voiceSoundboardEnabled,
  onToggleVoiceSoundboard,
  duckReductionPercent,
  onChangeDuckReductionPercent,
  overlayConfig,
  onToggleOverlayKey,
}) => {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Studio Settings"
      subtitle="Grouped stage preferences, motion controls, and audio ducking"
      data-testid="studio-settings-sheet"
    >
      {/* Group 1: Motion & Feel (Reduced Motion by Default) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="type-caption text-[#F59E0B] uppercase">1. Motion & Feel</h3>
          <Badge tone={motionEnabled ? 'gold' : 'neutral'}>
            {motionEnabled ? 'Full Motion (180ms)' : 'Reduced Motion (Default)'}
          </Badge>
        </div>
        <SwitchRow
          checked={motionEnabled}
          onCheckedChange={onChangeMotionEnabled}
          data-testid="toggle-full-motion"
          label="Full Studio Motion"
          description="Reduced motion is on by default. Enable for 180ms physical press transitions and live stage entry motion."
        />
      </div>

      {/* Group 2: Co-Host Persona & Hands-Free Pacing */}
      <div className="space-y-2.5 pt-2 border-t border-white/10">
        <h3 className="type-caption text-[#F59E0B] uppercase">
          2. Co-Host Voice & Auto Trash-Talk
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {(Object.values(COHOST_PERSONAS) as (typeof COHOST_PERSONAS)[CohostPersonaId][]).map(
            (persona) => (
              <Button
                key={persona.id}
                type="button"
                variant="outline"
                active={selectedPersonaId === persona.id}
                onClick={() => onSelectPersona(persona.id)}
                className="w-full justify-between"
              >
                <span className="truncate">{persona.name}</span>
                <span className="font-mono-tabular opacity-80">{persona.voiceName}</span>
              </Button>
            )
          )}
        </div>

        <SwitchRow
          checked={autoTalkEnabled}
          onCheckedChange={() => onToggleAutoTalk()}
          label="Hands-Free Auto Trash-Talk"
          description="Co-host automatically reacts to your screen without push-to-talk."
        />

        <div className="surface-inset p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="type-caption text-[#F5F3FF]">Auto-Roast Cadence</span>
          <div className="flex items-center gap-1.5">
            {[15, 25, 40].map((sec) => (
              <Button
                key={sec}
                type="button"
                variant="outline"
                active={autoTalkIntervalSec === sec}
                onClick={() => onChangeAutoTalkInterval(sec)}
                className="font-mono-tabular px-3"
              >
                {sec}s
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Group 3: Audio Ducking & Voice Soundboard */}
      <div className="space-y-2.5 pt-2 border-t border-white/10">
        <h3 className="type-caption text-[#F59E0B] uppercase">
          3. Stage Audio & Ducking
        </h3>

        <SwitchRow
          checked={voiceSoundboardEnabled}
          onCheckedChange={() => onToggleVoiceSoundboard()}
          label="Voice-Activated Soundboard"
          description="Fire MPC pads hands-free when you say trigger phrases out loud."
        />

        <div className="surface-inset p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="type-caption text-[#F5F3FF]">Voice Ducking Depth</span>
          <div className="flex items-center gap-1.5">
            {[15, 18, 20].map((pct) => (
              <Button
                key={pct}
                type="button"
                variant="outline"
                active={duckReductionPercent === pct}
                onClick={() => onChangeDuckReductionPercent(pct)}
                className="font-mono-tabular px-3"
              >
                -{pct}%
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Group 4: On-Screen Broadcast HUD */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <h3 className="type-caption text-[#F59E0B] uppercase">
          4. On-Screen Broadcast Overlays
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              { key: 'showVisualizer', label: 'Reactive Visualizer' },
              { key: 'showHypeOverlay', label: 'Hype Meter HUD' },
              { key: 'showGameScoreOverlay', label: 'Game Score HUD' },
              { key: 'showSongQueueOverlay', label: 'Song Queue HUD' },
              { key: 'showPinnedChatOverlay', label: 'Chat Spotlight HUD' },
            ] as const
          ).map((item) => (
            <SwitchRow
              key={item.key}
              checked={overlayConfig[item.key]}
              onCheckedChange={() => onToggleOverlayKey(item.key)}
              label={item.label}
            />
          ))}
        </div>
      </div>
    </Sheet>
  );
};
