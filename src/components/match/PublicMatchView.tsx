'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { processInningsDeliveries, DeliveryInput } from '@/lib/cricket/engine';
import { Eye, MapPin, Trophy, Calendar, Users, Activity, ListOrdered } from 'lucide-react';
import { cleanPlayerName, formatRoleForDisplay } from '@/lib/cricket/playerUtils';

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
  const isMatchCompleted = (() => {
    const s = (initialMatch.status || '').toString().toUpperCase();
    return s === 'COMPLETED' || s === 'FINISHED';
  })();
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCORECARD' | 'TEAMS'>(isMatchCompleted ? 'SCORECARD' : 'LIVE');
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
  const isCompleted = rawStatus === 'COMPLETED' || rawStatus === 'FINISHED';
  const displayStatus = isCompleted ? 'COMPLETED' : 'LIVE';

  // Build a comprehensive player name map from all available sources
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();

    const parseJsonArray = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    const addToMap = (p: any) => {
      if (!p) return;
      const rawName = typeof p === 'string'
        ? p
        : (p.name || p.full_name || p.display_name || p.player_name || '');

      if (!rawName || !rawName.trim()) return;

      const cleanedName = cleanPlayerName(rawName.trim());
      if (!cleanedName || cleanedName === 'Player') return;

      const rawId = p.id ? String(p.id).trim() : '';

      if (rawId) {
        map.set(rawId, cleanedName);
        map.set(rawId.toLowerCase(), cleanedName);
        if (rawId.startsWith('p_')) {
          map.set(rawId.slice(2), cleanedName);
        }
      }

      const lowerName = cleanedName.toLowerCase();
      map.set(lowerName, cleanedName);
      map.set(`p_${lowerName}`, cleanedName);
      map.set(`p_${lowerName.replace(/\s+/g, '_')}`, cleanedName);
      map.set(lowerName.replace(/\s+/g, '_'), cleanedName);
      map.set(rawName.trim().toLowerCase(), cleanedName);
    };

    (team1Players || []).forEach(addToMap);
    (team2Players || []).forEach(addToMap);

    parseJsonArray(match.your_team_players).forEach(addToMap);
    parseJsonArray(match.opposite_team_players).forEach(addToMap);
    parseJsonArray(match.team1_players).forEach(addToMap);
    parseJsonArray(match.team2_players).forEach(addToMap);
    parseJsonArray(match.players_a).forEach(addToMap);
    parseJsonArray(match.players_b).forEach(addToMap);

    return map;
  }, [team1Players, team2Players, match]);

  // Helper to resolve a player name from ID with optional index/squad fallback
  const resolvePlayerName = (playerId: string, index?: number, squad?: any[]): string => {
    if (!playerId || playerId === 'UNKNOWN_BATTER' || playerId === 'UNKNOWN_BOWLER') {
      if (squad && typeof index === 'number' && squad[index]) {
        const fallbackName = squad[index].name || squad[index].full_name || squad[index].display_name;
        if (fallbackName) return cleanPlayerName(fallbackName);
      }
      return 'Player';
    }

    const pidStr = String(playerId).trim();

    // 1. Direct map lookups
    const exactMatch = playerNameMap.get(pidStr);
    if (exactMatch) return exactMatch;

    const lowerMatch = playerNameMap.get(pidStr.toLowerCase());
    if (lowerMatch) return lowerMatch;

    if (pidStr.toLowerCase().startsWith('p_')) {
      const strippedMatch = playerNameMap.get(pidStr.toLowerCase().slice(2));
      if (strippedMatch) return strippedMatch;
    }

    // 2. Direct array search across team1Players and team2Players
    const foundInArrays = [...(team1Players || []), ...(team2Players || [])].find((p: any) => {
      if (!p) return false;
      const idStr = String(p.id || '').toLowerCase();
      const nStr = String(p.name || p.full_name || p.display_name || '').toLowerCase();
      const searchKey = pidStr.toLowerCase();
      return idStr === searchKey || nStr === searchKey || `p_${nStr}` === searchKey || `p_${nStr.replace(/\s+/g, '_')}` === searchKey;
    });

    if (foundInArrays) {
      const resolved = foundInArrays.name || foundInArrays.full_name || foundInArrays.display_name;
      if (resolved) return cleanPlayerName(resolved);
    }

    // 3. Fallback to squad by index if provided
    if (squad && typeof index === 'number' && squad[index]) {
      const fallbackName = squad[index].name || squad[index].full_name || squad[index].display_name;
      if (fallbackName) return cleanPlayerName(fallbackName);
    }

    // 4. If playerId is already a human-readable name string (not a UUID)
    const cleanedDirect = cleanPlayerName(pidStr);
    if (cleanedDirect && cleanedDirect !== 'Player' && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(pidStr)) {
      return cleanedDirect;
    }

    return 'Player';
  };

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
  const team1OversStr = team1LiveState ? team1LiveState.oversFormatted : (match.current_over ? `${match.current_over}` : '0.0');

  const team2ScoreStr = team2LiveState ? `${team2LiveState.totalRuns}/${team2LiveState.totalWickets}` : '0/0';
  const team2OversStr = team2LiveState ? team2LiveState.oversFormatted : '0.0';

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
           {/* HEADER MATCH BANNER - EXACT REFERENCE IMAGE 2 DESIGN */}
      <div className="bg-white border border-orange-200 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-900 space-y-3">
        {/* TOP ROW: CATEGORY NAME ON LEFT | DATE ON RIGHT */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-orange-600 font-extrabold text-sm sm:text-base tracking-wider uppercase">
            {(match.category || 'TOURNAMENT').toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm font-semibold">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span suppressHydrationWarning>
              {match.scheduled_start || match.scheduled_at || match.scheduled_date || match.created_at
                ? new Date(match.scheduled_start || match.scheduled_at || match.scheduled_date || match.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Today'}
            </span>
          </div>
        </div>

        {/* TEAMS & SCORES ROW */}
        <div className="grid grid-cols-2 items-center gap-4 pt-1">
          
          {/* LEFT TEAM (TEAM 1) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {match.team1?.logo_url ? (
                  <img 
                    src={match.team1.logo_url.includes('/storage/v1/object/') && !match.team1.logo_url.includes('/storage/v1/object/public/') ? match.team1.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team1.logo_url} 
                    alt={match.team1.name} 
                    className="w-full h-full object-cover rounded-lg" 
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-black text-sm text-orange-600 font-mono">{match.team1?.short_name || 'T1'}</span>
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {team1ScoreStr}
              </span>
            </div>

            <div className="flex items-center gap-2 pl-0.5 text-xs sm:text-sm">
              <span className="font-extrabold text-slate-900 truncate max-w-[100px] sm:max-w-[160px]">
                {match.team1?.name || match.team1?.short_name || 'Team 1'}
              </span>
              <span className="text-slate-500 font-mono font-medium text-xs sm:text-sm">
                ({team1OversStr})
              </span>
            </div>
          </div>

          {/* RIGHT TEAM (TEAM 2) */}
          <div className="space-y-1.5 text-right">
            <div className="flex items-center justify-end gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                {team2ScoreStr}
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {match.team2?.logo_url ? (
                  <img 
                    src={match.team2.logo_url.includes('/storage/v1/object/') && !match.team2.logo_url.includes('/storage/v1/object/public/') ? match.team2.logo_url.replace('/storage/v1/object/', '/storage/v1/object/public/') : match.team2.logo_url} 
                    alt={match.team2.name} 
                    className="w-full h-full object-cover rounded-lg" 
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="font-black text-sm text-orange-600 font-mono">{match.team2?.short_name || 'T2'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pr-0.5 text-xs sm:text-sm">
              <span className="text-slate-500 font-mono font-medium text-xs sm:text-sm">
                ({team2OversStr})
              </span>
              <span className="font-extrabold text-slate-900 truncate max-w-[100px] sm:max-w-[160px]">
                {match.team2?.name || match.team2?.short_name || 'Team 2'}
              </span>
            </div>
          </div>

        </div>

        {/* SUMMARY / TARGET BADGE IF APPLICABLE */}
        {match.result_summary ? (
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs">
              🏆 {match.result_summary}
            </span>
          </div>
        ) : match.target ? (
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="px-4 py-1 rounded-full bg-slate-50 border border-slate-200 text-orange-600 font-bold text-xs">
              Target: {match.target} ({match.target - (liveState?.totalRuns || 0)} runs needed off {match.overs * 6 - (liveState?.legalBalls || 0)} balls)
            </span>
          </div>
        ) : null}
      </div>

      {/* STREAMLINED TABS NAVIGATION (LIVE, SCORECARD, TEAMS) */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
        {[
          ...(isCompleted ? [] : [{ id: 'LIVE', label: 'LIVE' }]),
          { id: 'SCORECARD', label: 'SCORECARD' },
          { id: 'TEAMS', label: 'TEAMS' },
        ].map((tab) => {
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-extrabold text-xs transition-all uppercase tracking-wider ${
                isActiveTab
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE */}
      {activeTab === 'LIVE' && liveState && (
        <div className="space-y-4">
          
          {/* CURRENT OVER BALLS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Over {liveState.currentOverNumber + 1}</span>
            <div className="flex items-center gap-2">
              {currentOverDeliveries.map((d: any, idx: number) => (
                <span
                  key={idx}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono border ${
                    d.wicket 
                      ? 'bg-red-600 text-white border-red-500' 
                      : d.runs_batter === 4 || d.runs_batter === 6 
                      ? 'bg-orange-500 text-white border-orange-400'
                      : d.extra_type !== 'NONE'
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {d.wicket ? 'W' : d.extra_type !== 'NONE' ? d.extra_type[0] : d.runs_batter}
                </span>
              ))}
            </div>
          </div>

          {/* ACTIVE BATSMEN TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Batting
            </div>
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2 sm:p-3 w-[38%]">Name</th>
                  <th className="p-2 sm:p-3 text-right w-[12%]">R</th>
                  <th className="p-2 sm:p-3 text-right w-[12%]">B</th>
                  <th className="p-2 sm:p-3 text-right w-[12%]">4s</th>
                  <th className="p-2 sm:p-3 text-right w-[12%]">6s</th>
                  <th className="p-2 sm:p-3 text-right w-[14%]">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[liveState.strikerId, liveState.nonStrikerId].map((id, index) => {
                  const b = liveState.batters[id];
                  const isStriker = index === 0;
                  return (
                    <tr key={id || index} className={isStriker ? 'bg-orange-50/50 font-bold text-slate-900' : 'text-slate-700'}>
                      <td className="p-2 sm:p-3 flex items-center gap-2 truncate w-[38%]">
                        <span className="truncate">{resolvePlayerName(id)}</span>
                        {isStriker && <span className="text-orange-600 font-bold shrink-0">🏏 *</span>}
                      </td>
                      <td className="p-2 sm:p-3 text-right font-mono text-orange-600 font-bold w-[12%]">{b?.runs || 0}</td>
                      <td className="p-2 sm:p-3 text-right font-mono w-[12%]">{b?.balls || 0}</td>
                      <td className="p-2 sm:p-3 text-right font-mono w-[12%]">{b?.fours || 0}</td>
                      <td className="p-2 sm:p-3 text-right font-mono w-[12%]">{b?.sixes || 0}</td>
                      <td className="p-2 sm:p-3 text-right font-mono w-[14%]">{b?.strikeRate || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ACTIVE BOWLER TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bowling
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
                  return (
                    <tr className="text-slate-900 font-semibold">
                      <td className="p-3 flex items-center gap-2">
                        <span>{resolvePlayerName(liveState.currentBowlerId)}</span>
                        <span className="text-orange-500 font-bold">⚾</span>
                      </td>
                      <td className="p-3 text-right font-mono">{bw?.oversFormatted || '0.0'}</td>
                      <td className="p-3 text-right font-mono">{bw?.maidens || 0}</td>
                      <td className="p-3 text-right font-mono">{bw?.runsConceded || 0}</td>
                      <td className="p-3 text-right font-mono text-orange-600 font-bold">{bw?.wickets || 0}</td>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-5 shadow-sm text-slate-900">
          {/* SEGMENTED TEAM TOGGLE BUTTON */}
          <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedScorecardTeam('TEAM1')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 truncate ${
                selectedScorecardTeam === 'TEAM1'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {match.team1?.name || 'TEAM 1'} Innings
            </button>
            <button
              type="button"
              onClick={() => setSelectedScorecardTeam('TEAM2')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-200 truncate ${
                selectedScorecardTeam === 'TEAM2'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {match.team2?.name || 'TEAM 2'} Innings
            </button>
          </div>

          {/* 1. BATTING SCORECARD TABLE FOR SELECTED TEAM */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span>🏏 Batting — {selectedScorecardTeam === 'TEAM1' ? (match.team1?.name || 'Team 1') : (match.team2?.name || 'Team 2')}</span>
              <span className="font-mono text-orange-600">
                {selectedScorecardTeam === 'TEAM1' ? team1ScoreStr : team2ScoreStr} ({selectedScorecardTeam === 'TEAM1' ? team1OversStr : team2OversStr} Ov)
              </span>
            </h4>

            <div className="w-full rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[11px] sm:text-xs table-fixed">
                <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-2 sm:p-3 w-[38%]">Batter</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">R</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">B</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">4s</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">6s</th>
                    <th className="p-2 sm:p-3 text-right w-[14%]">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeScorecardBatters.length > 0 ? (
                    activeScorecardBatters.map((b: any, idx: number) => {
                      const currentBattingSquad = selectedScorecardTeam === 'TEAM1' ? team1Players : team2Players;
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={b.playerId || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 sm:p-3 w-[38%] truncate">
                            <div className="font-extrabold text-slate-900 truncate">
                              {resolvePlayerName(b.playerId, idx, currentBattingSquad)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                              {b.isOut ? `b ${b.dismissalInfo || 'out'}` : <span className="text-orange-600 font-bold">not out</span>}
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-right font-mono font-black text-orange-600 text-xs sm:text-sm w-[12%]">{b.runs}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-600 font-semibold w-[12%]">{b.balls}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-600 font-semibold w-[12%]">{b.fours}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-600 font-semibold w-[12%]">{b.sixes}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-600 font-semibold w-[14%]">{sr}</td>
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

          {/* 2. BOWLING SCORECARD TABLE FOR OPPOSITE TEAM */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              🎯 Bowling — {selectedScorecardTeam === 'TEAM1' ? (match.team2?.name || 'Team 2') : (match.team1?.name || 'Team 1')}
            </h4>

            <div className="w-full rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[11px] sm:text-xs table-fixed">
                <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-2 sm:p-3 w-[38%]">Bowler</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">O</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">M</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">R</th>
                    <th className="p-2 sm:p-3 text-right w-[12%]">W</th>
                    <th className="p-2 sm:p-3 text-right w-[14%]">ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targetScorecardState && targetScorecardState.bowlers && Object.values(targetScorecardState.bowlers).length > 0 ? (
                    Object.values(targetScorecardState.bowlers).map((bw: any, idx: number) => {
                      const currentBowlingSquad = selectedScorecardTeam === 'TEAM1' ? team2Players : team1Players;
                      return (
                        <tr key={bw.playerId || idx} className="hover:bg-slate-50 transition-colors font-medium">
                          <td className="p-2 sm:p-3 w-[38%] truncate font-extrabold text-slate-900">
                            {resolvePlayerName(bw.playerId, idx, currentBowlingSquad)}
                          </td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-700 w-[12%]">{bw.oversFormatted || '0.0'}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-500 w-[12%]">{bw.maidens || 0}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-900 font-bold w-[12%]">{bw.runsConceded || 0}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-orange-600 font-black text-xs sm:text-sm w-[12%]">{bw.wickets || 0}</td>
                          <td className="p-2 sm:p-3 text-right font-mono text-slate-600 w-[14%]">{bw.economy || '0.00'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-500 italic">
                        No bowling figures recorded yet for this innings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAMS (ALL PLAYERS FOR BOTH TEAMS) */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEAM 1 PLAYING XI */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-slate-900">
            <h4 className="font-extrabold text-sm text-orange-600 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>{match.team1?.name || 'Team 1'} Playing XI</span>
              <span className="text-xs text-slate-500 font-mono">({team1Players.length} Players)</span>
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {team1Players.map((p, idx) => (
                <div key={p.id || idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-extrabold text-slate-800">
                      {cleanPlayerName(p.name || p.full_name || p.display_name)} — <span className="text-orange-600 font-semibold">{formatRoleForDisplay(p.role || p.player_role || p.type || p.position)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM 2 PLAYING XI */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-slate-900">
            <h4 className="font-extrabold text-sm text-orange-600 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>{match.team2?.name || 'Team 2'} Playing XI</span>
              <span className="text-xs text-slate-500 font-mono">({team2Players.length} Players)</span>
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {team2Players.map((p, idx) => (
                <div key={p.id || idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                    <span className="font-extrabold text-slate-800">
                      {cleanPlayerName(p.name || p.full_name || p.display_name)} — <span className="text-orange-600 font-semibold">{formatRoleForDisplay(p.role || p.player_role || p.type || p.position)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
