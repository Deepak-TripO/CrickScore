import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BarChart3, Users, Award, Trophy, MapPin, CheckCircle2, Radio, Clock, Shield } from 'lucide-react';

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

  const { count: totalTeams } = await supabase.from('teams').select('*', { count: 'exact', head: true });
  const { count: totalPlayers } = await supabase.from('players').select('*', { count: 'exact', head: true });
  const { count: totalPlaygrounds } = await supabase.from('playgrounds').select('*', { count: 'exact', head: true });

  const approvalRate = totalApps && totalApps > 0 ? Math.round((approvedApps || 0) / totalApps * 100) : 0;

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-purple-400" />
          Platform Reports & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Aggregated system performance metrics, Master application approval ratios, and activity distributions.
        </p>
      </div>

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Approval Rate</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-black text-purple-400 font-mono">{approvalRate}%</div>
          <p className="text-xs text-slate-400">
            {approvedApps || 0} out of {totalApps || 0} applications approved.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Match Ratio</span>
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div className="text-4xl font-black text-white font-mono">
            {liveMatches || 0} <span className="text-xs font-normal text-slate-400">/ {totalMatches || 0}</span>
          </div>
          <p className="text-xs text-slate-400">
            {completedMatches || 0} matches completed, {upcomingMatches || 0} upcoming.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Growth</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl font-black text-emerald-400 font-mono">{totalUsers || 0}</div>
          <p className="text-xs text-slate-400">
            {totalTeams || 0} registered teams with {totalPlayers || 0} players.
          </p>
        </div>
      </div>

      {/* DETAILED DATA BREAKDOWN TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MASTER APPLICATIONS STATUS REPORT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-4 h-4 text-purple-400" />
            Master Applications Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-amber-400">Pending Under Review:</span>
              <strong className="font-mono text-amber-400 text-sm">{pendingApps || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-emerald-400">Approved Masters:</span>
              <strong className="font-mono text-emerald-400 text-sm">{approvedApps || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-red-400">Rejected Applications:</span>
              <strong className="font-mono text-red-400 text-sm">{rejectedApps || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Total Submitted Applications:</span>
              <strong className="font-mono text-white text-sm">{totalApps || 0}</strong>
            </div>
          </div>
        </div>

        {/* MATCH STATUS REPORT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Trophy className="w-4 h-4 text-cyan-400" />
            Match Status Distribution
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-red-400">Live Matches Currently:</span>
              <strong className="font-mono text-red-400 text-sm">{liveMatches || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-amber-400">Upcoming Scheduled:</span>
              <strong className="font-mono text-amber-400 text-sm">{upcomingMatches || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-teal-400">Completed Scorecards:</span>
              <strong className="font-mono text-teal-400 text-sm">{completedMatches || 0}</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Total Matches Recorded:</span>
              <strong className="font-mono text-white text-sm">{totalMatches || 0}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
