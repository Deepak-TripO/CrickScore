import { Ball, ExtrasType, WicketType } from './types';
import { isLegalDelivery, calculateExtraRuns } from './extras';
import { oversToLegalBalls, legalBallsToOvers } from './overs';

export interface BallInput {
  innings_id: string;
  over_number: number;
  ball_number: number;
  striker_id: string;
  non_striker_id: string;
  bowler_id: string;
  runs_batter: number;
  extras_type: ExtrasType;
  custom_extra_runs?: number;
  wicket: boolean;
  wicket_type?: WicketType;
  dismissed_player_id?: string;
  commentary?: string;
}

export interface ScoringResult {
  updatedRuns: number;
  updatedWickets: number;
  updatedOvers: number; // e.g. 18.3
  isOverEnd: boolean;
  nextStrikerId: string;
  nextNonStrikerId: string;
  runsTotalOnBall: number;
  extrasRunsOnBall: number;
  legalBallAdded: boolean;
}

/**
 Calculates full state transition for a newly entered ball
 Enforces cricket logic rules:
 - Wide: +1 penalty run (plus any byes/runs), legal ball count does NOT increment.
 - No Ball: +1 penalty run (plus batter runs), legal ball count does NOT increment.
 - Legal delivery: legal ball count increments by 1.
 - Strike rotates on odd batter runs (1, 3, 5) or when over ends (except when over end coincides with odd runs, which cancel out rotation).
 */
export function processBallEntry(
  currentRuns: number,
  currentWickets: number,
  currentOvers: number,
  input: BallInput
): ScoringResult {
  const isLegal = isLegalDelivery(input.extras_type);
  const extraRuns = calculateExtraRuns(input.extras_type, input.custom_extra_runs || 0);

  const totalBallRuns = input.runs_batter + extraRuns;
  const newRuns = currentRuns + totalBallRuns;
  const newWickets = input.wicket ? currentWickets + 1 : currentWickets;

  // Convert current overs to legal ball count
  const currentLegalBalls = oversToLegalBalls(currentOvers);
  const newLegalBalls = isLegal ? currentLegalBalls + 1 : currentLegalBalls;
  const newOvers = legalBallsToOvers(newLegalBalls);

  // Check if current over is completed (6 legal deliveries)
  const currentOverLegalBalls = newLegalBalls % 6;
  const isOverEnd = isLegal && currentOverLegalBalls === 0;

  // Determine strike rotation
  // Batter runs that cause rotation: 1, 3, 5 (or byes/leg-byes of 1, 3, 5)
  const runsToRotate = input.runs_batter + (input.extras_type === 'BYE' || input.extras_type === 'LEG_BYE' ? extraRuns : 0);
  const isOddRun = runsToRotate % 2 !== 0;

  let nextStriker = input.striker_id;
  let nextNonStriker = input.non_striker_id;

  // 1. Rotate for odd runs
  if (isOddRun) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
  }

  // 2. Rotate for over end (strike changes at end of over)
  if (isOverEnd) {
    const temp = nextStriker;
    nextStriker = nextNonStriker;
    nextNonStriker = temp;
  }

  return {
    updatedRuns: newRuns,
    updatedWickets: newWickets,
    updatedOvers: newOvers,
    isOverEnd,
    nextStrikerId: nextStriker,
    nextNonStrikerId: nextNonStriker,
    runsTotalOnBall: totalBallRuns,
    extrasRunsOnBall: extraRuns,
    legalBallAdded: isLegal,
  };
}
