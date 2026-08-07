'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_MATCHES, MOCK_TOURNAMENTS } from '@/lib/mockData';
import { MatchCard } from '@/components/match/MatchCard';
import { LayoutDashboard, Radio, Trophy, Shield, Users, Bell, User, Settings, Calendar, LogOut } from 'lucide-react';

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LIVE' | 'MY_MATCHES' | 'NOTIFICATIONS' | 'PROFILE'>('OVERVIEW');

  const liveMatches = MOCK_MATCHES.filter((m) => m.status === 'LIVE');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 space-y-6 shrink-0 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center">
            ⚡
          </div>
          <div>
            <span className="font-black text-white text-lg">CrickScore</span>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">User Portal</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm font-semibold">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
            { id: 'LIVE', label: 'Live Matches', icon: Radio },
            { id: 'MY_MATCHES', label: 'My Fixtures', icon: Calendar },
            { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
            { id: 'PROFILE', label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-400" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <Link href="/admin" className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/30">
            <Trophy className="w-4 h-4" /> Organizer Admin Console
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Welcome Back, Cricket Fan! 👋</h1>
            <p className="text-sm font-medium text-slate-500">Track your favorite matches, teams, and live ball updates.</p>
          </div>
        </div>

        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Live Matches Now</span>
                <div className="text-3xl font-black text-rose-600 flex items-center gap-2">
                  <Radio className="w-5 h-5 animate-pulse" /> {liveMatches.length}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Followed Tournaments</span>
                <div className="text-3xl font-black text-emerald-600">2</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Saved Favorite Teams</span>
                <div className="text-3xl font-black text-amber-500">4</div>
              </div>
            </div>

            {/* Live Matches Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Ongoing Live Matches
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'LIVE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}

        {activeTab === 'NOTIFICATIONS' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4">
            <h3 className="text-xl font-black text-slate-900">Recent Notifications</h3>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Match Started: Royal Panthers vs Deccan Strikers</div>
                  <div className="text-xs text-slate-500">Toss won by Deccan Strikers (elected to bat)</div>
                </div>
                <span className="text-xs text-slate-400">10m ago</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PROFILE' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 max-w-lg space-y-4">
            <h3 className="text-xl font-black text-slate-900">My Profile</h3>
            <div className="space-y-3 text-sm font-medium">
              <div><strong>Name:</strong> Rahul Sharma</div>
              <div><strong>Role:</strong> Player / Spectator</div>
              <div><strong>Email:</strong> rahul@example.com</div>
              <div><strong>Team:</strong> Royal Panthers CC</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
