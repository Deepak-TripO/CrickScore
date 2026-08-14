import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import TeamManagerUI from './TeamManagerUI';
import { getUserAndRole } from '@/lib/auth';

export default async function MasterTeamsPage() {
  const { user, role: userRole } = await getUserAndRole();

  if (userRole !== 'MASTER' && userRole !== 'ADMIN') redirect('/apply-master');

  const supabase = createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('*, team_players(players(*))')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Team & Squad Management</h1>
        <TeamManagerUI teams={teams || []} />
      </div>
    </div>
  );
}
