import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import { MapPin, Building2, ShieldCheck } from 'lucide-react';

export default async function PlaygroundDetailsPage({ params }: { params: { playgroundId: string } }) {
  const { user, role: userRole } = await getUserAndRole();
  const supabase = createClient();

  const { data: playground } = await supabase
    .from('playgrounds')
    .select('*, owner:profiles!playgrounds_owner_id_fkey(*)')
    .eq('id', params.playgroundId)
    .single();

  if (!playground) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase">
                {playground.pitch_type} Pitch
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-2">{playground.name}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {playground.address}, {playground.city}, {playground.state}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Ground Type</span>
              <strong className="text-white">{playground.ground_type}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Boundary Size</span>
              <strong className="text-white">{playground.boundary_size ? `${playground.boundary_size}m` : 'Standard'}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Capacity</span>
              <strong className="text-white">{playground.capacity || 'N/A'}</strong>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Country</span>
              <strong className="text-white">{playground.country}</strong>
            </div>
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
