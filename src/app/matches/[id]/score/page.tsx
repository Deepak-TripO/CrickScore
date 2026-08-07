import React from 'react';
import Link from 'next/link';
import { ScorerInterface } from '@/components/scoring/ScorerInterface';
import { MOCK_MATCHES } from '@/lib/mockData';
import { ArrowLeft, Shield } from 'lucide-react';

export default function ScorerPage({ params }: { params: { id: string } }) {
  const match = MOCK_MATCHES.find((m) => m.id === params.id) || MOCK_MATCHES[0];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-xl mx-auto mb-4 flex items-center justify-between">
        <Link href={`/matches/${match.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Exit Scorer & Return to Match Center
        </Link>
        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> Scorer Mode
        </span>
      </div>

      <ScorerInterface
        matchId={match.id}
        battingTeamName={match.team_a.name}
        bowlingTeamName={match.team_b.name}
      />
    </div>
  );
}
