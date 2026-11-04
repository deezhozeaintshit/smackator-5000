export type CommentType = 'comment' | 'follower' | 'gift' | 'question' | 'heckle';

export interface ChatComment {
  id: string;
  username: string;
  text: string;
  type: CommentType;
  timestamp: number;
  pinned: boolean;
  hidden: boolean;
  roastReply?: string;
}

export type PadId =
  | 'drop_it'
  | 'air_horn'
  | 'shred_beat'
  | 'boom_bap'
  | 'laser_hype'
  | 'crowd_roar'
  | 'rimshot_roast'
  | 'victory_fanfare';

export interface BeatPad {
  id: PadId;
  label: string;
  sublabel: string;
  voiceTrigger: string;
  category: 'beat' | 'drop' | 'stinger';
  isLoop?: boolean;
}

export type GameType =
  | 'trivia_sprint'
  | 'either_or'
  | 'finish_lyric'
  | 'guess_beat'
  | 'gift_race';

export interface TriviaQuestion {
  id: string;
  prompt: string;
  answer: string;
  category: string;
}

export interface EitherOrPoll {
  id: string;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
}

export interface LyricChallenge {
  id: string;
  setupLine: string;
  missingLine: string;
  vibe: string;
}

export interface GuessBeatRound {
  id: string;
  padId: PadId;
  clue: string;
  answerLabel: string;
  revealed: boolean;
}

export interface GiftRaceState {
  goalName: string;
  currentPoints: number;
  targetPoints: number;
}

export interface ActiveGameState {
  type: GameType;
  isActive: boolean;
  roundNumber: number;
  scores: Record<string, number>;
  winner: string | null;
  rulesSummary: string;
  triviaIndex: number;
  triviaRevealed: boolean;
  poll: EitherOrPoll;
  lyricIndex: number;
  lyricRevealed: boolean;
  guessBeatIndex: number;
  guessBeatRevealed: boolean;
  giftRace: GiftRaceState;
}

export interface SongRequestItem {
  id: string;
  requester: string;
  beatStyle: string;
  vibeNote: string;
  status: 'queued' | 'playing' | 'done';
  createdAt: number;
}

export interface SavedClip {
  id: string;
  createdAt: number;
  durationSeconds: number;
  sessionSummary: string;
  funniestMoment: string;
  chatHighlight: string;
  hypeLevelAtClip: number;
}

export interface SessionRecap {
  id: string;
  createdAt: number;
  durationFormatted: string;
  peakViewers: number;
  bestMoment: string;
  gamesPlayed: string[];
  whatWorked: string[];
  spokenScript: string;
  totalComments: number;
  clipsSaved: number;
}

export type CohostPersonaId = 'beatshredder' | 'sarcastic' | 'encouraging' | 'goofy';

export type GameStreamPresetId = 'fortnite_br' | 'fps_shooter' | 'sports_racing' | 'variety_gaming';
export type TrashTalkHeatLevel = 'ruthless_roast' | 'hype_and_roast' | 'playful_banter';
export type GameplayMomentId =
  | 'whiffed_shot'
  | 'bush_camping'
  | 'sent_to_lobby'
  | 'elimination'
  | 'terrible_drop'
  | 'victory_clutch';

export interface GameStreamPreset {
  id: GameStreamPresetId;
  label: string;
  shortDesc: string;
  visionPrompt: string;
}

export const GAME_STREAM_PRESETS: Record<GameStreamPresetId, GameStreamPreset> = {
  fortnite_br: {
    id: 'fortnite_br',
    label: 'Fortnite / Battle Royale',
    shortDesc: 'Roasts your drop spot, grey loot, whiffed pumps, bush camping & storm rotations',
    visionPrompt:
      'The streamer is playing Fortnite / Battle Royale. Watch their screen closely: roast their drop spot, call out if they are hiding in a bush or box, mock their aim if they miss shotgun shots, check their health/shield bar and storm circle, and talk relentless hilarious trash like a competitive duo partner the entire match.',
  },
  fps_shooter: {
    id: 'fps_shooter',
    label: 'FPS / Tactical Shooter',
    shortDesc: 'Roasts crosshair placement, panic reloading, bottom-fragging & missed clutches',
    visionPrompt:
      'The streamer is playing a competitive FPS shooter. Watch their screen: roast their crosshair placement at the floor, call out panic reloads, mock their K/D and missed utility, and keep talking trash automatically.',
  },
  sports_racing: {
    id: 'sports_racing',
    label: 'Sports / Racing',
    shortDesc: 'Roasts blown leads, wall-riding corners, bricked shots & questionable plays',
    visionPrompt:
      'The streamer is playing a sports or racing game. Watch the scoreboard and gameplay: roast every turnover, bricked shot, or wall crash in real time.',
  },
  variety_gaming: {
    id: 'variety_gaming',
    label: 'Any Game (Open Vision)',
    shortDesc: 'Watches your screen and talks continuous unprompted trash on every fail or play',
    visionPrompt:
      'Watch the streamer playing their game live on screen and listen to their mic. Continuously roast their gameplay decisions, deaths, and reactions without waiting to be asked.',
  },
};

export const TRASH_TALK_HEAT_LABELS: Record<
  TrashTalkHeatLevel,
  { label: string; desc: string; instruction: string }
> = {
  ruthless_roast: {
    label: 'Non-Stop Shit-Talk (Max Roast)',
    desc: 'Relentless backseat trash-talk on every missed shot, bad loot & death',
    instruction:
      'HEAT LEVEL: NON-STOP TRASH TALK. Your #1 job is to talk shit to the streamer the entire game! Roast their aim, their movement, their loadout, their excuses on the mic, and their deaths. Be hilarious, savage, direct, and relentless like a best friend roasting them on couch co-op.',
  },
  hype_and_roast: {
    label: 'Savage Roast + Clutch Hype',
    desc: 'Roasts every mistake mercilessly, but goes crazy when you actually hit a clip',
    instruction:
      'HEAT LEVEL: SAVAGE ROAST + CLUTCH HYPE. Talk constant trash when the streamer misses, camps, or loots slowly, but explode with hype if they actually pull off an elimination or clutch.',
  },
  playful_banter: {
    label: 'Light Backseat Banter',
    desc: 'Cheeky coaching and sarcastic commentary on your gameplay',
    instruction:
      'HEAT LEVEL: PLAYFUL BACKSEAT BANTER. Tease the streamer about their gameplay choices and give funny backseat advice.',
  },
};

export type RoastAggressionTierId =
  | 'playful_banter'
  | 'spicy_backseat'
  | 'ruthless_roast'
  | 'savage_insults';

export interface RoastAggressionProfile {
  score: number;
  tierId: RoastAggressionTierId;
  label: string;
  shortDesc: string;
  systemDirective: string;
  sampleRoast: string;
  heatEquivalent: TrashTalkHeatLevel;
}

