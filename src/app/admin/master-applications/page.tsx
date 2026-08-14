import React from 'react';
import { createClient } from '@/lib/supabase/server';
import MasterAppReviewCard from './MasterAppReviewCard';
import { FileCheck, LayoutDashboard } from 'lucide-react';
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
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-purple-400" />
            Master Applications
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/dashboard"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link
            href="/admin/master-applications"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            Master Applications
          </Link>
        </div>
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
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Pending ({pendingApps || 0})
        </Link>

        <Link
          href="/admin/master-applications?status=APPROVED"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Approved ({approvedApps || 0})
        </Link>

        <Link
          href="/admin/master-applications?status=REJECTED"
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedStatus === 'REJECTED'
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Rejected ({rejectedApps || 0})
        </Link>
      </div>

      {/* APPLICATIONS LIST */}
      {!applications || applications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm space-y-2 shadow-xl">
          <FileCheck className="w-10 h-10 text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-400">No Applications Found</h3>
          <p className="text-xs text-slate-500">
            {selectedStatus === 'ALL'
              ? 'There are currently no Master Scorer applications in the database.'
              : `No applications found with status "${selectedStatus}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app) => (
            <MasterAppReviewCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
