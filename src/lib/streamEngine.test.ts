import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseRawChatInput,
  calculateHypeUpdate,
  togglePinComment,
  toggleHideComment,
  timeoutUsername,
  createInitialGameState,
  awardGameScore,
  declareGameWinner,
  advanceGiftRace,
  addSongRequest,
  advanceSongQueue,
  buildThirtySecondClip,
  buildSessionRecap,
  COHOST_PERSONAS,
  generateLightRoast,
  buildPersonaLine,
  createDefaultOverlayConfig,
  toggleOverlayElement,
  computeVisualizerBars,
  GAME_STREAM_PRESETS,
  generateGameplayTrashTalk,
  buildAutoVisionTickPrompt,
  createDefaultFloatingOverlayConfig,
  buildFloatingHudStatus,
  getRoastAggressionProfile,
  matchVoiceCommandToPad,
  computeAudioDuckingTarget,
  analyzeVisionFramesForAutoMoment,
  getAndroidApkProjectManifest,
} from './streamEngine';

test('parseRawChatInput parses multi-line comments and classifies followers, gifts, questions, and heckles', () => {
  const raw = [
    '@dj_nova: Drop that heavy 808 beat?',
    'beat_fan99: just followed the stream!',
    'hater_guy: this beat is mid and boring',
    'vip_gifter: sent a Galaxy gift!',
  ].join('\n');

  const parsed = parseRawChatInput(raw, 'viewer', undefined, 1000);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].username, 'dj_nova');
  assert.equal(parsed[0].type, 'question');
  assert.equal(parsed[1].username, 'beat_fan99');
  assert.equal(parsed[1].type, 'follower');
  assert.equal(parsed[2].username, 'hater_guy');
  assert.equal(parsed[2].type, 'heckle');
  assert.equal(parsed[3].username, 'vip_gifter');
  assert.equal(parsed[3].type, 'gift');
});

test('calculateHypeUpdate clamps hype 0-100, scales with dynamic hypeMultiplier on consecutive milestones/chat bursts, and triggers callouts', () => {
  const m10 = calculateHypeUpdate(50, 10, 10, 0);
  assert.equal(m10.nextHype, 60);
  assert.equal(m10.hypeMultiplier, 1);
  assert.equal(m10.nextStreakCount, 1);
  assert.ok(m10.milestoneCallout?.includes('10 NEW FOLLOWERS'));

  // Consecutive milestone with streakCount = 2 boosts hypeMultiplier to 1.5x (10 * 1.5 = +15)
  const streakStep = calculateHypeUpdate(55, 10, 10, 5, { streakCount: 2 });
  assert.equal(streakStep.hypeMultiplier, 1.5);
  assert.equal(streakStep.effectiveDelta, 15);
  assert.equal(streakStep.nextHype, 70);
  assert.equal(streakStep.nextStreakCount, 3);
  assert.ok(streakStep.milestoneCallout?.includes('GIFT TRAIN x5'));
  assert.ok(streakStep.milestoneCallout?.includes('1.5x HYPE MULTIPLIER'));

  // High-energy chat burst (5 messages + streak 4 + high pulse) caps cleanly at 2.5x max multiplier
  const burstStep = calculateHypeUpdate(40, 10, 12, 6, {
    streakCount: 4,
    chatBurstCount: 5,
    chatPulseEnergy: 90,
  });
  assert.equal(burstStep.hypeMultiplier, 2.5);
  assert.equal(burstStep.effectiveDelta, 25);
  assert.equal(burstStep.nextHype, 65);
  assert.equal(burstStep.nextStreakCount, 5);

  const overdrive = calculateHypeUpdate(75, 10, 3, 1);
  assert.equal(overdrive.nextHype, 85);
  assert.ok(overdrive.milestoneCallout?.includes('OVERDRIVE'));

  // Negative delta resets consecutive streak to 0 and keeps multiplier at 1x
  const cooled = calculateHypeUpdate(40, -15, 3, 1, { streakCount: 3 });
  assert.equal(cooled.nextHype, 25);
  assert.equal(cooled.hypeMultiplier, 1);
  assert.equal(cooled.nextStreakCount, 0);
});

test('moderation tools pin, hide, and timeout usernames accurately', () => {
  const initial = parseRawChatInput('@alice: First comment\n@bob: Second comment', 'viewer', undefined, 2000);
  const pinned = togglePinComment(initial, initial[0].id);
  assert.equal(pinned[0].pinned, true);

  const hidden = toggleHideComment(pinned, initial[0].id);
  assert.equal(hidden[0].hidden, true);
  assert.equal(hidden[0].pinned, false);

  const timedOut = timeoutUsername(hidden, [], '@bob');
  assert.deepEqual(timedOut.updatedTimedOutUsers, ['bob']);
  assert.equal(timedOut.updatedComments[1].hidden, true);
});

