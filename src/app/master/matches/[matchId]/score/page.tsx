import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound, redirect } from 'next/navigation';
import MobileScoringUI from '@/components/master/MobileScoringUI';
import { getMatchDetailsForEdit } from '@/actions/matches';

export default async function MasterScoringPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const cleanMatchId = params.matchId.trim();
  let match: any = null;

  // 1. Fetch match record with fallback to admin client
  const { data: rawMatch } = await supabase
    .from('matches')
    .select('*')
    .eq('id', cleanMatchId)
    .maybeSingle();

  if (rawMatch) {
    match = rawMatch;
  } else {
    try {
      const db = createAdminClient();
      const { data: adminMatch } = await db
        .from('matches')
        .select('*')
        .eq('id', cleanMatchId)
        .maybeSingle();
      if (adminMatch) match = adminMatch;
    } catch {
      // ignore
    }
  }

  if (!match) notFound();

  // Strict Live Scoring Access Control: Validate that the match is the latest match created by the Master User
  let dbClient: any = supabase;
  try {
    dbClient = createAdminClient();
  } catch {
    dbClient = supabase;
  }

  const { data: latestRow } = await dbClient
    .from('matches')
    .select('id')
    .or(`master_id.eq.${user.id},created_by.eq.${user.id},scorer_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isLatestMatch = latestRow ? latestRow.id === cleanMatchId : true;
  const isMatchCompleted = match.status === 'COMPLETED';

  // Historical or completed matches MUST NOT access Live Scoring — redirect to read-only Scorecard
  if (!isLatestMatch || isMatchCompleted) {
    redirect(`/matches/${cleanMatchId}`);
  }

  // 2. Fetch Team 1 & Team 2 details
  const team1Id = match.team1_id || match.team_a_id;
  const team2Id = match.team2_id || match.team_b_id;

  if (team1Id) {
    const { data: t1 } = await dbClient.from('teams').select('*').eq('id', team1Id).maybeSingle();
    match.team1 = t1 || { id: team1Id, name: 'Team 1' };
  } else {
    match.team1 = { id: 'team1', name: 'Team 1' };
  }

  if (team2Id) {
    const { data: t2 } = await dbClient.from('teams').select('*').eq('id', team2Id).maybeSingle();
    match.team2 = t2 || { id: team2Id, name: 'Team 2' };
  } else {
    match.team2 = { id: 'team2', name: 'Team 2' };
  }

  // 3. Fetch Innings details
  const { data: innings } = await dbClient.from('innings').select('*').eq('match_id', match.id);
  match.innings = innings || [];

  // Active innings resolution - ALWAYS ensure a valid UUID string for innings.id
  let activeInnings = match.innings?.find((i: any) => i.status === 'IN_PROGRESS') || match.innings?.[0];

  if (!activeInnings) {
    const { data: newInnings } = await dbClient
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

    activeInnings = newInnings || {
      id: match.id, // Fallback to match.id (guaranteed valid UUID in PostgreSQL)
      match_id: match.id,
      innings_number: 1,
      batting_team_id: team1Id,
      bowling_team_id: team2Id,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0.0,
      status: 'IN_PROGRESS'
    };
  }

  // 4. Fetch Team 1 & Team 2 Players comprehensively
  const fullDetails = await getMatchDetailsForEdit(cleanMatchId);
  const team1Players: any[] = fullDetails?.team1Players || [];
  const team2Players: any[] = fullDetails?.team2Players || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <MobileScoringUI 
        match={match}
        activeInnings={activeInnings}
        team1Players={team1Players}
        team2Players={team2Players}
      />
    </div>
  );
}
