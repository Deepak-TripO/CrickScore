import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Award, Trophy, MapPin, Calendar, Mail, CheckCircle2, Users } from 'lucide-react';
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
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-purple-400" />
            Approved Masters
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/users"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
          <Link
            href="/admin/masters"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Award className="w-4 h-4 text-purple-400" />
            Approved Masters
          </Link>
        </div>
      </div>

      {masters.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-3 shadow-xl">
          <Award className="w-10 h-10 text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-400">No Approved Masters Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When user applications are reviewed and approved, approved Master Scorers will be listed here.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/master-applications"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20"
            >
              Review Master Applications
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {masters.map((master: any) => {
            const masterMatchCount = matchCounts[master.id] || 0;
            const createdDate = master.created_at
              ? new Date(master.created_at).toLocaleDateString()
              : 'Unknown';

            return (
              <div
                key={master.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl hover:border-slate-700 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/30 text-purple-400 font-black text-base flex items-center justify-center uppercase shadow-inner">
                      {master.full_name?.slice(0, 2) || master.username?.slice(0, 2) || 'M'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base group-hover:text-purple-400 transition-colors">
                        {master.full_name || master.username || 'Master User'}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {master.email}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    APPROVED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-850 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Location</span>
                    <span className="font-semibold text-slate-300 truncate block">
                      {master.city || master.state ? `${master.city || ''}, ${master.state || ''}` : 'Not Specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Matches Scored</span>
                    <span className="font-mono font-bold text-purple-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {masterMatchCount}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Joined {createdDate}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">ID: {master.id?.slice(0, 8)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