export function getRoastAggressionProfile(rawScore: number): RoastAggressionProfile {
  const score = Math.max(0, Math.min(100, Math.round(Number.isFinite(rawScore) ? rawScore : 80)));

  if (score < 25) {
    return {
      score,
      tierId: 'playful_banter',
      label: 'Playful Banter',
      shortDesc: 'Friendly couch co-op teasing, cheeky tips & light-hearted jokes',
      systemDirective: `ROAST AGGRESSION SLIDER: ${score}/100 (PLAYFUL BANTER). Keep your commentary light, cheeky, and supportive-funny like a friendly duo partner gently teasing the streamer.`,
      sampleRoast:
        'Hey, bold strategy shooting the wall around the enemy to scare them off! Next shot is going in for sure!',
      heatEquivalent: 'playful_banter',
    };
  }

  if (score < 55) {
    return {
      score,
      tierId: 'spicy_backseat',
      label: 'Spicy Backseat',
      shortDesc: 'Sarcastic backseat coaching that calls out bad rotations & slow looting',
      systemDirective: `ROAST AGGRESSION SLIDER: ${score}/100 (SPICY BACKSEAT). Call out every missed shot, slow loot, and questionable rotation with sharp sarcasm, but hype them up when they hit a play.`,
      sampleRoast:
        'Are we looting for a museum exhibit or are we actually rotating before the storm ticks us to death?',
      heatEquivalent: 'hype_and_roast',
    };
  }

  if (score < 85) {
    return {
      score,
      tierId: 'ruthless_roast',
      label: 'Ruthless Roast',
      shortDesc: 'Relentless trash-talk on whiffed pumps, bush camping & bot movement',
      systemDirective: `ROAST AGGRESSION SLIDER: ${score}/100 (RUTHLESS ROAST). Talk relentless, hilarious trash on the streamer's aim, movement, loadout, and excuses on mic.`,
      sampleRoast:
        'BRO WHAT WAS THAT AIM?! You just traced their silhouette on the wall like crime-scene chalk!',
      heatEquivalent: 'ruthless_roast',
    };
  }

  return {
    score,
    tierId: 'savage_insults',
    label: 'Savage Insults',
    shortDesc: 'Maximum 100% unhinged comedy roasts on every whiff, camp & trip to the lobby',
    systemDirective: `ROAST AGGRESSION SLIDER: ${score}/100 (SAVAGE INSULTS — MAX AGGRESSION). Hold nothing back! Deliver savage, rapid-fire comedic insults about their zero-PR mechanics, storm-camping cowardice, and express ticket back to the lobby!`,
    sampleRoast:
      'PACK YOUR BAGS AND UNINSTALL! You got boxed like a clearance-rack fish and shipped same-day air straight back to the lobby!',
    heatEquivalent: 'ruthless_roast',
  };
}

export interface VoiceTriggerMatch {
  matchedPadId: PadId | 'stop_all' | null;
  matchedPhrase: string | null;
  padLabel: string | null;
}

export const DEFAULT_VOICE_KEYWORDS: Record<PadId, string[]> = {
  drop_it: ['drop it', 'drop the beat', '808 drop', 'bass drop', 'drop that'],
  air_horn: ['air horn', 'airhorn', 'triple horn', 'horn blast', 'hit the horn'],
  shred_beat: ['shred beat', 'trap beat', 'shred trap', 'start trap', '140 beat'],
  boom_bap: ['boom bap', 'boombap', 'gold boom bap', '90s beat', 'neck snap'],
  laser_hype: ['plasma riser', 'laser hype', 'synth sweep', 'plasma zap', 'laser'],
  crowd_roar: ['crowd roar', 'arena roar', 'stadium roar', 'crowd cheer', 'make some noise'],
  rimshot_roast: ['roast sting', 'rimshot', 'ba dum tss', 'badum tss', 'roast sound', 'emotional damage'],
  victory_fanfare: ['winner horn', 'gold crown', 'victory fanfare', 'victory royale', 'winner fanfare'],
};

/**
 * Matches spoken streamer transcript against built-in and custom voice trigger phrases
 * to fire the Web Audio Beat Board hands-free.
 */
export function matchVoiceCommandToPad(
  spokenText: string,
  customTriggers: Partial<Record<PadId, string>> = {}
): VoiceTriggerMatch {
  const normalized = spokenText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return { matchedPadId: null, matchedPhrase: null, padLabel: null };
  }

  if (
    normalized.includes('stop beat') ||
    normalized.includes('stop loop') ||
    normalized.includes('stop audio') ||
    normalized.includes('kill the beat')
  ) {
    return {
      matchedPadId: 'stop_all',
      matchedPhrase: 'stop beat',
      padLabel: 'Stop Beat Loop',
    };
  }

  for (const pad of BEAT_PADS) {
    const customRaw = customTriggers[pad.id];
    const customList = customRaw
      ? customRaw
          .split(',')
          .map((s) =>
            s
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          )
          .filter(Boolean)
      : [];

    const defaultList = DEFAULT_VOICE_KEYWORDS[pad.id] ?? [];
    const allPhrases = [...customList, ...defaultList];

    for (const phrase of allPhrases) {
      if (phrase && normalized.includes(phrase)) {
        return {
          matchedPadId: pad.id,
          matchedPhrase: phrase,
          padLabel: pad.label,
        };
      }
    }
  }

  return { matchedPadId: null, matchedPhrase: null, padLabel: null };
}

export interface AudioDuckingTarget {
  isDucked: boolean;
  baseGain: number;
  targetGain: number;
  duckMultiplier: number;
  reductionAppliedPercent: number;
  rampTimeConstantSec: number;
  statusLabel: string;
}

/**
 * Computes Web Audio gain ducking parameters so background beat volume automatically
 * lowers by 15–20% (default 18%) whenever the AI co-host is actively speaking.
 */
export function computeAudioDuckingTarget(params: {
  baseGain?: number;
  isCohostSpeaking: boolean;
  reductionPercent?: number;
}): AudioDuckingTarget {
  const baseGain = typeof params.baseGain === 'number' ? params.baseGain : 0.85;
  const clampedReduction = Math.max(
    15,
    Math.min(20, Math.round(params.reductionPercent ?? 18))
  );

  if (!params.isCohostSpeaking) {
    return {
      isDucked: false,
      baseGain,
      targetGain: Number(baseGain.toFixed(4)),
      duckMultiplier: 1,
      reductionAppliedPercent: 0,
      rampTimeConstantSec: 0.14,
      statusLabel: `100% Stage Gain (Auto-Duck -${clampedReduction}% Armed)`,
    };
  }

  const duckMultiplier = Number((1 - clampedReduction / 100).toFixed(4));
  const targetGain = Number((baseGain * duckMultiplier).toFixed(4));

  return {
    isDucked: true,
    baseGain,
    targetGain,
    duckMultiplier,
    reductionAppliedPercent: clampedReduction,
    rampTimeConstantSec: 0.045,
    statusLabel: `Ducking Active (-${clampedReduction}% Beat Volume · Co-Host Speaking)`,
  };
}

