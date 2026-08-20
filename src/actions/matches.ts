'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Helper for Inserting Match safely by dynamically stripping missing schema columns if PostgREST errors
async function insertMatchSafely(db: any, initialPayload: Record<string, any>) {
  let currentPayload = { ...initialPayload };

  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await db.from('matches').insert(currentPayload).select().single();

    if (!error && data) {
      return { data, error: null };
    }

    if (error && error.message) {
      console.warn(`[INSERT MATCH ATTEMPT ${attempt} ERROR]`, error.message);

      const match1 = error.message.match(/Could not find the '([^']+)' column/);
      const match2 = error.message.match(/column "([^"]+)" of relation/i);
      const match3 = error.message.match(/column "([^"]+)" does not exist/i);
      const match4 = error.message.match(/column '([^']+)' does not exist/i);

      const colToRemove = match1?.[1] || match2?.[1] || match3?.[1] || match4?.[1];

      if (colToRemove && currentPayload.hasOwnProperty(colToRemove)) {
        delete currentPayload[colToRemove];
        continue;
      }
    }

    // Fallback attempt: Minimal standard payload
    if (attempt === 10) {
      currentPayload = {
        title: initialPayload.title || 'Cricket Match',
        format: initialPayload.format || 'T20',
        overs: initialPayload.overs || 20,
        category: initialPayload.category || 'League',
        status: 'UPCOMING',
        team1_id: initialPayload.team1_id || initialPayload.team_a_id,
        team2_id: initialPayload.team2_id || initialPayload.team_b_id,
        created_at: new Date().toISOString()
      };
      Object.keys(currentPayload).forEach(k => currentPayload[k] === undefined && delete currentPayload[k]);
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: new Error('Failed to insert match.') };
}

// Helper for Updating Match safely by dynamically stripping missing schema columns if PostgREST errors
async function updateMatchSafely(db: any, matchId: string, initialPayload: Record<string, any>) {
  let currentPayload = { ...initialPayload };

  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await db.from('matches').update(currentPayload).eq('id', matchId).select();

    if (!error) {
      return { data, error: null };
    }

    if (error && error.message) {
      console.warn(`[UPDATE MATCH ATTEMPT ${attempt} ERROR]`, error.message);

      const match1 = error.message.match(/Could not find the '([^']+)' column/);
      const match2 = error.message.match(/column "([^"]+)" of relation/i);
      const match3 = error.message.match(/column "([^"]+)" does not exist/i);
      const match4 = error.message.match(/column '([^']+)' does not exist/i);

      const colToRemove = match1?.[1] || match2?.[1] || match3?.[1] || match4?.[1];

      if (colToRemove && currentPayload.hasOwnProperty(colToRemove)) {
        delete currentPayload[colToRemove];
        continue;
      }
    }

    return { data: null, error };
  }

  return { data: null, error: new Error('Failed to update match.') };
}

