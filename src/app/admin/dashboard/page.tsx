import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  Users, 
  Award, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Radio, 
  CheckCheck, 
  Trash2, 
  Users2,
  ArrowRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  // Fetch metrics in parallel using admin client to ensure complete database visibility
  const [
    usersResult,
    pendingAppsResult,
    approvedAppsResult,
    rejectedAppsResult,
    activeMatchesResult,
    liveMatchesResult,
    completedMatchesResult,
    deletedMatchesResult,
    communityResult,
    pendingApplicationsResult,
    recentMatchesResult,
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
    db.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED'),
    db.from('matches').select('*', { count: 'exact', head: true }).neq('status', 'DELETED'),
    db.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'LIVE'),
    db.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    db.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'DELETED'),
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('master_applications').select('id, full_name, city, state, organization, created_at').eq('status', 'PENDING').order('created_at', { ascending: false }).limit(5),
    db.from('matches').select('id, title, status, team1:teams!matches_team1_id_fkey(name), team2:teams!matches_team2_id_fkey(name)').neq('status', 'DELETED').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalUsers = usersResult.count || 0;
  const pendingApps = pendingAppsResult.count || 0;
  const approvedApps = approvedAppsResult.count || 0;
  const rejectedApps = rejectedAppsResult.count || 0;

  // STRICT REQUIREMENT: Total Masters = Approved Masters + Rejected Apps (Pending EXCLUDED)
  const totalMasters = approvedApps + rejectedApps;

  const totalMatches = activeMatchesResult.count || 0;
  const liveMatches = liveMatchesResult.count || 0;
  const completedMatches = completedMatchesResult.count || 0;
  const deletedMatches = deletedMatchesResult.count || 0;

  const totalCommunity = communityResult.count || 0;

  const pendingApplications = pendingApplicationsResult.data || [];
  const recentMatches = recentMatchesResult.data || [];

  return (
    <div className="space-y-8">
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Overview
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/dashboard"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link
            href="/admin/master-applications"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            Master Applications
          </Link>
        </div>
      </div>

      {/* REAL-DATA OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        
        {/* 1. TOTAL COMMUNITY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Community</span>
            <Users2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCommunity}</div>
        </div>

        {/* 2. TOTAL USERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalUsers}</div>
        </div>

        {/* 3. PENDING APPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Apps</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{pendingApps}</div>
        </div>

        {/* 4. APPROVED MASTERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Masters</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{approvedApps}</div>
        </div>

        {/* 5. REJECTED APPS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rejected Apps</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">{rejectedApps}</div>
        </div>

        {/* 6. TOTAL MASTERS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Masters</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">{totalMasters}</div>
        </div>

        {/* 7. TOTAL MATCHES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Matches</span>
            <Trophy className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalMatches}</div>
        </div>

        {/* 8. DELETED MATCHES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deleted Matches</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{deletedMatches}</div>
        </div>

        {/* 9. LIVE MATCHES */}
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Matches</span>
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">{liveMatches}</div>
        </div>

        {/* 10. COMPLETED MATCHES */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400 font-mono">{completedMatches}</div>
        </div>

      </div>

      {/* TWO COLUMN GRID FOR PENDING APPLICATIONS & RECENT MATCHES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PENDING APPLICATIONS PREVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Pending Master Applications ({pendingApps || 0})
            </h2>
            <Link href="/admin/master-applications" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!pendingApplications || pendingApplications.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs italic">
              No pending Master applications.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs space-y-3">
              {pendingApplications.map((app: any) => (
                <div key={app.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm block">{app.full_name}</span>
                    <span className="text-slate-400">{app.city}, {app.state} • {app.organization || 'Independent'}</span>
                  </div>
                  <Link
                    href="/admin/master-applications"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                  >
                    Action
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT MATCHES PREVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Recent Matches Overview
            </h2>
            <Link href="/admin/matches" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
              View Matches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!recentMatches || recentMatches.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs italic">
              No matches recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs space-y-3">
              {recentMatches.map((match: any) => (
                <div key={match.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">{match.title}</span>
                    <span className="text-slate-400">{match.team1?.name} vs {match.team2?.name}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    match.status === 'LIVE' 
                      ? 'bg-red-950 text-red-400 border-red-500/30'
                      : match.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {match.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
