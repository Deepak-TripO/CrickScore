import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import PublicMatchView from '@/components/match/PublicMatchView';
import { getMatchDetailsForEdit } from '@/actions/matches';

export async function generateMetadata({ params }: { params: { matchId: string } }) {
  let db: any = createClient();
  try {
    db = createAdminClient();
  } catch {
    // fallback
  }

  const { data: match } = await db
    .from('matches')
    .select('*')
    .eq('id', params.matchId)
    .maybeSingle();

  if (!match) return { title: 'Match Details | BatScore' };

  return {
    title: `${match.title || 'Live Match'} - BatScore`,
    description: `Watch live ball-by-ball score, scorecard, and commentary for ${match.title || 'this match'} on BatScore.`
  };
}

export default async function MatchDetailsPage({ params }: { params: { matchId: string } }) {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  let { data: match } = await db
    .from('matches')
    .select('*')
    .eq('id', params.matchId)
    .maybeSingle();

  if (!match) {
    notFound();
  }

  // Resolve team 1 and team 2 safely without relying on fragile PostgREST FK join strings
  const team1Id = match.team1_id || match.team_a_id;
  const team2Id = match.team2_id || match.team_b_id;

  let team1: any = null;
  let team2: any = null;

  if (team1Id) {
    const { data: t1 } = await db.from('teams').select('*').eq('id', team1Id).maybeSingle();
    team1 = t1;
  }
  if (team2Id) {
    const { data: t2 } = await db.from('teams').select('*').eq('id', team2Id).maybeSingle();
    team2 = t2;
  }

  const normalizedMatch = {
    ...match,
    team1: team1 || { name: match.your_team_name || (match.title ? match.title.split(' vs ')[0] : 'Team 1'), logo_url: match.your_team_logo_url || null },
    team2: team2 || { name: match.opposite_team_name || (match.title ? match.title.split(' vs ')[1] : 'Team 2'), logo_url: match.opposite_team_logo_url || null }
  };

  // Fetch innings, commentary, and full match player details in parallel
  const [inningsResult, commentaryResult, fullDetails] = await Promise.all([
    db
      .from('innings')
      .select('*')
      .eq('match_id', params.matchId)
      .order('innings_number', { ascending: true }),
    db
      .from('match_commentary')
      .select('*')
      .eq('match_id', params.matchId)
      .order('created_at', { ascending: false }),
    getMatchDetailsForEdit(params.matchId)
  ]);

  const innings = inningsResult.data || [];
  const commentary = commentaryResult.data || [];

  // Fetch deliveries only if innings exist
  const inningsIds = innings.map((i: any) => i.id);
  const { data: deliveries } = inningsIds.length > 0 
    ? await db
        .from('deliveries')
        .select('*')
        .in('innings_id', inningsIds)
        .order('created_at', { ascending: true })
    : { data: [] };

  const team1Players = fullDetails?.team1Players || [];
  const team2Players = fullDetails?.team2Players || [];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicMatchView
        initialMatch={normalizedMatch}
        initialInnings={innings}
        initialDeliveries={deliveries || []}
        initialCommentary={commentary}
        team1Players={team1Players}
        team2Players={team2Players}
      />
    </div>
  );
}