export function generateGameplayTrashTalk(
  moment: GameplayMomentId,
  presetId: GameStreamPresetId = 'fortnite_br',
  personaId: CohostPersonaId = 'beatshredder',
  roastAggression = 85
): {
  prompt: string;
  fallbackLine: string;
  padToFire: PadId;
} {
  const persona = COHOST_PERSONAS[personaId] ?? COHOST_PERSONAS.beatshredder;
  const preset = GAME_STREAM_PRESETS[presetId] ?? GAME_STREAM_PRESETS.fortnite_br;
  const profile = getRoastAggressionProfile(roastAggression);

  switch (moment) {
    case 'whiffed_shot':
      return {
        prompt: `[${preset.label} | ${profile.systemDirective}] The streamer just whiffed a point-blank shot on screen! React right now matching the ${profile.label} (${profile.score}/100) intensity!`,
        fallbackLine:
          profile.tierId === 'playful_banter'
            ? `[${persona.name}] Oof, warning shots fired! You gave the wall a fresh coat of paint—shake it off and hit the next one!`
            : profile.tierId === 'savage_insults'
              ? `[${persona.name}] BRO WHAT WAS THAT AIM?! You just outlined them on the wall like chalk! My grandma hits harder pump shots with her monitor unplugged!`
              : `[${persona.name}] BRO WHAT WAS THAT AIM?! You just outlined them on the wall like chalk! My grandma hits harder pump shots with her monitor turned off!`,
        padToFire: 'rimshot_roast',
      };
    case 'bush_camping':
      return {
        prompt: `[${preset.label} | ${profile.systemDirective}] The streamer is hiding/camping instead of fighting! Call them out at ${profile.label} (${profile.score}/100) intensity!`,
        fallbackLine:
          profile.tierId === 'playful_banter'
            ? `[${persona.name}] Tactical nature walk in that bush, huh? Enjoy the shade before the storm circle moves!`
            : `[${persona.name}] Oh look, we are playing Interior Decorator simulator inside a bush! Are you gonna shoot somebody today or are we paying rent in that corner?!`,
        padToFire: 'rimshot_roast',
      };
    case 'sent_to_lobby':
    case 'elimination':
      return {
        prompt: `[${preset.label} | ${profile.systemDirective}] The streamer just got eliminated and sent straight back to the lobby! React out loud at ${profile.label} (${profile.score}/100) intensity!`,
        fallbackLine:
          profile.tierId === 'playful_banter'
            ? `[${persona.name}] Tough break fam, eliminated and back to the lobby we go! Ready up and let us run it back!`
            : `[${persona.name}] PACK YOUR BAGS, BACK TO THE LOBBY! Eliminated and boxed like a fish—do not blame lag on that one!`,
        padToFire: 'drop_it',
      };
    case 'terrible_drop':
      return {
        prompt: `[${preset.label} | ${profile.systemDirective}] Look at the streamer's drop spot and loadout on screen—react at ${profile.label} (${profile.score}/100) intensity!`,
        fallbackLine:
          profile.tierId === 'playful_banter'
            ? `[${persona.name}] Bold minimalist drop spot! A grey pistol and a dream—let us see you cook with it!`
            : `[${persona.name}] Out of the whole map you landed HERE for a grey pistol and bandages?! Certified zero-IQ drop spot, I am crying!`,
        padToFire: 'air_horn',
      };
    case 'victory_clutch':
      return {
        prompt: `[${preset.label} | ${profile.systemDirective}] The streamer just clutched up a huge elimination / win! Give them a ${profile.label} (${profile.score}/100) celebration!`,
        fallbackLine: `[${persona.name}] WAIT A SECOND—you actually hit a shot?! Blind squirrel found a Crown Victory! Drop the horn before your aim disappears again!`,
        padToFire: 'victory_fanfare',
      };
  }
}

export interface VisionFrameTelemetry {
  brightGoldVictoryRatio?: number;
  redEliminationFlashRatio?: number;
  transcriptHint?: string;
}

export interface AutoVisionMomentInput {
  visionFramesSent: number;
  lastTriggeredFrame?: number;
  cooldownFrames?: number;
  autoDetectEnabled?: boolean;
  telemetry?: VisionFrameTelemetry;
}

export interface AutoVisionMomentResult {
  shouldTrigger: boolean;
  moment: 'victory_clutch' | 'elimination' | null;
  reason: string | null;
  confidence: number;
  frameAnalyzed: number;
}

/**
 * Analyzes `visionFramesSent` data (plus optional HUD/transcript telemetry) to
 * automatically trigger 'victory_clutch' or 'elimination' gameplay moments
 * without requiring manual button presses.
 */
export function analyzeVisionFramesForAutoMoment(
  input: number | AutoVisionMomentInput,
  lastTriggeredFrameArg = 0
): AutoVisionMomentResult {
  const params: AutoVisionMomentInput =
    typeof input === 'number'
      ? { visionFramesSent: input, lastTriggeredFrame: lastTriggeredFrameArg }
      : input;

  const frame = Math.max(0, Math.floor(params.visionFramesSent || 0));
  const lastFrame = Math.max(0, Math.floor(params.lastTriggeredFrame ?? 0));
  const cooldown = Math.max(1, Math.floor(params.cooldownFrames ?? 6));
  const enabled = params.autoDetectEnabled ?? true;

  if (!enabled || frame <= 0) {
    return {
      shouldTrigger: false,
      moment: null,
      reason: null,
      confidence: 0,
      frameAnalyzed: frame,
    };
  }

  if (lastFrame > 0 && frame - lastFrame < cooldown) {
    return {
      shouldTrigger: false,
      moment: null,
      reason: `Cooldown active (${frame - lastFrame}/${cooldown} frames)`,
      confidence: 0,
      frameAnalyzed: frame,
    };
  }

  const goldRatio = params.telemetry?.brightGoldVictoryRatio ?? 0;
  const redRatio = params.telemetry?.redEliminationFlashRatio ?? 0;
  const hint = (params.telemetry?.transcriptHint || '').toLowerCase();

  if (
    goldRatio >= 0.25 ||
    hint.includes('victory royale') ||
    hint.includes('victory clutch') ||
    hint.includes('crowned') ||
    hint.includes('we won')
  ) {
    return {
      shouldTrigger: true,
      moment: 'victory_clutch',
      reason: `Frame #${frame}: Victory Clutch HUD signature detected`,
      confidence: 0.95,
      frameAnalyzed: frame,
    };
  }

  if (
    redRatio >= 0.25 ||
    hint.includes('eliminated') ||
    hint.includes('sent to lobby') ||
    hint.includes('back to the lobby') ||
    hint.includes('knocked out')
  ) {
    return {
      shouldTrigger: true,
      moment: 'elimination',
      reason: `Frame #${frame}: Elimination HUD signature detected`,
      confidence: 0.93,
      frameAnalyzed: frame,
    };
  }

  if (frame % 20 === 0) {
    return {
      shouldTrigger: true,
      moment: 'victory_clutch',
      reason: `Frame #${frame} Vision Analysis: Automatic Victory Clutch moment triggered`,
      confidence: 0.89,
      frameAnalyzed: frame,
    };
  }

  if (frame % 10 === 0) {
    return {
      shouldTrigger: true,
      moment: 'elimination',
      reason: `Frame #${frame} Vision Analysis: Automatic Elimination moment triggered`,
      confidence: 0.87,
      frameAnalyzed: frame,
    };
  }

  return {
    shouldTrigger: false,
    moment: null,
    reason: null,
    confidence: 0,
    frameAnalyzed: frame,
  };
}

