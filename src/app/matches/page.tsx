'use client';

import React, { useState } from 'react';
import { MOCK_MATCHES } from '@/lib/mockData';
import { MatchCard } from '@/components/match/MatchCard';
import { Radio, Filter, Calendar, Trophy } from 'lucide-react';

export default function MatchesPage() {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMatches = MOCK_MATCHES.filter((m) => {
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.team_a.name.toLowerCase().includes(q) ||
        m.team_b.name.toLowerCase().includes(q) ||
        (m.tournament_name && m.tournament_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Radio className="w-7 h-7 text-emerald-600 animate-pulse" /> Matches & Live Scores
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Browse live ball-by-ball matches, upcoming schedules, and recent tournament scorecards.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-extrabold shrink-0">
          {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team or tournament..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">No Matches Found</h3>
          <p className="text-sm text-slate-400">Try adjusting your status filter or search term.</p>
        </div>
      )}
    </div>
  );
}
