'use client';

import React, { useState } from 'react';
import { Search, UserCheck } from 'lucide-react';

export default function AdminPlayersTable({ players }: { players: any[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = 
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.display_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* SEARCH AND ROLE FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name or display name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Playing Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-rounder">All-rounder</option>
            <option value="Wicketkeeper">Wicketkeeper</option>
          </select>
        </div>
      </div>

      {/* PLAYERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Player Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Batting Style</th>
                <th className="p-4">Bowling Style</th>
                <th className="p-4">Jersey #</th>
                <th className="p-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No players found matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div>
                        <span>{p.full_name}</span>
                        {p.display_name && (
                          <span className="text-slate-400 font-normal text-[11px] block">"{p.display_name}"</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-purple-400 border border-slate-700">
                        {p.role || 'Player'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300">
                      {p.batting_style || 'Right Hand'}
                    </td>

                    <td className="p-4 text-slate-300">
                      {p.bowling_style || 'Right Arm Medium'}
                    </td>

                    <td className="p-4 font-mono text-emerald-400 font-bold">
                      #{p.jersey_number || 'N/A'}
                    </td>

                    <td className="p-4 text-slate-400" suppressHydrationWarning>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : 'N/A'}
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
