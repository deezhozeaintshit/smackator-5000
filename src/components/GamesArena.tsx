import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  Volume2,
  Play,
  CheckCircle2,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  ActiveGameState,
  GameType,
  GAME_RULES,
  TRIVIA_BANK,
  LYRIC_CHALLENGES,
  GUESS_BEAT_ROUNDS,
  PadId,
} from '../lib/streamEngine';
import { Badge, Button, Input } from './ui/primitives';

interface GamesArenaProps {
  game: ActiveGameState;
  onSelectGame: (type: GameType) => void;
  onStartOrExplainGame: () => void;
  onNextRound: () => void;
  onRevealAnswer: () => void;
  onVotePoll: (side: 'A' | 'B') => void;
  onUpdatePollOptions: (optionA: string, optionB: string) => void;
  onPlayMysteryBeat: (padId: PadId) => void;
  onBoostGiftRace: (points: number) => void;
  onAwardScore: (username: string, points: number) => void;
  onDeclareWinner: (explicitWinner?: string) => void;
}

const GAME_TABS: { id: GameType; label: string }[] = [
  { id: 'trivia_sprint', label: 'Trivia Sprint' },
  { id: 'either_or', label: 'Either-Or Poll' },
  { id: 'finish_lyric', label: 'Finish The Lyric' },
  { id: 'guess_beat', label: 'Guess The Beat' },
  { id: 'gift_race', label: 'Gift-Goal Race' },
];