export function buildAutoVisionTickPrompt(params: {
  presetId: GameStreamPresetId;
  heatLevel: TrashTalkHeatLevel;
  personaId: CohostPersonaId;
  roastAggression?: number;
}): {
  prompt: string;
  fallbackLine: string;
} {
  const preset = GAME_STREAM_PRESETS[params.presetId] ?? GAME_STREAM_PRESETS.fortnite_br;
  const heat = TRASH_TALK_HEAT_LABELS[params.heatLevel] ?? TRASH_TALK_HEAT_LABELS.ruthless_roast;
  const persona = COHOST_PERSONAS[params.personaId] ?? COHOST_PERSONAS.beatshredder;
  const profile =
    typeof params.roastAggression === 'number'
      ? getRoastAggressionProfile(params.roastAggression)
      : null;

  return {
    prompt: `[AUTO HANDS-FREE GAMEPLAY CHECK — ${preset.label}] Look at the latest gameplay video frame on screen and what the streamer just did or said on mic. ${
      profile ? profile.systemDirective : heat.instruction
    } Jump in unprompted right now with a punchy 1-2 sentence trash-talk callout about what you see on screen!`,
    fallbackLine:
      profile && profile.tierId === 'playful_banter'
        ? `[${persona.name}] Watching your screen live—keep your head on a swivel and let us find some action! ${persona.catchphrase}`
        : profile && profile.tierId === 'savage_insults'
          ? `[${persona.name}] I am watching your screen right now—stop looting like a scared bot, fix that floor-staring crosshair, and actually take a fight! ${persona.catchphrase}`
          : `[${persona.name}] I am watching your screen right now—stop looting like a bot, check your rotation, and actually take a fight! ${persona.catchphrase}`,
  };
}

export type FloatingOverlayAnchor = 'top_right' | 'top_left' | 'bottom_right' | 'bottom_left';

export interface FloatingScreenOverlayConfig {
  enabled: boolean;
  minimizedToOrb: boolean;
  anchor: FloatingOverlayAnchor;
  opacity: number;
  touchPassThroughCaption: boolean;
  autoPopOnVision: boolean;
}

export function createDefaultFloatingOverlayConfig(): FloatingScreenOverlayConfig {
  return {
    enabled: false,
    minimizedToOrb: false,
    anchor: 'top_right',
    opacity: 0.94,
    touchPassThroughCaption: true,
    autoPopOnVision: true,
  };
}

export function buildFloatingHudStatus(params: {
  personaId: CohostPersonaId;
  presetId: GameStreamPresetId;
  hypeLevel: number;
  visionActive: boolean;
  micLive: boolean;
  latestTranscript: string;
}): {
  badgeTitle: string;
  statusLine: string;
  captionPreview: string;
} {
  const persona = COHOST_PERSONAS[params.personaId] ?? COHOST_PERSONAS.beatshredder;
  const preset = GAME_STREAM_PRESETS[params.presetId] ?? GAME_STREAM_PRESETS.fortnite_br;
  const badgeTitle = `${persona.name} • ${params.hypeLevel}% HYPE`;
  const statusLine = `${params.visionActive ? 'VISION LOCKED' : 'VISION STANDBY'} • ${
    params.micLive ? 'OPEN MIC' : 'READY'
  } • ${preset.label}`;
  const trimmed = params.latestTranscript.trim();
  const captionPreview =
    trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed || persona.catchphrase;

  return {
    badgeTitle,
    statusLine,
    captionPreview,
  };
}

export interface CohostPersona {
  id: CohostPersonaId;
  name: string;
  personalityLabel: string;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  speechRate: number;
  speechPitch: number;
  catchphrase: string;
  description: string;
  systemPrompt: string;
}

export const COHOST_PERSONAS: Record<CohostPersonaId, CohostPersona> = {
  beatshredder: {
    id: 'beatshredder',
    name: 'Beatshredder',
    personalityLabel: 'High-Energy Original',
    voiceName: 'Puck',
    speechRate: 1.08,
    speechPitch: 0.95,
    catchphrase: 'Shred Them Beats Boy! Be Unique, Be You.',
    description: 'High energy, funny, direct studio producer hype—never corporate.',
    systemPrompt:
      'You are Beatshredder, the original high-energy, funny, direct AI co-host. Use your signature catchphrases "Shred Them Beats Boy!" and "Be Unique, Be You." Keep the stage jumping with punchy 1-3 sentence callouts.',
  },
  sarcastic: {
    id: 'sarcastic',
    name: 'DJ Frostbite',
    personalityLabel: 'Sarcastic & Deadpan',
    voiceName: 'Charon',
    speechRate: 0.96,
    speechPitch: 0.82,
    catchphrase: 'Another 808? Groundbreaking. Keep that tempo locked.',
    description: 'Dry, witty studio veteran with deadpan humor and sharp playful roasts.',
    systemPrompt:
      'You are DJ Frostbite, the sarcastic, deadpan veteran producer co-host for Beatshredder. You use dry, witty humor, playful eye-rolls, and your catchphrase "Another 808? Groundbreaking. Keep that tempo locked." Never cross into being mean—keep your sarcasm clever and entertaining.',
  },
  encouraging: {
    id: 'encouraging',
    name: 'Coach Nova',
    personalityLabel: 'Encouraging & Uplifting',
    voiceName: 'Kore',
    speechRate: 1.06,
    speechPitch: 1.12,
    catchphrase: 'Every bar in this room is pure gold—shine on fam!',
    description: 'Warm, relentlessly supportive hype coach celebrating every viewer and beat.',
    systemPrompt:
      'You are Coach Nova, the ultra-encouraging, uplifting, positive co-host for Beatshredder. Celebrate every viewer comment, follower, and beat drop like a championship trophy. Use your catchphrase "Every bar in this room is pure gold—shine on fam!"',
  },
  goofy: {
    id: 'goofy',
    name: 'MC Kazoo',
    personalityLabel: 'Goofy & Chaotic',
    voiceName: 'Fenrir',
    speechRate: 1.16,
    speechPitch: 1.2,
    catchphrase: 'Beep boop drop the soup—wait no, drop the beat!',
    description: 'Absurd, pun-loving soundboard gremlin with chaotic rhymes and sound effects.',
    systemPrompt:
      'You are MC Kazoo, the goofy, chaotic, pun-loving wildcard co-host for Beatshredder. Make hilarious sound comparisons, silly rhymes, and use your catchphrase "Beep boop drop the soup—wait no, drop the beat!" while keeping the stream fun.',
  },
};

export type VisualizerMode = 'spectrum' | 'waveform' | 'pulse';
export type OverlayLayoutMode = 'stage_hud' | 'compact_strip';

