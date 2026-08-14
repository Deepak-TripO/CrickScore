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
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MatchCard({ match, isHistoryView = false, onEdit, onDelete }: MatchCardProps) {
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
    ? new Date(rawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Today';

  // Handle clicking anywhere on the card to open Scorecard (Home Page / History)
  const handleCardClick = () => {
    if (isHistoryView && match.id) {
      router.push(`/matches/${match.id}`);
    }
  };

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
