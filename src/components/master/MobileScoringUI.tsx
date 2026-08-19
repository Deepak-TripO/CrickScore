'use client';

import React, { useState } from 'react';
import { scoreBall, undoLastBall, setBattingTeam } from '@/actions/scoring';
import { ExtraType, WicketType } from '@/lib/cricket/engine';
import { ArrowLeft, RotateCcw, AlertTriangle, ChevronRight, RefreshCw, X, MoreHorizontal, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface MobileScoringUIProps {
  match: any;
  activeInnings: any;
  team1Players: any[];
  team2Players: any[];
}

export default function MobileScoringUI({ match, activeInnings, team1Players, team2Players }: MobileScoringUIProps) {
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

  const [selectedBattingTeamId, setSelectedBattingTeamId] = useState<string>(
    activeInnings?.batting_team_id || team1Id
  );
  const [isTeamConfirmed, setIsTeamConfirmed] = useState<boolean>(false);

  const isBattingTeam1 = selectedBattingTeamId === team1Id;
  const battingPlayers = isBattingTeam1 ? team1Players : team2Players;
  const bowlingPlayers = isBattingTeam1 ? team2Players : team1Players;

  const battingTeamName = isBattingTeam1 ? team1Name : team2Name;
  const battingTeamLogo = isBattingTeam1 ? team1Logo : team2Logo;
  const battingTeamShort = isBattingTeam1 ? team1Short : team2Short;

  const [strikerId, setStrikerId] = useState<string>(battingPlayers[0]?.id || '');
  const [nonStrikerId, setNonStrikerId] = useState<string>(battingPlayers[1]?.id || '');
  const [bowlerId, setBowlerId] = useState<string>(bowlingPlayers[0]?.id || '');

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

  // Ball History State
  const [recentBalls, setRecentBalls] = useState<Array<{ ball: string; run: number | string; type?: string }>>([
    { ball: '10.1', run: 1 },
    { ball: '10.2', run: 4 },
    { ball: '10.3', run: 'W' },
    { ball: '10.4', run: 2 }
  ]);

  // Always resolve a valid UUID string for inningsId
  const safeInningsId = (activeInnings?.id && activeInnings.id !== 'inn1') ? activeInnings.id : match.id;

  const strikerPlayer = battingPlayers.find(p => p.id === strikerId) || battingPlayers[0];
  const nonStrikerPlayer = battingPlayers.find(p => p.id === nonStrikerId) || battingPlayers[1];
  const bowlerPlayer = bowlingPlayers.find(p => p.id === bowlerId) || bowlingPlayers[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // =========================================================================
  // 1. TEAM SELECTION SCREEN (FIRST STEP BEFORE LIVE SCORING PANEL)
  // =========================================================================
  if (!isTeamConfirmed) {
    return (
      <div className="min-h-screen bg-[#050A1A] text-white font-sans p-4 sm:p-6 flex flex-col justify-between max-w-md mx-auto selection:bg-[#19D89A] selection:text-black">
        <div className="space-y-5">
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
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-5 space-y-5 text-center shadow-xl mt-2">
            <div className="w-12 h-12 rounded-2xl bg-[#19D89A]/15 border border-[#19D89A]/30 flex items-center justify-center text-[#19D89A] mx-auto">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>

            <div>
              <h2 className="text-base font-black text-white">Which team is batting now?</h2>
              <p className="text-xs text-[#AAB5CC] mt-0.5">
                Select the team currently batting to start updating live scores.
              </p>
            </div>

            {/* TEAM OPTIONS */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedBattingTeamId(team1Id)}
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  selectedBattingTeamId === team1Id
                    ? 'bg-[#19D89A]/15 border-[#19D89A] text-[#19D89A] shadow-md shadow-[#19D89A]/10 font-black'
                    : 'bg-[#111A2D] border-[#173541] text-[#AAB5CC] hover:text-white hover:border-[#AAB5CC]/40 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center font-black text-xs text-[#19D89A] font-mono overflow-hidden shrink-0">
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
                className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  selectedBattingTeamId === team2Id
                    ? 'bg-[#19D89A]/15 border-[#19D89A] text-[#19D89A] shadow-md shadow-[#19D89A]/10 font-black'
                    : 'bg-[#111A2D] border-[#173541] text-[#AAB5CC] hover:text-white hover:border-[#AAB5CC]/40 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#050A1A] border border-[#173541] p-1 flex items-center justify-center font-black text-xs text-[#19D89A] font-mono overflow-hidden shrink-0">
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
          </div>
        </div>

        {/* START SCORING BUTTON */}
        <div className="pt-4">
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
    );
  }

  // 1. FAST SCORE RUN HANDLER
  const handleScoreRun = async (runsBatter: number, extraType: ExtraType = 'NONE') => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    const res = await scoreBall({
      matchId: match.id,
      inningsId: safeInningsId,
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
      setStrikerId(res.newState.strikerId);
      setNonStrikerId(res.newState.nonStrikerId);
      
      const nextBallNum = ((activeInnings.total_overs || 0) + 0.1).toFixed(1);
      const displayRun = extraType !== 'NONE' ? `${extraType === 'WIDE' ? '1wd' : extraType === 'NO_BALL' ? '1nb' : runsBatter}` : runsBatter;
      setRecentBalls(prev => [...prev.slice(-3), { ball: nextBallNum, run: displayRun }]);
      
      showToast(extraType !== 'NONE' ? `${extraType.replace('_', ' ')} recorded` : `${runsBatter} run${runsBatter === 1 ? '' : 's'} added`);
    }
  };

  // 2. WICKET SUBMIT HANDLER
  const handleScoreWicketSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    setIsWicketModalOpen(false);

    const res = await scoreBall({
      matchId: match.id,
      inningsId: safeInningsId,
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
      if (nextBatterId) {
        if ((dismissedPlayerId || strikerId) === strikerId) {
          setStrikerId(nextBatterId);
        } else {
          setNonStrikerId(nextBatterId);
        }
      }
      const nextBallNum = ((activeInnings.total_overs || 0) + 0.1).toFixed(1);
      setRecentBalls(prev => [...prev.slice(-3), { ball: nextBallNum, run: 'W' }]);
      showToast('Wicket recorded');
    }
  };

  // 3. UNDO HANDLER
  const handleUndo = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    const res = await undoLastBall(match.id, safeInningsId);
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setRecentBalls(prev => prev.slice(0, -1));
      showToast('Last ball undone');
    }
  };

  // 4. SWAP BATSMEN HANDLER
  const handleSwapBatsmen = () => {
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
    showToast('Striker swapped');
  };

  const crr = (((activeInnings.total_runs || 0) / (activeInnings.total_overs || 1))).toFixed(2);
  const rrr = match.target 
    ? (((match.target - (activeInnings.total_runs || 0)) / Math.max((match.overs - (activeInnings.total_overs || 0)), 0.1))).toFixed(2)
    : 'N/A';

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

      {/* MAIN COMPACT LAYOUT CONTAINER MATCHING REFERENCE UI MODEL */}
      <div className="max-w-xl mx-auto px-3 py-3 space-y-3">
        
        {/* 1. MAIN SCOREBOARD HEADER BOX WITH CRR */}
        <div className="bg-[#0D1528] border border-[#19D89A]/40 rounded-2xl p-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#050A1A] border border-[#173541] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
              {battingTeamLogo ? (
                <img src={battingTeamLogo} alt={battingTeamName} className="w-full h-full object-cover rounded-sm" />
              ) : (
                <span className="font-black text-[9px] text-[#19D89A] font-mono">{battingTeamShort}</span>
              )}
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                {battingTeamName}
              </h2>
              <div className="text-xs font-bold text-[#AAB5CC] font-mono">
                {(activeInnings.total_overs || 0.0).toFixed(1)} <span className="text-[9px] text-[#71809A]">OV</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#19D89A]">
              {activeInnings.total_runs || 0} <span className="text-white">/</span> {activeInnings.total_wickets || 0}
            </div>

            <div className="text-right border-l border-[#173541] pl-3 py-0.5">
              <span className="text-[9px] font-black text-[#71809A] uppercase tracking-wider block">CRR</span>
              <span className="text-sm font-black text-white font-mono">{crr}</span>
            </div>
          </div>
        </div>

        {/* 2. BATSMAN & BOWLER SCORECARD TABLE */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-3 shadow-md space-y-2.5">
          {/* BATSMAN TABLE */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#71809A] font-semibold border-b border-[#173541]/60">
                <th className="font-semibold py-1">Batsman</th>
                <th className="text-right py-1">R</th>
                <th className="text-right py-1">B</th>
                <th className="text-right py-1">4s</th>
                <th className="text-right py-1">6s</th>
                <th className="text-right py-1">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#173541]/30">
              {/* STRIKER ROW */}
              <tr className="font-medium text-white">
                <td className="py-1.5 font-bold text-[#19D89A] flex items-center gap-1">
                  <span>{strikerPlayer?.full_name || strikerPlayer?.display_name || 'Striker'}*</span>
                  <span className="text-[10px]" title="Striker">👑</span>
                </td>
                <td className="text-right font-black py-1.5 text-white">44</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">17</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">5</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">2</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">258.82</td>
              </tr>
              {/* NON-STRIKER ROW */}
              <tr className="font-medium text-[#AAB5CC]">
                <td className="py-1.5 font-bold text-[#19D89A]">
                  {nonStrikerPlayer?.full_name || nonStrikerPlayer?.display_name || 'Non-Striker'}
                </td>
                <td className="text-right font-black py-1.5 text-white">32</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">13</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">5</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">1</td>
                <td className="text-right py-1.5 text-[#AAB5CC]">246.15</td>
              </tr>
            </tbody>
          </table>

          {/* BOWLER TABLE */}
          <div className="border-t border-[#173541] pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#71809A] font-semibold">
                  <th className="font-semibold py-1">Bowler</th>
                  <th className="text-right py-1">O</th>
                  <th className="text-right py-1">M</th>
                  <th className="text-right py-1">R</th>
                  <th className="text-right py-1">W</th>
                  <th className="text-right py-1">ER</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-medium text-[#AAB5CC]">
                  <td className="py-1 font-bold text-[#19D89A]">{bowlerPlayer?.full_name || bowlerPlayer?.display_name || 'Bowler'}</td>
                  <td className="text-right py-1 text-[#AAB5CC]">1.0</td>
                  <td className="text-right py-1 text-[#AAB5CC]">0</td>
                  <td className="text-right py-1 text-[#AAB5CC]">14</td>
                  <td className="text-right py-1 text-[#19D89A] font-bold">0</td>
                  <td className="text-right py-1 text-[#AAB5CC]">14.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. THIS OVER STRIP CARD */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-white shrink-0">This over:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {['2', '1', '4', '4', '1', '2'].map((ball, idx) => (
              <span
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  ball === '4' || ball === '6'
                    ? 'bg-amber-600 text-white font-black shadow-sm'
                    : 'bg-[#111A2D] text-white border border-[#173541]'
                }`}
              >
                {ball}
              </span>
            ))}
          </div>
        </div>

        {/* 4. EXTRAS, WICKET CHECKBOXES & ACTION BUTTONS CARD */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-3 space-y-3">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-white">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => e.target.checked && handleScoreRun(1, 'WIDE')}
                className="w-4 h-4 rounded border-[#173541] bg-[#071022] accent-[#19D89A]"
              />
              <span>Wide</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => e.target.checked && handleScoreRun(1, 'NO_BALL')}
                className="w-4 h-4 rounded border-[#173541] bg-[#071022] accent-[#19D89A]"
              />
              <span>No Ball</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => e.target.checked && handleScoreRun(1, 'BYE')}
                className="w-4 h-4 rounded border-[#173541] bg-[#071022] accent-[#19D89A]"
              />
              <span>Byes</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => e.target.checked && handleScoreRun(1, 'LEG_BYE')}
                className="w-4 h-4 rounded border-[#173541] bg-[#071022] accent-[#19D89A]"
              />
              <span>Leg Byes</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#173541]/40">
            <label className="flex items-center gap-1.5 text-xs font-medium text-white cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => e.target.checked && setIsWicketModalOpen(true)}
                className="w-4 h-4 rounded border-[#173541] bg-[#071022] accent-[#E5232F]"
              />
              <span>Wicket</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => showToast('Batter retired')}
                className="px-3 py-1.5 bg-[#17233B] hover:bg-[#1E2D4A] text-xs font-semibold text-[#AAB5CC] hover:text-white rounded-lg transition-colors"
              >
                Retire
              </button>
              <button
                type="button"
                onClick={handleSwapBatsmen}
                className="px-3 py-1.5 bg-[#17233B] hover:bg-[#1E2D4A] text-xs font-semibold text-[#AAB5CC] hover:text-white rounded-lg transition-colors"
              >
                Swap Batsman
              </button>
            </div>
          </div>
        </div>

        {/* 5. KEYPAD & ACTION BUTTONS CARD */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* LEFT VERTICAL ACTION BUTTONS */}
          <div className="col-span-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleUndo}
              className="flex-1 py-3 px-2 bg-[#1B7043] hover:bg-[#155A35] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setIsPlayerChangeOpen(!isPlayerChangeOpen)}
              className="flex-1 py-3 px-2 bg-[#1B7043] hover:bg-[#155A35] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              Partnerships
            </button>
            <button
              type="button"
              onClick={() => setIsMoreModalOpen(true)}
              className="flex-1 py-3 px-2 bg-[#1B7043] hover:bg-[#155A35] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              Extras
            </button>
          </div>

          {/* RIGHT CIRCULAR RUN KEYPAD (4x2 GRID) */}
          <div className="col-span-8 bg-[#0D1528] border border-[#173541] rounded-2xl p-3">
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                <button
                  key={run}
                  type="button"
                  disabled={loading}
                  onClick={() => handleScoreRun(run)}
                  className="w-10 h-10 rounded-full border-2 border-[#1B7043] hover:bg-[#1B7043]/30 text-white font-bold text-sm flex items-center justify-center mx-auto transition-all active:scale-95"
                >
                  {run}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsMoreModalOpen(true)}
                className="w-10 h-10 rounded-full border-2 border-[#1B7043] hover:bg-[#1B7043]/30 text-white font-bold text-sm flex items-center justify-center mx-auto transition-all active:scale-95"
              >
                ...
              </button>
            </div>
          </div>
        </div>

        {/* PLAYER CHANGE SELECTION EXPANDABLE */}
        {isPlayerChangeOpen && (
          <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-3 space-y-2">
            <h4 className="text-xs font-bold text-[#19D89A]">Change Player Selection</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#71809A] block mb-1">Striker</label>
                <select
                  value={strikerId}
                  onChange={(e) => setStrikerId(e.target.value)}
                  className="w-full bg-[#071022] border border-[#173541] text-xs text-white rounded-lg p-1.5 font-bold"
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
                  className="w-full bg-[#071022] border border-[#173541] text-xs text-white rounded-lg p-1.5 font-bold"
                >
                  {battingPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || p.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

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
