import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Award, Trophy, MapPin, Calendar, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function AdminMastersPage() {
  const supabase = createClient();

  // Fetch profiles with MASTER role or APPROVED master application
  const [userRolesResult, approvedAppsResult, matchesResult] = await Promise.all([
    supabase
      .from('user_roles')
      .select('user_id, roles!inner(name)')
      .eq('roles.name', 'MASTER'),
    supabase
      .from('master_applications')
      .select('user_id')
      .eq('status', 'APPROVED'),
    supabase
      .from('matches')
      .select('master_id')
  ]);

  const roleMasterIds = userRolesResult.data ? userRolesResult.data.map((ur: any) => ur.user_id) : [];
  const appMasterIds = approvedAppsResult.data ? approvedAppsResult.data.map((app: any) => app.user_id) : [];
  const masterIds = Array.from(new Set([...roleMasterIds, ...appMasterIds])).filter(Boolean);

  let masters: any[] = [];
  if (masterIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', masterIds)
      .order('created_at', { ascending: false });
    masters = data || [];
  }

  // Calculate match counts for each master
  const matches = matchesResult.data || [];
  const matchCounts: Record<string, number> = {};
  matches.forEach((m: any) => {
    if (m.master_id) {
      matchCounts[m.master_id] = (matchCounts[m.master_id] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-purple-400" />
            Approved Master Scorers ({masters.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Active Master Scorers authorized to create grounds, schedule matches, and manage live scoring.
          </p>
        </div>

        <Link
          href="/admin/master-applications"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
        >
          Review Pending Applications
        </Link>
      </div>

      {masters.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-2">
          <Award className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No approved Master Scorers found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masters.map((master) => {
            const count = matchCounts[master.id] || 0;
            return (
              <div key={master.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shrink-0">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-sm text-emerald-400 uppercase">
                        {master.full_name?.slice(0, 2) || 'MS'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{master.full_name}</h3>
                      <p className="text-xs text-slate-400">@{master.username || master.email?.split('@')[0]}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Master
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{master.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{master.city || 'City'}, {master.state || 'State'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Joined {new Date(master.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    Matches Created: <strong className="text-white font-mono text-sm">{count}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