export async function createMatch(payload: {
  title: string;
  description?: string;
  playgroundId?: string;
  format: string;
  overs: number;
  category: string;
  scheduledStart: string;
  team1Id: string;
  team2Id: string;
  tossWinnerId?: string;
  tossDecision?: 'BAT' | 'BOWL';
  team1PlayingXI: string[];
  team2PlayingXI: string[];
  umpire1?: string;
  umpire2?: string;
  thirdUmpire?: string;
  scorer?: string;
  matchReferee?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const startTime = payload.scheduledStart || new Date().toISOString();

  // Create match record safely passing both column naming conventions (team1_id/team2_id AND team_a_id/team_b_id)
  const matchPayload: any = {
    master_id: user.id,
    scorer_id: user.id,
    created_by: user.id,
    playground_id: payload.playgroundId || null,
    title: payload.title,
    description: payload.description || null,
    format: payload.format,
    overs: payload.overs,
    category: payload.category,
    scheduled_start: startTime,
    scheduled_at: startTime,
    status: 'UPCOMING',
    team1_id: payload.team1Id,
    team2_id: payload.team2Id,
    team_a_id: payload.team1Id,
    team_b_id: payload.team2Id,
    toss_winner: payload.tossWinnerId || null,
    toss_decision: payload.tossDecision || null,
    umpire1: payload.umpire1 || null,
    umpire2: payload.umpire2 || null,
    third_umpire: payload.thirdUmpire || null,
    scorer: payload.scorer || null,
    match_referee: payload.matchReferee || null,
    current_score: '0/0',
    current_wickets: 0,
    current_over: 0.0
  };

  const { data: match, error: matchError } = await insertMatchSafely(db, matchPayload);

  if (matchError || !match) {
    return { error: matchError?.message || 'Failed to create match.' };
  }

  // Populate match_players
  const matchPlayersToInsert = [
    ...payload.team1PlayingXI.map(pid => ({
      match_id: match.id,
      team_id: payload.team1Id,
      player_id: pid,
      is_playing: true
    })),
    ...payload.team2PlayingXI.map(pid => ({
      match_id: match.id,
      team_id: payload.team2Id,
      player_id: pid,
      is_playing: true
    }))
  ];

  if (matchPlayersToInsert.length > 0) {
    try {
      await db.from('match_players').insert(matchPlayersToInsert);
    } catch {
      // ignore
    }
  }

  // Determine Innings 1 Batting & Bowling teams based on Toss
  let battingTeamId = payload.team1Id;
  let bowlingTeamId = payload.team2Id;

  if (payload.tossWinnerId && payload.tossDecision) {
    if (payload.tossDecision === 'BAT') {
      battingTeamId = payload.tossWinnerId;
      bowlingTeamId = payload.tossWinnerId === payload.team1Id ? payload.team2Id : payload.team1Id;
    } else {
      bowlingTeamId = payload.tossWinnerId;
      battingTeamId = payload.tossWinnerId === payload.team1Id ? payload.team2Id : payload.team1Id;
    }
  }

  // Initialize Innings 1
  try {
    await db.from('innings').insert({
      match_id: match.id,
      innings_number: 1,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0.0,
      status: 'IN_PROGRESS'
    });
  } catch {
    // ignore
  }

  revalidatePath('/master/matches');
  revalidatePath('/matches');
  return { success: true, matchId: match.id };
}

export async function createFullTwoStepMatch(payload: {
  yourTeamName: string;
  yourTeamLogoUrl?: string;
  oppositeTeamName: string;
  oppositeTeamLogoUrl?: string;
  category: 'League' | 'Tournament' | 'Club Match';
  scheduledDate: string;
  overs: number;
  yourTeamPlayers: { name: string; type: 'WK' | 'Batsman' | 'Allrounder' | 'Bowler'; avatarUrl?: string }[];
  oppositeTeamPlayers: { name: string; type: 'WK' | 'Batsman' | 'Allrounder' | 'Bowler'; avatarUrl?: string }[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized: Master Scorer login required.' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const insertTeam = async (name: string, logoUrl?: string) => {
    const shortName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'TEAM';
    
    let { data, error } = await db.from('teams').insert({
      owner_id: user.id,
      manager_id: user.id,
      name,
      short_name: shortName,
      logo_url: logoUrl || null
    }).select().single();

    if (error && error.message.includes('short_name')) {
      const resShort = await db.from('teams').insert({
        owner_id: user.id,
        manager_id: user.id,
        name,
        logo_url: logoUrl || null
      }).select().single();
      data = resShort.data;
      error = resShort.error;
    }

    if (error && error.message.includes('manager_id')) {
      const res2 = await db.from('teams').insert({
        owner_id: user.id,
        name,
        logo_url: logoUrl || null
      }).select().single();
      data = res2.data;
      error = res2.error;
    }

    if (error && error.message.includes('owner_id')) {
      const res3 = await db.from('teams').insert({
        manager_id: user.id,
        name,
        logo_url: logoUrl || null
      }).select().single();
      data = res3.data;
      error = res3.error;
    }

    if (error && (error.message.includes('manager_id') || error.message.includes('owner_id'))) {
      const res4 = await db.from('teams').insert({
        name,
        logo_url: logoUrl || null
      }).select().single();
      data = res4.data;
      error = res4.error;
    }

    return { data, error };
  };

  const insertPlayer = async (p: { name: string; type: string; avatarUrl?: string }, teamId: string) => {
    const pName = p.name.trim();
    if (!pName) return null;

    const roleMapping = p.type === 'WK' ? 'WICKETKEEPER' : p.type === 'Batsman' ? 'BATSMAN' : p.type === 'Bowler' ? 'BOWLER' : 'ALL_ROUNDER';

    // 1. Reuse existing player record for this owner/user if present
    try {
      const { data: existing } = await db
        .from('players')
        .select('*')
        .eq('full_name', pName)
        .eq('owner_id', user.id)
        .maybeSingle();

      if (existing) {
        if (teamId) {
          try { await db.from('team_players').upsert({ team_id: teamId, player_id: existing.id }); } catch {}
          try { await db.from('players').update({ team_id: teamId }).eq('id', existing.id); } catch {}
        }
        return existing;
      }
    } catch {}

    let { data, error } = await db.from('players').insert({
      owner_id: user.id,
      full_name: pName,
      display_name: pName,
      role: roleMapping,
      photo_url: p.avatarUrl || null
    }).select().single();

    if (error || !data) {
      const res2 = await db.from('players').insert({
        full_name: pName,
        display_name: pName,
        role: roleMapping
      }).select().single();
      data = res2.data;
    }

    if (data && teamId) {
      try {
        await db.from('team_players').upsert({
          team_id: teamId,
          player_id: data.id
        });
      } catch {}

      try {
        await db.from('players').update({ team_id: teamId }).eq('id', data.id);
      } catch {}
    }

    return data;
  };

  const { data: team1, error: team1Err } = await insertTeam(payload.yourTeamName, payload.yourTeamLogoUrl);
  if (team1Err || !team1) return { error: `Failed to create Your Team: ${team1Err?.message}` };

  const { data: team2, error: team2Err } = await insertTeam(payload.oppositeTeamName, payload.oppositeTeamLogoUrl);
  if (team2Err || !team2) return { error: `Failed to create Opposite Team: ${team2Err?.message}` };

  const team1PlayerIds: string[] = [];
  for (const p of payload.yourTeamPlayers) {
    if (p.name.trim()) {
      const playerRecord = await insertPlayer(p, team1.id);
      if (playerRecord?.id) team1PlayerIds.push(playerRecord.id);
    }
  }

  const team2PlayerIds: string[] = [];
  for (const p of payload.oppositeTeamPlayers) {
    if (p.name.trim()) {
      const playerRecord = await insertPlayer(p, team2.id);
      if (playerRecord?.id) team2PlayerIds.push(playerRecord.id);
    }
  }

  const matchFormat = payload.overs <= 10 ? 'T10' : payload.overs <= 20 ? 'T20' : 'ODI';
  const matchTitle = `${payload.yourTeamName} vs ${payload.oppositeTeamName}`;
  const startTime = payload.scheduledDate || new Date().toISOString();

  const matchPayload: any = {
    master_id: user.id,
    scorer_id: user.id,
    created_by: user.id,
    title: matchTitle,
    format: matchFormat,
    overs: payload.overs,
    category: payload.category,
    scheduled_start: startTime,
    scheduled_at: startTime,
    status: 'UPCOMING',
    team1_id: team1.id,
    team2_id: team2.id,
    team_a_id: team1.id,
    team_b_id: team2.id,
    your_team_name: payload.yourTeamName,
    opposite_team_name: payload.oppositeTeamName,
    your_team_logo_url: payload.yourTeamLogoUrl || null,
    opposite_team_logo_url: payload.oppositeTeamLogoUrl || null,
    your_team_players: payload.yourTeamPlayers,
    opposite_team_players: payload.oppositeTeamPlayers,
    toss_winner: team1.id,
    toss_decision: 'BAT',
    current_score: '0/0',
    current_wickets: 0,
    current_over: 0.0
  };

  const { data: match, error: matchError } = await insertMatchSafely(db, matchPayload);

  if (matchError || !match) {
    return { error: matchError?.message || 'Failed to create match.' };
  }

  const matchPlayersToInsert: any[] = [];

  team1PlayerIds.forEach((pid, idx) => {
    if (pid) {
      matchPlayersToInsert.push({
        match_id: match.id,
        team_id: team1.id,
        player_id: pid,
        is_playing: true
      });
    }
  });

  team2PlayerIds.forEach((pid, idx) => {
    if (pid) {
      matchPlayersToInsert.push({
        match_id: match.id,
        team_id: team2.id,
        player_id: pid,
        is_playing: true
      });
    }
  });

  if (matchPlayersToInsert.length > 0) {
    try {
      const { error: mpErr } = await db.from('match_players').upsert(matchPlayersToInsert, { onConflict: 'match_id,player_id' });
      if (mpErr) {
        console.warn('[CREATE MATCH PLAYERS UPSERT WARNING]', mpErr.message);
        for (const row of matchPlayersToInsert) {
          try {
            await db.from('match_players').insert(row);
          } catch (rErr: any) {
            console.warn('[CREATE MATCH PLAYERS ROW INSERT WARNING]', rErr.message);
          }
        }
      }
    } catch (e: any) {
      console.warn('[CREATE MATCH PLAYERS CATCH]', e.message);
    }
  }

  try {
    await db.from('innings').insert({
      match_id: match.id,
      innings_number: 1,
      batting_team_id: team1.id,
      bowling_team_id: team2.id,
      total_runs: 0,
      total_wickets: 0,
      total_overs: 0.0,
      status: 'IN_PROGRESS'
    });
  } catch {}

  revalidatePath('/master/dashboard');
  revalidatePath('/master/matches');
  revalidatePath('/matches');
  return { success: true, matchId: match.id };
}

export async function getMatchDetailsForEdit(matchId: string) {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { data: match } = await db.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match) return null;

  const team1Id = match.team1_id || match.team_a_id;
  const team2Id = match.team2_id || match.team_b_id;

  let team1Obj: any = null;
  let team2Obj: any = null;

  if (team1Id) {
    const { data: t1 } = await db.from('teams').select('*').eq('id', team1Id).maybeSingle();
    if (t1) team1Obj = t1;
  }

  if (team2Id) {
    const { data: t2 } = await db.from('teams').select('*').eq('id', team2Id).maybeSingle();
    if (t2) team2Obj = t2;
  }

  const fetchPlayersForTeam = async (teamId: string, isTeam1: boolean): Promise<any[]> => {
    const allFoundPlayers: any[] = [];
    const seenNames = new Set<string>();

    const addPlayer = (p: any) => {
      if (!p) return;
      const pName = p.name || p.full_name || p.display_name || p.player_name || (typeof p === 'string' ? p : '');
      if (!pName || !pName.trim()) return;

      const nameKey = pName.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        let type: string = p.type || p.role || p.player_type || 'Batsman';
        const rUpper = String(type).toUpperCase();
        if (rUpper.includes('WICKET') || rUpper === 'WK' || rUpper.includes('KEEPER')) type = 'WK';
        else if (rUpper.includes('BOWLER') || rUpper === 'BOWL') type = 'Bowler';
        else if (rUpper.includes('ALL') || rUpper === 'AR' || rUpper.includes('ROUND')) type = 'Allrounder';
        else type = 'Batsman';

        allFoundPlayers.push({
          id: p.id || `p_${nameKey}`,
          name: pName.trim(),
          type,
          role: type,
          avatar_url: p.avatar_url || p.image_url || p.profile_image || p.avatarUrl || p.photo_url || ''
        });
      }
    };

    // 1. Direct JSON arrays on match record
    let jsonPlayers = isTeam1
      ? (match.your_team_players || match.team1_players || match.team_1_players || match.players_a)
      : (match.opposite_team_players || match.team2_players || match.team_2_players || match.players_b);

    if (typeof jsonPlayers === 'string') {
      try { jsonPlayers = JSON.parse(jsonPlayers); } catch {}
    }

    if (Array.isArray(jsonPlayers)) {
      jsonPlayers.forEach(addPlayer);
    }

    // 2. Query match_players table for this specific match ID
    try {
      const { data: mpRows, error: mpErr } = await db
        .from('match_players')
        .select('*')
        .eq('match_id', matchId);

      if (!mpErr && mpRows && mpRows.length > 0) {
        // Filter rows belonging to this team
        const teamMpRows = mpRows.filter((r: any) => {
          if (teamId && r.team_id) {
            return String(r.team_id).toLowerCase() === String(teamId).toLowerCase();
          }
          if (!r.team_id) {
            const half = Math.ceil(mpRows.length / 2);
            const idx = mpRows.indexOf(r);
            return isTeam1 ? idx < half : idx >= half;
          }
          return true;
        });

        const playerIds = teamMpRows.map((r: any) => r.player_id).filter(Boolean);

        if (playerIds.length > 0) {
          const { data: pList } = await db
            .from('players')
            .select('*')
            .in('id', playerIds);

          if (pList && pList.length > 0) {
            const playerMap = new Map<string, any>();
            pList.forEach((pRec: any) => playerMap.set(String(pRec.id), pRec));

            for (const r of teamMpRows) {
              const pRec = playerMap.get(String(r.player_id));
              if (pRec) {
                addPlayer({
                  id: pRec.id,
                  name: pRec.full_name || pRec.display_name || pRec.name,
                  role: pRec.role || r.role || 'BATSMAN',
                  avatar_url: pRec.photo_url || pRec.avatar_url || ''
                });
              } else if (r.player_name || r.name) {
                addPlayer({
                  id: r.player_id || r.id,
                  name: r.player_name || r.name,
                  role: r.role || 'BATSMAN',
                  avatar_url: r.avatar_url || ''
                });
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[EDIT FETCH MATCH PLAYERS CATCH]', e?.message);
    }

    // 3. Fallback: Query team_players join table ONLY if fewer than 11 players found
    if (allFoundPlayers.length < 11 && teamId) {
      try {
        const { data: tp } = await db.from('team_players').select('player_id').eq('team_id', teamId);
        if (tp && tp.length > 0) {
          const pIds = tp.map((item: any) => item.player_id).filter(Boolean);
          if (pIds.length > 0) {
            const { data: pList } = await db.from('players').select('*').in('id', pIds);
            if (pList && pList.length > 0) {
              pList.forEach((p: any) => addPlayer({
                ...p,
                name: p.name || p.full_name || p.display_name
              }));
            }
          }
        }
      } catch {}

      // 4. Fallback: Query players table directly by team_id ONLY if fewer than 11 players found
      if (allFoundPlayers.length < 11) {
        try {
          const { data: directPlayers } = await db.from('players').select('*').eq('team_id', teamId);
          if (directPlayers && directPlayers.length > 0) {
            directPlayers.forEach((p: any) => addPlayer({
              ...p,
              name: p.name || p.full_name || p.display_name
            }));
          }
        } catch {}
      }
    }

    return allFoundPlayers;
  };

  const [team1Players, team2Players] = await Promise.all([
    fetchPlayersForTeam(team1Id, true),
    fetchPlayersForTeam(team2Id, false)
  ]);

  console.log(`[EDIT FETCH] Editing Match ID: ${matchId}`);
  console.log(`[EDIT FETCH] Team 1 ID: ${team1Id}`);
  console.log(`[EDIT FETCH] Team 1 Players: ${team1Players.length}`);
  console.log(`[EDIT FETCH] Team 1 Player Names:`, team1Players.map((p: any) => p.name || p.full_name || p.display_name));
  console.log(`[EDIT FETCH] Team 2 ID: ${team2Id}`);
  console.log(`[EDIT FETCH] Team 2 Players: ${team2Players.length}`);
  console.log(`[EDIT FETCH] Team 2 Player Names:`, team2Players.map((p: any) => p.name || p.full_name || p.display_name));

  const yourTeamName = match.your_team_name || team1Obj?.name || (match.title ? match.title.split(' vs ')[0] : '');
  const yourTeamLogoUrl = match.your_team_logo_url || team1Obj?.logo_url || '';
  const oppositeTeamName = match.opposite_team_name || team2Obj?.name || (match.title ? match.title.split(' vs ')[1] : '');
  const oppositeTeamLogoUrl = match.opposite_team_logo_url || team2Obj?.logo_url || '';

  return {
    ...match,
    your_team_name: yourTeamName,
    your_team_logo_url: yourTeamLogoUrl,
    opposite_team_name: oppositeTeamName,
    opposite_team_logo_url: oppositeTeamLogoUrl,
    team1: team1Obj || match.team1,
    team2: team2Obj || match.team2,
    team1Players,
    team2Players
  };
}

export async function updateFullMatch(payload: {
  matchId: string;
  yourTeamName: string;
  yourTeamLogoUrl?: string;
  oppositeTeamName: string;
  oppositeTeamLogoUrl?: string;
  category: 'League' | 'Tournament' | 'Club Match';
  format?: string;
  scheduledDate: string;
  venue?: string;
  status?: string;
  overs: number;
  yourTeamPlayers: { id?: string; name: string; type: 'WK' | 'Batsman' | 'Allrounder' | 'Bowler'; avatarUrl?: string }[];
  oppositeTeamPlayers: { id?: string; name: string; type: 'WK' | 'Batsman' | 'Allrounder' | 'Bowler'; avatarUrl?: string }[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized: Master Scorer login required.' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { data: match, error: fetchErr } = await db.from('matches').select('*').eq('id', payload.matchId).maybeSingle();
  if (!match || fetchErr) return { error: 'Match not found.' };

  const isAuthorized = match.master_id === user.id || match.created_by === user.id || match.scorer_id === user.id;
  if (!isAuthorized) return { error: 'Unauthorized: Only the match creator can update this match.' };

  const matchFormat = payload.format || (payload.overs <= 10 ? 'T10' : payload.overs <= 20 ? 'T20' : 'ODI');
  const matchTitle = `${payload.yourTeamName} vs ${payload.oppositeTeamName}`;
  const startTime = payload.scheduledDate || new Date().toISOString();

  const updateMatchData: any = {
    title: matchTitle,
    format: matchFormat,
    overs: payload.overs,
    category: payload.category,
    scheduled_start: startTime,
    scheduled_at: startTime,
    venue: payload.venue || null,
    status: payload.status || match.status,
    your_team_name: payload.yourTeamName,
    opposite_team_name: payload.oppositeTeamName,
    your_team_players: payload.yourTeamPlayers,
    opposite_team_players: payload.oppositeTeamPlayers,
    updated_at: new Date().toISOString()
  };

  if (payload.yourTeamLogoUrl) updateMatchData.your_team_logo_url = payload.yourTeamLogoUrl;
  if (payload.oppositeTeamLogoUrl) updateMatchData.opposite_team_logo_url = payload.oppositeTeamLogoUrl;

  const { error: matchUpdateErr } = await updateMatchSafely(db, payload.matchId, updateMatchData);
  if (matchUpdateErr) return { error: matchUpdateErr.message };

  if (match.team1_id) {
    try {
      await db.from('teams').update({
        name: payload.yourTeamName,
        logo_url: payload.yourTeamLogoUrl || null
      }).eq('id', match.team1_id);
    } catch {}
  }

  if (match.team2_id) {
    try {
      await db.from('teams').update({
        name: payload.oppositeTeamName,
        logo_url: payload.oppositeTeamLogoUrl || null
      }).eq('id', match.team2_id);
    } catch {}
  }

  const insertOrUpdatePlayer = async (p: { id?: string; name: string; type: string; avatarUrl?: string }, teamId: string) => {
    const roleMapping = p.type === 'WK' ? 'WICKETKEEPER' : p.type === 'Batsman' ? 'BATSMAN' : p.type === 'Bowler' ? 'BOWLER' : 'ALL_ROUNDER';

    if (p.id && !p.id.startsWith('y_') && !p.id.startsWith('o_') && !p.id.startsWith('p_') && !p.id.includes('pad')) {
      try {
        await db.from('players').update({
          full_name: p.name,
          display_name: p.name,
          role: roleMapping,
          photo_url: p.avatarUrl || null
        }).eq('id', p.id);
        return p.id;
      } catch {}
    }

    let { data, error } = await db.from('players').insert({
      owner_id: user.id,
      full_name: p.name,
      display_name: p.name,
      role: roleMapping,
      photo_url: p.avatarUrl || null
    }).select().single();

    if (error || !data) {
      const resFallback = await db.from('players').insert({
        full_name: p.name,
        display_name: p.name,
        role: roleMapping
      }).select().single();
      data = resFallback.data;
    }

    if (data && teamId) {
      try {
        await db.from('team_players').upsert({
          team_id: teamId,
          player_id: data.id
        });
      } catch {}

      try {
        await db.from('players').update({ team_id: teamId }).eq('id', data.id);
      } catch {}
    }

    return data?.id;
  };

  try {
    await db.from('match_players').delete().eq('match_id', payload.matchId);
  } catch {}

  const matchPlayersToInsert: any[] = [];

  for (const p of payload.yourTeamPlayers) {
    if (p.name.trim()) {
      const pid = await insertOrUpdatePlayer(p, match.team1_id);
      if (pid) {
        matchPlayersToInsert.push({
          match_id: payload.matchId,
          team_id: match.team1_id,
          player_id: pid,
          is_playing: true
        });
      }
    }
  }

  for (const p of payload.oppositeTeamPlayers) {
    if (p.name.trim()) {
      const pid = await insertOrUpdatePlayer(p, match.team2_id);
      if (pid) {
        matchPlayersToInsert.push({
          match_id: payload.matchId,
          team_id: match.team2_id,
          player_id: pid,
          is_playing: true
        });
      }
    }
  }

  if (matchPlayersToInsert.length > 0) {
    try {
      const { error: mpUpdateErr } = await db.from('match_players').upsert(matchPlayersToInsert, { onConflict: 'match_id,player_id' });
      if (mpUpdateErr) {
        console.warn('[UPDATE MATCH PLAYERS UPSERT WARNING]', mpUpdateErr.message);
        for (const row of matchPlayersToInsert) {
          try {
            await db.from('match_players').insert(row);
          } catch (rErr: any) {
            console.warn('[UPDATE MATCH PLAYERS ROW INSERT WARNING]', rErr.message);
          }
        }
      }
    } catch (e: any) {
      console.warn('[UPDATE MATCH PLAYERS CATCH]', e.message);
    }
  }

  revalidatePath('/master/dashboard');
  revalidatePath('/master/matches');
  revalidatePath('/matches');
  revalidatePath(`/matches/${payload.matchId}`);

  return { success: true };
}

export async function updateMatch(payload: {
  matchId: string;
  title?: string;
  yourTeamName?: string;
  yourTeamLogoUrl?: string;
  oppositeTeamName?: string;
  oppositeTeamLogoUrl?: string;
  scheduledStart?: string;
  venue?: string;
  overs?: number;
  category?: string;
  format?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized: Master Scorer login required.' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { data: match } = await db.from('matches').select('*').eq('id', payload.matchId).maybeSingle();
  if (!match) return { error: 'Match not found.' };

  const isAuthorized = match.master_id === user.id || match.created_by === user.id || match.scorer_id === user.id;
  if (!isAuthorized) return { error: 'Unauthorized: Only the match creator can update this match.' };

  const isLiveOrCompleted = match.status === 'LIVE' || match.status === 'COMPLETED';

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (payload.title) updateData.title = payload.title;
  if (payload.scheduledStart) {
    updateData.scheduled_start = payload.scheduledStart;
    updateData.scheduled_at = payload.scheduledStart;
  }
  if (payload.category) updateData.category = payload.category;
  if (payload.format) updateData.format = payload.format;

  if (payload.yourTeamName) {
    updateData.your_team_name = payload.yourTeamName;
    if (match.team1_id) {
      try { await db.from('teams').update({ name: payload.yourTeamName }).eq('id', match.team1_id); } catch {}
    }
  }
  if (payload.yourTeamLogoUrl) {
    updateData.your_team_logo_url = payload.yourTeamLogoUrl;
    if (match.team1_id) {
      try { await db.from('teams').update({ logo_url: payload.yourTeamLogoUrl }).eq('id', match.team1_id); } catch {}
    }
  }

  if (payload.oppositeTeamName) {
    updateData.opposite_team_name = payload.oppositeTeamName;
    if (match.team2_id) {
      try { await db.from('teams').update({ name: payload.oppositeTeamName }).eq('id', match.team2_id); } catch {}
    }
  }
  if (payload.oppositeTeamLogoUrl) {
    updateData.opposite_team_logo_url = payload.oppositeTeamLogoUrl;
    if (match.team2_id) {
      try { await db.from('teams').update({ logo_url: payload.oppositeTeamLogoUrl }).eq('id', match.team2_id); } catch {}
    }
  }

  if (!isLiveOrCompleted && payload.overs) {
    updateData.overs = payload.overs;
  }

  const { error } = await updateMatchSafely(db, payload.matchId, updateData);

  if (error) return { error: error.message };

  revalidatePath('/master/dashboard');
  revalidatePath('/master/matches');
  revalidatePath('/matches');

  return { success: true };
}

export async function deleteMatch(matchId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized: Master Scorer login required.' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  // Verify ownership before deleting
  const { data: targetMatch } = await db.from('matches').select('master_id, created_by, scorer_id').eq('id', matchId).maybeSingle();
  if (targetMatch) {
    const isOwner = targetMatch.master_id === user.id || targetMatch.created_by === user.id || targetMatch.scorer_id === user.id;
    if (!isOwner) {
      return { error: 'Unauthorized: You can only delete your own matches.' };
    }
  }

  // 1. Cascade delete all child records by match_id
  try {
    const { data: innings } = await db.from('innings').select('id').eq('match_id', matchId);
    if (innings && innings.length > 0) {
      const inningsIds = innings.map((i: any) => i.id);
      try { await db.from('deliveries').delete().in('innings_id', inningsIds); } catch {}
      try { await db.from('overs').delete().in('innings_id', inningsIds); } catch {}
    }
  } catch {}

  try { await db.from('match_commentary').delete().eq('match_id', matchId); } catch {}
  try { await db.from('match_players').delete().eq('match_id', matchId); } catch {}
  try { await db.from('ball_by_ball').delete().eq('match_id', matchId); } catch {}
  try { await db.from('innings').delete().eq('match_id', matchId); } catch {}

  // Mark match status as DELETED so it is tracked under Deleted Matches in Product Admin Overview
  let { error: deleteErr } = await db.from('matches').update({ status: 'DELETED', updated_at: new Date().toISOString() }).eq('id', matchId);

  if (deleteErr) {
    const { error: hardDeleteErr } = await db.from('matches').delete().eq('id', matchId);
    if (hardDeleteErr) {
      console.error('[DELETE MATCH ERROR]', hardDeleteErr);
      return { error: hardDeleteErr.message || 'Failed to delete match.' };
    }
  }

  revalidatePath('/master/dashboard');
  revalidatePath('/master/matches');
  revalidatePath('/matches');

  return { success: true };
}

export async function startMatch(matchId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const { error } = await db
    .from('matches')
    .update({ status: 'LIVE', updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('master_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/master/matches/${matchId}/score`);
  revalidatePath(`/matches/${matchId}`);
  return { success: true };
}
