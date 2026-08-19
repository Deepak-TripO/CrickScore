'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndRole } from '@/lib/auth';
import { processInningsDeliveries, DeliveryInput, WicketType, ExtraType } from '@/lib/cricket/engine';
import { revalidatePath } from 'next/cache';

// Authorization helper to check if current user can score the match
function isAuthorizedScorer(user: any, userRole: string, match: any): boolean {
  if (!user || !match) return false;
  if (userRole === 'ADMIN' || userRole === 'MASTER') return true;
  if (match.master_id && match.master_id === user.id) return true;
  if (match.scorer_id && match.scorer_id === user.id) return true;
  if (match.created_by && match.created_by === user.id) return true;
  if (match.user_id && match.user_id === user.id) return true;
  return false;
}

// Resilient delivery query with schema fallbacks (deliveries / match_deliveries / balls)
async function fetchDeliveriesSafely(db: any, inningsId: string) {
  const { data: d1, error: e1 } = await db
    .from('deliveries')
    .select('*')
    .eq('innings_id', inningsId)
    .order('created_at', { ascending: true });

  if (!e1 && d1) return d1;

  const { data: d2, error: e2 } = await db
    .from('match_deliveries')
    .select('*')
    .eq('innings_id', inningsId)
    .order('created_at', { ascending: true });

  if (!e2 && d2) return d2;

  const { data: d3 } = await db
    .from('balls')
    .select('*')
    .eq('innings_id', inningsId)
    .order('created_at', { ascending: true });

  return d3 || [];
}

// Resilient delivery insertion with schema fallbacks
async function insertDeliverySafely(db: any, payload: any) {
  const { data: d1, error: e1 } = await db
    .from('deliveries')
    .insert(payload)
    .select()
    .maybeSingle();

  if (!e1 && d1) return { data: d1, error: null };

  const { data: d2, error: e2 } = await db
    .from('match_deliveries')
    .insert(payload)
    .select()
    .maybeSingle();

  if (!e2 && d2) return { data: d2, error: null };

  const { data: d3, error: e3 } = await db
    .from('balls')
    .insert(payload)
    .select()
    .maybeSingle();

  if (!e3 && d3) return { data: d3, error: null };

  return { data: d1 || d2 || d3 || null, error: e1 || e2 || e3 };
}

// Resilient delivery deletion for undo
async function deleteDeliverySafely(db: any, deliveryId: string) {
  await db.from('deliveries').delete().eq('id', deliveryId);
  try { await db.from('match_deliveries').delete().eq('id', deliveryId); } catch {}
  try { await db.from('balls').delete().eq('id', deliveryId); } catch {}
}

