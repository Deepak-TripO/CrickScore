'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { scoreBall, undoLastBall, setBattingTeam, completeMatch } from '@/actions/scoring';
import { ExtraType, WicketType, InningsState } from '@/lib/cricket/engine';
import { ArrowLeft, RotateCcw, AlertTriangle, ChevronRight, RefreshCw, X, MoreHorizontal, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
  const battingPlayers = isBattingTeam1 ? team1Players : team2Players;
  const bowlingPlayers = isBattingTeam1 ? team2Players : team1Players;

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

  const nonStrikerStats = liveInningsState?.batters[nonStrikerId];
  const nonStrikerRuns = nonStrikerStats ? nonStrikerStats.runs : 0;
  const nonStrikerBalls = nonStrikerStats ? nonStrikerStats.balls : 0;

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
      <div className="min-h-screen bg-[#050A1A] text-white font-sans p-4 sm:p-6 flex flex-col justify-start gap-4 max-w-md mx-auto selection:bg-[#19D89A] selection:text-black">
        <div className="space-y-4">
          {/* HEADER */}
          <header className="flex items-center justify-between pb-3 border-b border-[#173541]">
            <Link href="/master/dashboard" className="flex items-center gap-2 text-[#AAB5CC] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-bold">Back</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-[#19D89A]">BatScore</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#19D89A]/10 text-[#19D89A] border border-[#19D89A]/30 text-[10px] font-black uppercase tracking-wider">
              LIVE SCORING
            </span>
          </header>

          {/* QUESTION BOX */}
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-4 sm:p-5 space-y-4 text-center shadow-xl mt-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#19D89A]/15 border border-[#19D89A]/30 flex items-center justify-center text-[#19D89A] mx-auto">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            </div>

            <div>
              <h2 className="text-base font-black text-white">Which team is batting now?</h2>
              <p className="text-xs text-[#AAB5CC] mt-0.5">
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
                    ? 'bg-[#19D89A]/15 border-[#19D89A] text-[#19D89A] shadow-md shadow-[#19D89A]/10 font-black'
                    : 'bg-[#111A2D] border-[#173541] text-[#AAB5CC] hover:text-white hover:border-[#AAB5CC]/40 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center font-black text-xs text-[#19D89A] font-mono overflow-hidden shrink-0">
                    {team1Logo ? (
                      <img src={team1Logo} alt={team1Name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      team1Short
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{team1Name}</span>
                </div>
                {selectedBattingTeamId === team1Id && (
                  <CheckCircle2 className="w-5 h-5 text-[#19D89A]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBattingTeamId(team2Id)}
                className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  selectedBattingTeamId === team2Id
                    ? 'bg-[#19D89A]/15 border-[#19D89A] text-[#19D89A] shadow-md shadow-[#19D89A]/10 font-black'
                    : 'bg-[#111A2D] border-[#173541] text-[#AAB5CC] hover:text-white hover:border-[#AAB5CC]/40 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center font-black text-xs text-[#19D89A] font-mono overflow-hidden shrink-0">
                    {team2Logo ? (
                      <img src={team2Logo} alt={team2Name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      team2Short
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{team2Name}</span>
                </div>
                {selectedBattingTeamId === team2Id && (
                  <CheckCircle2 className="w-5 h-5 text-[#19D89A]" />
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
                className="w-full py-3.5 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#19D89A]/20 transition-all active:scale-95 disabled:opacity-50"
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
    <div className="min-h-screen bg-[#050A1A] text-white selection:bg-[#19D89A] selection:text-black font-sans pb-16">
      
      {/* 1. HEADER (CLEAN TOP BAR) */}
      <header className="bg-[#080F20] border-b border-[#173541] px-4 py-2 sticky top-0 z-30 flex items-center justify-between">
        <Link href="/master/dashboard" className="flex items-center gap-1.5 text-[#AAB5CC] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold">Back</span>
        </Link>
        
        <div className="flex items-center gap-1.5">
          <span className="text-base font-black tracking-tight text-[#19D89A]">BatScore</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5232F]/20 text-[#E5232F] border border-[#E5232F]/40 text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5232F] animate-ping" />
            LIVE ●
          </span>
        </div>
      </header>

      {/* TOAST CONFIRMATION FEEDBACK */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 bg-[#19D89A] text-[#050A1A] font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg border border-[#19D89A] animate-in fade-in slide-in-from-top-2">
          ✓ {toastMsg}
        </div>
      )}

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <div className="max-w-4xl mx-auto px-4 mt-2">
          <div className="p-2.5 bg-[#E5232F]/10 border border-[#E5232F]/40 rounded-xl text-[#E5232F] text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
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
          <div className="bg-[#0D1528] border border-[#19D89A]/50 rounded-2xl p-2.5 sm:p-3 shadow-lg flex items-center justify-between gap-3">
            {/* LEFT / CENTER SCORE DETAILS */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-[#050A1A] border border-[#173541] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                  {battingTeamLogo ? (
                    <img src={battingTeamLogo} alt={battingTeamName} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <span className="font-black text-[8px] text-[#19D89A] font-mono">{battingTeamShort}</span>
                  )}
                </div>
                <h2 className="text-xs font-black text-[#AAB5CC] uppercase tracking-wider truncate">
                  {battingTeamName}
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#19D89A]">
                  {displayRuns} <span className="text-white">/</span> {displayWickets}
                </div>
                <div className="text-xs font-extrabold text-white font-mono">
                  {displayOvers} <span className="text-[9px] text-[#71809A]">OV</span>
                </div>
              </div>

              {match.target && (
                <div className="text-[10px] font-bold text-[#AAB5CC] font-mono flex items-center gap-2">
                  <span>TARGET <strong className="text-[#19D89A]">{match.target}</strong></span>
                  <span>• RRR <strong className="text-[#315BEA]">{rrr}</strong></span>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: CRR DISPLAYED AT CENTER OF RIGHT SIDE */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 pl-3 border-l border-[#173541] py-1 min-w-[64px]">
              <span className="text-[9px] font-black text-[#71809A] uppercase tracking-wider block">CRR</span>
              <span className="text-base font-black text-[#19D89A] font-mono mt-0.5">{displayCRR}</span>
            </div>
          </div>

          {/* 3. COMPACT ACTIVE BATTERS WITH REAL DYNAMIC RUNS & BALLS */}
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#71809A] uppercase tracking-wider">Batters</span>
              <button 
                onClick={handleSwapBatsmen}
                className="text-[10px] font-extrabold text-[#19D89A] flex items-center gap-1 hover:underline active:scale-95 transition-transform"
                title="Swap Striker and Non-Striker"
              >
                <RefreshCw className="w-3 h-3" />
                Swap
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* STRIKER */}
              <div className="bg-[#111A2D] border border-[#19D89A]/60 rounded-xl p-2">
                <div className="flex items-center justify-between text-xs font-bold text-white truncate gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#19D89A] shrink-0 animate-pulse" />
                    <span className="truncate">{strikerPlayer?.full_name || strikerPlayer?.display_name || 'Striker'}</span>
                  </div>
                  <span className="text-[8px] font-black text-[#19D89A] bg-[#19D89A]/10 px-1 rounded border border-[#19D89A]/30 shrink-0">STRIKER</span>
                </div>
                <div className="text-xs font-extrabold text-[#19D89A] font-mono mt-0.5">
                  {strikerRuns} <span className="text-[10px] text-[#AAB5CC] font-normal">({strikerBalls})</span>
                </div>
              </div>

              {/* NON-STRIKER */}
              <div className="bg-[#111A2D] border border-[#173541] rounded-xl p-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#AAB5CC] truncate gap-1">
                  <span className="truncate pl-1">{nonStrikerPlayer?.full_name || nonStrikerPlayer?.display_name || 'Non-Striker'}</span>
                  <span className="text-[8px] font-bold text-[#71809A] shrink-0">NON-STRIKER</span>
                </div>
                <div className="text-xs font-extrabold text-white font-mono mt-0.5 pl-1">
                  {nonStrikerRuns} <span className="text-[10px] text-[#71809A] font-normal">({nonStrikerBalls})</span>
                </div>
              </div>
            </div>

            {/* PLAYER SELECTION TOGGLE */}
            <div className="flex justify-end pt-0.5">
              <button 
                onClick={() => setIsPlayerChangeOpen(!isPlayerChangeOpen)}
                className="text-[10px] font-bold text-[#AAB5CC] hover:text-white underline"
              >
                {isPlayerChangeOpen ? 'Done' : 'Change Player Selection'}
              </button>
            </div>

            {isPlayerChangeOpen && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#173541]">
                <div>
                  <label className="text-[10px] text-[#71809A] block mb-1">Striker</label>
                  <select
                    value={strikerId}
                    onChange={(e) => setStrikerId(e.target.value)}
                    className="w-full bg-[#071022] border border-[#173541] text-xs text-white rounded-lg p-1.5"
                  >
                    {battingPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.display_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#71809A] block mb-1">Non-Striker</label>
                  <select
                    value={nonStrikerId}
                    onChange={(e) => setNonStrikerId(e.target.value)}
                    className="w-full bg-[#071022] border border-[#173541] text-xs text-white rounded-lg p-1.5"
                  >
                    {battingPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.display_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. COMPACT CURRENT BOWLER WITH DYNAMIC STATS & SELECTOR */}
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold text-[#71809A] uppercase tracking-wider block">Bowler</span>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="bg-[#071022] border border-[#173541] text-xs font-bold text-white rounded-lg px-2 py-1 mt-0.5 max-w-full truncate focus:outline-none focus:border-[#19D89A]"
              >
                {bowlingPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name || p.display_name || 'Bowler'}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-extrabold font-mono text-[#AAB5CC] shrink-0">
              <div>{bowlerOvers} <span className="text-[9px] font-semibold text-[#71809A]">OV</span></div>
              <div>{bowlerRuns} <span className="text-[9px] font-semibold text-[#71809A]">R</span></div>
              <div className="text-[#19D89A]">{bowlerWickets} <span className="text-[9px] font-semibold text-[#71809A]">W</span></div>
            </div>
          </div>

          {/* 5. DYNAMIC CURRENT OVER STRIP */}
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-[#AAB5CC] uppercase tracking-wider">OVER {currentOverNum}</span>
              <span className="font-bold text-[#19D89A] text-[10px]">{currentOverTotalRuns} RUNS</span>
            </div>
            <div className="flex items-center gap-1.5 min-h-[26px]">
              {currentOverBallsList.length > 0 ? (
                currentOverBallsList.map((ballObj: any, idx: number) => (
                  <span 
                    key={idx}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${
                      ballObj.display === '4' ? 'bg-[#315BEA] text-white' :
                      ballObj.display === '6' ? 'bg-[#19D89A] text-[#050A1A]' :
                      ballObj.isWicket || ballObj.display === 'W' ? 'bg-[#E5232F] text-white' :
                      'bg-[#111A2D] text-[#AAB5CC] border border-[#173541]'
                    }`}
                  >
                    {ballObj.display}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-[#71809A] font-semibold italic pl-1">
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
          <div className="bg-[#111A2D] border border-[#173541] rounded-2xl p-2.5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#71809A] uppercase tracking-wider block">Runs</span>
              {isInningsCompleted && (
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
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
                className="h-14 sm:h-15 rounded-xl bg-[#071022] hover:bg-[#0D1528] border border-[#173541] text-white font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                0
              </button>

              {/* RUN 1 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(1)}
                className="h-14 sm:h-15 rounded-xl bg-[#071022] hover:bg-[#0D1528] border border-[#173541] text-[#19D89A] font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                1
              </button>

              {/* RUN 2 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(2)}
                className="h-14 sm:h-15 rounded-xl bg-[#071022] hover:bg-[#0D1528] border border-[#173541] text-[#19D89A] font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                2
              </button>

              {/* RUN 3 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(3)}
                className="h-14 sm:h-15 rounded-xl bg-[#071022] hover:bg-[#0D1528] border border-[#173541] text-[#19D89A] font-black text-xl sm:text-2xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                3
              </button>

              {/* RUN 4 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(4)}
                className="h-14 sm:h-15 rounded-xl bg-[#315BEA] hover:bg-blue-600 text-white font-black text-xl sm:text-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                4
              </button>

              {/* RUN 6 */}
              <button
                type="button"
                disabled={loading || isInningsCompleted}
                onClick={() => handleScoreRun(6)}
                className="h-14 sm:h-15 rounded-xl bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black text-xl sm:text-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="h-11 rounded-xl bg-[#E5232F] hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                WICKET
              </button>

              {/* MORE BUTTON */}
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsMoreModalOpen(true)}
                className="h-11 rounded-xl bg-[#0D1528] hover:bg-[#111A2D] border border-[#173541] text-[#19D89A] font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
                MORE
              </button>

              {/* UNDO BUTTON */}
              <button
                type="button"
                disabled={loading}
                onClick={handleUndo}
                className="h-11 rounded-xl bg-[#0D1528] hover:bg-[#111A2D] border border-[#173541] text-[#AAB5CC] hover:text-white font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
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
                  className="w-full h-12 rounded-xl bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
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
                  className="h-12 rounded-xl bg-[#0D1528] hover:bg-[#111A2D] border border-[#173541] text-[#AAB5CC] hover:text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  title="Return to first team scoring"
                >
                  <ArrowLeft className="w-4 h-4 text-[#AAB5CC]" />
                  <span>PREVIOUS</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteMatch}
                  className="h-12 rounded-xl bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  title="Finalize match and close scoring panel"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#050A1A]" />
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
        <div className="fixed inset-0 z-50 bg-[#050A1A]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0D1528] border border-[#173541] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#173541]">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E5232F]" />
                Record Wicket
              </h3>
              <button onClick={() => setIsWicketModalOpen(false)} className="p-1 text-[#AAB5CC] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Dismissed Player</label>
              <select 
                value={dismissedPlayerId || strikerId}
                onChange={(e) => setDismissedPlayerId(e.target.value)}
                className="w-full bg-[#071022] border border-[#173541] rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value={strikerId}>Striker: {strikerPlayer?.full_name || 'Striker'}</option>
                <option value={nonStrikerId}>Non-Striker: {nonStrikerPlayer?.full_name || 'Non-Striker'}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Dismissal Type</label>
              <select 
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value as WicketType)}
                className="w-full bg-[#071022] border border-[#173541] rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Other'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Select New Batter</label>
              <select 
                value={nextBatterId}
                onChange={(e) => setNextBatterId(e.target.value)}
                className="w-full bg-[#071022] border border-[#173541] rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="">Select Next Batter...</option>
                {battingPlayers
                  .filter(p => p.id !== strikerId && p.id !== nonStrikerId)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || p.display_name}</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="flex-1 py-3 bg-[#111A2D] text-[#AAB5CC] font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScoreWicketSubmit}
                className="flex-1 py-3 bg-[#E5232F] text-white font-black rounded-xl text-xs shadow-md uppercase tracking-wider"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 10. MORE / OTHER SCORING BOTTOM SHEET MODAL               */}
      {/* ========================================================== */}
      {isMoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050A1A]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0D1528] border border-[#173541] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#173541]">
              <h3 className="text-base font-extrabold text-white">Other Scoring Options</h3>
              <button onClick={() => setIsMoreModalOpen(false)} className="p-1 text-[#AAB5CC] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleScoreRun(1, 'WIDE')}
                className="py-3.5 px-4 bg-[#111A2D] hover:bg-[#173541] border border-[#173541] rounded-xl text-xs font-bold text-white text-left flex items-center justify-between"
              >
                <span>Wide (+1)</span>
                <span className="text-[#19D89A] font-black">+1</span>
              </button>

              <button
                type="button"
                onClick={() => handleScoreRun(1, 'NO_BALL')}
                className="py-3.5 px-4 bg-[#111A2D] hover:bg-[#173541] border border-[#173541] rounded-xl text-xs font-bold text-white text-left flex items-center justify-between"
              >
                <span>No Ball (+1)</span>
                <span className="text-[#19D89A] font-black">+1</span>
              </button>

              <button
                type="button"
                onClick={() => handleScoreRun(1, 'BYE')}
                className="py-3.5 px-4 bg-[#111A2D] hover:bg-[#173541] border border-[#173541] rounded-xl text-xs font-bold text-white text-left flex items-center justify-between"
              >
                <span>Bye (+1)</span>
                <span className="text-[#19D89A] font-black">+1</span>
              </button>

              <button
                type="button"
                onClick={() => handleScoreRun(1, 'LEG_BYE')}
                className="py-3.5 px-4 bg-[#111A2D] hover:bg-[#173541] border border-[#173541] rounded-xl text-xs font-bold text-white text-left flex items-center justify-between"
              >
                <span>Leg Bye (+1)</span>
                <span className="text-[#19D89A] font-black">+1</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsMoreModalOpen(false)}
                className="w-full py-3 bg-[#111A2D] text-[#AAB5CC] font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
