import React from 'react';
import Link from 'next/link';
import { MOCK_PLAYERS } from '@/lib/mockData';
import { Users, Award, ArrowRight } from 'lucide-react';

export default function PlayersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-600" /> Players & Career Statistics
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Browse local cricket players, view batting/bowling averages, and recent match performances.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_PLAYERS.map((player) => (
          <div key={player.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-xl text-emerald-900">
                #{player.jersey_number || '10'}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{player.name}</h2>
                <span className="text-xs font-semibold text-emerald-700">{player.team_name}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-black text-slate-900">{player.runs}</div>
                  <div className="text-slate-400 font-medium">Runs</div>
                </div>
                <div>
                  <div className="font-black text-rose-600">{player.wickets}</div>
                  <div className="text-slate-400 font-medium">Wickets</div>
                </div>
                <div>
                  <div className="font-black text-emerald-600">{player.strike_rate}</div>
                  <div className="text-slate-400 font-medium">S/R</div>
                </div>
              </div>
            </div>

            <Link
              href={`/players/${player.id}`}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Full Profile & Stats <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
