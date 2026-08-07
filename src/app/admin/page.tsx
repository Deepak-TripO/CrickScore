'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_MATCHES, MOCK_TOURNAMENTS, MOCK_TEAMS, MOCK_PLAYERS, MOCK_SERVICES } from '@/lib/mockData';
import { MatchCard } from '@/components/match/MatchCard';
import { LayoutDashboard, Trophy, Shield, Users, Radio, MapPin, Wrench, Settings, Plus, BarChart2, CheckCircle2, UserCheck, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TOURNAMENTS' | 'MATCHES' | 'TEAMS' | 'PLAYERS' | 'VENUES' | 'SCORERS'>('DASHBOARD');

  // Chart Sample Data
  const monthlyData = [
    { month: 'Apr', matches: 12 },
    { month: 'May', matches: 18 },
    { month: 'Jun', matches: 24 },
    { month: 'Jul', matches: 30 },
    { month: 'Aug', matches: 42 },
  ];

  const participationData = [
    { name: 'Bangalore Premier', teams: 8 },
    { name: 'Karnataka Super T10', teams: 12 },
    { name: 'Koramangala Cup', teams: 6 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-300 p-6 space-y-6 shrink-0 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center">
            ⚡
          </div>
          <div>
            <span className="font-black text-white text-lg">Crick<span className="text-emerald-400">Score</span></span>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Organizer Console</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm font-semibold">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'TOURNAMENTS', label: 'Tournaments', icon: Trophy },
            { id: 'MATCHES', label: 'Matches', icon: Radio },
            { id: 'TEAMS', label: 'Teams', icon: Shield },
            { id: 'PLAYERS', label: 'Players', icon: Users },
            { id: 'VENUES', label: 'Venues', icon: MapPin },
            { id: 'SCORERS', label: 'Assign Scorers', icon: UserCheck },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                    : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-slate-950' : 'text-emerald-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Organizer Command Center 🏆</h1>
            <p className="text-sm font-medium text-slate-500">Manage local tournaments, team rosters, venue bookings, and live scoring assignments.</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Create Tournament
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Schedule Match
            </button>
          </div>
        </div>

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-8">
            {/* Dashboard Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Tournaments', val: MOCK_TOURNAMENTS.length, color: 'text-emerald-600' },
                { label: 'Active Matches', val: 1, color: 'text-rose-600' },
                { label: 'Total Teams', val: MOCK_TEAMS.length, color: 'text-slate-900' },
                { label: 'Total Players', val: MOCK_PLAYERS.length, color: 'text-slate-900' },
                { label: 'Completed', val: 1, color: 'text-blue-600' },
                { label: 'Live Matches', val: 1, color: 'text-emerald-600' },
              ].map((card, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase">{card.label}</div>
                  <div className={`text-3xl font-black ${card.color}`}>{card.val}</div>
                </div>
              ))}
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Matches per Month */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-600" /> Matches Organized per Month
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="matches" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Tournament Participation */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Tournament Team Participation
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={participationData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="teams" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Live Matches */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-900">Active Live Scoring Operations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_MATCHES.filter((m) => m.status === 'LIVE').map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TOURNAMENTS' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Manage Tournaments</h3>
              <button className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
                + Add New Tournament
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_TOURNAMENTS.map((t) => (
                <div key={t.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 text-base">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.format} • {t.location}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'MATCHES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_MATCHES.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}

        {activeTab === 'TEAMS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_TEAMS.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-2">
                <h4 className="font-extrabold text-slate-900">{t.name}</h4>
                <span className="text-xs text-slate-500">15 Players</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
