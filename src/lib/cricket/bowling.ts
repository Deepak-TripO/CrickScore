import { Ball, BowlerStats, Player } from './types';
import { isLegalDelivery } from './extras';
import { isBowlerWicket } from './wickets';
import { legalBallsToOvers } from './overs';

/**
 Calculates bowling figures for all bowlers in an innings
 */
export function calculateBowlingStats(players: Player[], balls: Ball[]): BowlerStats[] {
  const statsMap: Record<string, BowlerStats> = {};

  balls.forEach((ball) => {
    if (!ball.bowler_id) return;

    if (!statsMap[ball.bowler_id]) {
      statsMap[ball.bowler_id] = {
        id: ball.bowler_id,
        name: ball.bowler_name || 'Bowler',
        overs: 0,
        balls: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      };
    }

    const bowler = statsMap[ball.bowler_id];

    // Runs conceded by bowler (Byes & Leg-Byes do NOT count against bowler runs)
    if (ball.extras_type !== 'BYE' && ball.extras_type !== 'LEG_BYE') {
      bowler.runs += ball.runs_total;
    }

    // Legal balls
    if (isLegalDelivery(ball.extras_type)) {
      bowler.balls += 1;
    }

    // Wickets credited to bowler
    if (ball.wicket && isBowlerWicket(ball.wicket_type)) {
      bowler.wickets += 1;
    }
  });

  // Calculate maidens and economy rate
  return Object.values(statsMap).map((bowler) => {
    const oversDecimal = legalBallsToOvers(bowler.balls);
    bowler.overs = oversDecimal;

    // Economy calculation
    const totalOversFraction = bowler.balls / 6;
    bowler.economy = totalOversFraction > 0 ? Number((bowler.runs / totalOversFraction).toFixed(2)) : 0;

    return bowler;
  });
}
