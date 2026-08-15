'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Radio, 
  CheckCheck, 
  Trash2, 
  Users2,
  Clock
} from 'lucide-react';

interface MetricsProps {
  initialTotalUsers: number;
  initialPendingApps: number;
  initialApprovedApps: number;
  initialRejectedApps: number;
  initialTotalMasters: number;
  initialTotalMatches: number;
  initialDeletedMatches: number;
  initialLiveMatches: number;
  initialCompletedMatches: number;
  initialTotalCommunity: number;
}

export default function RealtimeDashboardMetrics({
  initialTotalUsers,
  initialPendingApps,
  initialApprovedApps,
  initialRejectedApps,
  initialTotalMasters,
  initialTotalMatches,
  initialDeletedMatches,
  initialLiveMatches,
  initialCompletedMatches,
  initialTotalCommunity
}: MetricsProps) {
  const [totalUsers, setTotalUsers] = useState(initialTotalUsers);
  const [pendingApps, setPendingApps] = useState(initialPendingApps);
  const [approvedApps, setApprovedApps] = useState(initialApprovedApps);
  const [rejectedApps, setRejectedApps] = useState(initialRejectedApps);
  const [totalMasters, setTotalMasters] = useState(initialTotalMasters);

  useEffect(() => {
    const supabase = createClient();

    // 1. Subscribe to profiles changes for Realtime Total Users Count
    const profileChannel = supabase
      .channel('admin-profiles-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          setTotalUsers((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        () => {
          setTotalUsers((prev) => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    // 2. Subscribe to master_applications changes for Realtime Application Status
    const appChannel = supabase
      .channel('admin-apps-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'master_applications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status === 'PENDING') {
              setPendingApps((prev) => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new?.status;

            if (oldStatus === 'PENDING' && newStatus === 'APPROVED') {
              setPendingApps((prev) => Math.max(0, prev - 1));
              setApprovedApps((prev) => prev + 1);
              setTotalMasters((prev) => prev + 1);
            } else if (oldStatus === 'PENDING' && newStatus === 'REJECTED') {
              setPendingApps((prev) => Math.max(0, prev - 1));
              setRejectedApps((prev) => prev + 1);
              setTotalMasters((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    // CLEANUP ON UNMOUNT TO PREVENT MEMORY LEAKS
    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(appChannel);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {/* 1. TOTAL COMMUNITY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-indigo-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Community</span>
          <Users2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-black text-white font-mono">{initialTotalCommunity}</div>
      </div>

      {/* 2. TOTAL USERS (REALTIME UPDATED) */}
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
        <div className="text-2xl font-black text-white font-mono">{initialTotalMatches}</div>
      </div>

      {/* 8. DELETED MATCHES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-rose-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Deleted Matches</span>
          <Trash2 className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-black text-rose-400 font-mono">{initialDeletedMatches}</div>
      </div>

      {/* 9. LIVE MATCHES */}
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-red-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Live Matches</span>
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
        </div>
        <div className="text-2xl font-black text-red-400 font-mono">{initialLiveMatches}</div>
      </div>

      {/* 10. COMPLETED MATCHES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-teal-400">
          <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
          <CheckCheck className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-2xl font-black text-teal-400 font-mono">{initialCompletedMatches}</div>
      </div>
    </div>
  );
}