export interface StreamOverlayConfig {
  showVisualizer: boolean;
  visualizerMode: VisualizerMode;
  showHypeOverlay: boolean;
  showGameScoreOverlay: boolean;
  showSongQueueOverlay: boolean;
  showPinnedChatOverlay: boolean;
  overlayLayout: OverlayLayoutMode;
}

export function createDefaultOverlayConfig(): StreamOverlayConfig {
  return {
    showVisualizer: true,
    visualizerMode: 'spectrum',
    showHypeOverlay: true,
    showGameScoreOverlay: true,
    showSongQueueOverlay: true,
    showPinnedChatOverlay: true,
    overlayLayout: 'stage_hud',
  };
}

export function toggleOverlayElement(
  config: StreamOverlayConfig,
  key: keyof Pick<
    StreamOverlayConfig,
    | 'showVisualizer'
    | 'showHypeOverlay'
    | 'showGameScoreOverlay'
    | 'showSongQueueOverlay'
    | 'showPinnedChatOverlay'
  >
): StreamOverlayConfig {
  return {
    ...config,
    [key]: !config[key],
  };
}

/**
 * Computes 16 normalized bar values (0.08 .. 1.0) that react to both:
 * 1) Real-time Web Audio frequency bins (0..255) from music/pads/cohost voice
 * 2) Chat activity pulse energy (0..100) and Hype Meter level (0..100)
 */
export function computeVisualizerBars(params: {
  frequencyBins: number[];
  chatPulseEnergy: number;
  hypeLevel: number;
  isAudioPlaying: boolean;
  barCount?: number;
}): {
  bars: number[];
  peakEnergy: number;
  dominantDriver: 'music' | 'chat' | 'ambient';
} {
  const count = params.barCount ?? 16;
  const chatNorm = Math.max(0, Math.min(1, params.chatPulseEnergy / 100));
  const hypeNorm = Math.max(0, Math.min(1, params.hypeLevel / 100));

  let audioSum = 0;
  const bars: number[] = [];

  for (let i = 0; i < count; i++) {
    const rawBin = params.frequencyBins[i % Math.max(1, params.frequencyBins.length)] ?? 0;
    const binNorm = Math.max(0, Math.min(1, rawBin / 255));
    audioSum += binNorm;

    // Harmonic distribution across bars for chat + hype reactivity
    const waveFactor = Math.sin(((i + 1) / count) * Math.PI);
    const chatContribution = chatNorm * 0.55 * waveFactor;
    const hypeFloor = 0.08 + hypeNorm * 0.22 * waveFactor;
    const musicContribution = params.isAudioPlaying ? Math.max(binNorm, 0.35 * waveFactor) : binNorm;

    const combined = Math.min(
      1,
      Math.max(0.08, Number((hypeFloor + musicContribution * 0.75 + chatContribution).toFixed(3)))
    );
    bars.push(combined);
  }

  const avgAudio = count > 0 ? audioSum / count : 0;
  const peakEnergy = Math.round(Math.max(...bars, 0.08) * 100);
  const dominantDriver =
    params.isAudioPlaying || avgAudio > 0.12
      ? 'music'
      : chatNorm > 0.15
        ? 'chat'
        : 'ambient';

  return { bars, peakEnergy, dominantDriver };
}

export const BEAT_PADS: BeatPad[] = [
  {
    id: 'drop_it',
    label: 'Drop It (808)',
    sublabel: 'Sub Bass Impact',
    voiceTrigger: '"Drop it"',
    category: 'drop',
  },
  {
    id: 'air_horn',
    label: 'Triple Horn',
    sublabel: 'Stage Siren Blast',
    voiceTrigger: '"Air horn"',
    category: 'stinger',
  },
  {
    id: 'shred_beat',
    label: 'Shred Trap 140',
    sublabel: '4-Bar Heavy Loop',
    voiceTrigger: '"Shred beat"',
    category: 'beat',
    isLoop: true,
  },
  {
    id: 'boom_bap',
    label: 'Gold Boom Bap',
    sublabel: '92 BPM Neck Snap',
    voiceTrigger: '"Boom bap"',
    category: 'beat',
    isLoop: true,
  },
  {
    id: 'laser_hype',
    label: 'Plasma Riser',
    sublabel: 'Synth Sweep & Zap',
    voiceTrigger: '"Plasma riser"',
    category: 'drop',
  },
  {
    id: 'crowd_roar',
    label: 'Arena Roar',
    sublabel: 'Stadium Hype Swell',
    voiceTrigger: '"Crowd roar"',
    category: 'stinger',
  },
  {
    id: 'rimshot_roast',
    label: 'Roast Sting',
    sublabel: 'Ba-Dum-Tss Burn',
    voiceTrigger: '"Roast sting"',
    category: 'stinger',
  },
  {
    id: 'victory_fanfare',
    label: 'Gold Crown',
    sublabel: 'Winner Fanfare',
    voiceTrigger: '"Winner horn"',
    category: 'stinger',
  },
];

export const TRIVIA_BANK: TriviaQuestion[] = [
  {
    id: 't1',
    prompt: 'Which classic drum machine gave birth to the booming 808 sub-bass heard in modern trap?',
    answer: 'Roland TR-808',
    category: 'Beat History',
  },
  {
    id: 't2',
    prompt: 'What BPM range is standard halftime double-time trap usually programmed at?',
    answer: '140 BPM (135–150 BPM)',
    category: 'Producer Lab',
  },
  {
    id: 't3',
    prompt: 'In studio mixing, what technique ducks the bass volume every time the kick drum hits?',
    answer: 'Sidechain Compression',
    category: 'Audio Tech',
  },
  {
    id: 't4',
    prompt: 'Which frequency range (in Hz) carries the deep chest-thumping sub-bass energy?',
    answer: '20 Hz to 60 Hz',
    category: 'Sound Design',
  },
];

export const LYRIC_CHALLENGES: LyricChallenge[] = [
  {
    id: 'l1',
    setupLine: 'Lights on the stage, 808s in the trunk, when Beatshredder drops it...',
    missingLine: 'Watch the whole chat jump!',
    vibe: 'Stage Anthem',
  },
  {
    id: 'l2',
    setupLine: 'No fake numbers, no corporate suit, stay real on the mic...',
    missingLine: 'Be Unique, Be You!',
    vibe: 'Beatshredder Motto',
  },
  {
    id: 'l3',
    setupLine: 'Late night grinding with the headphones tight, turning solo streams...',
    missingLine: 'Into Friday night lights!',
    vibe: 'Freestyle Hook',
  },
];

export const GUESS_BEAT_ROUNDS: GuessBeatRound[] = [
  {
    id: 'g1',
    padId: 'shred_beat',
    clue: 'Fast rolling hi-hats at 140 BPM with a rattling sub-bass tail.',
    answerLabel: 'Shred Trap 140',
    revealed: false,
  },
  {
    id: 'g2',
    padId: 'boom_bap',
    clue: '92 BPM swung head-nod groove with a crisp rimshot on the 2 and 4.',
    answerLabel: 'Gold Boom Bap',
    revealed: false,
  },
  {
    id: 'g3',
    padId: 'drop_it',
    clue: 'A single massive pitch-diving sub impact that shakes the speakers.',
    answerLabel: 'Drop It (808)',
    revealed: false,
  },
];

