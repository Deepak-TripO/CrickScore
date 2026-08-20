'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { 
  LayoutDashboard, 
  FileCheck, 
  Users, 
  Award, 
  Radio, 
  Trophy, 
  BarChart3, 
  Settings, 
  LogOut,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface AdminSidebarProps {
  user?: any;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  // Full navigation array for Desktop Sidebar
  const navigationGrouped = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Master Applications', href: '/admin/master-applications', icon: FileCheck, badge: true },
      ]
    },
    {
      title: 'MATCH MANAGEMENT',
      items: [
        { name: 'Live Matches', href: '/admin/live-matches', icon: Radio, pulse: true },
        { name: 'All Matches', href: '/admin/matches', icon: Trophy },
      ]
    },
    {
      title: 'USER & TEAM MANAGEMENT',
      items: [
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Approved Masters', href: '/admin/masters', icon: Award },
      ]
    },
    {
      title: 'ANALYTICS & SETTINGS',
      items: [
        { name: 'Analytics', href: '/admin/reports', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR CONTAINER (UNCHANGED DESKTOP VIEW) */}
      <aside className="hidden lg:flex sticky top-0 left-0 z-30 h-screen w-64 bg-slate-950 border-r border-slate-800 flex-col justify-between shrink-0">
        
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Logo size="md" href="/admin/dashboard" />
        </div>

        {/* FULL NAVIGATION LINKS CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navigationGrouped.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <span className="px-3 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                {group.title}
              </span>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${
                          active ? 'text-white' : (item as any).pulse ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`} />
                        <span>{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(item as any).pulse && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                        {active && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER USER / LOGOUT FOR DESKTOP */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <Link href="/profile" className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:bg-slate-850 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-400 font-bold text-xs flex items-center justify-center uppercase">
              {user?.email?.slice(0, 2) || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.email?.split('@')[0] || 'Admin User'}</p>
              <span className="text-[10px] text-purple-400 font-semibold block uppercase">Admin Role</span>
            </div>
          </Link>

          <form action={logoutUser}>
            <button 
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/50 hover:text-red-400 text-slate-400 border border-slate-800 hover:border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>

      </aside>

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        aria-label="Mobile Admin Bottom Navigation" 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl px-2 py-1.5"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          
          {/* 1. OVERVIEW */}
          <Link
            href="/admin/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname === '/admin/dashboard' || pathname === '/admin' || pathname.startsWith('/admin/master-applications')
                ? 'text-purple-400 bg-purple-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${pathname === '/admin/dashboard' || pathname === '/admin' || pathname.startsWith('/admin/master-applications') ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold tracking-tight truncate mt-0.5">Overview</span>
          </Link>

          {/* 2. MATCH MANAGEMENT */}
          <Link
            href="/admin/matches"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname.startsWith('/admin/matches') || pathname.startsWith('/admin/live-matches')
                ? 'text-purple-400 bg-purple-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className={`w-5 h-5 ${pathname.startsWith('/admin/matches') || pathname.startsWith('/admin/live-matches') ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold tracking-tight truncate mt-0.5">Match Mgmt</span>
          </Link>

          {/* 3. USER & TEAM MANAGEMENT */}
          <Link
            href="/admin/users"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname.startsWith('/admin/users') || pathname.startsWith('/admin/masters')
                ? 'text-purple-400 bg-purple-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 ${pathname.startsWith('/admin/users') || pathname.startsWith('/admin/masters') ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold tracking-tight truncate mt-0.5">User & Team</span>
          </Link>

          {/* 4. ANALYTICS & SETTINGS */}
          <Link
            href="/admin/reports"
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              pathname.startsWith('/admin/reports') || pathname.startsWith('/admin/settings')
                ? 'text-purple-400 bg-purple-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${pathname.startsWith('/admin/reports') || pathname.startsWith('/admin/settings') ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="text-[10px] font-bold tracking-tight truncate mt-0.5">Analytics</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
