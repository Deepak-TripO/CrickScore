import React from 'react';
import { Match, BatterStats, BowlerStats, Partnership } from '@/lib/cricket/types';
import { Radio, Shield, MapPin, Activity } from 'lucide-react';

interface LiveScoreProps {
  match: Match;
  currentBatters?: BatterStats[];
  currentBowler?: BowlerStats;
  recentBalls?: string[];
  partnership?: Partnership;
}

export const LiveScore: React.FC<LiveScoreProps> = ({
  match,
  currentBatters = [
    { id: '1', name: 'Rahul Sharma', runs: 52, balls: 31, fours: 6, sixes: 2, strikeRate: 167.7, isOut: false, isOnStrike: true },
    { id: '2', name: 'Arun Kumar', runs: 21, balls: 18, fours: 2, sixes: 0, strikeRate: 116.6, isOut: false, isOnStrike: false },
  ],
  currentBowler = { id: '3', name: 'Karthik Rao', overs: 2.2, balls: 14, maidens: 0, runs: 18, wickets: 1, economy: 7.71 },
  recentBalls = ['1', '4', '0', 'W', '2', '6'],
  partnership = { runs: 32, balls: 22, player1Name: 'Rahul', player2Name: 'Arun' },
}) => {
  const innings = match.current_innings;
  const battingTeam = match.team_a.id === innings?.batting_team_id ? match.team_a : match.team_b;
  const bowlingTeam = match.team_a.id === innings?.batting_team_id ? match.team_b : match.team_a;

  const target = innings?.target;
  const runs = innings?.runs || 142;
  const wickets = innings?.wickets || 3;
  const overs = innings?.overs || 16.2;

  const reqRuns = target ? Math.max(0, target - runs) : undefined;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
      {/* Background Subtle Stadium Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Match Header info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE MATCH
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {match.tournament_name || 'T20 Championship'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
            {match.team_a.name} vs {match.team_b.name}
          </h2>
        </div>

        <div className="text-right text-xs font-semibold text-slate-400 space-y-1">
          <div className="flex items-center justify-end gap-1 text-emerald-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>{match.venue?.name || 'Central Sports Complex'}</span>
          </div>
          <div>Format: {match.format || 'T20'} (20 Overs)</div>
        </div>
      </div>

      {/* Core Live Score Display */}
      <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Main Team Score & Over Count */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-xl text-emerald-400">
              {battingTeam.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Batting Now</span>
              <h3 className="text-2xl font-black text-white">{battingTeam.name}</h3>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              {runs}<span className="text-emerald-400">/{wickets}</span>
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-400">
              {overs} <span className="text-sm font-semibold">Overs</span>
            </span>
          </div>

          {target && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold">
              <span>Target: {target} runs</span>
              <span>•</span>
              <span>Need {reqRuns} runs off {Math.max(0, 20 * 6 - Math.floor(overs) * 6 - Math.round((overs % 1) * 10))} balls</span>
            </div>
          )}
        </div>

        {/* Recent Balls Timeline */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Recent Deliveries (This Over)
            </span>
            <span className="text-xs font-bold text-slate-400">CRR: {(runs / (overs || 1)).toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {recentBalls.map((ball, idx) => {
              let colorClass = 'bg-slate-700 text-white';
              if (ball === '4') colorClass = 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30';
              if (ball === '6') colorClass = 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30';
              if (ball === 'W') colorClass = 'bg-rose-600 text-white font-black animate-bounce';
              if (ball.includes('WD') || ball.includes('NB')) colorClass = 'bg-orange-500 text-white font-bold';

              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${colorClass}`}
                >
                  {ball}
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Partnership: <strong className="text-white">{partnership.runs} runs ({partnership.balls}b)</strong></span>
            <span>Bowling: <strong className="text-white">{bowlingTeam.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Batters & Bowler Mini Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-700/60">
        {/* Batters */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Current Batters</span>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 space-y-2 text-sm">
            {currentBatters.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <span className={b.isOnStrike ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {b.name} {b.isOnStrike ? '*' : ''}
                  </span>
                </div>
                <div className="font-bold text-slate-200">
                  {b.runs} <span className="text-xs text-slate-400 font-normal">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bowler */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Current Bowler</span>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between text-sm">
            <div>
              <div className="font-bold text-emerald-400">{currentBowler.name}</div>
              <div className="text-xs text-slate-400">Eco: {currentBowler.economy}</div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-white text-base">
                {currentBowler.wickets}/{currentBowler.runs}
              </div>
              <div className="text-xs text-slate-400">{currentBowler.overs} Overs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
