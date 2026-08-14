'use client';

import React, { useState } from 'react';
import MatchCard from '@/components/match/MatchCard';
import { Trophy, ShieldCheck, Flame } from 'lucide-react';

interface HomePageClientProps {
  user: any;
  userRole: string;
  allMatches: any[];
}

export default function HomePageClient({
  user,
  userRole = 'USER',
  allMatches = []
}: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Tournament', 'League', 'Club'];

  // Filter matches dynamically based on active category
  const filteredMatches = allMatches.filter((m: any) => {
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
      {/* 1. CATEGORY FILTER BAR (ONLY 4 OPTIONS: All, Tournament, League, Club) */}
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
      {/* 2. CATEGORY RESULTS LIST                                   */}
      {/* ========================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#19D89A]" />
            {activeCategory === 'All' ? 'All Matches & Tournaments' : `${activeCategory} Matches`}
          </h2>
          <span className="text-xs text-[#71809A] font-mono">
            {filteredMatches.length} {filteredMatches.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} isHistoryView={true} />
            ))}
          </div>
        ) : (
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3">
            <p className="text-xs font-bold text-[#AAB5CC]">No {activeCategory.toLowerCase()} matches found.</p>
            <p className="text-[11px] text-[#71809A]">Try selecting another category to discover cricket content.</p>
            <button
              onClick={() => setActiveCategory('All')}
              className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
            >
              View All
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
