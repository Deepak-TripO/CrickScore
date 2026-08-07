import React from 'react';
import { MOCK_TEAMS, MOCK_PLAYERS, MOCK_MATCHES } from '@/lib/mockData';
import { MatchCard } from '@/components/match/MatchCard';
import { Shield, Users, Trophy } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const team = MOCK_TEAMS.find((t) => t.id === params.id) || MOCK_TEAMS[0];
  const teamPlayers = MOCK_PLAYERS.filter((p) => p.team_id === team.id);
  const teamMatches = MOCK_MATCHES.filter((m) => m.team_a.id === team.id || m.team_b.id === team.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center font-black text-3xl text-emerald-900 shrink-0 overflow-hidden">
          {team.logo_url ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" /> : team.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900">{team.name}</h1>
          <p className="text-sm font-medium text-slate-500">Participating in Bangalore Premier T20 Cup 2026</p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-600">
            <span>Matches: 12</span>
            <span className="text-emerald-600">Wins: 8</span>
            <span className="text-rose-600">Losses: 4</span>
          </div>
        </div>
      </div>

      {/* Squad Roster */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" /> Squad Roster
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PLAYERS.map((player) => (
            <div key={player.id} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  #{player.jersey_number}
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">{player.role}</span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{player.name}</h4>
              <p className="text-xs text-slate-500 font-medium">{player.batting_style}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> Team Matches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