test('interactive game scoring, winner declaration, and gift goal race work end-to-end', () => {
  let game = createInitialGameState('trivia_sprint');
  game = awardGameScore(game, '@producer_x', 10);
  game = awardGameScore(game, '@beat_queen', 20);
  game = declareGameWinner(game);
  assert.equal(game.winner, 'beat_queen');

  let raceGame = createInitialGameState('gift_race');
  raceGame = advanceGiftRace(raceGame, 100);
  assert.equal(raceGame.giftRace.currentPoints, 100);
  assert.ok(raceGame.winner?.includes('Shredder Community'));
});

test('song request queue adds items and advances nowPlaying state cleanly', () => {
  let q = addSongRequest([], '@kilo', 'Dark Phonk 808', 'Aggressive drift vibe', 5000);
  q = addSongRequest(q, '@melody', 'Soulful Boom Bap', 'Late night crate dig', 5001);
  assert.equal(q.length, 2);

  const step1 = advanceSongQueue(q);
  assert.equal(step1.nowPlaying?.requester, 'kilo');
  assert.equal(step1.updatedQueue[0].status, 'playing');

  const step2 = advanceSongQueue(step1.updatedQueue);
  assert.equal(step2.updatedQueue[0].status, 'done');
  assert.equal(step2.nowPlaying?.requester, 'melody');
});

test('buildThirtySecondClip and buildSessionRecap produce accurate summaries without fake data', () => {
  const game = createInitialGameState('trivia_sprint');
  const clip = buildThirtySecondClip({
    comments: [],
    cohostLines: ['Shred Them Beats Boy! Welcome to the stage!'],
    hypeLevel: 65,
    activeGame: game,
    activePadLabel: 'Drop It (808)',
    now: 9000,
  });

  assert.equal(clip.durationSeconds, 30);
  assert.ok(clip.sessionSummary.includes('Drop It (808)'));
  assert.ok(clip.chatHighlight.includes('no chat messages entered'));

  const recap = buildSessionRecap({
    elapsedSeconds: 125,
    peakViewers: 0,
    comments: [],
    gamesPlayed: ['Trivia Sprint'],
    clips: [clip],
    padsFiredCount: 4,
    peakHype: 85,
    now: 10000,
  });

  assert.equal(recap.durationFormatted, '2m 5s');
  assert.equal(recap.peakViewers, 0);
  assert.equal(recap.clipsSaved, 1);
  assert.ok(recap.spokenScript.includes('Be Unique, Be You'));
});

test('co-host personas provide distinct voices, catchphrases, and personality-specific roasts', () => {
  assert.equal(COHOST_PERSONAS.beatshredder.voiceName, 'Puck');
  assert.equal(COHOST_PERSONAS.sarcastic.voiceName, 'Charon');
  assert.equal(COHOST_PERSONAS.encouraging.voiceName, 'Kore');
  assert.equal(COHOST_PERSONAS.goofy.voiceName, 'Fenrir');

  const sarcasticRoast = generateLightRoast('@critic', 'slow tempo', 'sarcastic');
  assert.ok(sarcasticRoast.includes('Pulitzer-worthy'));

  const goofyLine = buildPersonaLine('goofy', 'Let us roll!');
  assert.ok(goofyLine.includes('MC Kazoo'));
  assert.ok(goofyLine.includes('drop the soup'));
});

test('customizable overlay toggles and music+chat visualizer bar math respond to inputs', () => {
  let cfg = createDefaultOverlayConfig();
  assert.equal(cfg.showHypeOverlay, true);
  cfg = toggleOverlayElement(cfg, 'showHypeOverlay');
  assert.equal(cfg.showHypeOverlay, false);

  const idleViz = computeVisualizerBars({
    frequencyBins: new Array(16).fill(0),
    chatPulseEnergy: 0,
    hypeLevel: 35,
    isAudioPlaying: false,
  });
  assert.equal(idleViz.dominantDriver, 'ambient');
  assert.equal(idleViz.bars.length, 16);

  const chatViz = computeVisualizerBars({
    frequencyBins: new Array(16).fill(0),
    chatPulseEnergy: 90,
    hypeLevel: 75,
    isAudioPlaying: false,
  });
  assert.equal(chatViz.dominantDriver, 'chat');
  assert.ok(chatViz.peakEnergy > idleViz.peakEnergy);

  const musicViz = computeVisualizerBars({
    frequencyBins: new Array(16).fill(220),
    chatPulseEnergy: 20,
    hypeLevel: 80,
    isAudioPlaying: true,
  });
  assert.equal(musicViz.dominantDriver, 'music');
  assert.ok(musicViz.peakEnergy >= 80);
});

