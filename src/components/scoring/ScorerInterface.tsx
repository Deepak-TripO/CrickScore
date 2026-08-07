'use client';

import React, { useState } from 'react';
import { processBallEntry, BallInput } from '@/lib/cricket/scoring';
import { ExtrasType, WicketType } from '@/lib/cricket/types';
import { RotateCcw, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface ScorerInterfaceProps {
  matchId: string;
  battingTeamName: string;
  bowlingTeamName: string;
  initialRuns?: number;
  initialWickets?: number;
  initialOvers?: number;
}

export const ScorerInterface: React.FC<ScorerInterfaceProps> = ({
  matchId,
  battingTeamName = 'Royal Panthers CC',
  bowlingTeamName = 'Deccan Strikers',
  initialRuns = 124,
  initialWickets = 4,
  initialOvers = 16.2,
}) => {
  const [runs, setRuns] = useState(initialRuns);
  const [wickets, setWickets] = useState(initialWickets);
  const [overs, setOvers] = useState(initialOvers);

  const [strikerName, setStrikerName] = useState('Rahul');
  const [strikerRuns, setStrikerRuns] = useState(52);
  const [strikerBalls, setStrikerBalls] = useState(31);

  const [nonStrikerName, setNonStrikerName] = useState('Arun');
  const [nonStrikerRuns, setNonStrikerRuns] = useState(21);
  const [nonStrikerBalls, setNonStrikerBalls] = useState(18);

  const [bowlerName, setBowlerName] = useState('Karthik');
  const [bowlerOvers, setBowlerOvers] = useState(2.2);
  const [bowlerRuns, setBowlerRuns] = useState(18);
  const [bowlerWickets, setBowlerWickets] = useState(1);

  const [recentBalls, setRecentBalls] = useState<string[]>(['1', '4', '0', 'W', '2', '6']);
  const [ballHistory, setBallHistory] = useState<any[]>([]);

  const [selectedExtra, setSelectedExtra] = useState<ExtrasType>('NONE');
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<WicketType>('BOWLED');

  // Single ball input trigger
  const handleScoreBall = (runsOffBat: number, isWicket = false) => {
    const input: BallInput = {
      innings_id: 'inn-current',
      over_number: Math.floor(overs),
      ball_number: Math.round((overs % 1) * 10) + 1,
      striker_id: 's-1',
      non_striker_id: 'ns-1',
      bowler_id: 'b-1',
      runs_batter: runsOffBat,
      extras_type: selectedExtra,
      wicket: isWicket,
      wicket_type: isWicket ? wicketType : undefined,
    };

    const res = processBallEntry(runs, wickets, overs, input);

    // Save previous snapshot for undo
    setBallHistory((prev) => [
      ...prev,
      {
        runs,
        wickets,
        overs,
        strikerRuns,
        strikerBalls,
        nonStrikerRuns,
        nonStrikerBalls,
        bowlerRuns,
        recentBalls,
      },
    ]);

    // Apply state transition
    setRuns(res.updatedRuns);
    setWickets(res.updatedWickets);
    setOvers(res.updatedOvers);

    // Update batter stats
    if (selectedExtra === 'NONE' || selectedExtra === 'BYE' || selectedExtra === 'LEG_BYE') {
      setStrikerRuns((prev) => prev + runsOffBat);
    }
    if (selectedExtra !== 'WIDE') {
      setStrikerBalls((prev) => prev + 1);
    }

    // Update bowler stats
    setBowlerRuns((prev) => prev + res.runsTotalOnBall);
    if (isWicket) setBowlerWickets((prev) => prev + 1);

    // Timeline pill format
    let pillText = `${runsOffBat}`;
    if (selectedExtra === 'WIDE') pillText = `WD${runsOffBat > 0 ? `+${runsOffBat}` : ''}`;
    if (selectedExtra === 'NO_BALL') pillText = `NB+${runsOffBat}`;
    if (isWicket) pillText = 'W';
    setRecentBalls((prev) => [...prev.slice(-7), pillText]);

    // Reset extra selection & modal
    setSelectedExtra('NONE');
    setShowWicketModal(false);
  };

  const handleUndo = () => {
    if (ballHistory.length === 0) return;
    const lastState = ballHistory[ballHistory.length - 1];
    setRuns(lastState.runs);
    setWickets(lastState.wickets);
    setOvers(lastState.overs);
    setStrikerRuns(lastState.strikerRuns);
    setStrikerBalls(lastState.strikerBalls);
    setNonStrikerRuns(lastState.nonStrikerRuns);
    setNonStrikerBalls(lastState.nonStrikerBalls);
    setBowlerRuns(lastState.bowlerRuns);
    setRecentBalls(lastState.recentBalls);
    setBallHistory((prev) => prev.slice(0, -1));
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 p-4 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800">
      {/* Live Match Info Header */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-2 text-center">
        <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
          LIVE SCORER CONSOLE • {battingTeamName}
        </span>
        <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          {runs}/{wickets} <span className="text-xl text-slate-400 font-semibold">({overs} Ov)</span>
        </div>
      </div>

      {/* Batter & Bowler Current Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-slate-400 font-medium">Striker</div>
          <div className="font-bold text-white text-base">{strikerName} *</div>
          <div className="text-emerald-400 font-extrabold">{strikerRuns} ({strikerBalls}b)</div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="text-slate-400 font-medium">Bowler</div>
          <div className="font-bold text-white text-base">{bowlerName}</div>
          <div className="text-emerald-400 font-extrabold">{bowlerOvers} ov - {bowlerRuns}r - {bowlerWickets}w</div>
        </div>
      </div>

      {/* Recent Balls Timeline */}
      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Over:</span>
        {recentBalls.map((b, idx) => (
          <span
            key={idx}
            className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 ${
              b === 'W' ? 'bg-rose-600 text-white' : b === '4' ? 'bg-emerald-500 text-slate-950' : b === '6' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {b}
          </span>
        ))}
      </div>

      {/* Extras Selection Toggles */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">EXTRAS TOGGLE</span>
        <div className="grid grid-cols-4 gap-2">
          {(['WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'] as ExtrasType[]).map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedExtra((prev) => (prev === ex ? 'NONE' : ex))}
              className={`py-2.5 rounded-xl font-black text-xs transition-all border ${
                selectedExtra === ex
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {ex.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Runs Buttons Grid (Large Tap Targets) */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">RUNS SCORED</span>
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((r) => (
            <button
              key={r}
              onClick={() => handleScoreBall(r)}
              className="py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-2xl font-black shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {r}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleScoreBall(4)}
            className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-2xl font-black shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            4 (FOUR)
          </button>
          <button
            onClick={() => handleScoreBall(5)}
            className="py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-2xl font-black border border-slate-700 hover:scale-105 active:scale-95 transition-all"
          >
            5
          </button>
          <button
            onClick={() => handleScoreBall(6)}
            className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-2xl font-black shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            6 (SIX)
          </button>
        </div>
      </div>

      {/* Wicket Button & Action Toolbar */}
      <div className="pt-2 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowWicketModal(true)}
          className="py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-lg tracking-wide shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <AlertTriangle className="w-5 h-5" /> WICKET
        </button>

        <button
          onClick={handleUndo}
          disabled={ballHistory.length === 0}
          className="py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> UNDO BALL
        </button>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-black text-rose-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Select Wicket Dismissal Type
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {(['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET'] as WicketType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWicketType(w)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    wicketType === w
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {w.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowWicketModal(false)}
                className="w-1/2 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScoreBall(0, true)}
                className="w-1/2 py-3 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
