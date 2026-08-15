'use client';

import React, { useState, Suspense } from 'react';
import MatchCard from '@/components/match/MatchCard';
import { Trophy, Search, X } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface HomePageClientProps {
  user: any;
  userRole: string;
  allMatches: any[];
}

function HomePageClientContent({
  allMatches = []
}: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchQuery = searchParams.get('q') || '';
  const categories = ['All', 'Tournament', 'League', 'Club'];

  // Filter matches dynamically based strictly on TEAM NAME ONLY (Team 1 or Team 2) and active category
  const filteredMatches = allMatches.filter((m: any) => {
    // 1. STRICT TEAM NAME ONLY SEARCH FILTER (Team 1 OR Team 2)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();

      const t1 = Array.isArray(m.team1) ? m.team1[0] : m.team1;
      const t2 = Array.isArray(m.team2) ? m.team2[0] : m.team2;

      // Extract Team 1 & Team 2 names strictly from database fields
      const team1Name = (t1?.name || m.your_team_name || (m.title ? m.title.split(' vs ')[0] : '') || '').toLowerCase();
      const team2Name = (t2?.name || m.opposite_team_name || (m.title ? m.title.split(' vs ')[1] : '') || '').toLowerCase();

      const matchesTeam1 = team1Name.includes(q);
      const matchesTeam2 = team2Name.includes(q);

      // Require Team 1 Name OR Team 2 Name match only (ignore player names, categories, venues, etc.)
      if (!matchesTeam1 && !matchesTeam2) {
        return false;
      }
    }

    // 2. Category Filter
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

  const handleClearSearch = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 font-sans">

      {/* ACTIVE SEARCH INDICATOR BADGE IF FILTERED BY TEAM NAME */}
      {searchQuery.trim() && (
        <div className="bg-[#0D1528] border border-[#19D89A]/40 p-3 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#19D89A]" />
            <span className="text-[#AAB5CC]">
              Filtering team names by: <strong className="text-white font-mono">&quot;{searchQuery}&quot;</strong> ({filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSearch}
            className="flex items-center gap-1 text-[11px] font-bold text-[#19D89A] hover:underline bg-[#050A1A] px-2.5 py-1 rounded-lg border border-[#173541]"
          >
            <X className="w-3 h-3" />
            Clear Filter
          </button>
        </div>
      )}

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
      {/* 2. MATCH CARDS LISTING                                      */}
      {/* ========================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#19D89A]" />
            {activeCategory === 'All' ? 'All Matches' : `${activeCategory} Matches`}
          </h2>
          <span className="text-xs font-bold text-[#71809A]">
            Showing {filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'}
          </span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-12 text-center text-[#71809A] space-y-2 shadow-xl">
            <Trophy className="w-10 h-10 text-[#173541] mx-auto" />
            <h3 className="text-base font-bold text-white">No Matches Found</h3>
            <p className="text-xs text-[#71809A]">
              {searchQuery.trim()
                ? `No teams matching "${searchQuery}" found in database.`
                : 'No cricket matches are available for this category right now.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((match: any) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default function HomePageClient(props: HomePageClientProps) {
  return (
    <Suspense fallback={
      <div className="py-12 text-center text-xs text-[#71809A]">
        Loading matches...
      </div>
    }>
      <HomePageClientContent {...props} />
    </Suspense>
  );
}
