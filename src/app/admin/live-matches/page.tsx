import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Radio, Eye, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function AdminLiveMatchesPage() {
  const supabase = createClient();

  // Fetch currently LIVE matches only with full team and score details
  const { data: rawMatches } = await supabase
    .from('matches')
    .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)')
    .eq('status', 'LIVE')
    .order('created_at', { ascending: false });

  const liveMatches = (rawMatches || []).filter(m => m.status === 'LIVE');

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 text-white">
          <Radio className="w-7 h-7 text-red-500 animate-pulse" />
          Live Matches Monitor
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time oversight and full match details of currently ongoing matches.
        </p>
      </div>

      {!liveMatches || liveMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-3 shadow-xl">
          <Radio className="w-10 h-10 text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-400">No Live Matches Right Now</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When matches are currently live, full live match card details will update dynamically here.
          </p>
          <div className="pt-2">
            <Link href="/admin/matches" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md">
              View All Matches
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((match: any) => {
            const team1Name = match.team1?.name || match.your_team_name || 'Team 1';
            const team2Name = match.team2?.name || match.opposite_team_name || 'Team 2';
            const category = match.category || match.title || 'Tournament';
            const matchDateStr = match.created_at || match.scheduled_start || match.scheduled_at;
            const matchDate = matchDateStr
              ? new Date(matchDateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '14 Aug 2026';

            return (
              <div key={match.id} className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  LIVE NOW
                </div>

                {/* TOP MATCH CATEGORY & DATE */}
                <div className="flex items-center justify-between pr-24">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider">{category}</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{matchDate}</span>
                  </div>
                </div>

                {/* FULL TEAM DETAILS & LIVE SCORES */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                        {team1Name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-extrabold text-white text-sm">{team1Name}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-400 text-lg">
                      {match.current_score || '0/0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                        {team2Name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-300 text-sm">{team2Name}</span>
                    </div>
                    <span className="font-mono text-slate-300 font-bold">{match.current_over || '0.0'} Overs</span>
                  </div>
                </div>

                {/* TOSS & RESULT SUMMARY */}
                {match.result_summary && (
                  <p className="text-xs font-medium text-amber-400 bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    {match.result_summary}
                  </p>
                )}

                {/* ACTIONS */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">ID: {match.id?.slice(0, 8)}</span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Public Scorecard →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
