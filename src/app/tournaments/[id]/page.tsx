'use client';

import React, { useState } from 'react';
import { MOCK_TOURNAMENTS, MOCK_TEAMS, MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mockData';
import { calculatePointsTable } from '@/lib/cricket/pointsTable';
import { MatchCard } from '@/components/match/MatchCard';
import { Trophy, Calendar, MapPin, Shield, Activity, Award } from 'lucide-react';

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const tournament = MOCK_TOURNAMENTS.find((t) => t.id === params.id) || MOCK_TOURNAMENTS[0];
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATCHES' | 'TEAMS' | 'POINTS_TABLE'>('POINTS_TABLE');

  const pointsTable = calculatePointsTable(MOCK_TEAMS, MOCK_MATCHES);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950">
            {tournament.format} TOURNAMENT
          </span>
          <span className="text-xs font-bold text-slate-400">Status: {tournament.status}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black">{tournament.name}</h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          {tournament.description}
        </p>

        <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-400 border-t border-slate-800">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> {tournament.location}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-400" /> {tournament.start_date} to {tournament.end_date}</span>
          <span className="text-emerald-400 font-bold">🏆 {tournament.prize_info}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-extrabold overflow-x-auto">
        {[
          { id: 'POINTS_TABLE', label: 'Points Table' },
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'MATCHES', label: 'Matches' },
          { id: 'TEAMS', label: 'Teams' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 border-b-2 shrink-0 transition-all ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Points Table Tab */}
      {activeTab === 'POINTS_TABLE' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Tournament Standings & Net Run Rate (NRR)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-3 text-center">W</th>
                  <th className="py-3 px-3 text-center">L</th>
                  <th className="py-3 px-3 text-center">T</th>
                  <th className="py-3 px-3 text-center font-black text-slate-900">PTS</th>
                  <th className="py-3 px-4 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {pointsTable.map((team, idx) => (
                  <tr key={team.team_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600" /> {team.team_name}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-700">{team.played}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">{team.won}</td>
                    <td className="py-3.5 px-3 text-center text-rose-600 font-bold">{team.lost}</td>
                    <td className="py-3.5 px-3 text-center text-slate-500">{team.tied}</td>
                    <td className="py-3.5 px-3 text-center font-black text-slate-900 text-base">{team.points}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      {team.net_run_rate >= 0 ? `+${team.net_run_rate}` : team.net_run_rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'MATCHES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_MATCHES.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_TEAMS.map((team) => (
            <div key={team.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 mx-auto flex items-center justify-center font-black text-xl text-emerald-900">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">{team.name}</h4>
              <span className="text-xs font-semibold text-slate-500">15 Players Registered</span>
            </div>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4">
          <h3 className="text-xl font-black text-slate-900">Tournament Rules & Guidelines</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{tournament.rules}</p>
        </div>
      )}
    </div>
  );
}
