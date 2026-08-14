import React from 'react';
import AdminMatchesTable from './AdminMatchesTable';
import { Trophy } from 'lucide-react';
import { fetchMatchesSafely } from '@/lib/fetchMatches';

export default async function AdminMatchesPage() {
  const matches = await fetchMatchesSafely();

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Trophy className="w-7 h-7 text-purple-400" />
          All Matches Management ({matches.length})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search and filter all scheduled, live, completed, and cancelled matches on BatScore.
        </p>
      </div>

      <AdminMatchesTable matches={matches} />
    </div>
  );
}
