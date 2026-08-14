import React from 'react';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth';
import { Settings, ShieldCheck, BarChart3, Server } from 'lucide-react';
import Link from 'next/link';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();

  return (
    <div className="space-y-8">
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-purple-400" />
            Analytics & Settings
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/reports"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link
            href="/admin/settings"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ADMIN PROFILE CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Administrator Identity
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Authenticated Email:</span>
              <strong className="text-white">{user?.email}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">User ID:</span>
              <span className="font-mono text-slate-300">{user?.id}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Assigned Roles:</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-purple-950 text-purple-400 border border-purple-500/30">
                {profile?.roles?.join(', ') || 'ADMIN'}
              </span>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-emerald-400" />
            System Configuration
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Environment:</span>
              <strong className="text-emerald-400">Production Ready</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Database Connection:</span>
              <strong className="text-emerald-400">Supabase Connected</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Auth Engine:</span>
              <strong className="text-white">GoTrue / Service Role</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
