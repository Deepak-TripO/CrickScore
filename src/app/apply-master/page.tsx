import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import ApplyMasterForm from './ApplyMasterForm';
import { getUserAndRole } from '@/lib/auth';
import { Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default async function ApplyMasterPage() {
  const { user, role: userRole } = await getUserAndRole();

  if (!user) redirect('/login');

  const adminClient = createAdminClient();

  let existingApp: any = null;
  try {
    const { data } = await adminClient
      .from('master_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    existingApp = data;
  } catch (e) {
    existingApp = null;
  }

  // Approved Masters are sent directly to Master Scorer Dashboard
  if (userRole === 'MASTER' || existingApp?.status === 'APPROVED') {
    redirect('/master/dashboard');
  }

  let canReapply = false;
  let remainingHours = 0;

  if (existingApp?.status === 'REJECTED') {
    const rejectionTime = new Date(existingApp.reviewed_at || existingApp.created_at).getTime();
    const now = Date.now();
    const diffHours = (now - rejectionTime) / (1000 * 60 * 60);
    if (diffHours >= 24) {
      canReapply = true;
    } else {
      remainingHours = Math.max(1, Math.ceil(24 - diffHours));
    }
  }

  const showStatusCard = existingApp && (!canReapply || existingApp.status === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            <span>Master Application</span>
          </h1>
        </div>

        {showStatusCard ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-center shadow-sm text-slate-900">
            <h2 className="text-base font-bold text-slate-900">Application Status</h2>
            
            <div className="flex justify-center">
              {existingApp.status === 'PENDING' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  Application Pending Admin Review
                </div>
              )}

              {existingApp.status === 'REJECTED' && (
                <div className="flex flex-col items-center gap-2 px-4 py-3.5 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-bold text-xs text-center">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Your master application is rejected. Please try again after 24 hours.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 space-y-1">
              <p suppressHydrationWarning>Submitted on: <strong>{new Date(existingApp.created_at).toLocaleDateString('en-GB')}</strong></p>
            </div>
          </div>
        ) : (
          <ApplyMasterForm />
        )}

      </div>
    </div>
  );
}
