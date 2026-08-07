import React from 'react';
import Link from 'next/link';
import { Match } from '@/lib/cricket/types';
import { MapPin, Calendar, ArrowRight, Radio } from 'lucide-react';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const isLive = match.status === 'LIVE';
  const isUpcoming = match.status === 'UPCOMING';
  const isCompleted = match.status === 'COMPLETED';

  const inn1 = match.all_innings?.find((i) => i.innings_number === 1);
  const inn2 = match.all_innings?.find((i) => i.innings_number === 2);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      {/* Card Header Status */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate max-w-[200px]">
          {match.tournament_name || 'Friendly T20 Match'}
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </span>
        )}
        {isUpcoming && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            UPCOMING
          </span>
        )}
        {isCompleted && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            FINISHED
          </span>
        )}
      </div>

      {/* Main Teams & Score Section */}
      <div className="p-5 space-y-4">
        {/* Team A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
              {match.team_a.logo_url ? (
                <img src={match.team_a.logo_url} alt={match.team_a.name} className="w-full h-full object-cover" />
              ) : (
                match.team_a.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="font-extrabold text-slate-900 text-base">{match.team_a.name}</span>
          </div>

          <div className="text-right">
            {inn1 && inn1.batting_team_id === match.team_a.id ? (
              <div className="font-black text-slate-900 text-lg">
                {inn1.runs}/{inn1.wickets} <span className="text-xs font-semibold text-slate-500">({inn1.overs} ov)</span>
              </div>
            ) : inn2 && inn2.batting_team_id === match.team_a.id ? (
              <div className="font-black text-slate-900 text-lg">
                {inn2.runs}/{inn2.wickets} <span className="text-xs font-semibold text-slate-500">({inn2.overs} ov)</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400">Yet to Bat</span>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
              {match.team_b.logo_url ? (
                <img src={match.team_b.logo_url} alt={match.team_b.name} className="w-full h-full object-cover" />
              ) : (
                match.team_b.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <span className="font-extrabold text-slate-900 text-base">{match.team_b.name}</span>
          </div>

          <div className="text-right">
            {inn1 && inn1.batting_team_id === match.team_b.id ? (
              <div className="font-black text-slate-900 text-lg">
                {inn1.runs}/{inn1.wickets} <span className="text-xs font-semibold text-slate-500">({inn1.overs} ov)</span>
              </div>
            ) : inn2 && inn2.batting_team_id === match.team_b.id ? (
              <div className="font-black text-slate-900 text-lg">
                {inn2.runs}/{inn2.wickets} <span className="text-xs font-semibold text-slate-500">({inn2.overs} ov)</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400">Yet to Bat</span>
            )}
          </div>
        </div>

        {/* Result summary or target status */}
        {isCompleted && match.result_summary && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60">
            🏆 {match.result_summary}
          </div>
        )}

        {isLive && match.current_innings && match.current_innings.target && (
          <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 flex justify-between">
            <span>Target: {match.current_innings.target}</span>
            <span>Need {Math.max(0, match.current_innings.target - match.current_innings.runs)} runs</span>
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1 truncate max-w-[220px]">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{match.venue?.name || 'Local Sports Complex'}</span>
        </div>

        <Link
          href={`/matches/${match.id}`}
          className="flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform"
        >
          View Center <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
