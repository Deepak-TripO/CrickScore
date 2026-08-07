import React from 'react';
import Link from 'next/link';
import { MOCK_TEAMS } from '@/lib/mockData';
import { Shield, Users, ArrowRight } from 'lucide-react';

export default function TeamsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-600" /> Registered Teams & Clubs
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Explore local cricket clubs, squad rosters, and historical match stats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_TEAMS.map((team) => (
          <div key={team.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 text-center flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center font-black text-2xl text-emerald-800 shadow-inner overflow-hidden">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  team.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{team.name}</h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                15 Squad Players
              </span>
            </div>

            <Link
              href={`/teams/${team.id}`}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              View Team Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
