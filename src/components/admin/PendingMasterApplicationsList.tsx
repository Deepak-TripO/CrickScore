'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { reviewMasterApplication } from '@/actions/master-applications';
import { 
  FileCheck, 
  ArrowRight, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingApp {
  id: string;
  user_id: string;
  full_name: string;
  city: string;
  state: string;
  organization?: string;
  created_at?: string;
}

export default function PendingMasterApplicationsList({
  initialApplications,
  initialCount,
}: {
  initialApplications: PendingApp[];
  initialCount: number;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState<PendingApp[]>(initialApplications);
  const [count, setCount] = useState<number>(initialCount);

  // Modals and loading state
  const [confirmModalApp, setConfirmModalApp] = useState<{ app: PendingApp; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAction = async () => {
    if (!confirmModalApp) return;

    const { app, action } = confirmModalApp;
    setLoadingId(app.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await reviewMasterApplication(app.id, app.user_id, action);
    setLoadingId(null);
    setConfirmModalApp(null);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      // Immediately remove from list and update count in real-time
      setApplications(prev => prev.filter(a => a.id !== app.id));
      setCount(prev => Math.max(0, prev - 1));
      setSuccessMsg(`Application for ${app.full_name} has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
      router.refresh();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        {/* HEADER & PENDING COUNT */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" />
            Pending Master Applications ({count})
          </h2>
          <Link href="/admin/master-applications" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LIST OR EMPTY STATE */}
        {applications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs italic">
            No pending Master applications.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-sm block">{app.full_name}</span>
                  <span className="text-slate-400">{app.city}, {app.state} • {app.organization || 'Independent'}</span>
                </div>

                {/* ACTION BUTTONS: ACCEPT & REJECT */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={loadingId === app.id}
                    onClick={() => setConfirmModalApp({ app, action: 'APPROVE' })}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === app.id}
                    onClick={() => setConfirmModalApp({ app, action: 'REJECT' })}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                confirmModalApp.action === 'APPROVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
              }`}>
                {confirmModalApp.action === 'APPROVE' ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {confirmModalApp.action === 'APPROVE' ? 'Approve Application?' : 'Reject Application?'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {confirmModalApp.action === 'APPROVE' 
                  ? `Are you sure you want to approve the Master application for `
                  : `Are you sure you want to reject this application?`}
                <strong className="text-white"> {confirmModalApp.app.full_name}</strong>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalApp(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingId !== null}
                onClick={handleAction}
                className={`flex-1 py-2.5 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  confirmModalApp.action === 'APPROVE' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                }`}
              >
                {loadingId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : confirmModalApp.action === 'APPROVE' ? (
                  'Yes, Approve'
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
