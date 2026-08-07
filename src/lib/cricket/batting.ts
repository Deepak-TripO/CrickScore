import { Ball, BatterStats, Player } from './types';
import { isLegalDelivery } from './extras';
import { formatDismissal } from './wickets';

/**
 Calculates individual batter statistics from match ball history
 */
export function calculateBattingStats(
  players: Player[],
  balls: Ball[],
  strikerId: string,
  nonStrikerId: string
): BatterStats[] {
  const statsMap: Record<string, BatterStats> = {};

  // Initialize for all known batters in the balls or players
  players.forEach((p) => {
    statsMap[p.id] = {
      id: p.id,
      name: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      dismissal: 'not out',
      isOnStrike: p.id === strikerId,
    };
  });

  balls.forEach((ball) => {
    if (!statsMap[ball.striker_id]) {
      statsMap[ball.striker_id] = {
        id: ball.striker_id,
        name: ball.striker_name || 'Batter',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        dismissal: 'not out',
        isOnStrike: false,
      };
    }

    const batter = statsMap[ball.striker_id];

    // Runs off the bat (wides/byes/leg-byes do not count as batter runs)
    if (ball.extras_type !== 'WIDE' && ball.extras_type !== 'BYE' && ball.extras_type !== 'LEG_BYE') {
      batter.runs += ball.runs_batter;
      if (ball.runs_batter === 4) batter.fours += 1;
      if (ball.runs_batter === 6) batter.sixes += 1;
    }

    // Ball count faced (Wide does NOT count as a ball faced)
    if (ball.extras_type !== 'WIDE') {
      batter.balls += 1;
    }

    // Wicket check
    if (ball.wicket && ball.dismissed_player_id) {
      if (!statsMap[ball.dismissed_player_id]) {
        statsMap[ball.dismissed_player_id] = {
          id: ball.dismissed_player_id,
          name: 'Batter',
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: true,
          dismissal: 'out',
          isOnStrike: false,
        };
      }
      const outBatter = statsMap[ball.dismissed_player_id];
      outBatter.isOut = true;
      outBatter.dismissal = formatDismissal(ball.wicket_type, ball.bowler_name);
    }
  });

  // Calculate Strike Rate and update on-strike indicator
  return Object.values(statsMap)
    .filter((b) => b.balls > 0 || b.isOut || b.id === strikerId || b.id === nonStrikerId)
    .map((b) => {
      b.strikeRate = b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(2)) : 0;
      b.isOnStrike = b.id === strikerId;
      return b;
    });
}
