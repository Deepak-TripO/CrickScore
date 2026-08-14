import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Radio, MapPin, User, ArrowRight, Eye, Calendar, Trophy } from 'lucide-react';
import Link from 'next/link';

export default async function AdminLiveMatchesPage() {
  const supabase = createClient();

  // Fetch Live Matches
  const { data: liveMatches } = await supabase
    .from('matches')
    .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*), playground:playgrounds(*), master:profiles!matches_master_id_fkey(*)')
    .eq('status', 'LIVE')
    .order('scheduled_start', { ascending: false });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Radio className="w-7 h-7 text-red-500 animate-pulse" />
          Live Matches Monitor
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time oversight of ongoing matches, live scorecards, and scoring activity across playgrounds.
        </p>
      </div>

      {!liveMatches || liveMatches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-3">
          <Radio className="w-10 h-10 text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-400">No Live Matches Right Now</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When Master Scorers start scoring matches in real time, live scorecard monitors will appear here.
          </p>
          <div className="pt-2">
            <Link href="/admin/matches" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">
              View All Scheduled Matches
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveMatches.map((match: any) => (
            <div key={match.id} className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE SCORING NOW
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{match.category || 'Cricket Match'} • {match.format || 'T20'}</span>
                <h3 className="text-lg font-black text-white mt-0.5">{match.title}</h3>
              </div>

              {/* SCORES DISPLAY */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/30">
                      T1
                    </div>
                    <span className="font-bold text-white text-sm">{match.team1?.name}</span>
                  </div>
                  <span className="font-mono font-black text-emerald-400 text-lg">
                    {match.current_score || '0/0'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-2">
                  <span className="font-semibold">{match.team2?.name} (Team 2)</span>
                  <span className="font-mono text-slate-300 font-bold">{match.current_over || '0.0'} / {match.overs || 20} Overs</span>
                </div>
              </div>

              {/* MATCH DETAILS */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">Master: <strong>{match.master?.full_name || 'Assigned Scorer'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{match.playground?.name || 'Ground Unassigned'}</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">ID: {match.id?.slice(0, 8)}...</span>
                <Link
                  href={`/matches/${match.id}`}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Public Scorecard →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