test('gaming trash-talk presets, Fortnite roasts, and auto-vision tick builder work accurately', () => {
  assert.ok(GAME_STREAM_PRESETS.fortnite_br.visionPrompt.includes('Fortnite'));
  const whiff = generateGameplayTrashTalk('whiffed_shot', 'fortnite_br', 'beatshredder');
  assert.equal(whiff.padToFire, 'rimshot_roast');
  assert.ok(whiff.fallbackLine.includes('WHAT WAS THAT AIM'));

  const lobby = generateGameplayTrashTalk('sent_to_lobby', 'fortnite_br', 'sarcastic');
  assert.ok(lobby.fallbackLine.includes('DJ Frostbite'));
  assert.ok(lobby.fallbackLine.includes('BACK TO THE LOBBY'));

  const tick = buildAutoVisionTickPrompt({
    presetId: 'fortnite_br',
    heatLevel: 'ruthless_roast',
    personaId: 'beatshredder',
  });
  assert.ok(tick.prompt.includes('NON-STOP TRASH TALK'));
  assert.ok(tick.fallbackLine.includes('stop looting like a bot'));
});

test('Android draw-over-screen floating overlay config and HUD status builder format accurately', () => {
  const cfg = createDefaultFloatingOverlayConfig();
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.minimizedToOrb, false);
  assert.equal(cfg.anchor, 'top_right');

  const status = buildFloatingHudStatus({
    personaId: 'beatshredder',
    presetId: 'fortnite_br',
    hypeLevel: 88,
    visionActive: true,
    micLive: true,
    latestTranscript: 'Bro missed a point-blank pump shotgun shot in Fortnite!',
  });

  assert.equal(status.badgeTitle, 'Beatshredder • 88% HYPE');
  assert.ok(status.statusLine.includes('VISION LOCKED'));
  assert.ok(status.statusLine.includes('OPEN MIC'));
  assert.ok(status.captionPreview.includes('point-blank pump'));
});

test('Roast Aggression slider dynamically maps 0-100 scores from Playful Banter to Savage Insults', () => {
  const playful = getRoastAggressionProfile(10);
  assert.equal(playful.tierId, 'playful_banter');
  assert.equal(playful.label, 'Playful Banter');
  assert.equal(playful.heatEquivalent, 'playful_banter');

  const spicy = getRoastAggressionProfile(40);
  assert.equal(spicy.tierId, 'spicy_backseat');
  assert.equal(spicy.heatEquivalent, 'hype_and_roast');

  const ruthless = getRoastAggressionProfile(70);
  assert.equal(ruthless.tierId, 'ruthless_roast');

  const savage = getRoastAggressionProfile(98);
  assert.equal(savage.tierId, 'savage_insults');
  assert.equal(savage.label, 'Savage Insults');
  assert.ok(savage.systemDirective.includes('98/100'));

  const playfulWhiff = generateGameplayTrashTalk('whiffed_shot', 'fortnite_br', 'beatshredder', 12);
  assert.ok(playfulWhiff.fallbackLine.includes('warning shots fired'));

  const savageWhiff = generateGameplayTrashTalk('whiffed_shot', 'fortnite_br', 'beatshredder', 95);
  assert.ok(savageWhiff.fallbackLine.includes('monitor unplugged'));
});

test('Voice-Activated Soundboard matches spoken keywords and custom voice triggers accurately', () => {
  const m1 = matchVoiceCommandToPad('Yo Beatshredder drop it right now!');
  assert.equal(m1.matchedPadId, 'drop_it');
  assert.equal(m1.padLabel, 'Drop It (808)');

  const m2 = matchVoiceCommandToPad('Hit the air horn for that clutch!');
  assert.equal(m2.matchedPadId, 'air_horn');

  const m3 = matchVoiceCommandToPad('That was pure emotional damage bro');
  assert.equal(m3.matchedPadId, 'rimshot_roast');

  const custom = matchVoiceCommandToPad('He just got boxed like a fish', {
    victory_fanfare: 'boxed like a fish, crown time',
  });
  assert.equal(custom.matchedPadId, 'victory_fanfare');

  const stopMatch = matchVoiceCommandToPad('Okay stop beat loop now');
  assert.equal(stopMatch.matchedPadId, 'stop_all');
});

