'use client';

import React, { useState } from 'react';
import { Search, MapPin, User, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminPlaygroundsTable({ grounds }: { grounds: any[] }) {
  const [search, setSearch] = useState('');

  const filteredGrounds = grounds.filter((g) => {
    const matchesName = (g.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCity = (g.city || '').toLowerCase().includes(search.toLowerCase());
    const matchesOwner = (g.owner?.full_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesName || matchesCity || matchesOwner;
  });

  return (
    <div className="space-y-4">
      {/* SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search grounds by name, city, or owner..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* PLAYGROUNDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrounds.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
            No playgrounds found matching your search.
          </div>
        ) : (
          filteredGrounds.map((g) => (
            <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">{g.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {g.city}, {g.state}
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {g.pitch_type || 'TURF'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block font-semibold">Ground Type</span>
                  <strong className="text-slate-100">{g.ground_type || 'STADIUM'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block font-semibold">Boundary Size</span>
                  <strong className="text-slate-100">{g.boundary_size ? `${g.boundary_size}m` : 'Standard'}</strong>
                </div>

                <div className="col-span-2">
                  <span className="text-slate-500 block font-semibold">Managed By (Master / Owner)</span>
                  <strong className="text-purple-400">{g.owner?.full_name || 'Ground Owner'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <Link
                  href={`/playgrounds/${g.id}`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
