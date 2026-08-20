import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import { Settings, ArrowLeft, Bell, Globe, Shield } from 'lucide-react';

export default async function SettingsPage() {
  const { user, role: userRole } = await getUserAndRole();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="p-2 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            title="Back to Profile"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5 text-orange-500" />
          </Link>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            <span>Settings</span>
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            General Preferences
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  <p className="text-[11px] text-slate-500">Live score alerts & match updates</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Language & Region</h3>
                  <p className="text-[11px] text-slate-500">English (India)</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Default
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Account Role</h3>
                  <p className="text-[11px] text-slate-500">{userRole || 'User'}</p>
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="text-[11px] font-extrabold text-orange-600 hover:underline"
              >
                Manage Profile
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