export const GamesArena: React.FC<GamesArenaProps> = ({
  game,
  onSelectGame,
  onStartOrExplainGame,
  onNextRound,
  onRevealAnswer,
  onVotePoll,
  onUpdatePollOptions,
  onPlayMysteryBeat,
  onBoostGiftRace,
  onAwardScore,
  onDeclareWinner,
}) => {
  const [scorerName, setScorerName] = useState('');
  const [customPollA, setCustomPollA] = useState(game.poll.optionA);
  const [customPollB, setCustomPollB] = useState(game.poll.optionB);

  const currentTrivia = TRIVIA_BANK[game.triviaIndex % TRIVIA_BANK.length];
  const currentLyric = LYRIC_CHALLENGES[game.lyricIndex % LYRIC_CHALLENGES.length];
  const currentGuessBeat =
    GUESS_BEAT_ROUNDS[game.guessBeatIndex % GUESS_BEAT_ROUNDS.length];

  const totalVotes = game.poll.votesA + game.poll.votesB;
  const pctA = totalVotes > 0 ? Math.round((game.poll.votesA / totalVotes) * 100) : 50;
  const pctB = totalVotes > 0 ? 100 - pctA : 50;

  const giftPct = Math.min(
    100,
    Math.round((game.giftRace.currentPoints / game.giftRace.targetPoints) * 100)
  );

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAwardScore(scorerName || 'chat_mvp', 10);
    setScorerName('');
  };

  return (
    <section
      aria-label="Interactive LIVE Games Arena"
      className="surface-card p-4 sm:p-5 space-y-5"
    >
      {/* Composed Header with Clear Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Gamepad2 className="w-5 h-5 text-[#F59E0B]" />
          <div className="min-w-0">
            <h2 className="type-title text-[#F5F3FF]">Interactive LIVE Games</h2>
            <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
              Beatshredder explains the rules, tracks live scores, and crowns your room winner
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="gold"
          onClick={onStartOrExplainGame}
        >
          <Volume2 className="w-4 h-4" />
          <span>Explain Rules & Start</span>
        </Button>
      </div>

      {/* Game Selector Grid (Zero horizontal scroll, 48px touch targets) */}
      <div
        role="tablist"
        aria-label="Select LIVE Game Mode"
        className="grid grid-cols-2 sm:grid-cols-5 gap-2"
      >
        {GAME_TABS.map((tab) => (
          <Button
            key={tab.id}
            role="tab"
            type="button"
            variant="outline"
            active={game.type === tab.id}
            aria-selected={game.type === tab.id}
            onClick={() => onSelectGame(tab.id)}
            className="w-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Rules Callout Strip */}
      <div className="surface-inset p-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="type-caption text-[#F5F3FF] font-normal">
          <strong className="text-[#F59E0B] font-bold">Rules:</strong> {GAME_RULES[game.type]}
        </span>
        <Badge tone="gold" className="font-mono-tabular">
          Round #{game.roundNumber}
        </Badge>
      </div>

      {/* Active Game Mode Surface */}
      {game.type === 'trivia_sprint' && (
        <div className="surface-inset p-4 space-y-3.5 border-[#F59E0B]/40">
          <div className="type-caption text-[#F59E0B] uppercase">
            Category: {currentTrivia.category}
          </div>
          <p className="type-display text-[#F5F3FF]">
            “{currentTrivia.prompt}”
          </p>
          {game.triviaRevealed ? (
            <div
              data-testid="trivia-answer-revealed"
              className="rounded-xl bg-[#12101B] border border-[#F59E0B]/60 p-3.5 type-body text-[#FBBF24] font-bold"
            >
              Answer: {currentTrivia.answer}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button type="button" variant="gold" onClick={onRevealAnswer}>
              {game.triviaRevealed ? 'Answer Revealed' : 'Reveal Answer Out Loud'}
            </Button>
            <Button type="button" variant="secondary" onClick={onNextRound}>
              Next Trivia Question
            </Button>
          </div>
        </div>
      )}

      {game.type === 'either_or' && (
        <div className="surface-inset p-4 space-y-4 border-[#F59E0B]/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              type="text"
              aria-label="Poll Option A"
              value={customPollA}
              onChange={(e) => {
                setCustomPollA(e.target.value);
                onUpdatePollOptions(e.target.value, customPollB);
              }}
            />
            <Input
              type="text"
              aria-label="Poll Option B"
              value={customPollB}
              onChange={(e) => {
                setCustomPollB(e.target.value);
                onUpdatePollOptions(customPollA, e.target.value);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onVotePoll('A')}
              className="motion-interactive min-h-[76px] p-3.5 rounded-xl bg-[#12101B] hover:bg-[#191625] border border-[#F59E0B]/50 text-left flex flex-col justify-between cursor-pointer active:scale-[0.98]"
            >
              <span className="type-caption text-[#F59E0B]">Vote Option A (+1)</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="type-title text-[#F5F3FF] truncate">
                  {game.poll.optionA}
                </span>
                <span className="type-body font-mono-tabular font-bold text-[#FBBF24]">
                  {game.poll.votesA} ({pctA}%)
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onVotePoll('B')}
              className="motion-interactive min-h-[76px] p-3.5 rounded-xl bg-[#12101B] hover:bg-[#191625] border border-white/20 text-left flex flex-col justify-between cursor-pointer active:scale-[0.98]"
            >
              <span className="type-caption text-[#B6B0CC]">Vote Option B (+1)</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="type-title text-[#F5F3FF] truncate">
                  {game.poll.optionB}
                </span>
                <span className="type-body font-mono-tabular font-bold text-[#F5F3FF]">
                  {game.poll.votesB} ({pctB}%)
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {game.type === 'finish_lyric' && (
        <div className="surface-inset p-4 space-y-3.5 border-[#F59E0B]/40">
          <div className="type-caption text-[#F59E0B] uppercase">
            Vibe: {currentLyric.vibe}
          </div>
          <p className="type-display text-[#F5F3FF]">
            “{currentLyric.setupLine}”
          </p>
          {game.lyricRevealed && (
            <div className="rounded-xl bg-[#12101B] border border-[#F59E0B]/60 p-3.5 type-body text-[#FBBF24] font-bold">
              Punchline: “{currentLyric.missingLine}”
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button type="button" variant="gold" onClick={onRevealAnswer}>
              {game.lyricRevealed ? 'Bar Revealed' : 'Drop The Punchline'}
            </Button>
            <Button type="button" variant="secondary" onClick={onNextRound}>
              Next Lyric Bar
            </Button>
          </div>
        </div>
      )}

      {game.type === 'guess_beat' && (
        <div className="surface-inset p-4 space-y-3.5 border-[#F59E0B]/40">
          <p className="type-body text-[#B6B0CC]">
            Clue: <strong className="text-[#F5F3FF]">{currentGuessBeat.clue}</strong>
          </p>
          {game.guessBeatRevealed && (
            <div className="rounded-xl bg-[#12101B] border border-[#F59E0B]/60 p-3.5 type-body text-[#FBBF24] font-bold">
              Mystery Sound: {currentGuessBeat.answerLabel}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="gold"
              onClick={() => onPlayMysteryBeat(currentGuessBeat.padId)}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Fire Mystery Beat</span>
            </Button>
            <Button type="button" variant="secondary" onClick={onRevealAnswer}>
              Reveal Beat Name
            </Button>
            <Button type="button" variant="outline" onClick={onNextRound}>
              Next Mystery Sound
            </Button>
          </div>
        </div>
      )}

      {game.type === 'gift_race' && (
        <div className="surface-inset p-4 space-y-3.5 border-[#F59E0B]/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="type-title text-[#F5F3FF]">
              {game.giftRace.goalName}
            </span>
            <span
              data-testid="gift-race-progress-text"
              className="type-body font-mono-tabular font-bold text-[#F59E0B]"
            >
              {game.giftRace.currentPoints} / {game.giftRace.targetPoints} pts ({giftPct}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={game.giftRace.currentPoints}
            aria-valuemin={0}
            aria-valuemax={game.giftRace.targetPoints}
            aria-label="Gift Goal Race Progress"
            className="w-full h-4 rounded-full bg-[#09080D] border border-white/15 overflow-hidden p-0.5"
          >
            <div
              className="motion-interactive h-full rounded-full bg-[#F59E0B] origin-left"
              style={{ transform: `scaleX(${Math.max(0.02, giftPct / 100)})` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[10, 25, 50].map((pts) => (
              <Button
                key={pts}
                type="button"
                variant="outline"
                onClick={() => onBoostGiftRace(pts)}
                className="border-[#F59E0B]/50 text-[#F59E0B] font-mono-tabular"
              >
                +{pts} Gift Boost
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Scoreboard & Winner Declaration */}
      <div className="surface-inset p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <span className="type-title text-[#F5F3FF]">Stage Scoreboard</span>
          </div>

          <Button
            type="button"
            variant="gold"
            onClick={() => onDeclareWinner()}
          >
            <Sparkles className="w-4 h-4" />
            <span>Declare Winner Out Loud</span>
          </Button>
        </div>

        <form onSubmit={handleScoreSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <label htmlFor="game-scorer-input" className="sr-only">
            Viewer Username to Award Points
          </label>
          <Input
            id="game-scorer-input"
            type="text"
            placeholder="@viewer to award +10 pts"
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="shrink-0">
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>+10 Pts</span>
          </Button>
        </form>

        {Object.keys(game.scores).length === 0 ? (
          <p className="type-caption text-[#B6B0CC] font-normal">
            No viewer points awarded yet. Enter a viewer handle above to start the leaderboard.
          </p>
        ) : (
          <div
            data-testid="game-scoreboard-list"
            className="flex flex-wrap items-center gap-2 font-mono-tabular pt-1"
          >
            {Object.entries(game.scores).map(([user, pts]) => (
              <Badge key={user} tone="gold">
                @{user}: <strong>{pts} pts</strong>
              </Badge>
            ))}
          </div>
        )}

        {game.winner && (
          <div
            role="status"
            data-testid="game-winner-banner"
            className="rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B] p-3.5 flex items-center gap-2 type-caption text-[#FBBF24]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CROWNED WINNER: @{game.winner} — Shred Them Beats Boy!</span>
          </div>
        )}
      </div>
    </section>
  );
};
