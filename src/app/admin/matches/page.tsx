import React from 'react';
import AdminMatchesTable from './AdminMatchesTable';
import { Trophy, Radio } from 'lucide-react';
import { fetchMatchesSafely } from '@/lib/fetchMatches';
import Link from 'next/link';

export default async function AdminMatchesPage() {
  const matches = await fetchMatchesSafely();

  return (
    <div className="space-y-6">
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-purple-400" />
            Match Management
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/matches"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Trophy className="w-4 h-4" />
            All Matches
          </Link>
          <Link
            href="/admin/live-matches"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            Live Matches
          </Link>
        </div>
      </div>

      <AdminMatchesTable matches={matches} />
    </div>
  );
}
