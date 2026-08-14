import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AdminPlayersTable from './AdminPlayersTable';
import { UserCheck } from 'lucide-react';

export default async function AdminPlayersPage() {
  const supabase = createClient();

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-purple-400" />
          Players Registry ({players?.length || 0})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete database of player profiles, batting styles, bowling styles, and roles across teams.
        </p>
      </div>

      <AdminPlayersTable players={players || []} />
    </div>
  );
}
