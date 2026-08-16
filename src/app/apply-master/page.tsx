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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Master Application</span>
          </h1>
        </div>

        {existingApp ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-center">
            <h2 className="text-base font-bold text-slate-200">Application Status</h2>
            
            <div className="flex justify-center">
              {existingApp.status === 'PENDING' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-950 text-amber-400 border border-amber-500/30 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  Application Pending Admin Review
                </div>
              )}

              {existingApp.status === 'APPROVED' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Master Approved! Access your Master Panel in navigation.
                </div>
              )}

              {existingApp.status === 'REJECTED' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-950 text-red-400 border border-red-500/30 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  Application Rejected: {existingApp.rejection_reason || 'Criteria not met.'}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 space-y-1">
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
