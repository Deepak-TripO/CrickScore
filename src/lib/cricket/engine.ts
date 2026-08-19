export type ExtraType = 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';

export type WicketType = 
  | 'Bowled'
  | 'Caught'
  | 'LBW'
  | 'Run Out'
  | 'Stumped'
  | 'Hit Wicket'
  | 'Retired Hurt'
  | 'Retired Out'
  | 'Obstructing the Field'
  | 'Hit the Ball Twice'
  | 'Timed Out';

export interface DeliveryInput {
  id?: string;
  overNumber: number; // 0-indexed or 1-indexed over number
  ballNumber: number; // ball index within over
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBatter: number;
  runsExtras: number;
  extraType: ExtraType;
  wicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  fielderId?: string;
  commentary?: string;
}

export interface BatterStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalInfo?: string;
  strikeRate: number;
}

export interface BowlerStats {
  playerId: string;
  legalBalls: number;
  oversFormatted: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economy: number;
}

export interface Partnership {
  batter1Id: string;
  batter2Id: string;
  runs: number;
  balls: number;
}

export interface InningsState {
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  oversFormatted: string; // e.g. "17.3"
  currentOverNumber: number;
  currentBallInOver: number;
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  partnerships: Partnership[];
  currentPartnership: Partnership;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
    total: number;
  };
  currentRunRate: number;
  requiredRunRate?: number;
  target?: number;
  maxOvers: number;
  isCompleted: boolean;
}

/**
 * Checks if a delivery is a legal delivery (counts towards the 6-ball over count).
 * Wides and No Balls do NOT count as legal deliveries.
 */
export function isLegalDelivery(extraType: ExtraType): boolean {
  return extraType !== 'WIDE' && extraType !== 'NO_BALL';
}

/**
 * Formats total legal balls into over format (e.g. 15 legal balls = "2.3 overs")
 */
export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const remainder = legalBalls % 6;
  return `${overs}.${remainder}`;
}

/**
 * Calculates current run rate (CRR)
 */
export function calculateCRR(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((totalRuns / overs).toFixed(2));
}

/**
 * Calculates required run rate (RRR)
 */
export function calculateRRR(target: number, currentRuns: number, legalBalls: number, maxOvers: number): number {
  const remainingRuns = target - currentRuns;
  const totalMaxBalls = maxOvers * 6;
  const remainingBalls = totalMaxBalls - legalBalls;

  if (remainingRuns <= 0) return 0;
  if (remainingBalls <= 0) return 99.99;

  const remainingOvers = remainingBalls / 6;
  return Number((remainingRuns / remainingOvers).toFixed(2));
}

/**
 * Checks if bowler gets credit for wicket
 */
export function isBowlerWicket(wicketType?: WicketType): boolean {
  if (!wicketType) return false;
  const nonBowlerWickets: WicketType[] = [
    'Run Out',
    'Retired Hurt',
    'Retired Out',
    'Obstructing the Field',
    'Hit the Ball Twice',
    'Timed Out'
  ];
  return !nonBowlerWickets.includes(wicketType);
}

/**
 * Processes a sequence of deliveries and reconstructs the complete InningsState.
 * This is the central engine used for live scoring, score rendering, and exact UNDO functionality.
 */
