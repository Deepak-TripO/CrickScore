'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mockData';
import { LiveScore } from '@/components/match/LiveScore';
import { ScorecardComponent } from '@/components/match/Scorecard';
import { buildScorecardView } from '@/lib/cricket/innings';
import { Ball } from '@/lib/cricket/types';
import { Edit3, ArrowLeft, MessageSquare, ListFilter, Activity } from 'lucide-react';

export default function MatchDetailPage({ params }: { params: { id: string } }) {
  const match = MOCK_MATCHES.find((m) => m.id === params.id) || MOCK_MATCHES[0];
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SCORECARD' | 'COMMENTARY'>('LIVE');

  // Sample ball history for live match commentary & scorecard math
  const sampleBalls: Ball[] = [
    { id: 'b-1', innings_id: 'inn-2', over_number: 16, ball_number: 1, striker_id: 'p-1', non_striker_id: 'p-2', bowler_id: 'p-3', runs_batter: 1, runs_total: 1, extras_type: 'NONE', extras_runs: 0, wicket: false, commentary: 'Karthik to Rahul, 1 run, pushed down to long-on.', created_at: '2026-08-07T12:00:00Z' },
    { id: 'b-2', innings_id: 'inn-2', over_number: 16, ball_number: 2, striker_id: 'p-2', non_striker_id: 'p-1', bowler_id: 'p-3', runs_batter: 4, runs_total: 4, extras_type: 'NONE', extras_runs: 0, wicket: false, commentary: 'Karthik to Arun, FOUR! Cracking cover drive right through the gap.', created_at: '2026-08-07T12:01:00Z' },
    { id: 'b-3', innings_id: 'inn-2', over_number: 16, ball_number: 3, striker_id: 'p-2', non_striker_id: 'p-1', bowler_id: 'p-3', runs_batter: 0, runs_total: 0, extras_type: 'NONE', extras_runs: 0, wicket: false, commentary: 'Karthik to Arun, no run, dot ball.', created_at: '2026-08-07T12:02:00Z' },
    { id: 'b-4', innings_id: 'inn-2', over_number: 16, ball_number: 4, striker_id: 'p-2', non_striker_id: 'p-1', bowler_id: 'p-3', runs_batter: 0, runs_total: 0, extras_type: 'NONE', extras_runs: 0, wicket: true, wicket_type: 'BOWLED', dismissed_player_id: 'p-2', commentary: 'OUT! Clean bowled! Karthik breaks the partnership with a yorker.', created_at: '2026-08-07T12:03:00Z' },
    { id: 'b-5', innings_id: 'inn-2', over_number: 16, ball_number: 5, striker_id: 'p-4', non_striker_id: 'p-1', bowler_id: 'p-3', runs_batter: 2, runs_total: 2, extras_type: 'NONE', extras_runs: 0, wicket: false, commentary: 'Karthik to Vikram, 2 runs, flicked off pads to deep midwicket.', created_at: '2026-08-07T12:04:00Z' },
    { id: 'b-6', innings_id: 'inn-2', over_number: 16, ball_number: 6, striker_id: 'p-4', non_striker_id: 'p-1', bowler_id: 'p-3', runs_batter: 6, runs_total: 6, extras_type: 'NONE', extras_runs: 0, wicket: false, commentary: 'SIX! High into the stands! Vikram clears long-off with ease.', created_at: '2026-08-07T12:05:00Z' },
  ];

  const scorecardView = buildScorecardView(
    MOCK_PLAYERS,
    sampleBalls,
    'p-1',
    'p-4',
    142,
    16.2,
    175,
    20
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar with Scorer Button */}
      <div className="flex items-center justify-between">
        <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Matches
        </Link>

        <Link
          href={`/matches/${match.id}/score`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-sm shadow-md transition-all"
        >
          <Edit3 className="w-4 h-4" /> Open Scorer Console
        </Link>
      </div>

      {/* Main Live Banner */}
      <LiveScore match={match} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-extrabold">
        {[
          { id: 'LIVE', label: 'Live View', icon: Activity },
          { id: 'SCORECARD', label: 'Full Scorecard', icon: ListFilter },
          { id: 'COMMENTARY', label: 'Ball Commentary', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'LIVE' && (
        <div className="space-y-6">
          <ScorecardComponent
            scorecard={scorecardView}
            battingTeamName={match.team_a.name}
            bowlingTeamName={match.team_b.name}
          />
        </div>
      )}

      {activeTab === 'SCORECARD' && (
        <ScorecardComponent
          scorecard={scorecardView}
          battingTeamName={match.team_a.name}
          bowlingTeamName={match.team_b.name}
        />
      )}

      {activeTab === 'COMMENTARY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 mb-2">Live Ball-by-Ball Commentary</h3>
          <div className="divide-y divide-slate-100">
            {sampleBalls.map((ball) => (
              <div key={ball.id} className="py-3.5 flex items-start gap-4">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 shrink-0">
                  {ball.over_number}.{ball.ball_number}
                </span>
                <div className="text-sm font-medium text-slate-800">
                  {ball.commentary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
