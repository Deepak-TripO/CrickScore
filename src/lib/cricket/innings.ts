import { Ball, BatterStats, BowlerStats, ExtrasSummary, FallOfWicket, Partnership, Player } from './types';
import { calculateBattingStats } from './batting';
import { calculateBowlingStats } from './bowling';
import { summarizeExtras } from './extras';
import { oversToLegalBalls, formatOvers } from './overs';

export interface ScorecardView {
  batting: BatterStats[];
  bowling: BowlerStats[];
  extras: ExtrasSummary;
  fallOfWickets: FallOfWicket[];
  currentPartnership?: Partnership;
  runRate: number;
  requiredRunRate?: number;
}

/**
 Calculates full scorecard view for an innings
 */
export function buildScorecardView(
  players: Player[],
  balls: Ball[],
  strikerId: string,
  nonStrikerId: string,
  totalRuns: number,
  oversCount: number,
  targetRuns?: number,
  totalOversLimit: number = 20
): ScorecardView {
  const batting = calculateBattingStats(players, balls, strikerId, nonStrikerId);
  const bowling = calculateBowlingStats(players, balls);
  const extras = summarizeExtras(balls);

  // Fall of Wickets calculation
  const fallOfWickets: FallOfWicket[] = [];
  let wicketCounter = 0;
  let runningRuns = 0;
  let runningLegalBalls = 0;

  balls.forEach((ball) => {
    runningRuns += ball.runs_total;
    if (ball.extras_type !== 'WIDE' && ball.extras_type !== 'NO_BALL') {
      runningLegalBalls += 1;
    }

    if (ball.wicket && ball.dismissed_player_id) {
      wicketCounter += 1;
      const dismissedPlayer = players.find((p) => p.id === ball.dismissed_player_id);
      fallOfWickets.push({
        wicketNumber: wicketCounter,
        runs: runningRuns,
        overs: formatOvers(runningLegalBalls / 6),
        playerName: dismissedPlayer?.name || 'Batter',
      });
    }
  });

  // Current Partnership calculation (runs since last wicket)
  const lastWicketIndex = balls.map((b) => b.wicket).lastIndexOf(true);
  const partnershipBalls = lastWicketIndex === -1 ? balls : balls.slice(lastWicketIndex + 1);
  const partnershipRuns = partnershipBalls.reduce((acc, b) => acc + b.runs_total, 0);
  const partnershipLegalBalls = partnershipBalls.filter((b) => b.extras_type !== 'WIDE' && b.extras_type !== 'NO_BALL').length;

  const striker = players.find((p) => p.id === strikerId);
  const nonStriker = players.find((p) => p.id === nonStrikerId);

  const currentPartnership: Partnership = {
    runs: partnershipRuns,
    balls: partnershipLegalBalls,
    player1Name: striker?.name || 'Striker',
    player2Name: nonStriker?.name || 'Non-Striker',
  };

  // Run rate calculation
  const legalBallsFaced = oversToLegalBalls(oversCount);
  const oversFraction = legalBallsFaced / 6;
  const runRate = oversFraction > 0 ? Number((totalRuns / oversFraction).toFixed(2)) : 0;

  // Required Run Rate calculation (2nd innings)
  let requiredRunRate: number | undefined;
  if (targetRuns !== undefined && targetRuns > 0) {
    const runsNeeded = Math.max(0, targetRuns - totalRuns);
    const ballsRemaining = Math.max(0, totalOversLimit * 6 - legalBallsFaced);
    const oversRemainingFraction = ballsRemaining / 6;
    requiredRunRate = oversRemainingFraction > 0 ? Number((runsNeeded / oversRemainingFraction).toFixed(2)) : 0;
  }

  return {
    batting,
    bowling,
    extras,
    fallOfWickets,
    currentPartnership,
    runRate,
    requiredRunRate,
  };
}
