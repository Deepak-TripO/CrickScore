'use client';

import React, { useState } from 'react';
import { reviewMasterApplication } from '@/actions/master-applications';
import { CheckCircle2, XCircle, AlertCircle, Eye, User, Calendar, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function MasterAppReviewCard({ application }: { application: any }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    setMsg('');

    const res = await reviewMasterApplication(application.id, application.user_id, action, rejectionReason);
    setLoading(false);
    setConfirmModal(null);
    setShowRejectInput(false);

    if (res?.error) {
      setMsg(res.error);
      setMsgType('error');
    } else {
      setMsg(`Application successfully ${action.toLowerCase()}d! User role updated.`);
      setMsgType('success');
    }
  };

  const isPending = application.status === 'PENDING';

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              {application.full_name}
            </h3>
            <p className="text-xs text-slate-400">
              User ID: <span className="font-mono text-slate-300">{application.user_id?.slice(0, 8)}...</span> • City: <strong className="text-slate-200">{application.city}, {application.state}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full font-extrabold text-[11px] uppercase border ${
              application.status === 'APPROVED' 
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                : application.status === 'REJECTED'
                ? 'bg-red-950 text-red-400 border-red-500/30'
                : 'bg-amber-950 text-amber-400 border-amber-500/30'
            }`}>
              {application.status}
            </span>

            <button
              onClick={() => setViewModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              title="View Application Details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block font-semibold">Club / Organization</span>
            <strong className="text-slate-100">{application.organization || 'Independent Scorer'}</strong>
          </div>

          <div>
            <span className="text-slate-500 block font-semibold">Application Date</span>
            <strong className="text-slate-100">{new Date(application.created_at).toLocaleDateString()}</strong>
          </div>

          <div>
            <span className="text-slate-500 block font-semibold">Location</span>
            <strong className="text-slate-100">{application.city}, {application.state}</strong>
          </div>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msgType === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/80 border border-red-500/40 text-red-300'
          }`}>
            {msgType === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{msg}</span>
          </div>
        )}

        {isPending && (
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
            {showRejectInput ? (
              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 block">Reason for Rejection (Optional)</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why criteria was not met..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmModal('REJECT')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                  >
                    Proceed to Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmModal('APPROVE')}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve as Master
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowRejectInput(true)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                confirmModal === 'APPROVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
              }`}>
                {confirmModal === 'APPROVE' ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-bold text-white">
                {confirmModal === 'APPROVE' ? 'Approve Master Scorer?' : 'Reject Application?'}
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to {confirmModal.toLowerCase()} this Master Scorer application for <strong className="text-white">{application.full_name}</strong>?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction(confirmModal)}
                className={`flex-1 py-2.5 font-extrabold text-xs rounded-xl text-slate-950 transition-all ${
                  confirmModal === 'APPROVE' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}
              >
                {loading ? 'Processing...' : confirmModal === 'APPROVE' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Master Application Details</h3>
              </div>
              <button 
                onClick={() => setViewModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Applicant Name:</span>
                  <strong className="text-white text-sm">{application.full_name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">User ID:</span>
                  <span className="font-mono text-slate-300">{application.user_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-amber-400 uppercase">{application.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Submitted On:</span>
                  <strong className="text-slate-200">{new Date(application.created_at).toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">Club / Organization</span>
                  <strong className="text-slate-100">{application.organization || 'Independent'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">Location</span>
                  <strong className="text-slate-100">{application.city}, {application.state}</strong>
                </div>
              </div>

              {application.reviewed_at && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 font-semibold block">Review Audit</span>
                  <p className="text-slate-300">Reviewed at: {new Date(application.reviewed_at).toLocaleString()}</p>
                  {application.rejection_reason && (
                    <p className="text-red-400">Rejection reason: {application.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
