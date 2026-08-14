import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AdminTeamsTable from './AdminTeamsTable';
import { Shield } from 'lucide-react';

export default async function AdminTeamsPage() {
  const supabase = createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('*, owner:profiles!teams_owner_id_fkey(*)')
    .order('created_at', { ascending: false });

  // Fetch player counts per team
  const { data: teamPlayers } = await supabase
    .from('team_players')
    .select('team_id');

  const teamPlayerCounts: Record<string, number> = {};
  if (teamPlayers) {
    teamPlayers.forEach((tp: any) => {
      teamPlayerCounts[tp.team_id] = (teamPlayerCounts[tp.team_id] || 0) + 1;
    });
  }

  const enrichedTeams = (teams || []).map((t: any) => ({
    ...t,
    players_count: teamPlayerCounts[t.id] || 0
  }));

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Shield className="w-7 h-7 text-purple-400" />
          Teams Management ({teams?.length || 0})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Overview of all registered cricket teams, team managers, and player rosters.
        </p>
      </div>

      <AdminTeamsTable teams={enrichedTeams} />
    </div>
  );
}
