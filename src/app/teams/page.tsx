import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import { Trophy, Users } from 'lucide-react';

export default async function PublicTeamsPage() {
  const { user, role: userRole } = await getUserAndRole();
  const supabase = createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('*, owner:profiles!teams_owner_id_fkey(full_name), team_players(count)')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold tracking-tight">Cricket Teams & Squads</h1>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
            {teams?.length || 0} Registered Teams
          </span>
        </div>

        {!teams || teams.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No teams registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {teams.map((t: any) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 p-2 flex items-center justify-center font-black text-xl text-emerald-400">
                    {t.logo_url ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-contain" /> : t.short_name}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{t.name}</h3>
                    <p className="text-xs text-slate-400">Short Name: <strong>{t.short_name}</strong></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Manager: <strong className="text-slate-200">{t.owner?.full_name || 'Master'}</strong></span>
                  <span>Coach: <strong className="text-slate-200">{t.coach || 'N/A'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
