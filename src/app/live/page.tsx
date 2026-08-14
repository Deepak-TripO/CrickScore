import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import MatchCard from '@/components/match/MatchCard';
import { getUserAndRole } from '@/lib/auth';
import { Radio } from 'lucide-react';

export default async function LiveMatchesPage() {
  const { user, role: userRole } = await getUserAndRole();
  const supabase = createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('id, title, format, category, status, current_score, current_wickets, current_over, result_summary, scheduled_start, viewer_count, team1:teams!matches_team1_id_fkey(name, short_name, logo_url), team2:teams!matches_team2_id_fkey(name, short_name, logo_url), playground:playgrounds(name, city), master:profiles!matches_master_id_fkey(full_name)')
    .eq('status', 'LIVE')
    .order('scheduled_start', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-2xl font-extrabold tracking-tight">Live Matches</h1>
          </div>
          <span className="text-xs px-3 py-1 bg-red-950 text-red-400 border border-red-500/30 rounded-full font-bold">
            {matches?.length || 0} Matches Live Now
          </span>
        </div>

        {!matches || matches.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm space-y-2">
            <p>No live matches currently in progress.</p>
            <p className="text-xs text-slate-500">Check out the upcoming matches schedule!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
