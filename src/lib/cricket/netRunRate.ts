import { oversToLegalBalls } from './overs';

/**
 Calculates Net Run Rate (NRR) using standard ICC cricket formula:
 NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
export function calculateNRR(
  runsScored: number,
  oversFaced: number,
  runsConceded: number,
  oversBowled: number
): number {
  const ballsFaced = oversToLegalBalls(oversFaced);
  const ballsBowled = oversToLegalBalls(oversBowled);

  const oversFacedFraction = ballsFaced > 0 ? ballsFaced / 6 : 0;
  const oversBowledFraction = ballsBowled > 0 ? ballsBowled / 6 : 0;

  const runRateFor = oversFacedFraction > 0 ? runsScored / oversFacedFraction : 0;
  const runRateAgainst = oversBowledFraction > 0 ? runsConceded / oversBowledFraction : 0;

  const nrr = runRateFor - runRateAgainst;
  return Number(nrr.toFixed(3));
}
