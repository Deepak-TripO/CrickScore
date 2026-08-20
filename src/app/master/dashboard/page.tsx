import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import { getUserAndRole } from '@/lib/auth';
import MasterScorerDashboardUI from './MasterScorerDashboardUI';
import { fetchMatchesSafely } from '@/lib/fetchMatches';

export default async function MasterDashboardPage({
  searchParams
}: {
  searchParams?: { tab?: string }
}) {
  const { user, role: userRole } = await getUserAndRole();

  if (userRole !== 'MASTER' && userRole !== 'ADMIN') {
    redirect('/apply-master');
  }

  const supabase = createClient();

  const [matches, teamsResult, playgroundsResult] = await Promise.all([
    fetchMatchesSafely({ masterId: user!.id }),
    supabase
      .from('teams')
      .select('id, name, short_name, logo_url, city, owner_id')
      .eq('owner_id', user!.id),
    supabase
      .from('playgrounds')
      .select('id, name, city'),
  ]);

  const teams = teamsResult.data || [];
  const playgrounds = playgroundsResult.data || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col pb-28 sm:pb-32">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MasterScorerDashboardUI 
          user={user}
          userRole={userRole}
          matches={matches}
          teams={teams}
          playgrounds={playgrounds}
          initialTab={searchParams?.tab || 'overview'}
        />
      </main>
    </div>
  );
}