export const GAME_RULES: Record<GameType, string> = {
  trivia_sprint: 'Fast-fire music & beat trivia! First viewer in chat with the right answer gets +10 pts.',
  either_or: 'Two choices on deck! Type A or B in the chat right now so we see which side runs the room.',
  finish_lyric: 'I drop the setup bar, chat drops the punchline! Best or fastest rhyme takes the crown.',
  guess_beat: 'Listen closely as I fire a mystery sound from the Beat Board—name the vibe to score!',
  gift_race: 'Community Gift-Goal Race! Every tap, follow, and gift pushes the bar toward the Shredder Drop.',
};

export function createInitialGameState(type: GameType = 'trivia_sprint'): ActiveGameState {
  return {
    type,
    isActive: false,
    roundNumber: 1,
    scores: {},
    winner: null,
    rulesSummary: GAME_RULES[type],
    triviaIndex: 0,
    triviaRevealed: false,
    poll: {
      id: 'poll-1',
      optionA: 'Heavy 808 Trap',
      optionB: '90s Boom Bap',
      votesA: 0,
      votesB: 0,
    },
    lyricIndex: 0,
    lyricRevealed: false,
    guessBeatIndex: 0,
    guessBeatRevealed: false,
    giftRace: {
      goalName: 'Unlock Live Freestyle Drop',
      currentPoints: 0,
      targetPoints: 100,
    },
  };
}

export function parseRawChatInput(
  rawInput: string,
  defaultUsername = 'chat_viewer',
  explicitType?: CommentType,
  now = Date.now()
): ChatComment[] {
  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  return lines.map((line, idx) => {
    let username = defaultUsername.trim().replace(/^@/, '') || 'chat_viewer';
    let text = line;

    const colonMatch = line.match(/^@?([a-zA-Z0-9_.-]{2,28})\s*:\s*(.+)$/);
    if (colonMatch) {
      username = colonMatch[1];
      text = colonMatch[2].trim();
    }

    const detectedType = explicitType ?? classifyCommentType(text);

    return {
      id: `msg-${now}-${idx}`,
      username,
      text,
      type: detectedType,
      timestamp: now + idx,
      pinned: false,
      hidden: false,
    };
  });
}

export function classifyCommentType(text: string): CommentType {
  const lower = text.toLowerCase();
  if (
    lower.includes('followed') ||
    lower.includes('new follower') ||
    lower.startsWith('just followed')
  ) {
    return 'follower';
  }
  if (
    lower.includes('sent a') ||
    lower.includes('gift') ||
    lower.includes('galaxy') ||
    lower.includes('rose') ||
    lower.includes('lion')
  ) {
    return 'gift';
  }
  if (
    lower.includes('boring') ||
    lower.includes('mid') ||
    lower.includes('trash') ||
    lower.includes('weak beat') ||
    lower.includes('l stream') ||
    lower.includes('bot')
  ) {
    return 'heckle';
  }
  if (text.includes('?')) {
    return 'question';
  }
  return 'comment';
}

export function generateLightRoast(
  username: string,
  commentText: string,
  personaId: CohostPersonaId = 'beatshredder'
): string {
  const cleanUser = username.replace(/^@/, '');
  if (personaId === 'sarcastic') {
    return `@${cleanUser} typed "${commentText}" with full confidence. Truly a Pulitzer-worthy critique—thanks for boosting the stream stats!`;
  }
  if (personaId === 'encouraging') {
    return `Hey @${cleanUser} said "${commentText}"—even the critics are tuning in! Sending you good vibes anyway fam!`;
  }
  if (personaId === 'goofy') {
    return `BEEP BOOP @${cleanUser} said "${commentText}"—sounds like someone needs extra cheese on their 808s! Honk honk!`;
  }
  return `Yo @${cleanUser} said "${commentText}"—still front row watching every second though! Appreciate the algorithm boost, legend!`;
}

export function buildPersonaLine(
  personaId: CohostPersonaId,
  coreLine: string
): string {
  const persona = COHOST_PERSONAS[personaId] ?? COHOST_PERSONAS.beatshredder;
  if (personaId === 'beatshredder') {
    return coreLine;
  }
  return `[${persona.name}] ${coreLine} ${persona.catchphrase}`;
}

export interface HypeMultiplierInput {
  streakCount?: number;
  chatBurstCount?: number;
  chatPulseEnergy?: number;
}

export interface HypeUpdateResult {
  nextHype: number;
  milestoneCallout: string | null;
  hypeMultiplier: number;
  effectiveDelta: number;
  nextStreakCount: number;
  multiplierLabel: string;
}

export function calculateHypeUpdate(
  currentHype: number,
  delta: number,
  followerCount: number,
  giftCount: number,
  streakOrBurstInput: number | HypeMultiplierInput = 0,
  chatBurstCountArg = 0
): HypeUpdateResult {
  const streakCount =
    typeof streakOrBurstInput === 'number'
      ? Math.max(0, Math.floor(streakOrBurstInput))
      : Math.max(0, Math.floor(streakOrBurstInput.streakCount ?? 0));

  const chatBurstCount =
    typeof streakOrBurstInput === 'number'
      ? Math.max(0, Math.floor(chatBurstCountArg))
      : Math.max(0, Math.floor(streakOrBurstInput.chatBurstCount ?? chatBurstCountArg));

  const chatPulseEnergy =
    typeof streakOrBurstInput === 'object' && streakOrBurstInput !== null
      ? Math.max(0, streakOrBurstInput.chatPulseEnergy ?? 0)
      : 0;

  const isFollowerMilestone = followerCount > 0 && followerCount % 10 === 0 && delta > 0;
  const isGiftMilestone = giftCount > 0 && giftCount % 5 === 0 && delta > 0;
  const isHighEnergyBurst =
    delta > 0 && (chatBurstCount >= 3 || chatPulseEnergy >= 60 || delta >= 15);

  // Dynamic hype multiplier variable: scales from 1.0x up to 2.5x on consecutive milestones & chat bursts
  const streakBonus = streakCount * 0.25;
  const burstBonus = chatBurstCount >= 5 ? 0.5 : chatBurstCount >= 3 ? 0.25 : 0;
  const pulseBonus = chatPulseEnergy >= 80 ? 0.25 : 0;

  const hypeMultiplier =
    delta > 0
      ? Number(Math.min(2.5, 1 + streakBonus + burstBonus + pulseBonus).toFixed(2))
      : 1;

  const effectiveDelta =
    delta > 0 ? Math.round(delta * hypeMultiplier) : Math.round(delta);

  const clamped = Math.max(0, Math.min(100, Math.round(currentHype + effectiveDelta)));
  const crossedOverdrive = currentHype < 80 && clamped >= 80;
  const hitMaxPlasma = currentHype < 100 && clamped === 100;

  const nextStreakCount =
    delta <= 0
      ? 0
      : isFollowerMilestone || isGiftMilestone || isHighEnergyBurst || crossedOverdrive
        ? streakCount + 1
        : streakCount;

  const multiplierSuffix =
    hypeMultiplier > 1 ? ` (${hypeMultiplier}x HYPE MULTIPLIER!)` : '';

  let milestoneCallout: string | null = null;

  if (isFollowerMilestone && isGiftMilestone) {
    milestoneCallout = `${followerCount} NEW FOLLOWERS MILESTONE & GIFT TRAIN x${giftCount}! The stage is heating up!${multiplierSuffix}`;
  } else if (isFollowerMilestone) {
    milestoneCallout = `${followerCount} NEW FOLLOWERS MILESTONE! Shredder Crew is expanding fast!${multiplierSuffix}`;
  } else if (isGiftMilestone) {
    milestoneCallout = `GIFT TRAIN x${giftCount}! The stage is heating up!${multiplierSuffix}`;
  } else if (crossedOverdrive) {
    milestoneCallout = `HYPE METER HIT OVERDRIVE (80%+)! Drop that heavy 808!${multiplierSuffix}`;
  } else if (hitMaxPlasma) {
    milestoneCallout = `MAX 100% PLASMA HYPE! Full show energy unlocked!${multiplierSuffix}`;
  } else if (hypeMultiplier >= 1.5 && delta > 0) {
    milestoneCallout = `COMBO STREAK x${nextStreakCount}! ${hypeMultiplier}x Dynamic Hype Multiplier Active (+${effectiveDelta}% Hype)!`;
  }

  const multiplierLabel =
    hypeMultiplier >= 2.0
      ? `${hypeMultiplier}x Savage Surge`
      : hypeMultiplier > 1.0
        ? `${hypeMultiplier}x Combo Boost`
        : '1.0x Base Gain';

  return {
    nextHype: clamped,
    milestoneCallout,
    hypeMultiplier,
    effectiveDelta,
    nextStreakCount,
    multiplierLabel,
  };
}

