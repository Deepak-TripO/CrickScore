'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Play, Pencil, Trash2 } from 'lucide-react';

interface MatchCardProps {
  match: {
    id: string;
    title: string;
    format?: string;
    category?: string;
    status: string;
    overs?: number;
    current_score?: string;
    current_wickets?: number;
    current_over?: number;
    result_summary?: string;
    scheduled_start?: string;
    scheduled_at?: string;
    scheduled_date?: string;
    created_at?: string;
    team1?: any;
    team2?: any;
    playground?: any;
    master?: any;
    viewer_count?: number;
    your_team_name?: string;
    opposite_team_name?: string;
    your_team_logo_url?: string;
    opposite_team_logo_url?: string;
  };
  isHistoryView?: boolean;
  isLatestOverviewCard?: boolean;
  isHomePageCard?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MatchCard({
  match,
  isHistoryView = false,
  isLatestOverviewCard = false,
  isHomePageCard = false,
  onEdit,
  onDelete
}: MatchCardProps) {
  const router = useRouter();

  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  const t1 = Array.isArray(match.team1) ? match.team1[0] : match.team1;
  const t2 = Array.isArray(match.team2) ? match.team2[0] : match.team2;

  // Resolve Team 1 Name & Logo strictly from database fields
  const team1Name = t1?.name || match.your_team_name || (match.title ? match.title.split(' vs ')[0] : '') || 'Team 1';
  const team1Short = t1?.short_name || (team1Name ? team1Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'T1');
  const team1Logo = t1?.logo_url || match.your_team_logo_url;

  // Resolve Team 2 Name & Logo strictly from database fields
  const team2Name = t2?.name || match.opposite_team_name || (match.title ? match.title.split(' vs ')[1] : '') || 'Team 2';
  const team2Short = t2?.short_name || (team2Name ? team2Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'T2');
  const team2Logo = t2?.logo_url || match.opposite_team_logo_url;

  // Format Scheduled Date cleanly
  const rawDate = match.scheduled_start || match.scheduled_at || match.scheduled_date || match.created_at;
  const formattedDate = rawDate && !isNaN(new Date(rawDate).getTime())
    ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';

  // Handle clicking anywhere on the card to open Scorecard (Home Page / History)
  const handleCardClick = () => {
    if ((isHistoryView || isHomePageCard) && match.id) {
      router.push(`/matches/${match.id}`);
    }
  };

  /* ========================================================================= */
  /* 🏏 HOME PAGE & HISTORY MATCH CARD VARIANT (EXACT SAME VISUAL DESIGN)      */
  /* ========================================================================= */
  if (isHomePageCard || isHistoryView) {
    const categoryType = (match.category || 'TOURNAMENT').toUpperCase();

    const team1Id = t1?.id || (match as any).team1_id || (match as any).team_a_id;
    const team2Id = t2?.id || (match as any).team2_id || (match as any).team_b_id;

    const inningsList = Array.isArray((match as any).innings) ? (match as any).innings : [];

    const innings1 = inningsList.find((i: any) => i.batting_team_id === team1Id || i.innings_number === 1) || inningsList[0];
    const innings2 = inningsList.find((i: any) => i.batting_team_id === team2Id || i.innings_number === 2) || inningsList[1];

    const team1Runs = innings1 ? (innings1.total_runs ?? 0) : ((match as any).team1_runs ?? (match.current_score ? match.current_score.split('/')[0] : '0'));
    const team1Wickets = innings1 ? (innings1.total_wickets ?? 0) : ((match as any).team1_wickets ?? (match.current_score ? match.current_score.split('/')[1] : '0'));
    const team1Overs = innings1 ? (innings1.total_overs ?? 0.0) : (match.current_over || 0.0);

    const team2Runs = innings2 ? (innings2.total_runs ?? 0) : ((match as any).team2_runs ?? 0);
    const team2Wickets = innings2 ? (innings2.total_wickets ?? 0) : ((match as any).team2_wickets ?? 0);
    const team2Overs = innings2 ? (innings2.total_overs ?? 0.0) : ((match as any).team2_overs || 0.0);

    const team1ScoreText = `${team1Runs}/${team1Wickets}`;
    const team1OversText = `(${Number(team1Overs).toFixed(1)} Ov)`;

    const team2ScoreText = `${team2Runs}/${team2Wickets}`;
    const team2OversText = `(${Number(team2Overs).toFixed(1)} Ov)`;

    return (
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="bg-[#0A1224] border border-[#172D42] hover:border-[#19D89A]/50 rounded-2xl p-4 sm:p-5 text-white transition-all duration-300 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between space-y-4 select-none"
      >
        {/* 1. CLEAN TOP HEADER ROW: TOP LEFT CATEGORY | TOP RIGHT DATE */}
        <div className="flex items-center justify-between text-xs border-b border-[#172D42]/60 pb-2.5">
          {/* Top Left: Match Category / Type */}
          <span className="text-[#19D89A] font-extrabold text-xs uppercase tracking-wider">
            {categoryType}
          </span>

          {/* Top Right: Match Date */}
          <div className="flex items-center gap-1.5 text-[#AAB5CC] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#19D89A]" />
            <span suppressHydrationWarning>{formattedDate}</span>
          </div>
        </div>

        {/* 2. TEAMS & SCORES ROW */}
        <div className="grid grid-cols-2 items-center gap-4 pt-1">
          
          {/* LEFT TEAM (TEAM 1) */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#050A1A] border border-[#172D42] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                {team1Logo ? (
                  <img
                    src={team1Logo.includes('/storage/v1/object/') && !team1Logo.includes('/storage/v1/object/public/') ? team1Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team1Logo}
                    alt={team1Name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-black text-xs text-[#19D89A] font-mono">{team1Short}</span>
                )}
              </div>
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {team1ScoreText}
              </span>
            </div>

            <div className="flex items-center gap-2 pl-0.5 text-xs">
              <span className="font-black text-white">{team1Short}</span>
              <span className="text-[#AAB5CC] font-mono text-[11px]">{team1OversText}</span>
            </div>
          </div>

          {/* RIGHT TEAM (TEAM 2) */}
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-2.5">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {team2ScoreText}
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#050A1A] border border-[#172D42] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                {team2Logo ? (
                  <img
                    src={team2Logo.includes('/storage/v1/object/') && !team2Logo.includes('/storage/v1/object/public/') ? team2Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team2Logo}
                    alt={team2Name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-black text-xs text-[#19D89A] font-mono">{team2Short}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pr-0.5 text-xs">
              <span className="text-[#AAB5CC] font-mono text-[11px]">{team2OversText}</span>
              <span className="font-black text-white">{team2Short}</span>
            </div>
          </div>

        </div>

        {/* 3. OPTIONAL ACTION BAR FOR HISTORY MATCH CARDS (DELETE ONLY) */}
        {onDelete && (
          <div className="pt-3 border-t border-[#172D42]/60 flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="py-1.5 px-3 bg-[#E5232F]/10 hover:bg-[#E5232F]/20 text-[#E5232F] border border-[#E5232F]/30 hover:border-[#E5232F] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}

      </div>
    );
  }

  /* ========================================================================= */
  /* 🌟 DEDICATED MODERN UI FOR OVERVIEW LATEST CREATED MATCH CARD ONLY        */
  /* ========================================================================= */
  if (isLatestOverviewCard) {
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0D1629] via-[#0A1120] to-[#050A1A] border border-[#19D89A]/35 hover:border-[#19D89A]/70 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-300">
        
        {/* Top Emerald Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#19D89A] to-transparent" />

        {/* Header: Category Badge & Date */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#050A1A]/70 border-b border-[#173541]/80">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5232F]/15 text-[#E5232F] border border-[#E5232F]/30 font-black text-[11px] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#E5232F] animate-ping" />
                LIVE MATCH
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#111A2D] text-[#AAB5CC] font-bold text-[11px]">
                COMPLETED
              </span>
            ) : (
              <span className="text-[#19D89A] bg-[#19D89A]/10 border border-[#19D89A]/20 px-3 py-1 rounded-full font-extrabold text-[11px] uppercase tracking-wider">
                {match.category || match.format || 'Cricket Match'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[#AAB5CC] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#19D89A]" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Main Teams & Scores Section */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-7 items-center gap-3">
            
            {/* Team 1 */}
            <div className="col-span-3 flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#050A1A] border border-[#173541] p-1.5 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {team1Logo ? (
                  <img 
                    src={team1Logo.includes('/storage/v1/object/') && !team1Logo.includes('/storage/v1/object/public/') ? team1Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team1Logo} 
                    alt={team1Name} 
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }} 
                  />
                ) : (
                  <span className="font-black text-xl text-[#19D89A] font-mono">{team1Short}</span>
                )}
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">{team1Name}</h3>
              <div className="bg-[#050A1A] border border-[#173541] px-3 py-1 rounded-xl">
                <p className="text-xs text-[#19D89A] font-black font-mono">
                  {isLive || isCompleted ? match.current_score || '0/0' : 'Yet to Bat'}
                </p>
              </div>
            </div>

            {/* VS Badge */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#050A1A] border border-[#19D89A]/40 flex items-center justify-center text-[#19D89A] font-black text-xs shadow-md">
                VS
              </div>
            </div>

            {/* Team 2 */}
            <div className="col-span-3 flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#050A1A] border border-[#173541] p-1.5 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {team2Logo ? (
                  <img 
                    src={team2Logo.includes('/storage/v1/object/') && !team2Logo.includes('/storage/v1/object/public/') ? team2Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team2Logo} 
                    alt={team2Name} 
                    className="w-full h-full object-cover rounded-xl" 
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="font-black text-xl text-[#19D89A] font-mono">{team2Short}</span>
                )}
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">{team2Name}</h3>
              <div className="bg-[#050A1A] border border-[#173541] px-3 py-1 rounded-xl">
                <p className="text-xs text-[#19D89A] font-black font-mono">
                  {isLive || isCompleted ? 'Innings' : 'Yet to Bat'}
                </p>
              </div>
            </div>

          </div>

          {/* Result Summary Badge */}
          {match.result_summary && (
            <div className="pt-2 text-center">
              <p className="text-xs font-bold text-[#19D89A] bg-[#19D89A]/10 py-1.5 px-4 rounded-xl border border-[#19D89A]/20 inline-block shadow-sm">
                🏆 {match.result_summary}
              </p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-[#050A1A]/80 border-t border-[#173541]/80 flex items-center gap-2.5">
          <Link 
            href={`/master/matches/${match.id}/score`}
            className="flex-1 py-3 px-4 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs text-center flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-current text-[#050A1A]" />
            <span>Live Scoring</span>
          </Link>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="h-10 px-4 bg-[#111A2D] hover:bg-[#173541] text-white border border-[#173541] hover:border-[#19D89A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
              title="Edit Match"
            >
              <Pencil className="w-3.5 h-3.5 text-[#19D89A]" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-10 px-4 bg-[#E5232F]/10 hover:bg-[#E5232F]/20 text-[#E5232F] border border-[#E5232F]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 shadow-sm"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>

      </div>
    );
  }

  /* ========================================================================= */
  /* STANDARD MATCH CARD DESIGN FOR HISTORY AND OTHER SECTIONS                 */
  /* ========================================================================= */
  return (
    <div 
      onClick={handleCardClick}
      role={isHistoryView ? 'button' : undefined}
      tabIndex={isHistoryView ? 0 : undefined}
      onKeyDown={(e) => {
        if (isHistoryView && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`relative rounded-2xl bg-[#0D1528] border transition-all duration-300 overflow-hidden shadow-md flex flex-col justify-between select-none ${
        isHistoryView 
          ? 'cursor-pointer hover:border-[#19D89A] hover:scale-[1.01] active:scale-[0.99]' 
          : ''
      } ${
        isLive 
          ? 'border-[#19D89A]/50 hover:border-[#19D89A]' 
          : 'border-[#173541] hover:border-[#19D89A]/40'
      }`}
    >
      
      {/* 1. HEADER BAR: Status / Category & Date */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#050A1A]/80 border-b border-[#173541] text-xs">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E5232F]/20 text-[#E5232F] border border-[#E5232F]/40 font-black text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5232F] animate-ping" />
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#111A2D] text-[#AAB5CC] font-bold text-[10px]">
              COMPLETED
            </span>
          ) : match.category ? (
            <span className="text-[#19D89A] font-bold text-[11px]">{match.category}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-[#AAB5CC] text-[11px] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#19D89A]" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* 2. BODY: TEAMS, LOGOS & SCORES */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-7 items-center gap-2">
          
          {/* TEAM 1 */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              {team1Logo ? (
                <img 
                  src={team1Logo.includes('/storage/v1/object/') && !team1Logo.includes('/storage/v1/object/public/') ? team1Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team1Logo} 
                  alt={team1Name} 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }} 
                />
              ) : (
                <span className="font-black text-lg text-[#19D89A]">{team1Short}</span>
              )}
            </div>
            <h4 className="mt-2 font-bold text-xs sm:text-sm text-white line-clamp-1">{team1Name}</h4>
            <p className="text-[11px] text-[#19D89A] font-extrabold mt-0.5 font-mono">
              {isLive || isCompleted ? match.current_score || '0/0' : 'Yet to bat'}
            </p>
          </div>

          {/* VS BADGE */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-[#050A1A] border border-[#173541] flex items-center justify-center text-[#AAB5CC] font-black text-[10px] shadow-sm">
              VS
            </span>
          </div>

          {/* TEAM 2 */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              {team2Logo ? (
                <img 
                  src={team2Logo.includes('/storage/v1/object/') && !team2Logo.includes('/storage/v1/object/public/') ? team2Logo.replace('/storage/v1/object/', '/storage/v1/object/public/') : team2Logo} 
                  alt={team2Name} 
                  className="w-full h-full object-cover rounded-xl" 
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-black text-lg text-[#19D89A]">{team2Short}</span>
              )}
            </div>
            <h4 className="mt-2 font-bold text-xs sm:text-sm text-white line-clamp-1">{team2Name}</h4>
            <p className="text-[11px] text-[#19D89A] font-extrabold mt-0.5 font-mono">
              {isLive || isCompleted ? 'Innings' : 'Yet to bat'}
            </p>
          </div>

        </div>

        {/* RESULT SUMMARY IF COMPLETED */}
        {match.result_summary && (
          <div className="pt-2 border-t border-[#173541] text-center">
            <p className="text-xs font-bold text-[#19D89A] bg-[#19D89A]/10 py-1 px-3 rounded-lg border border-[#19D89A]/20 inline-block">
              🏆 {match.result_summary}
            </p>
          </div>
        )}
      </div>

      {/* 3. ACTION BAR (RENDERED IF LIVE SCORING OR EDIT/DELETE BUTTONS ARE PRESENT) */}
      {(!isHistoryView || onEdit || onDelete) && (
        <div className="p-2.5 bg-[#050A1A]/50 border-t border-[#173541] flex items-center gap-2">
          {!isHistoryView && (
            /* OVERVIEW LATEST MATCH ACTION: LIVE SCORING PANEL */
            <Link 
              href={`/master/matches/${match.id}/score`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-2 px-3 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-all shadow-md uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#050A1A]" />
              <span>Live Scoring</span>
            </Link>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 px-3 bg-[#111A2D] hover:bg-[#173541] text-white border border-[#173541] hover:border-[#19D89A] font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shrink-0 active:scale-95 flex-1"
              title="Edit Match"
            >
              <Pencil className="w-3.5 h-3.5 text-[#19D89A]" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 px-3 bg-[#E5232F]/10 hover:bg-[#E5232F]/20 text-[#E5232F] border border-[#E5232F]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shrink-0 active:scale-95 flex-1"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
