'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  LayoutDashboard, 
  FileCheck, 
  Trophy, 
  Radio, 
  Users, 
  Award, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface AdminHeaderNavProps {
  user?: any;
}

export default function AdminHeaderNav({ user }: AdminHeaderNavProps) {
  const pathname = usePathname();

  // Section toggle configuration for fixed header control
  const sectionConfigs = [
    {
      matchRoutes: ['/admin/dashboard', '/admin', '/admin/master-applications'],
      options: [
        { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Master Applications', href: '/admin/master-applications', icon: FileCheck }
      ]
    },
    {
      matchRoutes: ['/admin/matches', '/admin/live-matches'],
      options: [
        { name: 'All Matches', href: '/admin/matches', icon: Trophy },
        { name: 'Live Matches', href: '/admin/live-matches', icon: Radio, pulse: true }
      ]
    },
    {
      matchRoutes: ['/admin/users', '/admin/masters'],
      options: [
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Approved Masters', href: '/admin/masters', icon: Award }
      ]
    },
    {
      matchRoutes: ['/admin/reports', '/admin/settings'],
      options: [
        { name: 'Analytics', href: '/admin/reports', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings }
      ]
    }
  ];

  // Find active section toggle options based on current route
  const activeConfig = sectionConfigs.find(c =>
    c.matchRoutes.some(r => r === '/admin' ? pathname === '/admin' || pathname === '/admin/dashboard' : pathname.startsWith(r))
  ) || sectionConfigs[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl shrink-0">
      
      {/* 1. TOP LOGO & CONTROLS ROW: [ Admin Logo ] ........ [ Profile Icon ] [ Sign Out Icon ] */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* LEFT: ADMIN LOGO */}
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-emerald-400 p-0.5 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              BatScore Admin
            </span>
          </div>
        </Link>

        {/* RIGHT: ADMIN PROFILE ICON | SIGN OUT ICON (STABLE & FIXED POSITION) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/profile"
            title="Admin Profile"
            aria-label="Admin Profile"
            className="p-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/30 rounded-xl text-slate-200 hover:text-purple-300 transition-all shadow-sm group"
          >
            <User className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </Link>

          <form action={logoutUser} title="Sign Out">
            <button
              type="submit"
              aria-label="Sign Out"
              className="p-2 bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-950/30 rounded-xl text-slate-300 hover:text-red-400 transition-all shadow-sm group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 group-hover:scale-110 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. CLEAN VERTICAL SPACING & ANCHORED SECTION TOGGLE CONTROL ROW */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-950/90 flex items-center justify-between gap-4 h-14 border-t border-slate-850/60">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto max-w-md shadow-inner">
          {activeConfig.options.map((opt) => {
            const OptIcon = opt.icon;
            const isOptActive = opt.href === '/admin/dashboard'
              ? pathname === '/admin/dashboard' || pathname === '/admin'
              : pathname.startsWith(opt.href);

            return (
              <Link
                key={opt.href}
                href={opt.href}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 ${
                  isOptActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <OptIcon className={`w-3.5 h-3.5 ${isOptActive ? 'text-white' : opt.pulse ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="truncate">{opt.name}</span>
                {opt.pulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

    </header>
  );
}
