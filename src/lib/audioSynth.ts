import { AudioDuckingTarget, PadId, computeAudioDuckingTarget } from './streamEngine';

class StageAudioEngine {
  private ctx: AudioContext | null = null;
  private activeLoops: Map<PadId, number> = new Map();
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private readonly baseMasterGain = 0.85;
  private isCohostSpeaking = false;
  private duckReductionPercent = 18;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      const initialTarget = computeAudioDuckingTarget({
        baseGain: this.baseMasterGain,
        isCohostSpeaking: this.isCohostSpeaking,
        reductionPercent: this.duckReductionPercent,
      });
      this.masterGain.gain.value = initialTarget.targetGain;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.75;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Dynamically ducks background beat & synth volume by 15–20% (default 18%)
   * whenever the AI co-host is actively speaking, and smoothly restores gain when done.
   */
  public setVoiceDucking(isSpeaking: boolean, reductionPercent = this.duckReductionPercent): AudioDuckingTarget {
    this.isCohostSpeaking = isSpeaking;
    this.duckReductionPercent = Math.max(15, Math.min(20, Math.round(reductionPercent)));

    const duckTarget = computeAudioDuckingTarget({
      baseGain: this.baseMasterGain,
      isCohostSpeaking: this.isCohostSpeaking,
      reductionPercent: this.duckReductionPercent,
    });

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(
          duckTarget.targetGain,
          now,
          duckTarget.rampTimeConstantSec
        );
      } catch {
        this.masterGain.gain.value = duckTarget.targetGain;
      }
    }

    return duckTarget;
  }

  public getDuckingState(): AudioDuckingTarget {
    return computeAudioDuckingTarget({
      baseGain: this.baseMasterGain,
      isCohostSpeaking: this.isCohostSpeaking,
      reductionPercent: this.duckReductionPercent,
    });
  }

  public getFrequencyBins(count = 16): number[] {
    if (!this.analyser || !this.freqData) {
      return new Array(count).fill(0);
    }
    this.analyser.getByteFrequencyData(this.freqData);
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      out.push(this.freqData[i % this.freqData.length] ?? 0);
    }
    return out;
  }

  public stopAllLoops(): void {
    for (const timer of this.activeLoops.values()) {
      window.clearInterval(timer);
    }
    this.activeLoops.clear();
  }

  public isLoopRunning(padId: PadId): boolean {
    return this.activeLoops.has(padId);
  }

  public triggerPad(padId: PadId, onLoopChange?: () => void): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    if (padId === 'shred_beat' || padId === 'boom_bap') {
      if (this.activeLoops.has(padId)) {
        window.clearInterval(this.activeLoops.get(padId)!);
        this.activeLoops.delete(padId);
        onLoopChange?.();
        return false;
      } else {
        // Stop other beat loops so beats don't clash
        for (const [id, timer] of this.activeLoops.entries()) {
          window.clearInterval(timer);
          this.activeLoops.delete(id);
        }
        this.startBeatLoop(padId, onLoopChange);
        onLoopChange?.();
        return true;
      }
    }

    switch (padId) {
      case 'drop_it':
        this.play808Drop(ctx, this.masterGain);
        break;
      case 'air_horn':
        this.playAirHorn(ctx, this.masterGain);
        break;
      case 'laser_hype':
        this.playPlasmaRiser(ctx, this.masterGain);
        break;
      case 'crowd_roar':
        this.playCrowdRoar(ctx, this.masterGain);
        break;
      case 'rimshot_roast':
        this.playRimshotRoast(ctx, this.masterGain);
        break;
      case 'victory_fanfare':
        this.playVictoryFanfare(ctx, this.masterGain);
        break;
    }
    return true;
  }

  private startBeatLoop(padId: 'shred_beat' | 'boom_bap', onLoopChange?: () => void) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const bpm = padId === 'shred_beat' ? 140 : 92;
    const stepMs = (60 / bpm / 4) * 1000; // 16th note steps
    let step = 0;
    const maxSteps = 64; // 4 bars auto-complete or toggleable

    const tick = () => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      if (padId === 'shred_beat') {
        // 140 BPM Trap pattern
        if (step % 16 === 0 || step % 16 === 6 || step % 16 === 10) {
          this.playKick(this.ctx, this.masterGain, now, 130, 34, 0.35);
        }
        if (step % 16 === 4 || step % 16 === 12) {
          this.playSnare(this.ctx, this.masterGain, now, 0.18);
        }
        // Trap hi-hat rolls on steps
        if (step % 2 === 0 || step % 16 === 13 || step % 16 === 15) {
          this.playHiHat(this.ctx, this.masterGain, now, step % 4 === 0 ? 0.06 : 0.03);
        }
      } else {
        // 92 BPM Gold Boom Bap pattern
        if (step % 16 === 0 || step % 16 === 3 || step % 16 === 8 || step % 16 === 11) {
          this.playKick(this.ctx, this.masterGain, now, 110, 42, 0.25);
        }
        if (step % 16 === 4 || step % 16 === 12) {
          this.playSnare(this.ctx, this.masterGain, now, 0.22);
        }
        if (step % 2 === 0) {
          this.playHiHat(this.ctx, this.masterGain, now, 0.05);
        }
      }

      step++;
      if (step >= maxSteps) {
        if (this.activeLoops.has(padId)) {
          window.clearInterval(this.activeLoops.get(padId)!);
          this.activeLoops.delete(padId);
          onLoopChange?.();
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, stepMs);
    this.activeLoops.set(padId, timer);
  }

  private play808Drop(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    sub.type = 'triangle';

    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(24, now + 1.1);

    sub.frequency.setValueAtTime(70, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.1);

    gain.gain.setValueAtTime(0.95, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(dest);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 1.2);
    sub.stop(now + 1.2);
  }

  private playAirHorn(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const bursts = [
      { start: 0, dur: 0.14 },
      { start: 0.17, dur: 0.14 },
      { start: 0.34, dur: 0.48 },
    ];
    const freqs = [392, 493.88, 587.33]; // G4, B4, D5 stadium horn cluster

    for (const b of bursts) {
      for (const f of freqs) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.96, now + b.start);
        osc.frequency.linearRampToValueAtTime(f, now + b.start + 0.04);

        gain.gain.setValueAtTime(0.18, now + b.start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + b.start + b.dur);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + b.start);
        osc.stop(now + b.start + b.dur + 0.02);
      }
    }
  }

  private playPlasmaRiser(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.55);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.75);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  private playCrowdRoar(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.45);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
    noise.stop(now + 0.9);
  }

  private playRimshotRoast(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    // Ba-dum-tss
    this.playKick(ctx, dest, now, 150, 65, 0.14);
    this.playSnare(ctx, dest, now + 0.16, 0.18);
    this.playHiHat(ctx, dest, now + 0.34, 0.35);
  }

  private playVictoryFanfare(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.11;
      const dur = idx === notes.length - 1 ? 0.45 : 0.12;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.008, start + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  private playKick(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    startFreq: number,
    endFreq: number,
    duration: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playSnare(ctx: AudioContext, dest: AudioNode, time: number, duration: number) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(750, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + duration);
  }

  private playHiHat(ctx: AudioContext, dest: AudioNode, time: number, duration: number) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + duration);
  }
}

export const stageAudio = new StageAudioEngine();
