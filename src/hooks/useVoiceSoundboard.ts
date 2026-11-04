import { useCallback, useEffect, useRef, useState } from 'react';
import { PadId, VoiceTriggerMatch, matchVoiceCommandToPad } from '../lib/streamEngine';

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export interface VoiceSoundboardEvent {
  id: string;
  phrase: string;
  spokenTranscript: string;
  padId: PadId | 'stop_all';
  padLabel: string;
  timestamp: number;
}

interface UseVoiceSoundboardOptions {
  enabled: boolean;
  customTriggers: Partial<Record<PadId, string>>;
  streamerLiveTranscript: string;
  onFirePad: (padId: PadId) => void;
  onStopAllAudio: () => void;
}

export function useVoiceSoundboard({
  enabled,
  customTriggers,
  streamerLiveTranscript,
  onFirePad,
  onStopAllAudio,
}: UseVoiceSoundboardOptions) {
  const [isListeningSpeechApi, setIsListeningSpeechApi] = useState(false);
  const [lastHeardSpeech, setLastHeardSpeech] = useState<string>('');
  const [lastVoiceEvent, setLastVoiceEvent] = useState<VoiceSoundboardEvent | null>(null);

  const lastTriggerTimeRef = useRef<number>(0);
  const lastMatchedTranscriptRef = useRef<string>('');
  const customTriggersRef = useRef(customTriggers);
  const onFirePadRef = useRef(onFirePad);
  const onStopAllAudioRef = useRef(onStopAllAudio);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    customTriggersRef.current = customTriggers;
  }, [customTriggers]);

  useEffect(() => {
    onFirePadRef.current = onFirePad;
  }, [onFirePad]);

  useEffect(() => {
    onStopAllAudioRef.current = onStopAllAudio;
  }, [onStopAllAudio]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const evaluateSpokenPhrase = useCallback(
    (spokenText: string, forceImmediate = false): VoiceTriggerMatch => {
      const clean = spokenText.trim();
      if (!clean) {
        return { matchedPadId: null, matchedPhrase: null, padLabel: null };
      }

      setLastHeardSpeech(clean);
      const match = matchVoiceCommandToPad(clean, customTriggersRef.current);

      if (match.matchedPadId && match.matchedPhrase && match.padLabel) {
        const now = Date.now();
        // Prevent duplicate rapid triggers on interim speech transcripts within 1.4s
        if (
          !forceImmediate &&
          now - lastTriggerTimeRef.current < 1400 &&
          lastMatchedTranscriptRef.current === match.matchedPhrase
        ) {
          return match;
        }

        lastTriggerTimeRef.current = now;
        lastMatchedTranscriptRef.current = match.matchedPhrase;

        if (match.matchedPadId === 'stop_all') {
          onStopAllAudioRef.current();
        } else {
          onFirePadRef.current(match.matchedPadId);
        }

        setLastVoiceEvent({
          id: `voice-${now}`,
          phrase: match.matchedPhrase,
          spokenTranscript: clean,
          padId: match.matchedPadId,
          padLabel: match.padLabel,
          timestamp: now,
        });
      }

      return match;
    },
    []
  );

  // Also watch incoming streamerLiveTranscript from Gemini Live WebSocket
  useEffect(() => {
    if (!enabled || !streamerLiveTranscript.trim()) return;
    evaluateSpokenPhrase(streamerLiveTranscript, false);
  }, [enabled, evaluateSpokenPhrase, streamerLiveTranscript]);

  // Browser Web Speech API continuous voice trigger listener
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setIsListeningSpeechApi(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsListeningSpeechApi(false);
      return;
    }

    let recognition: SpeechRecognitionInstance | null = null;
    let isUnmounted = false;

    try {
      recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i]?.[0]?.transcript;
          if (transcript) {
            evaluateSpokenPhrase(transcript, false);
          }
        }
      };

      recognition.onerror = () => {
        // Silently handle mic contention or headless browser speech API limitations
      };

      recognition.onend = () => {
        if (!isUnmounted && enabledRef.current && recognition) {
          try {
            recognition.start();
          } catch {
            // ignore restart contention
          }
        }
      };

      recognition.start();
      setIsListeningSpeechApi(true);
    } catch {
      setIsListeningSpeechApi(false);
    }

    return () => {
      isUnmounted = true;
      setIsListeningSpeechApi(false);
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, evaluateSpokenPhrase]);

  return {
    isListeningSpeechApi,
    lastHeardSpeech,
    lastVoiceEvent,
    triggerSimulatedVoiceCommand: (phrase: string) => evaluateSpokenPhrase(phrase, true),
  };
}
