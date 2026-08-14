'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Search, 
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
      scrolled ? 'bg-[#050A1A]/95 backdrop-blur-md border-b border-[#173541] shadow-xl' : 'bg-[#050A1A] border-b border-[#173541]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. APPROVED BATSCORE LOGO (FIXED & UNCHANGED) */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[#19D89A] p-0.5 shadow-md shadow-[#19D89A]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#050A1A]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#19D89A] transition-colors">
              BatScore
            </span>
          </Link>

          {/* 2. DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0D1528] p-1.5 rounded-full border border-[#173541]">
            <Link 
              href="/" 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname === '/' ? 'bg-[#19D89A] text-[#050A1A] font-extrabold shadow-md' : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
              }`}
            >
              Home
            </Link>

            <Link 
              href="/community" 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/community') ? 'bg-[#19D89A] text-[#050A1A] font-extrabold shadow-md' : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D]'
              }`}
            >
              Community
            </Link>

            <Link 
              href={masterHref} 
              className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                pathname.startsWith('/master') || pathname === '/apply-master' ? 'bg-[#19D89A] text-[#050A1A] font-extrabold shadow-md' : 'text-[#19D89A] hover:bg-[#111A2D]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Master
            </Link>

            {userRole === 'ADMIN' && (
              <Link 
                href="/admin/dashboard" 
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                  pathname.startsWith('/admin') ? 'bg-[#D927A8] text-white font-extrabold' : 'text-[#D927A8] hover:bg-[#111A2D]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* 3. RIGHT HEADER ACTIONS (SEARCH, NOTIFICATION ONLY — PROFILE REMOVED FROM TOP HEADER) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* SEARCH ICON BUTTON */}
            <button className="p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors" title="Search">
              <Search className="w-4 h-4" />
            </button>

            {/* NOTIFICATION BELL BUTTON */}
            <button className="p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors relative" title="Notification">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#19D89A] absolute top-2 right-2 animate-ping" />
            </button>

            {user ? (
              <form action={logoutUser}>
                <button 
                  type="submit"
                  className="p-2 text-[#AAB5CC] hover:text-[#E5232F] hover:bg-[#0D1528] rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="px-3.5 py-1.5 text-xs font-bold text-[#AAB5CC] hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="px-3.5 py-1.5 text-xs font-black text-[#050A1A] bg-[#19D89A] hover:bg-emerald-400 rounded-xl transition-colors shadow-md"
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
