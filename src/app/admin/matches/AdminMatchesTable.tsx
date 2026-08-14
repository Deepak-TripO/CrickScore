'use client';

import React, { useState } from 'react';
import { Search, Trophy, MapPin, User, Eye, Radio, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminMatchesTable({ matches }: { matches: any[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredMatches = matches.filter((m) => {
    const titleMatch = (m.title || '').toLowerCase().includes(search.toLowerCase());
    const team1Match = (m.team1?.name || '').toLowerCase().includes(search.toLowerCase());
    const team2Match = (m.team2?.name || '').toLowerCase().includes(search.toLowerCase());
    const masterMatch = (m.master?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const groundMatch = (m.playground?.name || '').toLowerCase().includes(search.toLowerCase());

    const matchesSearch = titleMatch || team1Match || team2Match || masterMatch || groundMatch;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by match title, teams, master, or playground..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="LIVE">LIVE</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* MATCHES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Match Title & Format</th>
                <th className="p-4">Teams</th>
                <th className="p-4">Master Scorer</th>
                <th className="p-4">Playground</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Scorecard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No matches found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <span className="font-bold text-white block">{m.title}</span>
                        <span className="text-slate-400 text-[11px]">{m.category || 'Friendly'} • {m.format || 'T20'} ({m.overs || 20} Overs)</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-200">
                        <span>{m.team1?.name || 'Team A'}</span>
                        <span className="text-slate-500 mx-1">vs</span>
                        <span>{m.team2?.name || 'Team B'}</span>
                      </div>
                      {m.current_score && (
                        <span className="text-[11px] text-emerald-400 font-mono block">Score: {m.current_score}</span>
                      )}
                    </td>

                    <td className="p-4 font-medium text-slate-300">
                      {m.master?.full_name || 'Assigned Scorer'}
                    </td>

                    <td className="p-4 text-slate-300">
                      {m.playground?.name || 'Ground Unassigned'}
                    </td>

                    <td className="p-4 text-slate-400">
                      {new Date(m.scheduled_start).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        m.status === 'LIVE' 
                          ? 'bg-red-950 text-red-400 border-red-500/30 animate-pulse'
                          : m.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : m.status === 'UPCOMING'
                          ? 'bg-amber-950 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/matches/${m.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