// Helper: Ensure valid Innings record exists in database table 'innings'
async function ensureValidInningsId(db: any, match: any, rawInningsId?: string): Promise<string> {
  // 1. Check if rawInningsId exists in 'innings' table
  if (rawInningsId && rawInningsId !== match.id && rawInningsId !== 'inn1' && rawInningsId.length > 20) {
    const { data: existing } = await db
      .from('innings')
      .select('id')
      .eq('id', rawInningsId)
      .maybeSingle();

    if (existing?.id) return existing.id;
  }

  // 2. Check if any innings row exists for this match.id
  const { data: matchInnings } = await db
    .from('innings')
    .select('id')
    .eq('match_id', match.id)
    .order('innings_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (matchInnings?.id) return matchInnings.id;

  // 3. Resolve Team IDs from match or teams table
  let team1Id = match.team1_id || match.team_a_id;
  let team2Id = match.team2_id || match.team_b_id;

  if (!team1Id || !team2Id) {
    const { data: teams } = await db.from('teams').select('id').limit(2);
    if (teams && teams.length > 0) {
      if (!team1Id) team1Id = teams[0].id;
      if (!team2Id) team2Id = teams[1]?.id || teams[0].id;
    }
  }

  // If team IDs are still missing, create fallback teams
  if (!team1Id) {
    const { data: createdT1 } = await db.from('teams').insert({ name: 'Team 1', short_name: 'T1', owner_id: match.master_id || match.created_by }).select('id').maybeSingle();
    team1Id = createdT1?.id;
  }
  if (!team2Id) {
    const { data: createdT2 } = await db.from('teams').insert({ name: 'Team 2', short_name: 'T2', owner_id: match.master_id || match.created_by }).select('id').maybeSingle();
    team2Id = createdT2?.id;
  }

  // 4. Create an Innings row in 'innings' table
  const { data: created } = await db
    .from('innings')
    .insert({
      match_id: match.id,
      innings_number: 1,
      batting_team_id: team1Id,
      bowling_team_id: team2Id,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0.0,
      status: 'IN_PROGRESS'
    })
    .select()
    .maybeSingle();

  if (created?.id) return created.id;

  // 5. Final fallback query
  const { data: retryInnings } = await db
    .from('innings')
    .select('id')
    .eq('match_id', match.id)
    .maybeSingle();

  if (retryInnings?.id) return retryInnings.id;

  throw new Error('Could not resolve or create a valid Innings record for this match.');
}

export async function scoreBall(payload: {
  matchId: string;
  inningsId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsBatter: number;
  runsExtras?: number;
  extraType?: ExtraType;
  wicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  commentary?: string;
}) {
  const supabase = createClient();
  const { user, role: userRole } = await getUserAndRole();

  if (!user) return { error: 'Unauthorized: Please sign in to score.' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  // 1. Verify match ownership & authorization
  const { data: match } = await db
    .from('matches')
    .select('*, innings(*)')
    .eq('id', payload.matchId)
    .maybeSingle();

  if (!match) {
    return { error: 'Match not found.' };
  }

  if (!isAuthorizedScorer(user, userRole, match)) {
    return { error: 'Unauthorized. Only the match creator can update scores.' };
  }

  // 2. Ensure valid Innings ID in table 'innings' to prevent foreign key violations
  let actualInningsId: string;
  try {
    actualInningsId = await ensureValidInningsId(db, match, payload.inningsId);
  } catch (err: any) {
    return { error: err.message || 'Failed to initialize match innings.' };
  }

  // 3. Fetch current innings deliveries safely with schema fallbacks
  const existingDeliveries = await fetchDeliveriesSafely(db, actualInningsId);

  const currentDeliveries: DeliveryInput[] = (existingDeliveries || []).map((d: any) => ({
    id: d.id,
    overNumber: d.over_number || 0,
    ballNumber: d.ball_number || 0,
    strikerId: d.striker_id || payload.strikerId || 'striker',
    nonStrikerId: d.non_striker_id || payload.nonStrikerId || 'non_striker',
    bowlerId: d.bowler_id || payload.bowlerId || 'bowler',
    runsBatter: typeof d.runs_batter === 'number' ? d.runs_batter : 0,
    runsExtras: typeof d.runs_extras === 'number' ? d.runs_extras : 0,
    extraType: (d.extra_type as ExtraType) || 'NONE',
    wicket: Boolean(d.wicket),
    wicketType: d.wicket_type as WicketType,
    dismissedPlayerId: d.dismissed_player_id || d.striker_id || payload.strikerId
  }));

  // Calculate ball sequence numbers
  const currentInningsState = processInningsDeliveries(
    currentDeliveries,
    payload.strikerId,
    payload.nonStrikerId,
    payload.bowlerId,
    match.overs,
    match.target
  );

  const nextOverNumber = currentInningsState.currentOverNumber;
  const nextBallNumber = currentInningsState.currentBallInOver + 1;

  // Sanitize player IDs for foreign key safety
  const safeStrikerId = (payload.strikerId && payload.strikerId.length > 20) ? payload.strikerId : null;
  const safeNonStrikerId = (payload.nonStrikerId && payload.nonStrikerId.length > 20) ? payload.nonStrikerId : null;
  const safeBowlerId = (payload.bowlerId && payload.bowlerId.length > 20) ? payload.bowlerId : null;
  const safeDismissedId = (payload.dismissedPlayerId && payload.dismissedPlayerId.length > 20) ? payload.dismissedPlayerId : null;

  // Insert delivery safely with verified actualInningsId
  const deliveryPayload = {
    innings_id: actualInningsId,
    over_number: nextOverNumber,
    ball_number: nextBallNumber,
    striker_id: safeStrikerId,
    non_striker_id: safeNonStrikerId,
    bowler_id: safeBowlerId,
    runs_batter: payload.runsBatter,
    runs_extras: payload.runsExtras || 0,
    extra_type: payload.extraType || 'NONE',
    wicket: payload.wicket || false,
    wicket_type: payload.wicketType || null,
    dismissed_player_id: safeDismissedId,
    commentary: payload.commentary || null
  };

  const { data: newDelivery, error: deliveryError } = await insertDeliverySafely(db, deliveryPayload);

  if (deliveryError || !newDelivery) {
    return { error: deliveryError?.message || 'Failed to record ball.' };
  }

  // Insert commentary if provided
  if (payload.commentary) {
    try {
      await db.from('match_commentary').insert({
        match_id: payload.matchId,
        innings_id: actualInningsId,
        over_number: nextOverNumber,
        delivery_id: newDelivery.id,
        text: payload.commentary,
        created_by: user.id
      });
    } catch {
      // ignore commentary fallback
    }
  }

  // Re-process all deliveries including new one to get accurate state
  const updatedDeliveries: DeliveryInput[] = [
    ...currentDeliveries,
    {
      id: newDelivery.id,
      overNumber: nextOverNumber,
      ballNumber: nextBallNumber,
      strikerId: payload.strikerId,
      nonStrikerId: payload.nonStrikerId,
      bowlerId: payload.bowlerId,
      runsBatter: payload.runsBatter,
      runsExtras: payload.runsExtras || 0,
      extraType: payload.extraType || 'NONE',
      wicket: payload.wicket || false,
      wicketType: payload.wicketType as WicketType,
      dismissedPlayerId: payload.dismissedPlayerId
    }
  ];

  const newState = processInningsDeliveries(
    updatedDeliveries,
    payload.strikerId,
    payload.nonStrikerId,
    payload.bowlerId,
    match.overs,
    match.target
  );

  // Update Innings table
  await db
    .from('innings')
    .update({
      total_runs: newState.totalRuns,
      total_wickets: newState.totalWickets,
      total_overs: Number(newState.oversFormatted),
      status: newState.isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      updated_at: new Date().toISOString()
    })
    .eq('id', actualInningsId);

  // Update Match table
  const matchUpdate: any = {
    current_score: `${newState.totalRuns}/${newState.totalWickets}`,
    current_wickets: newState.totalWickets,
    current_over: Number(newState.oversFormatted),
    updated_at: new Date().toISOString()
  };

  // Check Innings / Match Completion Logic
  const activeInnings = match.innings?.find((i: any) => i.id === actualInningsId);

  if (activeInnings?.innings_number === 1 && newState.isCompleted) {
    matchUpdate.target = newState.totalRuns + 1;
    matchUpdate.status = 'INNINGS_BREAK';

    const team2BattingId = activeInnings.bowling_team_id;
    const team2BowlingId = activeInnings.batting_team_id;

    await db.from('innings').insert({
      match_id: payload.matchId,
      innings_number: 2,
      batting_team_id: team2BattingId,
      bowling_team_id: team2BowlingId,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0.0,
      target: newState.totalRuns + 1,
      status: 'IN_PROGRESS'
    });
  } else if (activeInnings?.innings_number === 2) {
    const target = match.target || activeInnings.target;
    if (newState.totalRuns >= target) {
      matchUpdate.status = 'COMPLETED';
      matchUpdate.winner_id = activeInnings.batting_team_id;
      const wicketsLeft = 10 - newState.totalWickets;
      matchUpdate.result_summary = `Won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`;
    } else if (newState.isCompleted) {
      if (newState.totalRuns === target - 1) {
        matchUpdate.status = 'COMPLETED';
        matchUpdate.result_summary = 'Match Tied (Super Over required)';
      } else {
        matchUpdate.status = 'COMPLETED';
        matchUpdate.winner_id = activeInnings.bowling_team_id;
        const runsMargin = (target - 1) - newState.totalRuns;
        matchUpdate.result_summary = `Won by ${runsMargin} run${runsMargin > 1 ? 's' : ''}`;
      }
    }
  }

  await db.from('matches').update(matchUpdate).eq('id', payload.matchId);

  revalidatePath(`/master/matches/${payload.matchId}/score`);
  revalidatePath(`/matches/${payload.matchId}`);
  revalidatePath('/master/dashboard');
  revalidatePath('/');
  return { success: true, newState };
}

export async function undoLastBall(matchId: string, inningsId: string) {
  const supabase = createClient();
  const { user, role: userRole } = await getUserAndRole();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  // 1. Verify match ownership & authorization
  const { data: match } = await db.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match || !isAuthorizedScorer(user, userRole, match)) {
    return { error: 'Unauthorized. Only the match creator can update scores.' };
  }

  // 2. Ensure valid Innings ID in table 'innings'
  const actualInningsId = await ensureValidInningsId(db, match, inningsId);

  // 3. Fetch last delivery safely
  const existingDeliveries = await fetchDeliveriesSafely(db, actualInningsId);
  if (existingDeliveries.length === 0) return { error: 'No deliveries to undo.' };

  const lastDelivery = existingDeliveries[existingDeliveries.length - 1];

  // 4. Delete last delivery
  await deleteDeliverySafely(db, lastDelivery.id);

  // 5. Fetch remaining deliveries
  const remainingDeliveries = await fetchDeliveriesSafely(db, actualInningsId);

  const deliveryInputs: DeliveryInput[] = (remainingDeliveries || []).map((d: any) => ({
    id: d.id,
    overNumber: d.over_number,
    ballNumber: d.ball_number,
    strikerId: d.striker_id,
    nonStrikerId: d.non_striker_id,
    bowlerId: d.bowler_id,
    runsBatter: d.runs_batter,
    runsExtras: d.runs_extras,
    extraType: d.extra_type as ExtraType,
    wicket: d.wicket,
    wicketType: d.wicket_type as WicketType,
    dismissedPlayerId: d.dismissed_player_id
  }));

  // Reconstruct state
  const newState = processInningsDeliveries(
    deliveryInputs,
    lastDelivery.striker_id,
    lastDelivery.non_striker_id,
    lastDelivery.bowler_id,
    match.overs,
    match.target
  );

  // Update Innings
  await db
    .from('innings')
    .update({
      total_runs: newState.totalRuns,
      total_wickets: newState.totalWickets,
      total_overs: Number(newState.oversFormatted),
      status: 'IN_PROGRESS',
      updated_at: new Date().toISOString()
    })
    .eq('id', actualInningsId);

  // Update Match
  await db
    .from('matches')
    .update({
      current_score: `${newState.totalRuns}/${newState.totalWickets}`,
      current_wickets: newState.totalWickets,
      current_over: Number(newState.oversFormatted),
      status: 'LIVE',
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId);

  revalidatePath(`/master/matches/${matchId}/score`);
  revalidatePath(`/matches/${matchId}`);
  revalidatePath('/master/dashboard');
  revalidatePath('/');
  return { success: true, newState };
}

export async function selectPlayerOfMatch(matchId: string, playerId: string) {
  const supabase = createClient();
  const { user, role: userRole } = await getUserAndRole();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { data: match } = await db.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match || !isAuthorizedScorer(user, userRole, match)) {
    return { error: 'Unauthorized' };
  }

  await db
    .from('matches')
    .update({ player_of_match_id: playerId })
    .eq('id', matchId);

  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

export async function setBattingTeam(matchId: string, inningsId: string, battingTeamId: string, bowlingTeamId: string) {
  const supabase = createClient();
  const { user, role: userRole } = await getUserAndRole();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { data: match } = await db.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match || !isAuthorizedScorer(user, userRole, match)) {
    return { error: 'Unauthorized: Only authorized scorers can set batting team.' };
  }

  const actualInningsId = await ensureValidInningsId(db, match, inningsId);

  await db
    .from('innings')
    .update({
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      updated_at: new Date().toISOString()
    })
    .eq('id', actualInningsId);

  revalidatePath(`/master/matches/${matchId}/score`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}

