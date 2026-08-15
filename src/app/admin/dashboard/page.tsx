import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import RealtimeDashboardMetrics from '@/components/admin/RealtimeDashboardMetrics';
import { 
  FileCheck, 
  Trophy, 
  ArrowRight
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
      {/* REALTIME OVERVIEW METRIC CARDS */}
      <RealtimeDashboardMetrics
        initialTotalUsers={totalUsers}
        initialPendingApps={pendingApps}
        initialApprovedApps={approvedApps}
        initialRejectedApps={rejectedApps}
        initialTotalMasters={totalMasters}
        initialTotalMatches={totalMatches}
        initialDeletedMatches={deletedMatches}
        initialLiveMatches={liveMatches}
        initialCompletedMatches={completedMatches}
        initialTotalCommunity={totalCommunity}
      />

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
