'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { scoreBall, undoLastBall, setBattingTeam, completeMatch } from '@/actions/scoring';
import { ExtraType, WicketType, InningsState } from '@/lib/cricket/engine';
import { ArrowLeft, RotateCcw, AlertTriangle, ChevronRight, RefreshCw, X, MoreHorizontal, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/common/Logo';
import { isValidImageUrl, sanitizeImageUrl } from '@/lib/imageUtils';
import { cleanPlayerName, getOrderedBatters, getFilteredBowlers } from '@/lib/cricket/playerUtils';

interface MobileScoringUIProps {
  match: any;
  activeInnings: any;
  team1Players: any[];
  team2Players: any[];
}

export default function MobileScoringUI({ match, activeInnings, team1Players, team2Players }: MobileScoringUIProps) {
  const router = useRouter();

  const t1 = Array.isArray(match.team1) ? match.team1[0] : match.team1;
  const t2 = Array.isArray(match.team2) ? match.team2[0] : match.team2;

  const team1Id = t1?.id || match.team1_id || match.team_a_id || 't1';
  const team2Id = t2?.id || match.team2_id || match.team_b_id || 't2';

  const team1Name = t1?.name || match.your_team_name || (match.title ? match.title.split(' vs ')[0] : 'Team 1');
  const team2Name = t2?.name || match.opposite_team_name || (match.title ? match.title.split(' vs ')[1] : 'Team 2');

  const team1Logo = t1?.logo_url || match.your_team_logo_url;
  const team2Logo = t2?.logo_url || match.opposite_team_logo_url;
  const team1Short = t1?.short_name || team1Name.slice(0, 4).toUpperCase();
  const team2Short = t2?.short_name || team2Name.slice(0, 4).toUpperCase();

  const [firstBattingTeamId] = useState<string>(activeInnings?.batting_team_id || team1Id);
  const [selectedBattingTeamId, setSelectedBattingTeamId] = useState<string>(
    activeInnings?.batting_team_id || team1Id
  );
  const [isTeamConfirmed, setIsTeamConfirmed] = useState<boolean>(false);

  const isFirstBattingTeam = selectedBattingTeamId === firstBattingTeamId;

  const isBattingTeam1 = selectedBattingTeamId === team1Id;
  const rawBattingPlayers = isBattingTeam1 ? team1Players : team2Players;
  const rawBowlingPlayers = isBattingTeam1 ? team2Players : team1Players;

  const battingPlayers = useMemo(() => getOrderedBatters(rawBattingPlayers), [rawBattingPlayers]);
  const bowlingPlayers = useMemo(() => getFilteredBowlers(rawBowlingPlayers), [rawBowlingPlayers]);

  const battingTeamName = isBattingTeam1 ? team1Name : team2Name;
  const battingTeamLogo = isBattingTeam1 ? team1Logo : team2Logo;
  const battingTeamShort = isBattingTeam1 ? team1Short : team2Short;

  const [strikerId, setStrikerId] = useState<string>(battingPlayers[0]?.id || '');
  const [nonStrikerId, setNonStrikerId] = useState<string>(battingPlayers[1]?.id || '');
  const [bowlerId, setBowlerId] = useState<string>(bowlingPlayers[0]?.id || '');

  // Separate Live Innings State for First & Second Batting Teams
  const [innings1State, setInnings1State] = useState<InningsState | null>(null);
  const [innings2State, setInnings2State] = useState<InningsState | null>(null);

  const liveInningsState = isFirstBattingTeam ? innings1State : innings2State;
  const setLiveInningsState = (newState: InningsState | null) => {
    if (isFirstBattingTeam) {
      setInnings1State(newState);
    } else {
      setInnings2State(newState);
    }
  };

  // Modals / Bottom Sheets
  const [isWicketModalOpen, setIsWicketModalOpen] = useState<boolean>(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState<boolean>(false);
  const [isPlayerChangeOpen, setIsPlayerChangeOpen] = useState<boolean>(false);

  // Extras Form State
  const [selectedExtraType, setSelectedExtraType] = useState<ExtraType>('NONE');
  const [selectedExtraRuns, setSelectedExtraRuns] = useState<number>(1);

  // Wicket Form State
  const [wicketType, setWicketType] = useState<WicketType>('Bowled');
  const [dismissedPlayerId, setDismissedPlayerId] = useState<string>('');
  const [nextBatterId, setNextBatterId] = useState<string>('');

  // Toast / Feedback State
  const [toastMsg, setToastMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Always resolve a valid UUID string for inningsId
  const safeInningsId = (activeInnings?.id && activeInnings.id !== 'inn1') ? activeInnings.id : match.id;

  const strikerPlayer = battingPlayers.find(p => p.id === strikerId) || battingPlayers[0];
  const nonStrikerPlayer = battingPlayers.find(p => p.id === nonStrikerId) || battingPlayers[1];
  const bowlerPlayer = bowlingPlayers.find(p => p.id === bowlerId) || bowlingPlayers[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Dynamic live score stats
  const displayRuns = liveInningsState ? liveInningsState.totalRuns : (activeInnings?.total_runs || 0);
  const displayWickets = liveInningsState ? liveInningsState.totalWickets : (activeInnings?.total_wickets || 0);
  const displayOvers = liveInningsState ? liveInningsState.oversFormatted : (activeInnings?.total_overs || 0.0).toFixed(1);

  const crrValue = (((activeInnings?.total_runs || 0) / (activeInnings?.total_overs || 1))).toFixed(2);
  const displayCRR = liveInningsState ? liveInningsState.currentRunRate : crrValue;

  const rrr = match.target 
    ? (((match.target - displayRuns) / Math.max((match.overs - (activeInnings?.total_overs || 0)), 0.1))).toFixed(2)
    : 'N/A';

  // Dynamic player stats
  const strikerStats = liveInningsState?.batters[strikerId];
  const strikerRuns = strikerStats ? strikerStats.runs : 0;
  const strikerBalls = strikerStats ? strikerStats.balls : 0;
  const strikerFours = strikerStats ? strikerStats.fours : 0;
  const strikerSixes = strikerStats ? strikerStats.sixes : 0;
  const strikerSR = strikerStats && strikerStats.balls > 0 
    ? strikerStats.strikeRate.toFixed(2) 
    : '0.00';

  const nonStrikerStats = liveInningsState?.batters[nonStrikerId];
  const nonStrikerRuns = nonStrikerStats ? nonStrikerStats.runs : 0;
  const nonStrikerBalls = nonStrikerStats ? nonStrikerStats.balls : 0;
  const nonStrikerFours = nonStrikerStats ? nonStrikerStats.fours : 0;
  const nonStrikerSixes = nonStrikerStats ? nonStrikerStats.sixes : 0;
  const nonStrikerSR = nonStrikerStats && nonStrikerStats.balls > 0 
    ? nonStrikerStats.strikeRate.toFixed(2) 
    : '0.00';

  const bowlerStats = liveInningsState?.bowlers[bowlerId];
  const bowlerOvers = bowlerStats ? bowlerStats.oversFormatted : '0.0';
  const bowlerRuns = bowlerStats ? bowlerStats.runsConceded : 0;
  const bowlerWickets = bowlerStats ? bowlerStats.wickets : 0;

  // Dynamic current over stats
  const maxAllowedOvers = match.overs || 20;
  const isMaxOversReached = (liveInningsState?.legalBalls || 0) >= maxAllowedOvers * 6;
  const isInningsCompleted = liveInningsState?.isCompleted || isMaxOversReached;

  const currentOverNum = Math.min(Math.floor((liveInningsState?.legalBalls || 0) / 6) + 1, maxAllowedOvers);
  const currentOverBallsList = liveInningsState?.currentOverDeliveries || [];
  const currentOverTotalRuns = liveInningsState?.currentOverRuns || 0;

  // =========================================================================
  // 1. TEAM SELECTION SCREEN (FIRST STEP BEFORE LIVE SCORING PANEL)
  // =========================================================================
  if (!isTeamConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 flex flex-col justify-start gap-4 max-w-md mx-auto selection:bg-orange-500 selection:text-white">
        <div className="space-y-4">
          {/* HEADER */}
          <header className="flex items-center justify-between pb-3 border-b border-slate-200">
            <Link href="/master/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-bold">Back</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Logo size="sm" href="" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-wider">
              LIVE SCORING
            </span>
          </header>

          {/* QUESTION BOX */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4 text-center shadow-sm mt-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mx-auto">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900">Which team is batting now?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the team currently batting to start updating live scores.
              </p>
            </div>

            {/* TEAM OPTIONS */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedBattingTeamId(team1Id)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  selectedBattingTeamId === team1Id
                    ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-orange-300 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center font-black text-xs text-orange-600 font-mono overflow-hidden shrink-0">
                    {isValidImageUrl(team1Logo) ? (
                      <img src={sanitizeImageUrl(team1Logo)} alt={team1Name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      team1Short
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{team1Name}</span>
                </div>
                {selectedBattingTeamId === team1Id && (
                  <CheckCircle2 className="w-5 h-5 text-orange-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBattingTeamId(team2Id)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  selectedBattingTeamId === team2Id
                    ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-orange-300 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center font-black text-xs text-orange-600 font-mono overflow-hidden shrink-0">
                    {isValidImageUrl(team2Logo) ? (
                      <img src={sanitizeImageUrl(team2Logo)} alt={team2Name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      team2Short
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{team2Name}</span>
                </div>
                {selectedBattingTeamId === team2Id && (
                  <CheckCircle2 className="w-5 h-5 text-orange-600" />
                )}
              </button>
            </div>

            {/* START SCORING BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedBattingTeamId || loading}
                onClick={async () => {
                  if (!selectedBattingTeamId) return;
                  setLoading(true);
                  const bowlingTeamId = selectedBattingTeamId === team1Id ? team2Id : team1Id;
                  try {
                    await setBattingTeam(match.id, safeInningsId, selectedBattingTeamId, bowlingTeamId);
                  } catch {}
                  setLoading(false);
                  setIsTeamConfirmed(true);
                }}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Start'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. FAST SCORE RUN HANDLER
  const handleScoreRun = async (runsBatter: number, extraType: ExtraType = 'NONE') => {
    if (loading) return;

    if (isInningsCompleted) {
      setErrorMsg(`Innings limit of ${maxAllowedOvers} overs reached.`);
      showToast(`Innings limit of ${maxAllowedOvers} overs reached.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await scoreBall({
        matchId: match.id,
        inningsId: selectedBattingTeamId,
        battingTeamId: selectedBattingTeamId,
        strikerId,
        nonStrikerId,
        bowlerId,
        runsBatter,
        extraType
      });

      setLoading(false);
      setIsMoreModalOpen(false);

      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.newState) {
        setLiveInningsState(res.newState);
        setStrikerId(res.newState.strikerId);
        setNonStrikerId(res.newState.nonStrikerId);
        
        showToast(extraType !== 'NONE' ? `${extraType.replace('_', ' ')} recorded` : `${runsBatter} run${runsBatter === 1 ? '' : 's'} added`);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to update score. Please try again.');
    }
  };

  // 1B. SUBMIT EXTRA WITH CONFIRMATION & SELECTED RUN VALUE
  const handleScoreExtraSubmit = async () => {
    if (loading || selectedExtraType === 'NONE') return;

    if (isInningsCompleted) {
      setErrorMsg(`Innings limit of ${maxAllowedOvers} overs reached.`);
      showToast(`Innings limit of ${maxAllowedOvers} overs reached.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    let runsBatter = 0;
    let runsExtras = 0;

    if (selectedExtraType === 'WIDE') {
      runsBatter = 0;
      runsExtras = Math.max(0, selectedExtraRuns - 1);
    } else if (selectedExtraType === 'NO_BALL') {
      runsBatter = Math.max(0, selectedExtraRuns - 1);
      runsExtras = 0;
    } else if (selectedExtraType === 'BYE') {
      runsBatter = 0;
      runsExtras = selectedExtraRuns;
    } else if (selectedExtraType === 'LEG_BYE') {
      runsBatter = 0;
      runsExtras = selectedExtraRuns;
    }

    try {
      const res = await scoreBall({
        matchId: match.id,
        inningsId: selectedBattingTeamId,
        battingTeamId: selectedBattingTeamId,
        strikerId,
        nonStrikerId,
        bowlerId,
        runsBatter,
        runsExtras,
        extraType: selectedExtraType
      });

      setLoading(false);
      setIsMoreModalOpen(false);
      setSelectedExtraType('NONE');

      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.newState) {
        setLiveInningsState(res.newState);
        setStrikerId(res.newState.strikerId);
        setNonStrikerId(res.newState.nonStrikerId);

        const label = selectedExtraType.replace('_', ' ');
        showToast(`${label} (${selectedExtraRuns} run${selectedExtraRuns === 1 ? '' : 's'}) added`);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to record extra. Please try again.');
    }
  };

  // 2. WICKET SUBMIT HANDLER
  const handleScoreWicketSubmit = async () => {
    if (loading) return;

    if (isInningsCompleted) {
      setErrorMsg(`Innings limit of ${maxAllowedOvers} overs reached.`);
      showToast(`Innings limit of ${maxAllowedOvers} overs reached.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setIsWicketModalOpen(false);

    try {
      const res = await scoreBall({
        matchId: match.id,
        inningsId: selectedBattingTeamId,
        battingTeamId: selectedBattingTeamId,
        strikerId,
        nonStrikerId,
        bowlerId,
        runsBatter: 0,
        extraType: 'NONE',
        wicket: true,
        wicketType,
        dismissedPlayerId: dismissedPlayerId || strikerId
      });

      setLoading(false);

      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.newState) {
        setLiveInningsState(res.newState);
        if (nextBatterId) {
          if ((dismissedPlayerId || strikerId) === strikerId) {
            setStrikerId(nextBatterId);
          } else {
            setNonStrikerId(nextBatterId);
          }
        }
        showToast('Wicket recorded');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to record wicket. Please try again.');
    }
  };

  // 3. UNDO HANDLER
  const handleUndo = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await undoLastBall(match.id, selectedBattingTeamId);
      setLoading(false);

      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.newState) {
        setLiveInningsState(res.newState);
        showToast('Last ball undone');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to undo last ball.');
    }
  };

  // 4. SWAP BATSMEN HANDLER
  const handleSwapBatsmen = () => {
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
    showToast('Striker swapped');
  };

  // 5. NEXT INNINGS HANDLER (FIRST TEAM ONLY)
  const handleNextInnings = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    const secondTeamId = firstBattingTeamId === team1Id ? team2Id : team1Id;
    const secondTeamPlayers = firstBattingTeamId === team1Id ? team2Players : team1Players;
    const firstTeamPlayers = firstBattingTeamId === team1Id ? team1Players : team2Players;

    try {
      await setBattingTeam(match.id, secondTeamId, secondTeamId, firstBattingTeamId);
      setSelectedBattingTeamId(secondTeamId);
      setStrikerId(secondTeamPlayers[0]?.id || '');
      setNonStrikerId(secondTeamPlayers[1]?.id || '');
      setBowlerId(firstTeamPlayers[0]?.id || '');
      showToast(`Opened scoring panel for ${secondTeamId === team1Id ? team1Name : team2Name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch to second team.');
    }
    setLoading(false);
  };

  // 6. PREVIOUS INNINGS HANDLER (SECOND TEAM ONLY)
  const handlePreviousInnings = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    const secondTeamId = firstBattingTeamId === team1Id ? team2Id : team1Id;
    const firstTeamPlayers = firstBattingTeamId === team1Id ? team1Players : team2Players;
    const secondTeamPlayers = firstBattingTeamId === team1Id ? team2Players : team1Players;

    try {
      await setBattingTeam(match.id, firstBattingTeamId, firstBattingTeamId, secondTeamId);
      setSelectedBattingTeamId(firstBattingTeamId);
      setStrikerId(firstTeamPlayers[0]?.id || '');
      setNonStrikerId(firstTeamPlayers[1]?.id || '');
      setBowlerId(secondTeamPlayers[0]?.id || '');
      showToast(`Returned to ${firstBattingTeamId === team1Id ? team1Name : team2Name}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to return to first team.');
    }
    setLoading(false);
  };

  // 7. COMPLETE MATCH HANDLER (ONLY WAY TO CLOSE THE SCORING PANEL)
  const handleCompleteMatch = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await completeMatch(match.id);
      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
      } else {
        showToast('Scoring completed & match finalized');
        setTimeout(() => {
          router.push('/master/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete match.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white font-sans pb-16">
      
      {/* 1. HEADER (CLEAN TOP BAR) */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Link href="/master/dashboard" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold">Back</span>
        </Link>
        
        <div className="flex items-center gap-1.5">
          <Logo size="sm" href="" />
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            LIVE ●
          </span>
        </div>
      </header>

      {/* TOAST CONFIRMATION FEEDBACK */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 bg-orange-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg border border-orange-400 animate-in fade-in slide-in-from-top-2">
          ✓ {toastMsg}
        </div>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto px-4 mt-2">
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* MAIN COMPACT LAYOUT CONTAINER */}
      <div className="max-w-4xl mx-auto px-3 py-2.5 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start space-y-2.5 lg:space-y-0">
        
        {/* ========================================================== */}
        {/* LEFT COLUMN (Scoreboard, Batters, Bowler, Over Timeline)   */}
        {/* ========================================================== */}
        <div className="lg:col-span-6 space-y-2.5">
          
          {/* 2. COMPACT MAIN SCOREBOARD WITH CRR ON CENTER OF RIGHT SIDE */}
          <div className="bg-white border border-orange-300 rounded-2xl p-2.5 sm:p-3 shadow-sm flex items-center justify-between gap-3">
            {/* LEFT / CENTER SCORE DETAILS */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                  {isValidImageUrl(battingTeamLogo) ? (
                    <img src={sanitizeImageUrl(battingTeamLogo)} alt={battingTeamName} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <span className="font-black text-[8px] text-orange-600 font-mono">{battingTeamShort}</span>
                  )}
                </div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider truncate">
                  {battingTeamName}
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-orange-600">
                  {displayRuns} <span className="text-slate-900">/</span> {displayWickets}
                </div>
                <div className="text-xs font-extrabold text-slate-900 font-mono">
                  {displayOvers} <span className="text-[9px] text-slate-500">OV</span>
                </div>
              </div>

              {match.target && (
                <div className="text-[10px] font-bold text-slate-500 font-mono flex items-center gap-2">
                  <span>TARGET <strong className="text-orange-600">{match.target}</strong></span>
                  <span>• RRR <strong className="text-blue-600">{rrr}</strong></span>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: CRR DISPLAYED AT CENTER OF RIGHT SIDE */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 pl-3 border-l border-slate-200 py-1 min-w-[64px]">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">CRR</span>
              <span className="text-base font-black text-orange-600 font-mono mt-0.5">{displayCRR}</span>
            </div>
          </div>

          {/* 3. BATSMAN CARD (MATCHES REFERENCE IMAGE) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Batters</span>
              <button 
                onClick={handleSwapBatsmen}
                className="text-[10px] font-extrabold text-orange-600 flex items-center gap-1 hover:underline active:scale-95 transition-transform"
                title="Swap Striker and Non-Striker"
              >
                <RefreshCw className="w-3 h-3" />
                Swap
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 font-semibold">
                    <th className="py-1.5 px-2 font-semibold">Batsman</th>
                    <th className="py-1.5 px-2 text-right font-semibold">R</th>
                    <th className="py-1.5 px-2 text-right font-semibold">B</th>
                    <th className="py-1.5 px-2 text-right font-semibold">4s</th>
                    <th className="py-1.5 px-2 text-right font-semibold">6s</th>
                    <th className="py-1.5 px-2 text-right font-semibold">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* STRIKER ROW */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 font-bold text-orange-600 truncate max-w-[120px]">
                      {cleanPlayerName(strikerPlayer?.name || strikerPlayer?.full_name || strikerPlayer?.display_name)}*
                    </td>
                    <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">{strikerRuns}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{strikerBalls}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{strikerFours}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{strikerSixes}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{strikerSR}</td>
                  </tr>

                  {/* NON-STRIKER ROW */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 font-bold text-orange-600 truncate max-w-[120px]">
                      {cleanPlayerName(nonStrikerPlayer?.name || nonStrikerPlayer?.full_name || nonStrikerPlayer?.display_name)}
                    </td>
                    <td className="py-2 px-2 text-right font-black text-slate-900 font-mono">{nonStrikerRuns}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{nonStrikerBalls}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{nonStrikerFours}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{nonStrikerSixes}</td>
                    <td className="py-2 px-2 text-right text-slate-600 font-mono">{nonStrikerSR}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PLAYER SELECTION TOGGLE */}
            <div className="flex justify-end pt-0.5">
              <button 
                onClick={() => setIsPlayerChangeOpen(!isPlayerChangeOpen)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline"
              >
                {isPlayerChangeOpen ? 'Done' : 'Change Player Selection'}
              </button>
            </div>

            {isPlayerChangeOpen && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Striker</label>
                  <select
                    value={strikerId}
                    onChange={(e) => setStrikerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-1.5"
                  >
                    {battingPlayers.map(p => (
                      <option key={p.id} value={p.id}>{cleanPlayerName(p.name || p.full_name || p.display_name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Non-Striker</label>
                  <select
                    value={nonStrikerId}
                    onChange={(e) => setNonStrikerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-1.5"
                  >
                    {battingPlayers.map(p => (
                      <option key={p.id} value={p.id}>{cleanPlayerName(p.name || p.full_name || p.display_name)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. COMPACT CURRENT BOWLER WITH DYNAMIC STATS & SELECTOR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Bowler</span>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-lg px-2 py-1 mt-0.5 max-w-full truncate focus:outline-none focus:border-orange-500"
              >
                {bowlingPlayers.map(p => (
                  <option key={p.id} value={p.id}>{cleanPlayerName(p.name || p.full_name || p.display_name)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-extrabold font-mono text-slate-600 shrink-0">
              <div>{bowlerOvers} <span className="text-[9px] font-semibold text-slate-400">OV</span></div>
              <div>{bowlerRuns} <span className="text-[9px] font-semibold text-slate-400">R</span></div>
              <div className="text-orange-600">{bowlerWickets} <span className="text-[9px] font-semibold text-slate-400">W</span></div>
            </div>
          </div>

          {/* 5. DYNAMIC CURRENT OVER STRIP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider">OVER {currentOverNum}</span>
              <span className="font-bold text-orange-600 text-[10px]">{currentOverTotalRuns} RUNS</span>
            </div>
            <div className="flex items-center gap-1.5 min-h-[26px]">
              {currentOverBallsList.length > 0 ? (
                currentOverBallsList.map((ballObj: any, idx: number) => (
                  <span 
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${
                      ballObj.display === '4' ? 'bg-blue-600 text-white' :
                      ballObj.display === '6' ? 'bg-orange-500 text-white' :
                      ballObj.isWicket || ballObj.display === 'W' ? 'bg-red-600 text-white' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {ballObj.display}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold italic pl-1">
                  No balls bowled in this over yet
                </span>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN (Run Keypad, Wicket, More, Undo, Next)       */}
        {/* ========================================================== */}
        <div className="lg:col-span-6 space-y-2.5">
          
          {/* 7. COMPACT SCORING KEYPAD (3x2 GRID) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Runs</span>
              {isInningsCompleted && (
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                  Overs Limit ({maxAllowedOvers} Ov) Reached
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* RUN 0 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(0)}
                className="h-14 sm:h-15 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                0
              </button>

              {/* RUN 1 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(1)}
                className="h-14 sm:h-15 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-orange-600 font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                1
              </button>

              {/* RUN 2 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(2)}
                className="h-14 sm:h-15 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-orange-600 font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                2
              </button>

              {/* RUN 3 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(3)}
                className="h-14 sm:h-15 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-orange-600 font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                3
              </button>

              {/* RUN 4 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(4)}
                className="h-14 sm:h-15 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xl sm:text-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                4
              </button>

              {/* RUN 6 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(6)}
                className="h-14 sm:h-15 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xl sm:text-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                6
              </button>
            </div>
          </div>

          {/* 8. SCORING ACTION BAR */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {/* WICKET BUTTON */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => setIsWicketModalOpen(true)}
                className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                WICKET
              </button>

              {/* MORE BUTTON */}
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsMoreModalOpen(true)}
                className="h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-orange-600 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                MORE
              </button>

              {/* UNDO BUTTON */}
              <button
                type="button"
                disabled={loading}
                onClick={handleUndo}
                className="h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                UNDO
              </button>
            </div>

            {/* DYNAMIC SCORING FLOW NAVIGATION BUTTONS */}
            {isFirstBattingTeam ? (
              /* FIRST BATTING TEAM PANEL: SHOW ONLY NEXT BUTTON */
              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleNextInnings}
                  className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  title="Proceed to second team scoring"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* SECOND BATTING TEAM PANEL: SHOW ONLY PREVIOUS & COMPLETE BUTTONS */
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePreviousInnings}
                  className="h-12 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                  title="Return to first team scoring"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                  <span>PREVIOUS</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteMatch}
                  className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  title="Finalize match and close scoring panel"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>COMPLETE</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* 9. WICKET BOTTOM SHEET MODAL                               */}
      {/* ========================================================== */}
      {isWicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Record Wicket
              </h3>
              <button onClick={() => setIsWicketModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Dismissed Player</label>
              <select 
                value={dismissedPlayerId || strikerId}
                onChange={(e) => setDismissedPlayerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
              >
                <option value={strikerId}>Striker: {cleanPlayerName(strikerPlayer?.name || strikerPlayer?.full_name || strikerPlayer?.display_name)}</option>
                <option value={nonStrikerId}>Non-Striker: {cleanPlayerName(nonStrikerPlayer?.name || nonStrikerPlayer?.full_name || nonStrikerPlayer?.display_name)}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Dismissal Type</label>
              <select 
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value as WicketType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
              >
                {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Other'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Select New Batter</label>
              <select 
                value={nextBatterId}
                onChange={(e) => setNextBatterId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
              >
                <option value="">Select Next Batter...</option>
                {battingPlayers
                  .filter(p => p.id !== strikerId && p.id !== nonStrikerId)
                  .map(p => (
                    <option key={p.id} value={p.id}>{cleanPlayerName(p.name || p.full_name || p.display_name)}</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScoreWicketSubmit}
                className="flex-1 py-3 bg-red-600 text-white font-black rounded-xl text-xs shadow-md uppercase tracking-wider"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 10. MORE / EXTRAS SCORING BOTTOM SHEET MODAL              */}
      {/* ========================================================== */}
      {isMoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 text-slate-900">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {selectedExtraType !== 'NONE' && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedExtraType('NONE')}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
                    title="Back to extras list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedExtraType === 'NONE' ? 'Other Scoring Options' : `Extra: ${selectedExtraType.replace('_', ' ')}`}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsMoreModalOpen(false);
                  setSelectedExtraType('NONE');
                }} 
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: SELECT EXTRA TYPE */}
            {selectedExtraType === 'NONE' ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExtraType('WIDE');
                    setSelectedExtraRuns(1);
                  }}
                  className="py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-left flex items-center justify-between active:scale-95 transition-all"
                >
                  <span>Wide</span>
                  <span className="text-orange-600 font-black">WD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedExtraType('NO_BALL');
                    setSelectedExtraRuns(1);
                  }}
                  className="py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-left flex items-center justify-between active:scale-95 transition-all"
                >
                  <span>No Ball</span>
                  <span className="text-orange-600 font-black">NB</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedExtraType('BYE');
                    setSelectedExtraRuns(1);
                  }}
                  className="py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-left flex items-center justify-between active:scale-95 transition-all"
                >
                  <span>Bye</span>
                  <span className="text-orange-600 font-black">B</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedExtraType('LEG_BYE');
                    setSelectedExtraRuns(1);
                  }}
                  className="py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-left flex items-center justify-between active:scale-95 transition-all"
                >
                  <span>Leg Bye</span>
                  <span className="text-orange-600 font-black">LB</span>
                </button>
              </div>
            ) : (
              /* STEP 2: SELECT RUN VALUE & CLICK ADD */
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
                    <span>Extra Type: <strong className="text-orange-600">{selectedExtraType.replace('_', ' ')}</strong></span>
                    <span>Selected Runs: <strong className="text-slate-900 text-sm font-mono">{selectedExtraRuns}</strong></span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {selectedExtraType === 'WIDE' && '1 Wide penalty run + additional runs to team total (0 to striker).'}
                    {selectedExtraType === 'NO_BALL' && '1 No Ball penalty run + runs scored off bat credited to striker.'}
                    {selectedExtraType === 'BYE' && 'Bye runs added to team total (0 to striker, legal ball).'}
                    {selectedExtraType === 'LEG_BYE' && 'Leg Bye runs added to team total (0 to striker, legal ball).'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Select Runs:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((rVal) => (
                      <button
                        key={rVal}
                        type="button"
                        onClick={() => setSelectedExtraRuns(rVal)}
                        className={`py-2.5 rounded-xl text-xs font-black font-mono transition-all active:scale-95 border ${
                          selectedExtraRuns === rVal
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm scale-105'
                            : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-orange-400'
                        }`}
                      >
                        {rVal} {rVal === 1 ? 'Run' : 'Runs'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExtraType('NONE')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleScoreExtraSubmit}
                    className="flex-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>{loading ? 'Adding...' : `ADD ${selectedExtraType.replace('_', ' ')} (${selectedExtraRuns})`}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedExtraType === 'NONE' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsMoreModalOpen(false)}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
