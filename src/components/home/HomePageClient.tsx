'use client';

import React, { useState, Suspense } from 'react';
import MatchCard from '@/components/match/MatchCard';
import { Trophy, Search } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface HomePageClientProps {
  user: any;
  userRole: string;
  allMatches: any[];
}

function HomePageContent({
  allMatches = []
}: {
  allMatches: any[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams?.get('search') || '';
  const [activeCategory, setActiveCategory] = useState<string>('ALL MATCHS');

  const categories = ['ALL MATCHS', 'TOURNAMENT', 'LEAGUE', 'CLUB'];

  // Calculate dynamic item counts for each category
  const getCategoryCount = (catName: string) => {
    if (catName === 'ALL MATCHS') return allMatches.length;

    const targetCategory = catName.toLowerCase();
    return allMatches.filter((m: any) => {
      const matchCategory = (m.category || m.format || m.match_type || '').toString().toLowerCase();
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
    }).length;
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  // Filter matches dynamically based strictly on TEAM NAME ONLY and active category
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
    if (activeCategory === 'ALL MATCHS' || activeCategory === 'All') return true;

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
      
      {/* 1. CATEGORY FILTER BAR (PERFECT FULL WIDTH GRID, NO EXTRA RIGHT GAP, EXACT DYNAMIC COUNTS) */}
      <div className="w-full bg-[#0D1528] border border-[#173541] rounded-2xl p-2.5 shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`w-full py-2.5 px-3 rounded-xl text-[11px] sm:text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-[#19D89A] text-[#050A1A] shadow-lg shadow-[#19D89A]/20 scale-[1.02]'
                    : 'bg-[#050A1A]/80 text-[#AAB5CC] hover:text-white hover:bg-[#111A2D] border border-[#173541]/50'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? 'bg-[#050A1A]/25 text-[#050A1A]' : 'bg-[#173541]/60 text-[#71809A]'
                }`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CATEGORY / SEARCH RESULTS LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#19D89A]" />
            {searchQuery.trim()
              ? `Team Search Results for "${searchQuery}"`
              : activeCategory === 'ALL MATCHS' || activeCategory === 'All'
              ? 'ALL MATCHS'
              : `${activeCategory} MATCHES`}
          </h2>
          <span className="text-xs text-[#71809A] font-mono">
            {filteredMatches.length} {filteredMatches.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((m: any) => (
              <MatchCard key={m.id} match={m} isHomePageCard={true} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          /* NO TEAMS FOUND STATE */
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-[#19D89A]/10 border border-[#19D89A]/30 flex items-center justify-center text-[#19D89A] mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-white">No teams found</h3>
            <p className="text-xs text-[#71809A]">
              No matches found with team name matching &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* NO CATEGORY MATCHES FOUND STATE */
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-10 text-center space-y-3">
            <p className="text-xs font-bold text-[#AAB5CC]">No {activeCategory.toLowerCase()} matches found.</p>
            <p className="text-[11px] text-[#71809A]">Try selecting another category to discover cricket content.</p>
            <button
              onClick={() => setActiveCategory('ALL MATCHS')}
              className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-black text-xs uppercase tracking-wider rounded-xl shadow-md"
            >
              View ALL MATCHS
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

export default function HomePageClient({
  allMatches = []
}: HomePageClientProps) {
  return (
    <Suspense fallback={
      <div className="py-12 text-center text-xs text-[#71809A]">
        Loading match results...
      </div>
    }>
      <HomePageContent allMatches={allMatches} />
    </Suspense>
  );
}
