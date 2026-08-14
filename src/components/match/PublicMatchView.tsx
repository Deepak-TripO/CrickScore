'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { processInningsDeliveries, DeliveryInput } from '@/lib/cricket/engine';
import { Eye, MapPin, Trophy, Calendar, Users, Activity, MessageSquare, Info, BarChart3, ListOrdered } from 'lucide-react';

interface PublicMatchViewProps {
  initialMatch: any;
  initialInnings: any[];
  initialDeliveries: any[];
  initialCommentary: any[];
  team1Players: any[];
  team2Players: any[];
}

export default function PublicMatchView({
  initialMatch,
  initialInnings,
  initialDeliveries,
  initialCommentary,
  team1Players,
  team2Players
}: PublicMatchViewProps) {
  const [match, setMatch] = useState<any>(initialMatch);
  const [innings, setInnings] = useState<any[]>(initialInnings);
  const [deliveries, setDeliveries] = useState<any[]>(initialDeliveries);
  const [commentary, setCommentary] = useState<any[]>(initialCommentary);
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCORECARD' | 'COMMENTARY' | 'TEAMS' | 'STATS' | 'INFO'>('LIVE');

  // Stable Supabase client — created once, not on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    // 1. Realtime score & commentary subscription
    const matchChannel = supabase
      .channel(`match:${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, (payload) => {
        setMatch((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${match.id}` }, (payload) => {
        const newItem: any = payload.new;
        if (newItem?.id) {
          setInnings((prev: any[]) => {
            const exists = prev.some(i => i.id === newItem.id);
            if (exists) {
              return prev.map(i => i.id === newItem.id ? newItem : i);
            }
            return [...prev, newItem];
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deliveries' }, (payload) => {
        setDeliveries((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_commentary', filter: `match_id=eq.${match.id}` }, (payload) => {
        setCommentary((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    // 2. Realtime Presence Tracking
    const presenceChannel = supabase.channel(`presence:match:${match.id}`);
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const count = Object.keys(state).length;
        setViewerCount(Math.max(1, count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: match.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [match.id, supabase]);

  // Compute live innings state — memoized to avoid recomputation on unrelated state changes
  const activeInningsRecord = useMemo(
    () => innings.find((i: any) => i.status === 'IN_PROGRESS') || innings[0],
    [innings]
  );

  const inningsDeliveries: DeliveryInput[] = useMemo(
    () => deliveries
      .filter((d: any) => d.innings_id === activeInningsRecord?.id)
      .map((d: any) => ({
        id: d.id,
        overNumber: d.over_number,
        ballNumber: d.ball_number,
        strikerId: d.striker_id,
        nonStrikerId: d.non_striker_id,
        bowlerId: d.bowler_id,
        runsBatter: d.runs_batter,
        runsExtras: d.runs_extras,
        extraType: d.extra_type,
        wicket: d.wicket,
        wicketType: d.wicket_type,
        dismissedPlayerId: d.dismissed_player_id
      })),
    [deliveries, activeInningsRecord?.id]
  );

  const liveState = useMemo(
    () => activeInningsRecord
      ? processInningsDeliveries(
          inningsDeliveries,
          team1Players[0]?.id || '',
          team1Players[1]?.id || '',
          team2Players[0]?.id || '',
          match.overs,
          match.target
        )
      : null,
    [inningsDeliveries, activeInningsRecord, team1Players, team2Players, match.overs, match.target]
  );

  const currentOverDeliveries = useMemo(
    () => deliveries
      .filter((d: any) => d.innings_id === activeInningsRecord?.id && d.over_number === liveState?.currentOverNumber)
      .slice(-6),
    [deliveries, activeInningsRecord?.id, liveState?.currentOverNumber]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* HEADER MATCH BANNER */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {match.status === 'LIVE' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                {match.status}
              </span>
            )}
            <span>{match.format} • {match.category}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-semibold bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>{viewerCount} watching</span>
          </div>
        </div>

        {/* TEAMS & SCORES */}
        <div className="grid grid-cols-7 items-center text-center gap-2 py-2">
          {/* TEAM 1 */}
          <div className="col-span-3 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-2 flex items-center justify-center shadow-lg">
              {match.team1?.logo_url ? (
                <img 
                  src={match.team1.logo_url.includes('/storage/v1/object/') && !match.team1.logo_url.includes('/storage/v1/object/public/') ? match.team1.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team1.logo_url} 
                  alt={match.team1.name} 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-black text-2xl text-emerald-400">{match.team1?.short_name}</span>
              )}
            </div>
            <h3 className="mt-3 font-extrabold text-base sm:text-lg text-white">{match.team1?.name}</h3>
          </div>

          {/* VS & SCORE CENTER */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <span className="text-slate-500 font-extrabold text-xs">VS</span>
            <div className="mt-1 font-mono">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {match.current_score || '0/0'}
              </span>
              <p className="text-xs text-slate-400 font-bold">{match.current_over || '0.0'} Ov</p>
            </div>
          </div>

          {/* TEAM 2 */}
          <div className="col-span-3 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-2 flex items-center justify-center shadow-lg">
              {match.team2?.logo_url ? (
                <img 
                  src={match.team2.logo_url.includes('/storage/v1/object/') && !match.team2.logo_url.includes('/storage/v1/object/public/') ? match.team2.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team2.logo_url} 
                  alt={match.team2.name} 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="font-black text-2xl text-emerald-400">{match.team2?.short_name}</span>
              )}
            </div>
            <h3 className="mt-3 font-extrabold text-base sm:text-lg text-white">{match.team2?.name}</h3>
          </div>
        </div>

        {/* SUMMARY / TARGET BADGE */}
        {match.result_summary ? (
          <div className="mt-5 text-center">
            <span className="px-4 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
              🏆 {match.result_summary}
            </span>
          </div>
        ) : match.target ? (
          <div className="mt-5 text-center">
            <span className="px-4 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 font-bold text-xs">
              Target: {match.target} ({match.target - (liveState?.totalRuns || 0)} runs needed off {match.overs * 6 - (liveState?.legalBalls || 0)} balls)
            </span>
          </div>
        ) : null}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'LIVE', label: 'Live', icon: Activity },
          { id: 'SCORECARD', label: 'Scorecard', icon: ListOrdered },
          { id: 'COMMENTARY', label: 'Commentary', icon: MessageSquare },
          { id: 'TEAMS', label: 'Teams', icon: Users },
          { id: 'STATS', label: 'Statistics', icon: BarChart3 },
          { id: 'INFO', label: 'Match Info', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: LIVE */}
      {activeTab === 'LIVE' && liveState && (
        <div className="space-y-4">
          
          {/* CURRENT OVER BALLS */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Over {liveState.currentOverNumber + 1}</span>
            <div className="flex items-center gap-2">
              {currentOverDeliveries.map((d: any, idx: number) => (
                <span
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono border ${
                    d.wicket 
                      ? 'bg-red-600 text-white border-red-500' 
                      : d.runs_batter === 4 || d.runs_batter === 6 
                      ? 'bg-purple-600 text-white border-purple-500'
                      : d.extra_type !== 'NONE'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {d.wicket ? 'W' : d.extra_type !== 'NONE' ? d.extra_type[0] : d.runs_batter}
                </span>
              ))}
            </div>
          </div>

          {/* ACTIVE BATSMEN TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Batting
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-500 font-semibold border-b border-slate-800/60">
                <tr>
                  <th className="p-3">Batter</th>
                  <th className="p-3 text-right">R</th>
                  <th className="p-3 text-right">B</th>
                  <th className="p-3 text-right">4s</th>
                  <th className="p-3 text-right">6s</th>
                  <th className="p-3 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[liveState.strikerId, liveState.nonStrikerId].map((id, index) => {
                  const b = liveState.batters[id];
                  const playerInfo = [...team1Players, ...team2Players].find(p => p.id === id);
                  const isStriker = index === 0;
                  return (
                    <tr key={id || index} className={isStriker ? 'bg-emerald-950/20 font-bold text-white' : 'text-slate-300'}>
                      <td className="p-3 flex items-center gap-2">
                        <span>{playerInfo?.full_name || playerInfo?.display_name || 'Batter'}</span>
                        {isStriker && <span className="text-emerald-400 font-bold">🏏 *</span>}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{b?.runs || 0}</td>
                      <td className="p-3 text-right font-mono">{b?.balls || 0}</td>
                      <td className="p-3 text-right font-mono">{b?.fours || 0}</td>
                      <td className="p-3 text-right font-mono">{b?.sixes || 0}</td>
                      <td className="p-3 text-right font-mono">{b?.strikeRate || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ACTIVE BOWLER TABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bowling
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-500 font-semibold border-b border-slate-800/60">
                <tr>
                  <th className="p-3">Bowler</th>
                  <th className="p-3 text-right">O</th>
                  <th className="p-3 text-right">M</th>
                  <th className="p-3 text-right">R</th>
                  <th className="p-3 text-right">W</th>
                  <th className="p-3 text-right">ECO</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const bw = liveState.bowlers[liveState.currentBowlerId];
                  const playerInfo = [...team1Players, ...team2Players].find(p => p.id === liveState.currentBowlerId);
                  return (
                    <tr className="text-white font-semibold">
                      <td className="p-3 flex items-center gap-2">
                        <span>{playerInfo?.full_name || playerInfo?.display_name || 'Bowler'}</span>
                        <span className="text-teal-400 font-bold">⚾</span>
                      </td>
                      <td className="p-3 text-right font-mono">{bw?.oversFormatted || '0.0'}</td>
                      <td className="p-3 text-right font-mono">{bw?.maidens || 0}</td>
                      <td className="p-3 text-right font-mono">{bw?.runsConceded || 0}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{bw?.wickets || 0}</td>
                      <td className="p-3 text-right font-mono">{bw?.economy || 0}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB CONTENT: SCORECARD */}
      {activeTab === 'SCORECARD' && liveState && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
          <h3 className="font-bold text-sm text-emerald-400">Full Innings Scorecard</h3>
          <div className="divide-y divide-slate-800 text-xs">
            {Object.values(liveState.batters).map((b) => {
              const playerInfo = [...team1Players, ...team2Players].find(p => p.id === b.playerId);
              return (
                <div key={b.playerId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{playerInfo?.full_name || playerInfo?.display_name}</span>
                    <span className="text-[11px] text-slate-500 block">{b.isOut ? `b ${b.dismissalInfo}` : 'not out'}</span>
                  </div>
                  <div className="font-mono text-right space-x-3">
                    <span className="text-emerald-400 font-bold text-sm">{b.runs}</span>
                    <span className="text-slate-400">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: COMMENTARY */}
      {activeTab === 'COMMENTARY' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
          <h3 className="font-bold text-sm text-emerald-400">Live Ball-by-Ball Commentary</h3>
          {commentary.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">No commentary added yet.</p>
          ) : (
            <div className="space-y-2">
              {commentary.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Over {c.over_number}</span>
                    <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TEAMS */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <span>{match.team1?.name} Playing XI</span>
            </h4>
            <div className="divide-y divide-slate-800/60 text-xs">
              {team1Players.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{p.full_name || p.display_name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{p.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <span>{match.team2?.name} Playing XI</span>
            </h4>
            <div className="divide-y divide-slate-800/60 text-xs">
              {team2Players.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{p.full_name || p.display_name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INFO */}
      {activeTab === 'INFO' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-emerald-400">Match Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 block">Ground & Venue</span>
              <strong className="text-white text-sm">{match.playground?.name || 'Cricket Ground'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Match Format & Category</span>
              <strong className="text-white text-sm">{match.format} ({match.category})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Umpires</span>
              <strong className="text-white">{match.umpire1 || 'Official Umpire'} & {match.umpire2 || 'Official Umpire'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Match Referee</span>
              <strong className="text-white">{match.match_referee || 'Certified Referee'}</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
