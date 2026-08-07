import { WicketType } from './types';

/**
 Determines if a bowler gets credit for a given wicket type
 (Bowler gets credit for Bowled, Caught, LBW, Stumped, Hit Wicket)
 (Bowler does NOT get credit for Run Out, Retired Hurt, Obstructing Field)
 */
export function isBowlerWicket(type?: WicketType): boolean {
  if (!type) return false;
  return ['BOWLED', 'CAUGHT', 'LBW', 'STUMPED', 'HIT_WICKET'].includes(type);
}

/**
 Formats a human readable dismissal label
 */
export function formatDismissal(
  type?: WicketType,
  bowlerName?: string,
  fielderName?: string
): string {
  if (!type) return 'not out';
  switch (type) {
    case 'BOWLED':
      return `b ${bowlerName || 'Bowler'}`;
    case 'CAUGHT':
      return fielderName ? `c ${fielderName} b ${bowlerName}` : `c & b ${bowlerName}`;
    case 'LBW':
      return `lbw b ${bowlerName || 'Bowler'}`;
    case 'STUMPED':
      return fielderName ? `st ${fielderName} b ${bowlerName}` : `st b ${bowlerName}`;
    case 'RUN_OUT':
      return fielderName ? `run out (${fielderName})` : 'run out';
    case 'HIT_WICKET':
      return `hit wicket b ${bowlerName}`;
    case 'RETIRED_HURT':
      return 'retired hurt';
    case 'OBSTRUCTING_FIELD':
      return 'obstructing the field';
    default:
      return 'out';
  }
}
