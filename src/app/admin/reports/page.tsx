import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BarChart3, Award } from 'lucide-react';

export default async function AdminReportsPage() {
  const supabase = createClient();

  // Metrics Queries
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true });
  const { count: approvedApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
  const { count: pendingApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
  const { count: rejectedApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED');

  const { count: totalMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  const { count: liveMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'LIVE');
  const { count: upcomingMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'UPCOMING');
  const { count: completedMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');

  const approvalRate = totalApps && totalApps > 0 ? Math.round((approvedApps || 0) / totalApps * 100) : 0;

  return (
    <div className="space-y-8">
      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Approval Rate</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-black text-white font-mono">{approvalRate}%</div>
          <p className="text-xs text-slate-500">
            Ratio of approved Master applications vs total received ({approvedApps || 0} / {totalApps || 0}).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Match Ratio</span>
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-emerald-400 font-mono">
            {totalMatches && totalMatches > 0 ? Math.round(((completedMatches || 0) + (liveMatches || 0)) / totalMatches * 100) : 0}%
          </div>
          <p className="text-xs text-slate-500">
            Percentage of matches in active or completed state ({completedMatches || 0} completed, {liveMatches || 0} live).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform System Scale</span>
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-4xl font-black text-indigo-400 font-mono">{(totalUsers || 0) + (totalMatches || 0)}</div>
          <p className="text-xs text-slate-500">
            Combined sum of registered profiles and recorded cricket matches.
          </p>
        </div>
      </div>

      {/* DETAILED STATS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* APPLICATION STATUS BREAKDOWN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Master Application Status Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Approved Applications ({approvedApps || 0})</span>
                <span>{totalApps ? Math.round((approvedApps || 0) / totalApps * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${totalApps ? ((approvedApps || 0) / totalApps * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Pending Applications ({pendingApps || 0})</span>
                <span>{totalApps ? Math.round((pendingApps || 0) / totalApps * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${totalApps ? ((pendingApps || 0) / totalApps * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Rejected Applications ({rejectedApps || 0})</span>
                <span>{totalApps ? Math.round((rejectedApps || 0) / totalApps * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${totalApps ? ((rejectedApps || 0) / totalApps * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MATCH STATUS BREAKDOWN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Match Status Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Completed Matches ({completedMatches || 0})</span>
                <span>{totalMatches ? Math.round((completedMatches || 0) / totalMatches * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${totalMatches ? ((completedMatches || 0) / totalMatches * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Live Matches ({liveMatches || 0})</span>
                <span>{totalMatches ? Math.round((liveMatches || 0) / totalMatches * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${totalMatches ? ((liveMatches || 0) / totalMatches * 100) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Upcoming Matches ({upcomingMatches || 0})</span>
                <span>{totalMatches ? Math.round((upcomingMatches || 0) / totalMatches * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${totalMatches ? ((upcomingMatches || 0) / totalMatches * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
