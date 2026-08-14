import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AdminPlaygroundsTable from './AdminPlaygroundsTable';
import { MapPin } from 'lucide-react';

export default async function AdminPlaygroundsPage() {
  const supabase = createClient();

  const { data: playgrounds } = await supabase
    .from('playgrounds')
    .select('*, owner:profiles!playgrounds_owner_id_fkey(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <MapPin className="w-7 h-7 text-purple-400" />
          Playgrounds Directory ({playgrounds?.length || 0})
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Registered cricket grounds, pitch types, boundary dimensions, and stadium manager associations.
        </p>
      </div>

      <AdminPlaygroundsTable grounds={playgrounds || []} />
    </div>
  );
}
