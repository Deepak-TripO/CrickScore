'use client';

import React, { useState } from 'react';
import { Search, Shield, User, Calendar, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function AdminTeamsTable({ teams }: { teams: any[] }) {
  const [search, setSearch] = useState('');

  const filteredTeams = teams.filter((t) => {
    const matchesName = (t.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesShort = (t.short_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesOwner = (t.owner?.full_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesName || matchesShort || matchesOwner;
  });

  return (
    <div className="space-y-4">
      {/* SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name, short name, or manager..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* TEAMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
            No teams found matching your search.
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div key={team.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-500/30 text-indigo-400 font-black text-sm flex items-center justify-center uppercase shrink-0">
                    {team.short_name || team.name?.slice(0, 2) || 'TM'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{team.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">[{team.short_name || 'TEAM'}]</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {team.players_count || 0} Players
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Team Manager:</span>
                  <strong className="text-slate-200">{team.owner?.full_name || 'Registered Manager'}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Team ID:</span>
                  <span className="font-mono text-slate-400">{team.id?.slice(0, 8)}...</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Created Date:</span>
                  <span className="text-slate-400" suppressHydrationWarning>{team.created_at ? new Date(team.created_at).toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <Link
                  href={`/teams`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
