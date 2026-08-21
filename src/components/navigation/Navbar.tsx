'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { 
  Bell, 
  Star,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface NavbarProps {
  user?: any;
  userRole?: string;
  userProfile?: any;
}

export default function Navbar({ user, userRole = 'USER' }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const isScrolled = window.scrollY > 10;
        setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';
  const masterHref = isMasterOrAdmin ? '/master/dashboard' : '/apply-master';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-white border-b border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. APPROVED BATSCORE LOGO */}
          <Logo size="md" href="/" />

          {/* 2. DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200 shrink-0">
            <Link 
              href="/" 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname === '/' ? 'bg-orange-500 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Home
            </Link>

            <Link 
              href="/community" 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/community') ? 'bg-orange-500 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Community
            </Link>

            <Link 
              href={masterHref} 
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                pathname.startsWith('/master') || pathname === '/apply-master' ? 'bg-orange-500 text-white font-extrabold shadow-sm' : 'text-orange-600 hover:bg-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Master
            </Link>

            {userRole === 'ADMIN' && (
              <Link 
                href="/admin/dashboard" 
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  pathname.startsWith('/admin') ? 'bg-slate-900 text-white font-extrabold' : 'text-slate-700 hover:bg-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                Admin
              </Link>
            )}

            <Link 
              href="/profile" 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/profile') ? 'bg-orange-500 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* 3. RIGHT HEADER ACTIONS: [ NOTIFICATION 🔔 ] [ LOGOUT 🚪 ] */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* NOTIFICATION BELL BUTTON */}
            <button className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative" title="Notification">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute top-2 right-2 animate-ping" />
            </button>

            {/* LOGOUT BUTTON / AUTH BUTTONS */}
            {user ? (
              <form action={logoutUser}>
                <button 
                  type="submit"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="px-3.5 py-1.5 text-xs font-black text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
