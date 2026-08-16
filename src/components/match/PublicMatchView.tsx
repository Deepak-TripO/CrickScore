'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { processInningsDeliveries, DeliveryInput } from '@/lib/cricket/engine';
import { Eye, MapPin, Trophy, Calendar, Users, Activity, ListOrdered } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCORECARD' | 'TEAMS'>('LIVE');
  const [selectedScorecardTeam, setSelectedScorecardTeam] = useState<'TEAM1' | 'TEAM2'>('TEAM1');

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

  // Determine dynamic match status: ONLY "LIVE" or "COMPLETED" (no "UPCOMING")
  const rawStatus = (match.status || '').toString().toUpperCase();
  const displayStatus = (rawStatus === 'COMPLETED' || rawStatus === 'FINISHED') ? 'COMPLETED' : 'LIVE';

  // Compute live active innings record
  const activeInningsRecord = useMemo(
    () => innings.find((i: any) => i.status === 'IN_PROGRESS') || innings[0],
    [innings]
  );

  // Compute Team 1 & Team 2 Innings Records
  const team1InningsRecord = useMemo(
    () => innings.find((i: any) => i.batting_team_id === match.team1_id || i.batting_team_id === match.team_a_id) || innings[0],
    [innings, match.team1_id, match.team_a_id]
  );

  const team2InningsRecord = useMemo(
    () => innings.find((i: any) => i.batting_team_id === match.team2_id || i.batting_team_id === match.team_b_id) || innings[1],
    [innings, match.team2_id, match.team_b_id]
  );

  // Deliveries for active innings
  const activeDeliveriesInput: DeliveryInput[] = useMemo(
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

  const team1DeliveriesInput: DeliveryInput[] = useMemo(
    () => deliveries
      .filter((d: any) => d.innings_id === team1InningsRecord?.id)
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
    [deliveries, team1InningsRecord?.id]
  );

  const team2DeliveriesInput: DeliveryInput[] = useMemo(
    () => deliveries
      .filter((d: any) => d.innings_id === team2InningsRecord?.id)
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
    [deliveries, team2InningsRecord?.id]
  );

  const liveState = useMemo(
    () => activeInningsRecord
      ? processInningsDeliveries(
          activeDeliveriesInput,
          team1Players[0]?.id || '',
          team1Players[1]?.id || '',
          team2Players[0]?.id || '',
          match.overs,
          match.target
        )
      : null,
    [activeDeliveriesInput, activeInningsRecord, team1Players, team2Players, match.overs, match.target]
  );

  const team1LiveState = useMemo(
    () => team1InningsRecord
      ? processInningsDeliveries(
          team1DeliveriesInput,
          team1Players[0]?.id || '',
          team1Players[1]?.id || '',
          team2Players[0]?.id || '',
          match.overs,
          match.target
        )
      : null,
    [team1DeliveriesInput, team1InningsRecord, team1Players, team2Players, match.overs, match.target]
  );

  const team2LiveState = useMemo(
    () => team2InningsRecord
      ? processInningsDeliveries(
          team2DeliveriesInput,
          team2Players[0]?.id || '',
          team2Players[1]?.id || '',
          team1Players[0]?.id || '',
          match.overs,
          match.target
        )
      : null,
    [team2DeliveriesInput, team2InningsRecord, team1Players, team2Players, match.overs, match.target]
  );

  const currentOverDeliveries = useMemo(
    () => deliveries
      .filter((d: any) => d.innings_id === activeInningsRecord?.id && d.over_number === liveState?.currentOverNumber)
      .slice(-6),
    [deliveries, activeInningsRecord?.id, liveState?.currentOverNumber]
  );

  // Separate scores and overs calculation for Team 1 and Team 2
  const team1ScoreStr = team1LiveState ? `${team1LiveState.totalRuns}/${team1LiveState.totalWickets}` : (match.current_score || '0/0');
  const team1OversStr = team1LiveState ? `${team1LiveState.oversFormatted} Ov` : (match.current_over ? `${match.current_over} Ov` : '0.0 Ov');

  const team2ScoreStr = team2LiveState ? `${team2LiveState.totalRuns}/${team2LiveState.totalWickets}` : '0/0';
  const team2OversStr = team2LiveState ? `${team2LiveState.oversFormatted} Ov` : '0.0 Ov';

  // Target team for Scorecard tab
  const targetScorecardState = selectedScorecardTeam === 'TEAM1' ? team1LiveState : team2LiveState;

  // Strict batting scorecard filtering: SHOW ONLY CURRENTLY PLAYING AND WICKETED BATTERS (Exclude un-batted players)
  const activeScorecardBatters = useMemo(() => {
    if (!targetScorecardState || !targetScorecardState.batters) return [];
    return Object.values(targetScorecardState.batters).filter((b: any) => {
      const isCurrentlyBatting = b.playerId === targetScorecardState.strikerId || b.playerId === targetScorecardState.nonStrikerId;
      return b.balls > 0 || b.isOut || isCurrentlyBatting;
    });
  }, [targetScorecardState]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 font-sans">
      
      {/* HEADER MATCH BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {displayStatus === 'LIVE' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] uppercase">
                COMPLETED
              </span>
            )}
            <span>{match.format || 'ODI'} • {match.category || 'Tournament'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-semibold bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>{viewerCount} watching</span>
          </div>
        </div>

        {/* TEAM 1 & TEAM 2 SEPARATE SCORES + OVERS DISPLAY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center py-1">
          {/* TEAM 1 SCORECARD BOX */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                {match.team1?.logo_url ? (
                  <img 
                    src={match.team1.logo_url.includes('/storage/v1/object/') && !match.team1.logo_url.includes('/storage/v1/object/public/') ? match.team1.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team1.logo_url} 
                    alt={match.team1.name} 
                    className="w-full h-full object-contain" 
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-black text-lg text-emerald-400">{match.team1?.short_name || 'T1'}</span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-[120px] sm:max-w-[160px]">{match.team1?.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono font-bold">{team1OversStr}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">{team1ScoreStr}</span>
            </div>
          </div>

          {/* TEAM 2 SCORECARD BOX */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                {match.team2?.logo_url ? (
                  <img 
                    src={match.team2.logo_url.includes('/storage/v1/object/') && !match.team2.logo_url.includes('/storage/v1/object/public/') ? match.team2.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team2.logo_url} 
                    alt={match.team2.name} 
                    className="w-full h-full object-contain" 
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-black text-lg text-emerald-400">{match.team2?.short_name || 'T2'}</span>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-[120px] sm:max-w-[160px]">{match.team2?.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono font-bold">{team2OversStr}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">{team2ScoreStr}</span>
            </div>
          </div>
        </div>

        {/* SUMMARY / TARGET BADGE */}
        {match.result_summary ? (
          <div className="text-center pt-1">
            <span className="px-4 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
              🏆 {match.result_summary}
            </span>
          </div>
        ) : match.target ? (
          <div className="text-center pt-1">
            <span className="px-4 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 font-bold text-xs">
              Target: {match.target} ({match.target - (liveState?.totalRuns || 0)} runs needed off {match.overs * 6 - (liveState?.legalBalls || 0)} balls)
            </span>
          </div>
        ) : null}
      </div>

      {/* STREAMLINED TABS NAVIGATION (LIVE, SCORECARD, TEAMS) */}
      <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'LIVE', label: 'Live', icon: Activity },
          { id: 'SCORECARD', label: 'Scorecard', icon: ListOrdered },
          { id: 'TEAMS', label: 'Teams', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all uppercase tracking-wider ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE */}
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

      {/* TAB 2: SCORECARD */}
      {activeTab === 'SCORECARD' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
          {/* SEGMENTED TEAM TOGGLE BUTTON */}
          <div className="flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-md">
            <button
              type="button"
              onClick={() => setSelectedScorecardTeam('TEAM1')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 truncate ${
                selectedScorecardTeam === 'TEAM1'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {match.team1?.name || 'TEAM A'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedScorecardTeam('TEAM2')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 truncate ${
                selectedScorecardTeam === 'TEAM2'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {match.team2?.name || 'TEAM B'}
            </button>
          </div>

          {/* BATTING SCORECARD TABLE FOR SELECTED TEAM */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-extrabold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Player Name</th>
                  <th className="p-3 text-right">Runs</th>
                  <th className="p-3 text-right">Balls</th>
                  <th className="p-3 text-right">4s</th>
                  <th className="p-3 text-right">6s</th>
                  <th className="p-3 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeScorecardBatters.length > 0 ? (
                  activeScorecardBatters.map((b: any) => {
                    const playerInfo = [...team1Players, ...team2Players].find(p => p.id === b.playerId);
                    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={b.playerId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3">
                          <div className="font-extrabold text-white">
                            {playerInfo?.full_name || playerInfo?.display_name || 'Batter'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {b.isOut ? `b ${b.dismissalInfo || 'out'}` : <span className="text-emerald-400 font-bold">not out</span>}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">{b.runs}</td>
                        <td className="p-3 text-right font-mono text-slate-300 font-semibold">{b.balls}</td>
                        <td className="p-3 text-right font-mono text-slate-300 font-semibold">{b.fours}</td>
                        <td className="p-3 text-right font-mono text-slate-300 font-semibold">{b.sixes}</td>
                        <td className="p-3 text-right font-mono text-slate-300 font-semibold">{sr}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500 italic">
                      No batters have faced a ball yet in this innings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEAMS (ALL 11 PLAYERS FOR BOTH TEAMS) */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEAM 1 PLAYING XI */}
          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-extrabold text-sm text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>{match.team1?.name} Playing XI</span>
              <span className="text-xs text-slate-500 font-mono">({team1Players.length} Players)</span>
            </h4>
            <div className="divide-y divide-slate-800/60 text-xs">
              {team1Players.map((p, idx) => (
                <div key={p.id || idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-extrabold text-slate-200">{p.full_name || p.display_name}</span>
                  </div>
                  <span className="text-emerald-400/90 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                    {p.role || p.player_role || p.position || 'Player'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM 2 PLAYING XI */}
          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-extrabold text-sm text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>{match.team2?.name} Playing XI</span>
              <span className="text-xs text-slate-500 font-mono">({team2Players.length} Players)</span>
            </h4>
            <div className="divide-y divide-slate-800/60 text-xs">
              {team2Players.map((p, idx) => (
                <div key={p.id || idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-extrabold text-slate-200">{p.full_name || p.display_name}</span>
                  </div>
                  <span className="text-emerald-400/90 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                    {p.role || p.player_role || p.position || 'Player'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
