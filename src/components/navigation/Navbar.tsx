'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Search, 
  Star,
  ShieldAlert,
  X
} from 'lucide-react';

interface NavbarProps {
  user?: any;
  userRole?: string;
  userProfile?: any;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Navbar({ 
  user, 
  userRole = 'USER',
  searchQuery,
  onSearchChange
}: NavbarProps) {
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
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* 1. APPROVED BATSCORE LOGO */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#19D89A] p-0.5 shadow-md shadow-[#19D89A]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#050A1A]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#19D89A] transition-colors hidden sm:inline">
              BatScore
            </span>
          </Link>

          {/* 2. TOP NAVIGATION SEARCH BAR (MOVED TO TOP NAV; SEARCHES TEAM 1 AND TEAM 2 NAMES ONLY) */}
          {onSearchChange !== undefined && (
            <div className="flex-1 max-w-md mx-2 relative">
              <Search className="w-4 h-4 text-[#19D89A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search team name (e.g., Chennai, Madurai)..."
                className="w-full bg-[#0D1528] border border-[#173541] focus:border-[#19D89A] text-white text-xs pl-10 pr-8 py-2 rounded-xl outline-none transition-all placeholder-[#71809A] font-medium shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#AAB5CC] hover:text-white bg-[#050A1A] rounded-md transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* 3. DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0D1528] p-1.5 rounded-full border border-[#173541] shrink-0">
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

        </div>
      </div>
    </header>
  );
}
