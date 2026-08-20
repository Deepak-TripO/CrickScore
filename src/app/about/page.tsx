import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import Logo from '@/components/common/Logo';
import { Info, ArrowLeft, Trophy, Heart, ShieldCheck, Zap } from 'lucide-react';

export default async function AboutPage() {
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
            <Info className="w-5 h-5 text-orange-500" />
            <span>About BatScore</span>
          </h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm flex flex-col items-center">
          <Logo size="xl" href="/" />

          <div className="space-y-1">
            <p className="text-xs font-bold text-orange-600">Local Cricket Organizer & Real-Time Scoring</p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            BatScore is built for local cricket leagues, academies, turf tournaments, and passionate scorers. Track ball-by-ball commentary, player statistics, and community fixtures seamlessly.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-left">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-slate-900">Live Scoring</h3>
              <p className="text-[11px] text-slate-500">Real-time ball updates</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-slate-900">Verified Masters</h3>
              <p className="text-[11px] text-slate-500">Official match scoring</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            Version 1.0.0 • Built with <Heart className="w-3 h-3 text-red-500 inline mx-0.5 fill-red-500" /> for Cricket
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