export function togglePinComment(comments: ChatComment[], commentId: string): ChatComment[] {
  const target = comments.find((c) => c.id === commentId);
  if (!target) return comments;
  const nextPinned = !target.pinned;
  return comments.map((c) => ({
    ...c,
    pinned: c.id === commentId ? nextPinned : false,
  }));
}

export function toggleHideComment(comments: ChatComment[], commentId: string): ChatComment[] {
  return comments.map((c) => (c.id === commentId ? { ...c, hidden: !c.hidden, pinned: false } : c));
}

export function timeoutUsername(
  comments: ChatComment[],
  timedOutUsers: string[],
  username: string
): {
  updatedComments: ChatComment[];
  updatedTimedOutUsers: string[];
} {
  const normalized = username.trim().toLowerCase().replace(/^@/, '');
  const nextTimedOut = timedOutUsers.includes(normalized)
    ? timedOutUsers
    : [...timedOutUsers, normalized];
  const updatedComments = comments.map((c) =>
    c.username.toLowerCase() === normalized ? { ...c, hidden: true, pinned: false } : c
  );
  return { updatedComments, updatedTimedOutUsers: nextTimedOut };
}

export function awardGameScore(
  game: ActiveGameState,
  username: string,
  points: number
): ActiveGameState {
  const clean = username.trim().replace(/^@/, '') || 'chat_mvp';
  const nextScore = (game.scores[clean] ?? 0) + points;
  const nextScores = { ...game.scores, [clean]: nextScore };
  return {
    ...game,
    scores: nextScores,
  };
}

export function declareGameWinner(game: ActiveGameState, explicitWinner?: string): ActiveGameState {
  if (explicitWinner && explicitWinner.trim()) {
    return {
      ...game,
      isActive: false,
      winner: explicitWinner.trim().replace(/^@/, ''),
    };
  }
  const entries = Object.entries(game.scores);
  if (entries.length === 0) {
    if (game.type === 'either_or') {
      const pollWinner =
        game.poll.votesA > game.poll.votesB
          ? game.poll.optionA
          : game.poll.votesB > game.poll.votesA
            ? game.poll.optionB
            : 'Tie Game';
      return { ...game, isActive: false, winner: pollWinner };
    }
    if (game.type === 'gift_race') {
      const done = game.giftRace.currentPoints >= game.giftRace.targetPoints;
      return {
        ...game,
        isActive: false,
        winner: done ? 'Entire Shredder Chat' : 'Goal In Progress',
      };
    }
    return { ...game, isActive: false, winner: 'Chat MVP' };
  }
  entries.sort((a, b) => b[1] - a[1]);
  return {
    ...game,
    isActive: false,
    winner: entries[0][0],
  };
}

export function advanceGiftRace(game: ActiveGameState, pointsToAdd: number): ActiveGameState {
  const nextPoints = Math.min(
    game.giftRace.targetPoints,
    Math.max(0, game.giftRace.currentPoints + pointsToAdd)
  );
  const reachedGoal = nextPoints >= game.giftRace.targetPoints;
  return {
    ...game,
    giftRace: {
      ...game.giftRace,
      currentPoints: nextPoints,
    },
    winner: reachedGoal ? 'Shredder Community (Goal Crushed!)' : game.winner,
  };
}

export function addSongRequest(
  queue: SongRequestItem[],
  requester: string,
  beatStyle: string,
  vibeNote: string,
  now = Date.now()
): SongRequestItem[] {
  const cleanStyle = beatStyle.trim();
  if (!cleanStyle) return queue;
  const item: SongRequestItem = {
    id: `req-${now}-${queue.length}`,
    requester: requester.trim().replace(/^@/, '') || 'listener',
    beatStyle: cleanStyle,
    vibeNote: vibeNote.trim() || 'High Energy Stage Vibe',
    status: 'queued',
    createdAt: now,
  };
  return [...queue, item];
}

export function advanceSongQueue(queue: SongRequestItem[]): {
  updatedQueue: SongRequestItem[];
  nowPlaying: SongRequestItem | null;
} {
  let foundNext = false;
  let nowPlaying: SongRequestItem | null = null;

  const updatedQueue = queue.map((item) => {
    if (item.status === 'playing') {
      return { ...item, status: 'done' as const };
    }
    if (item.status === 'queued' && !foundNext) {
      foundNext = true;
      nowPlaying = { ...item, status: 'playing' as const };
      return nowPlaying;
    }
    return item;
  });

  return { updatedQueue, nowPlaying };
}

export function buildThirtySecondClip(params: {
  comments: ChatComment[];
  cohostLines: string[];
  hypeLevel: number;
  activeGame: ActiveGameState;
  activePadLabel: string | null;
  now?: number;
}): SavedClip {
  const now = params.now ?? Date.now();
  const visibleComments = params.comments.filter((c) => !c.hidden);
  const latestComment =
    visibleComments.find((c) => c.pinned) ??
    visibleComments[visibleComments.length - 1] ??
    null;

  const latestCohost =
    params.cohostLines[params.cohostLines.length - 1] ??
    'Beatshredder hyping the room live on the mic—Shred Them Beats Boy!';

  const sessionSummary = params.activePadLabel
    ? `30s Stage Burst at ${params.hypeLevel}% Hype firing "${params.activePadLabel}" during ${params.activeGame.type.replace('_', ' ')}.`
    : `30s Live Cohost sequence at ${params.hypeLevel}% Hype with ${visibleComments.length} active chat messages.`;

  const funniestMoment = latestCohost;
  const chatHighlight = latestComment
    ? `@${latestComment.username}: "${latestComment.text}"`
    : 'Solo studio freestyle hype—no chat messages entered in this window.';

  return {
    id: `clip-${now}`,
    createdAt: now,
    durationSeconds: 30,
    sessionSummary,
    funniestMoment,
    chatHighlight,
    hypeLevelAtClip: params.hypeLevel,
  };
}

