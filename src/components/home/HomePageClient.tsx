'use client';

import React, { useState } from 'react';
import MatchCard from '@/components/match/MatchCard';
import { Trophy, Search, CheckCheck, Radio } from 'lucide-react';

interface HomePageClientProps {
  user: any;
  userRole: string;
  allMatches: any[];
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export default function HomePageClient({
  allMatches = [],
  searchQuery = '',
  setSearchQuery
}: HomePageClientProps) {
  const [activeStatus, setActiveStatus] = useState<'LIVE' | 'COMPLETED'>('LIVE');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Tournament', 'League', 'Club'];

  // Filter matches dynamically based strictly on MATCH STATUS (LIVE vs COMPLETED) AND TEAM NAME ONLY
  const filteredMatches = allMatches.filter((m: any) => {
    const matchStatus = (m.status || '').toString().toUpperCase();

    // 1. MATCH STATUS FILTER (LIVE vs COMPLETED)
    if (activeStatus === 'LIVE' && matchStatus !== 'LIVE') {
      return false;
    }
    if (activeStatus === 'COMPLETED' && matchStatus !== 'COMPLETED') {
      return false;
    }

    // 2. STRICT TEAM NAME ONLY SEARCH FILTER (Team 1 OR Team 2)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      const t1 = Array.isArray(m.team1) ? m.team1[0] : m.team1;
      const t2 = Array.isArray(m.team2) ? m.team2[0] : m.team2;

      const team1Name = (t1?.name || m.your_team_name || (m.title ? m.title.split(' vs ')[0] : '') || '').toLowerCase();
      const team2Name = (t2?.name || m.opposite_team_name || (m.title ? m.title.split(' vs ')[1] : '') || '').toLowerCase();

      const matchesTeam1 = team1Name.includes(q);
      const matchesTeam2 = team2Name.includes(q);

      if (!matchesTeam1 && !matchesTeam2) {
        return false;
      }
    }

    // 3. Category Filter
    if (activeCategory === 'All') return true;

    const matchCategory = (m.category || m.format || m.match_type || '').toString().toLowerCase();
    const targetCategory = activeCategory.toLowerCase();

    if (targetCategory === 'tournament') {
      return matchCategory.includes('tournament') || matchCategory.includes('t20');
    }
    if (targetCategory === 'league') {
      return matchCategory.includes('league') || matchCategory.includes('premier');
    }
    if (targetCategory === 'club') {
      return matchCategory.includes('club') || matchCategory.includes('friendly');
    }

    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* ========================================================== */}
      {/* 🔴/🟢 1. MATCH STATUS TOGGLE BAR: [ LIVE ] | [ COMPLETED ] */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#173541] pb-4">
        
        {/* STATUS TOGGLE BUTTONS */}
        <div className="relative flex items-center bg-[#0D1528] p-1.5 rounded-2xl border border-[#173541] w-full sm:w-auto shadow-inner">
          
          {/* LIVE TOGGLE OPTION */}
          <button
            type="button"
            onClick={() => setActiveStatus('LIVE')}
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 select-none ${
              activeStatus === 'LIVE'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${activeStatus === 'LIVE' ? 'block' : 'hidden'}`} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Live
          </button>

          {/* COMPLETED TOGGLE OPTION */}
          <button
            type="button"
            onClick={() => setActiveStatus('COMPLETED')}
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 select-none ${
              activeStatus === 'COMPLETED'
                ? 'bg-[#19D89A] text-[#050A1A] shadow-md shadow-[#19D89A]/30'
                : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            Completed
          </button>
        </div>

        {/* ACTIVE STATUS ITEM COUNT */}
        <div className="flex items-center gap-2 text-xs text-[#71809A] font-mono">
          <span>Showing {filteredMatches.length} {activeStatus.toLowerCase()} {filteredMatches.length === 1 ? 'match' : 'matches'}</span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. CATEGORY FILTER BAR (All, Tournament, League, Club)    */}
      {/* ========================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all shrink-0 border ${
                isActive
                  ? 'bg-[#19D89A] text-[#050A1A] border-[#19D89A] shadow-md'
                  : 'bg-[#0D1528] text-[#AAB5CC] border-[#173541] hover:text-white hover:border-[#19D89A]/40'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ========================================================== */}
      {/* 3. MATCH CARDS SECTION                                      */}
      {/* ========================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#19D89A]" />
            {searchQuery.trim()
              ? `Team Search Results for "${searchQuery}" (${activeStatus})`
              : activeStatus === 'LIVE'
              ? 'Currently Live Matches'
              : 'Completed Match History'}
          </h2>
        </div>

        {filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} isHomePageCard={true} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          /* NO MATCHES FOUND FOR TEAM SEARCH */
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-[#19D89A]/10 border border-[#19D89A]/30 flex items-center justify-center text-[#19D89A] mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-white">No {activeStatus.toLowerCase()} matches found</h3>
            <p className="text-xs text-[#71809A]">
              No {activeStatus.toLowerCase()} matches found with team name matching &quot;{searchQuery}&quot;.
            </p>
            {setSearchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : activeStatus === 'LIVE' ? (
          /* NO LIVE MATCHES STATE */
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3">
            <Radio className="w-10 h-10 text-red-500/50 mx-auto animate-pulse" />
            <p className="text-sm font-extrabold text-white">No Live Matches Right Now</p>
            <p className="text-xs text-[#71809A] max-w-md mx-auto">
              There are currently no live cricket matches in progress. Switch to Completed matches to view finished match scorecards.
            </p>
            <button
              onClick={() => setActiveStatus('COMPLETED')}
              className="px-5 py-2.5 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              View Completed Matches →
            </button>
          </div>
        ) : (
          /* NO COMPLETED MATCHES STATE */
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3">
            <Trophy className="w-10 h-10 text-[#19D89A]/50 mx-auto" />
            <p className="text-sm font-extrabold text-white">No Completed Matches</p>
            <p className="text-xs text-[#71809A]">
              No completed matches found for this filter.
            </p>
            <button
              onClick={() => setActiveStatus('LIVE')}
              className="px-5 py-2.5 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              View Live Matches →
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
