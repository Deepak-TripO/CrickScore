'use client';

import React, { useState, Suspense } from 'react';
import MatchCard from '@/components/match/MatchCard';
import { Trophy, Search, Filter, X } from 'lucide-react';
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
  const [statusToggle, setStatusToggle] = useState<'LIVE' | 'COMPLETED'>('LIVE');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const categories = ['ALL MATCHS', 'TOURNAMENT', 'LEAGUE', 'CLUB'];

  const handleClearSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  // Filter matches dynamically based strictly on TEAM NAME ONLY, status toggle, and active category
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m: any) => {
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

      // 2. Status Filter (LIVE vs COMPLETED)
      const mStatus = (m.status || '').toString().toUpperCase();
      if (statusToggle === 'LIVE') {
        if (mStatus === 'COMPLETED' || mStatus === 'FINISHED') return false;
      } else if (statusToggle === 'COMPLETED') {
        if (mStatus !== 'COMPLETED' && mStatus !== 'FINISHED') return false;
      }

      // 3. Category Filter
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
  }, [allMatches, searchQuery, statusToggle, activeCategory]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HOME PAGE MOBILE SEARCH BAR (LIGHTWEIGHT, SIMPLE, FIT FOR MOBILE) */}
      <div className="md:hidden w-full space-y-2">
        <div className="flex items-center gap-2 bg-[#0D1528] border border-[#173541] focus-within:border-[#19D89A] rounded-xl px-3 py-2.5 transition-colors shadow-md">
          <Search className="w-4 h-4 text-[#19D89A] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(searchParams?.toString() || '');
              if (val.trim()) {
                params.set('search', val);
              } else {
                params.delete('search');
              }
              router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
            }}
            placeholder="Search team name..."
            className="w-full bg-transparent text-white text-xs outline-none placeholder-[#71809A] font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 text-[#AAB5CC] hover:text-white rounded transition-colors shrink-0"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* HOME PAGE CONTROL ROW: STATUS TOGGLE ON LEFT, ICON-ONLY FILTER ON FAR RIGHT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 w-full">
          {/* SEGMENTED TOGGLE BUTTON [ LIVE ] [ COMPLETED ] */}
          <div className="flex items-center bg-[#0D1528] border border-[#173541] rounded-xl p-1 shadow-md">
            <button
              type="button"
              onClick={() => setStatusToggle('LIVE')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 ${
                statusToggle === 'LIVE'
                  ? 'bg-[#19D89A] text-[#050A1A] shadow-md shadow-[#19D89A]/20'
                  : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
              }`}
            >
              LIVE
            </button>
            <button
              type="button"
              onClick={() => setStatusToggle('COMPLETED')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 ${
                statusToggle === 'COMPLETED'
                  ? 'bg-[#19D89A] text-[#050A1A] shadow-md shadow-[#19D89A]/20'
                  : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
              }`}
            >
              COMPLETED
            </button>
          </div>

          {/* ICON-ONLY FILTER BUTTON ON FAR RIGHT */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2.5 rounded-xl transition-all duration-200 shadow-md active:scale-95 border flex items-center justify-center relative ${
              isFilterOpen || (activeCategory !== 'ALL MATCHS' && activeCategory !== 'All')
                ? 'bg-[#0D1528] border-[#19D89A] text-[#19D89A] shadow-[#19D89A]/10'
                : 'bg-[#0D1528] border-[#173541] text-[#AAB5CC] hover:text-white hover:border-[#19D89A]/50'
            }`}
            title="Filter Categories"
            aria-label="Filter Categories"
          >
            <Filter className="w-4 h-4" />
            {activeCategory !== 'ALL MATCHS' && activeCategory !== 'All' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#19D89A] rounded-full border border-[#050A1A]" />
            )}
          </button>
        </div>

        {/* EXPANDABLE FILTER PANEL CONTAINING CATEGORY OPTIONS */}
        {isFilterOpen && (
          <div className="w-full bg-[#0D1528] border border-[#173541] rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#173541]/60">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-white tracking-wider">
                <Filter className="w-3.5 h-3.5 text-[#19D89A]" />
                <span>Select Category</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full items-center">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase transition-all duration-200 text-center truncate ${
                      isActive
                        ? 'bg-[#19D89A] text-[#050A1A] shadow-md shadow-[#19D89A]/20 font-extrabold scale-[1.01]'
                        : 'bg-[#050A1A]/80 text-[#AAB5CC] hover:text-white hover:bg-[#111A2D] border border-[#173541]/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. CATEGORY / SEARCH RESULTS LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#19D89A]" />
            {searchQuery.trim()
              ? `Team Search Results for "${searchQuery}"`
              : activeCategory !== 'ALL MATCHS' && activeCategory !== 'All'
              ? activeCategory
              : statusToggle}
          </h2>
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
