import React from 'react';
import { createClient } from '@/lib/supabase/server';
import MasterAppReviewCard from './MasterAppReviewCard';
import { FileCheck, Filter } from 'lucide-react';
import Link from 'next/link';

export default async function MasterApplicationsAdminPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const supabase = createClient();
  const selectedStatus = searchParams?.status || 'ALL';

  let query = supabase
    .from('master_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (selectedStatus !== 'ALL') {
    query = query.eq('status', selectedStatus);
  }

  const { data: applications } = await query;

  // Counts for tabs
  const { count: totalApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true });
  const { count: pendingApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
  const { count: approvedApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
  const { count: rejectedApps } = await supabase.from('master_applications').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED');

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <FileCheck className="w-7 h-7 text-purple-400" />
          Master Scorer Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review, approve, or reject user applications to become Master Scorers.
        </p>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60">
        <Link
          href="/admin/master-applications?status=ALL"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'ALL'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          All ({totalApps || 0})
        </Link>

        <Link
          href="/admin/master-applications?status=PENDING"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'PENDING'
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          Pending ({pendingApps || 0})
        </Link>

        <Link
          href="/admin/master-applications?status=APPROVED"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'APPROVED'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          Approved ({approvedApps || 0})
        </Link>

        <Link
          href="/admin/master-applications?status=REJECTED"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'REJECTED'
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
              : 'bg-slate-900 text-red-400 border-slate-800 hover:border-red-500/40'
          }`}
        >
          Rejected ({rejectedApps || 0})
        </Link>
      </div>

      {/* APPLICATIONS LIST */}
      {!applications || applications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-2">
          <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No master applications found for status "{selectedStatus}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <MasterAppReviewCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
