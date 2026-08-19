import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import { Trophy, Users, ShieldCheck } from 'lucide-react';
import { isValidImageUrl, sanitizeImageUrl } from '@/lib/imageUtils';

export default async function TeamDetailsPage({ params }: { params: { teamId: string } }) {
  const { user, role: userRole } = await getUserAndRole();
  const supabase = createClient();

  const { data: team } = await supabase
    .from('teams')
    .select('*, owner:profiles!teams_owner_id_fkey(*), team_players(players(*))')
    .eq('id', params.teamId)
    .single();

  if (!team) notFound();

  const squad = team.team_players?.map((tp: any) => tp.players).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 p-2 flex items-center justify-center font-black text-2xl text-emerald-400">
              {isValidImageUrl(team.logo_url) ? <img src={sanitizeImageUrl(team.logo_url)} alt={team.name} className="w-full h-full object-contain" /> : team.short_name}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{team.name}</h1>
              <p className="text-xs text-slate-400">Short Name: <strong>{team.short_name}</strong> • Coach: {team.coach || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Playing Squad ({squad.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {squad.map((p: any) => (
              <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
                  #{p.jersey_number || '0'}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">{p.full_name || p.display_name}</h4>
                  <p className="text-[10px] text-emerald-400 font-semibold">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
