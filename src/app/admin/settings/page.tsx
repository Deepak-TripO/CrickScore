import React from 'react';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth';
import { ShieldCheck, Server } from 'lucide-react';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();

  return (
    <div className="space-y-8">
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