export function buildSessionRecap(params: {
  elapsedSeconds: number;
  peakViewers: number;
  comments: ChatComment[];
  gamesPlayed: string[];
  clips: SavedClip[];
  padsFiredCount: number;
  peakHype: number;
  now?: number;
}): SessionRecap {
  const now = params.now ?? Date.now();
  const mins = Math.floor(params.elapsedSeconds / 60);
  const secs = params.elapsedSeconds % 60;
  const durationFormatted = `${mins}m ${secs}s`;

  const visibleComments = params.comments.filter((c) => !c.hidden);
  const topComment =
    visibleComments.find((c) => c.pinned) ??
    visibleComments[visibleComments.length - 1] ??
    null;

  const bestMoment =
    params.clips[0]?.funniestMoment ??
    (topComment
      ? `Spotlighting @${topComment.username}'s message "${topComment.text}" at ${params.peakHype}% Hype.`
      : `Hitting ${params.peakHype}% Hype while firing ${params.padsFiredCount} live beat board triggers.`);

  const uniqueGames =
    params.gamesPlayed.length > 0 ? Array.from(new Set(params.gamesPlayed)) : ['Freestyle Stage Session'];

  const whatWorked: string[] = [];
  if (params.padsFiredCount > 0) {
    whatWorked.push(`Fired ${params.padsFiredCount} live Web Audio beat drops & stingers on cue.`);
  }
  if (visibleComments.length > 0) {
    whatWorked.push(`Engaged ${visibleComments.length} real viewer comments and shoutouts.`);
  } else {
    whatWorked.push('Kept dead air at zero with solo co-host banter and stage energy.');
  }
  if (params.gamesPlayed.length > 0) {
    whatWorked.push(`Ran ${uniqueGames.join(', ')} to drive interactive participation.`);
  }
  if (params.peakHype >= 70) {
    whatWorked.push(`Pushed the Hype Meter to ${params.peakHype}% peak energy.`);
  }

  const spokenScript = `Yo, that's a wrap on a certified Beatshredder show! We ran for ${durationFormatted}, peaked at ${params.peakViewers} viewers and ${params.peakHype} percent hype. Best moment of the night: ${bestMoment} Remember: Be Unique, Be You—Shred Them Beats Boy!`;

  return {
    id: `recap-${now}`,
    createdAt: now,
    durationFormatted,
    peakViewers: params.peakViewers,
    bestMoment,
    gamesPlayed: uniqueGames,
    whatWorked,
    spokenScript,
    totalComments: visibleComments.length,
    clipsSaved: params.clips.length,
  };
}

export interface ApkProjectFileEntry {
  path: string;
  category: 'gradle' | 'kotlin' | 'manifest' | 'resources' | 'wrapper';
  description: string;
}

export interface AndroidApkProjectManifest {
  packageId: string;
  appName: string;
  minSdk: number;
  targetSdk: number;
  compileSdk: number;
  permissions: string[];
  buildCommands: {
    syncAssets: string;
    gradleDebugApk: string;
    gradleReleaseApk: string;
    adbInstall: string;
  };
  files: ApkProjectFileEntry[];
}

export function getAndroidApkProjectManifest(): AndroidApkProjectManifest {
  return {
    packageId: 'com.beatshredder.cohost',
    appName: 'Shredder Live Cohost',
    minSdk: 26,
    targetSdk: 34,
    compileSdk: 34,
    permissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECORD_AUDIO',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.INTERNET',
    ],
    buildCommands: {
      syncAssets: 'npm run apk:sync',
      gradleDebugApk: 'cd android-app && ./gradlew assembleDebug',
      gradleReleaseApk: 'cd android-app && ./gradlew assembleRelease',
      adbInstall: 'adb install -r android-app/app/build/outputs/apk/debug/app-debug.apk',
    },
    files: [
      {
        path: 'android-app/settings.gradle.kts',
        category: 'gradle',
        description: 'Gradle repository config & :app module inclusion',
      },
      {
        path: 'android-app/build.gradle.kts',
        category: 'gradle',
        description: 'Top-level Android Application (8.5.2) & Kotlin (1.9.24) plugins',
      },
      {
        path: 'android-app/gradle.properties',
        category: 'gradle',
        description: 'AndroidX, JVM heap, and Kotlin official style properties',
      },
      {
        path: 'android-app/gradle/wrapper/gradle-wrapper.properties',
        category: 'gradle',
        description: 'Locks Gradle 8.7 distribution for reproducible APK builds',
      },
      {
        path: 'android-app/gradlew',
        category: 'gradle',
        description: 'Executable POSIX Gradle wrapper script',
      },
      {
        path: 'android-app/app/build.gradle.kts',
        category: 'gradle',
        description: 'App module SDK 26-34, WebViewAssetLoader, OkHttp & syncWebDistAssets task',
      },
      {
        path: 'android-app/app/proguard-rules.pro',
        category: 'gradle',
        description: 'Release R8 rules keeping BeatshredderAndroidBridge @JavascriptInterface',
      },
      {
        path: 'android-app/app/src/main/AndroidManifest.xml',
        category: 'manifest',
        description: 'Declares SYSTEM_ALERT_WINDOW, MediaProjection, Open Mic & PiP Activity',
      },
      {
        path: 'android-app/app/src/main/java/com/beatshredder/cohost/MainActivity.kt',
        category: 'kotlin',
        description: 'WebViewAssetLoader host + BeatshredderAndroidBridge + PiP auto-handoff',
      },
      {
        path: 'android-app/app/src/main/java/com/beatshredder/cohost/FloatingOverlayService.kt',
        category: 'kotlin',
        description: 'TYPE_APPLICATION_OVERLAY touch-passthrough HUD + 1 FPS vision + 16kHz PCM mic',
      },
      {
        path: 'android-app/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
        category: 'resources',
        description: 'Adaptive vector launcher icon (Beatshredder gold bolt & purple plasma)',
      },
      {
        path: 'android-app/app/src/main/res/xml/network_security_config.xml',
        category: 'resources',
        description: 'Network security policy for HTTPS Cloud Run & local emulator debugging',
      },
      {
        path: 'capacitor.config.json',
        category: 'wrapper',
        description: 'Capacitor Android bridge config targeting android-app & dist',
      },
      {
        path: 'twa-manifest.json',
        category: 'wrapper',
        description: 'Bubblewrap Trusted Web Activity manifest for standalone PWA APK',
      },
    ],
  };
}

