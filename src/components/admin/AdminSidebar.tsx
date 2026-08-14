'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileCheck, 
  Users, 
  Award, 
  Radio, 
  Trophy, 
  Shield, 
  UserCheck, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface AdminSidebarProps {
  user?: any;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        { name: 'Teams', href: '/admin/teams', icon: Shield },
        { name: 'Players', href: '/admin/players', icon: UserCheck },
      ]
    },
    {
      title: 'GROUNDS & ANALYTICS',
      items: [
        { name: 'Playgrounds', href: '/admin/playgrounds', icon: MapPin },
        { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
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
      {/* MOBILE TOP BAR WITH HAMBURGER TOGGLE */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
            BatScore Admin
          </span>
        </Link>

        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label="Toggle Admin Sidebar"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* BRAND HEADER */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
                BatScore
              </span>
              <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase -mt-1">
                Admin Console
              </span>
            </div>
          </Link>

          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS CONTAINER */}
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
                      onClick={() => setMobileOpen(false)}
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

        {/* FOOTER USER / LOGOUT */}
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
    </>
  );
}