export function processInningsDeliveries(
  deliveries: DeliveryInput[],
  initialStrikerId: string,
  initialNonStrikerId: string,
  initialBowlerId: string,
  maxOvers: number = 20,
  target?: number
): InningsState {
  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;

  const batters: Record<string, BatterStats> = {};
  const bowlers: Record<string, BowlerStats> = {};

  const ensureBatter = (id?: string | null): string => {
    const key = (id && String(id).trim()) ? String(id).trim() : 'UNKNOWN_BATTER';
    if (!batters[key]) {
      batters[key] = {
        playerId: key,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        strikeRate: 0
      };
    }
    return key;
  };

  const ensureBowler = (id?: string | null): string => {
    const key = (id && String(id).trim()) ? String(id).trim() : 'UNKNOWN_BOWLER';
    if (!bowlers[key]) {
      bowlers[key] = {
        playerId: key,
        legalBalls: 0,
        oversFormatted: '0.0',
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0
      };
    }
    return key;
  };

  let strikerId = ensureBatter(initialStrikerId);
  let nonStrikerId = ensureBatter(initialNonStrikerId);
  let currentBowlerId = ensureBowler(initialBowlerId);

  const extras = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0
  };

  const partnerships: Partnership[] = [];
  let currentPartnership: Partnership = {
    batter1Id: strikerId,
    batter2Id: nonStrikerId,
    runs: 0,
    balls: 0
  };

  let overLegalBallsCount = 0;
  let overRunsConcededCount = 0;

  for (let i = 0; i < (deliveries || []).length; i++) {
    const d = deliveries[i];
    if (!d) continue;

    strikerId = ensureBatter(d.strikerId || strikerId);
    nonStrikerId = ensureBatter(d.nonStrikerId || nonStrikerId);
    currentBowlerId = ensureBowler(d.bowlerId || currentBowlerId);

    const isLegal = isLegalDelivery(d.extraType);

    // Calculate ball total runs
    let deliveryTotalRuns = d.runsBatter + d.runsExtras;
    if (d.extraType === 'WIDE' || d.extraType === 'NO_BALL') {
      deliveryTotalRuns += 1; // standard penalty run
    }

    totalRuns += deliveryTotalRuns;

    // Track Extras
    if (d.extraType === 'WIDE') {
      const wRuns = 1 + d.runsExtras;
      extras.wides += wRuns;
      extras.total += wRuns;
      bowlers[currentBowlerId].wides += 1;
      bowlers[currentBowlerId].runsConceded += wRuns;
      overRunsConcededCount += wRuns;
    } else if (d.extraType === 'NO_BALL') {
      const nbRuns = 1;
      extras.noBalls += nbRuns;
      extras.total += nbRuns;
      bowlers[currentBowlerId].noBalls += 1;
      bowlers[currentBowlerId].runsConceded += nbRuns + d.runsBatter;
      overRunsConcededCount += nbRuns + d.runsBatter;
    } else if (d.extraType === 'BYE') {
      extras.byes += d.runsExtras;
      extras.total += d.runsExtras;
    } else if (d.extraType === 'LEG_BYE') {
      extras.legByes += d.runsExtras;
      extras.total += d.runsExtras;
    } else if (d.extraType === 'PENALTY') {
      extras.penalty += d.runsExtras;
      extras.total += d.runsExtras;
    }

    // Batter stats
    if (d.extraType !== 'WIDE') {
      batters[strikerId].balls += 1;
      currentPartnership.balls += 1;
    }

    if (d.extraType === 'NONE' || d.extraType === 'NO_BALL') {
      batters[strikerId].runs += d.runsBatter;
      if (d.runsBatter === 4) batters[strikerId].fours += 1;
      if (d.runsBatter === 6) batters[strikerId].sixes += 1;

      if (d.extraType === 'NONE') {
        bowlers[currentBowlerId].runsConceded += d.runsBatter;
        overRunsConcededCount += d.runsBatter;
      }
    }

    currentPartnership.runs += deliveryTotalRuns;

    // Batter SR calculation
    if (batters[strikerId].balls > 0) {
      batters[strikerId].strikeRate = Number(
        ((batters[strikerId].runs / batters[strikerId].balls) * 100).toFixed(2)
      );
    }

    // Bowler stats & legal balls
    if (isLegal) {
      legalBalls += 1;
      overLegalBallsCount += 1;
      bowlers[currentBowlerId].legalBalls += 1;
      bowlers[currentBowlerId].oversFormatted = formatOvers(bowlers[currentBowlerId].legalBalls);
    }

    // Bowler Economy
    const bOvers = bowlers[currentBowlerId].legalBalls / 6;
    if (bOvers > 0) {
      bowlers[currentBowlerId].economy = Number(
        (bowlers[currentBowlerId].runsConceded / bOvers).toFixed(2)
      );
    }

    // Wickets
    if (d.wicket) {
      totalWickets += 1;
      const dismissedId = d.dismissedPlayerId || strikerId;
      ensureBatter(dismissedId);
      batters[dismissedId].isOut = true;
      batters[dismissedId].dismissalInfo = d.wicketType || 'Out';

      if (isBowlerWicket(d.wicketType)) {
        bowlers[currentBowlerId].wickets += 1;
      }

      // Record ended partnership & start new
      partnerships.push({ ...currentPartnership });
      currentPartnership = {
        batter1Id: dismissedId === strikerId ? nonStrikerId : strikerId,
        batter2Id: 'NEW_BATTER',
        runs: 0,
        balls: 0
      };
    }

    // Strike Rotation (Physical runs swap)
    const runningRuns = d.extraType === 'BYE' || d.extraType === 'LEG_BYE' ? d.runsExtras : d.runsBatter;
    if (runningRuns % 2 !== 0 && !d.wicket) {
      const temp = strikerId;
      strikerId = nonStrikerId;
      nonStrikerId = temp;
    }

    // Over Completion Check (6 legal balls)
    if (isLegal && overLegalBallsCount === 6) {
      if (overRunsConcededCount === 0) {
        bowlers[currentBowlerId].maidens += 1;
      }
      overLegalBallsCount = 0;
      overRunsConcededCount = 0;

      // Swap strike at end of over
      const temp = strikerId;
      strikerId = nonStrikerId;
      nonStrikerId = temp;
    }
  }

  const currentOverNumber = Math.floor(legalBalls / 6);
  const currentBallInOver = legalBalls % 6;
  const crr = calculateCRR(totalRuns, legalBalls);
  const rrr = target ? calculateRRR(target, totalRuns, legalBalls, maxOvers) : undefined;
  const isCompleted = totalWickets >= 10 || legalBalls >= maxOvers * 6 || (target !== undefined && totalRuns >= target);

  return {
    totalRuns,
    totalWickets,
    legalBalls,
    oversFormatted: formatOvers(legalBalls),
    currentOverNumber,
    currentBallInOver,
    strikerId,
    nonStrikerId,
    currentBowlerId,
    batters,
    bowlers,
    partnerships,
    currentPartnership,
    extras,
    currentRunRate: crr,
    requiredRunRate: rrr,
    target,
    maxOvers,
    isCompleted
  };
}