test('computeAudioDuckingTarget lowers background beat gain by 15-20% when AI co-host speaks and restores when silent', () => {
  const idle = computeAudioDuckingTarget({ baseGain: 0.85, isCohostSpeaking: false, reductionPercent: 18 });
  assert.equal(idle.isDucked, false);
  assert.equal(idle.targetGain, 0.85);
  assert.equal(idle.duckMultiplier, 1);
  assert.equal(idle.reductionAppliedPercent, 0);

  const speaking18 = computeAudioDuckingTarget({ baseGain: 0.85, isCohostSpeaking: true, reductionPercent: 18 });
  assert.equal(speaking18.isDucked, true);
  assert.equal(speaking18.reductionAppliedPercent, 18);
  assert.equal(speaking18.duckMultiplier, 0.82);
  assert.equal(speaking18.targetGain, Number((0.85 * 0.82).toFixed(4)));
  assert.ok(speaking18.statusLabel.includes('-18%'));

  // Clamps within the 15-20% range
  const clampedLow = computeAudioDuckingTarget({ baseGain: 1.0, isCohostSpeaking: true, reductionPercent: 5 });
  assert.equal(clampedLow.reductionAppliedPercent, 15);
  assert.equal(clampedLow.targetGain, 0.85);

  const clampedHigh = computeAudioDuckingTarget({ baseGain: 1.0, isCohostSpeaking: true, reductionPercent: 35 });
  assert.equal(clampedHigh.reductionAppliedPercent, 20);
  assert.equal(clampedHigh.targetGain, 0.8);
});

test('analyzeVisionFramesForAutoMoment automatically triggers victory_clutch and elimination moments from visionFramesSent', () => {
  const zero = analyzeVisionFramesForAutoMoment(0);
  assert.equal(zero.shouldTrigger, false);
  assert.equal(zero.moment, null);

  // Frame 10 triggers 'elimination' automatically
  const frame10 = analyzeVisionFramesForAutoMoment(10);
  assert.equal(frame10.shouldTrigger, true);
  assert.equal(frame10.moment, 'elimination');
  assert.equal(frame10.frameAnalyzed, 10);

  // Cooldown prevents re-triggering on frame 12 if frame 10 just fired
  const cooldownCheck = analyzeVisionFramesForAutoMoment({
    visionFramesSent: 12,
    lastTriggeredFrame: 10,
    cooldownFrames: 6,
  });
  assert.equal(cooldownCheck.shouldTrigger, false);

  // Frame 20 triggers 'victory_clutch' automatically
  const frame20 = analyzeVisionFramesForAutoMoment({
    visionFramesSent: 20,
    lastTriggeredFrame: 10,
  });
  assert.equal(frame20.shouldTrigger, true);
  assert.equal(frame20.moment, 'victory_clutch');

  // Telemetry spike also triggers 'victory_clutch' or 'elimination' on non-cadence frames
  const telemetryClutch = analyzeVisionFramesForAutoMoment({
    visionFramesSent: 7,
    telemetry: { brightGoldVictoryRatio: 0.42 },
  });
  assert.equal(telemetryClutch.shouldTrigger, true);
  assert.equal(telemetryClutch.moment, 'victory_clutch');

  const elimTrashTalk = generateGameplayTrashTalk('elimination', 'fortnite_br', 'beatshredder', 90);
  assert.equal(elimTrashTalk.padToFire, 'drop_it');
  assert.ok(elimTrashTalk.fallbackLine.includes('BACK TO THE LOBBY'));
});

test('getAndroidApkProjectManifest lists all required Android APK files and every file exists on disk', () => {
  const manifest = getAndroidApkProjectManifest();
  assert.equal(manifest.packageId, 'com.beatshredder.cohost');
  assert.equal(manifest.minSdk, 26);
  assert.equal(manifest.targetSdk, 34);
  assert.ok(manifest.permissions.includes('android.permission.SYSTEM_ALERT_WINDOW'));
  assert.ok(manifest.files.length >= 14);

  for (const fileEntry of manifest.files) {
    const absPath = path.resolve(process.cwd(), fileEntry.path);
    assert.equal(
      fs.existsSync(absPath),
      true,
      `Expected APK project file to exist on disk: ${fileEntry.path}`
    );
    assert.ok(
      fs.statSync(absPath).size > 0,
      `Expected APK project file to be non-empty: ${fileEntry.path}`
    );
  }
});
