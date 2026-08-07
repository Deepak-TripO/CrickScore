import { ExtrasType, ExtrasSummary, Ball } from './types';

/**
 Calculates extra runs added to team total based on delivery type
 */
export function calculateExtraRuns(type: ExtrasType, customExtraRuns: number = 0): number {
  switch (type) {
    case 'WIDE':
      return 1 + customExtraRuns; // Wide awards 1 extra penalty run + any bye/run scored
    case 'NO_BALL':
      return 1 + customExtraRuns; // No ball awards 1 penalty run + off-the-bat runs
    case 'BYE':
    case 'LEG_BYE':
    case 'PENALTY':
      return customExtraRuns > 0 ? customExtraRuns : 1;
    default:
      return 0;
  }
}

/**
 Checks if delivery counts as a legal delivery in an over
 (WIDE and NO_BALL do NOT count as legal deliveries)
 */
export function isLegalDelivery(type: ExtrasType): boolean {
  return type !== 'WIDE' && type !== 'NO_BALL';
}

/**
 Aggregates extras breakdown from an array of balls
 */
export function summarizeExtras(balls: Ball[]): ExtrasSummary {
  const summary: ExtrasSummary = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0,
  };

  balls.forEach((ball) => {
    if (ball.extras_type === 'WIDE') {
      summary.wides += ball.extras_runs;
    } else if (ball.extras_type === 'NO_BALL') {
      summary.noBalls += ball.extras_runs;
    } else if (ball.extras_type === 'BYE') {
      summary.byes += ball.extras_runs;
    } else if (ball.extras_type === 'LEG_BYE') {
      summary.legByes += ball.extras_runs;
    } else if (ball.extras_type === 'PENALTY') {
      summary.penalty += ball.extras_runs;
    }
  });

  summary.total = summary.wides + summary.noBalls + summary.byes + summary.legByes + summary.penalty;
  return summary;
}
