import React from 'react';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth';
import { Settings, ShieldCheck, Mail, User, Server } from 'lucide-react';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-purple-400" />
          Admin System & Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Administrator profile information, privilege status, and system configuration overview.
        </p>
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

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Display Name:</span>
              <strong className="text-slate-200">{profile?.full_name || 'Admin User'}</strong>
            </div>
          </div>
        </div>

        {/* SYSTEM ENVIRONMENT INFO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-emerald-400" />
            Platform Environment Configuration
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <strong className="text-emerald-400 font-mono">Supabase PostgreSQL</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Security Model:</span>
              <strong className="text-emerald-400 font-mono">Row Level Security (RLS) Active</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Framework:</span>
              <strong className="text-slate-200 font-mono">Next.js App Router (React 18)</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Realtime Scoring Engine:</span>
              <strong className="text-purple-400 font-mono">Supabase Realtime Enabled</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
