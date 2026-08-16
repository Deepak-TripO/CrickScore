'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  Trophy, 
  Search, 
  Bell, 
  Star,
  ShieldAlert,
  LogOut,
  X
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface NavbarProps {
  user?: any;
  userRole?: string;
  userProfile?: any;
}

function NavSearchControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get('search') || '';

  const [searchOpen, setSearchOpen] = useState(!!currentSearch);
  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(currentSearch);
    if (currentSearch) setSearchOpen(true);
  }, [currentSearch]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (val.trim()) {
      params.set('search', val.trim());
    } else {
      params.delete('search');
    }
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const handleCloseSearch = () => {
    setSearchValue('');
    setSearchOpen(false);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  if (searchOpen) {
    return (
      <div className="hidden md:flex items-center gap-2 bg-[#0D1528] border border-[#19D89A] rounded-xl px-3 py-1.5 transition-all duration-200 w-44 sm:w-60 shadow-lg">
        <Search className="w-3.5 h-3.5 text-[#19D89A] shrink-0" />
        <input
          type="text"
          autoFocus
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search team name..."
          className="w-full bg-transparent text-white text-xs outline-none placeholder-[#71809A] font-medium"
        />
        <button
          type="button"
          onClick={handleCloseSearch}
          className="p-0.5 text-[#AAB5CC] hover:text-white rounded transition-colors shrink-0"
          title="Close search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      type="button"
      onClick={() => setSearchOpen(true)}
      className="hidden md:flex p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors" 
      title="Search by Team Name"
      aria-label="Search by Team Name"
    >
      <Search className="w-4 h-4" />
    </button>
  );
}

function MobileNavSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get('search') || '';

  const [mobileSearchOpen, setMobileSearchOpen] = useState(!!currentSearch);
  const [searchValue, setSearchValue] = useState(currentSearch);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  // Automatically close mobile search bar on outside click/touch
  useEffect(() => {
    if (!mobileSearchOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileSearchOpen]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (val.trim()) {
      params.set('search', val.trim());
    } else {
      params.delete('search');
    }
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const handleCloseSearch = () => {
    setSearchValue('');
    setMobileSearchOpen(false);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  return (
    <>
      {/* MOBILE SEARCH ICON BUTTON IN TOP NAV */}
      <button 
        ref={buttonRef}
        type="button"
        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        className="md:hidden p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors" 
        title="Search by Team Name"
        aria-label="Search by Team Name"
      >
        {mobileSearchOpen ? <X className="w-4 h-4 text-[#19D89A]" /> : <Search className="w-4 h-4" />}
      </button>

      {/* MOBILE EXPANDED SEARCH CARD (MATCHES REFERENCE IMAGE STYLING EXACTLY BELOW TOP NAV) */}
      {mobileSearchOpen && (
        <div 
          ref={containerRef}
          className="md:hidden bg-[#1E1F24] border border-[#2B2C34] rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-2 my-2 mx-3 relative z-50"
        >
          {/* SEARCH INPUT ROW WITH AMBER/ORANGE ACCENT BORDER & RIGHT CLOSE ICON */}
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex-1 flex items-center gap-2.5 bg-[#282930] border-2 border-amber-500/90 rounded-full px-3.5 py-2 shadow-inner focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/30 transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search team name..."
                className="w-full bg-transparent text-white text-xs outline-none placeholder-gray-500 font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleCloseSearch}
              className="p-1 text-gray-400 hover:text-white rounded-full transition-colors shrink-0"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
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
          
          {/* 1. APPROVED BATSCORE LOGO & WEBSITE NAME (FIXED & UNCHANGED) */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
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

          {/* 3. RIGHT HEADER ACTIONS: [ SEARCH ICON 🔍 ] [ NOTIFICATION 🔔 ] [ LOGOUT 🚪 ] */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* DESKTOP SEARCH CONTROL */}
            <Suspense fallback={
              <button className="hidden md:flex p-2 rounded-xl text-[#AAB5CC]" title="Search">
                <Search className="w-4 h-4" />
              </button>
            }>
              <NavSearchControl />
            </Suspense>

            {/* MOBILE SEARCH CONTROL */}
            <Suspense fallback={
              <button className="md:hidden p-2 rounded-xl text-[#AAB5CC]" title="Search">
                <Search className="w-4 h-4" />
              </button>
            }>
              <MobileNavSearch />
            </Suspense>

            {/* NOTIFICATION BELL BUTTON */}
            <button className="p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors relative" title="Notification">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#19D89A] absolute top-2 right-2 animate-ping" />
            </button>

            {/* LOGOUT BUTTON / AUTH BUTTONS */}
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
