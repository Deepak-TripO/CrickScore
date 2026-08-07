/**
 Converts over count decimal format like 18.3 to total legal balls (111 balls)
 */
export function oversToLegalBalls(overs: number): number {
  const overNumber = Math.floor(overs);
  const ballInOver = Math.round((overs - overNumber) * 10);
  return overNumber * 6 + ballInOver;
}

/**
 Converts total legal balls (e.g. 111) to over notation decimal (e.g. 18.3)
 */
export function legalBallsToOvers(legalBalls: number): number {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return Number(`${overs}.${balls}`);
}

/**
 Checks if an over is complete (6 legal balls bowled in the over)
 */
export function isOverComplete(legalBallsInOver: number): boolean {
  return legalBallsInOver >= 6;
}

/**
 Formats overs display cleanly (e.g. "18.3" or "20.0")
 */
export function formatOvers(overs: number): string {
  const formatted = overs.toFixed(1);
  return formatted;
}
