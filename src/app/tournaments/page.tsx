import React from 'react';
import Link from 'next/link';
import { MOCK_TOURNAMENTS } from '@/lib/mockData';
import { Trophy, Calendar, MapPin, ArrowRight } from 'lucide-react';

export default function TournamentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" /> Tournaments & Leagues
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Explore local cricket tournaments, view registered teams, and track live standings points tables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_TOURNAMENTS.map((t) => (
          <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t.format} FORMAT
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {t.start_date} - {t.end_date}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">{t.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{t.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-600" /> {t.location}
              </div>
              <Link
                href={`/tournaments/${t.id}`}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                Tournament Center <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
