import React from 'react';
import { MOCK_PLAYERS } from '@/lib/mockData';
import { User, Award, Shield, Activity } from 'lucide-react';

export default function PlayerDetailPage({ params }: { params: { id: string } }) {
  const player = MOCK_PLAYERS.find((p) => p.id === params.id) || MOCK_PLAYERS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Player Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col sm:flex-row items-center gap-8">
        <div className="w-28 h-28 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-4xl text-emerald-400 shrink-0">
          #{player.jersey_number || '10'}
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase">
            {player.role}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">{player.name}</h1>
          <p className="text-sm font-bold text-slate-400">{player.team_name}</p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300 font-semibold">
            <span>Batting: <strong>{player.batting_style}</strong></span>
            <span>•</span>
            <span>Bowling: <strong>{player.bowling_style}</strong></span>
          </div>
        </div>
      </div>

      {/* Core Career Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Matches', val: player.matches, color: 'text-slate-900' },
          { label: 'Total Runs', val: player.runs, color: 'text-emerald-600' },
          { label: 'Wickets', val: player.wickets, color: 'text-rose-600' },
          { label: 'Batting Avg', val: player.average, color: 'text-slate-900' },
          { label: 'Strike Rate', val: player.strike_rate, color: 'text-amber-600' },
          { label: 'Economy', val: player.economy, color: 'text-blue-600' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase">{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
