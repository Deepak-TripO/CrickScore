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

        {existingApp ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-center shadow-sm text-slate-900">
            <h2 className="text-base font-bold text-slate-900">Application Status</h2>
            
            <div className="flex justify-center">
              {existingApp.status === 'PENDING' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  Application Pending Admin Review
                </div>
              )}

              {existingApp.status === 'APPROVED' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Master Approved! Access your Master Panel in navigation.
                </div>
              )}

              {existingApp.status === 'REJECTED' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  Application Rejected: {existingApp.rejection_reason || 'Criteria not met.'}
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
