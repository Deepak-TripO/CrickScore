'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { 
  Trophy, 
  Search, 
  Bell, 
  Star,
  ShieldAlert,
  LogOut,
  X,
  ArrowLeft
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface NavbarProps {
  user?: any;
  userRole?: string;
  userProfile?: any;
}

function TopNavSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get('search') || '';
  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(currentSearch);
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

  const handleClear = () => {
    setSearchValue('');
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
    router.replace(`/${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  return (
    <div className="w-full flex items-center gap-1.5 bg-white border border-slate-200 focus-within:border-orange-500 rounded-xl px-2.5 py-1.5 transition-all shadow-sm">
      <Search className="w-3.5 h-3.5 text-orange-500 shrink-0" />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search team..."
        className="w-full bg-transparent text-slate-900 text-xs outline-none placeholder-slate-400 font-medium"
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function MobileNavSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get('search') || '';

  const [mobileSearchOpen, setMobileSearchOpen] = useState(!!currentSearch);
  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(currentSearch);
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

  const handleClearInput = () => {
    setSearchValue('');
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('search');
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
        type="button"
        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" 
        title="Search by Team Name"
        aria-label="Search by Team Name"
      >
        {mobileSearchOpen ? <X className="w-4 h-4 text-orange-500" /> : <Search className="w-4 h-4" />}
      </button>

      {/* DEDICATED MOBILE SEARCH VIEW (APPEARS DIRECTLY BELOW TOP NAV ONLY ON MOBILE) */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 bg-white border border-orange-500 rounded-xl px-3 py-2 w-full shadow-inner">
            <button
              type="button"
              onClick={handleCloseSearch}
              className="p-1 text-orange-500 hover:text-orange-600 rounded-lg transition-colors shrink-0"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <input
              type="text"
              autoFocus
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search team name..."
              className="w-full bg-transparent text-slate-900 text-xs outline-none placeholder-slate-400 font-medium"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearInput}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mt-1">
            <span>{searchValue ? `Searching team: "${searchValue}"` : 'Type team name to filter matches'}</span>
            <button 
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-orange-600 font-bold text-[11px]"
            >
              Done
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
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-white border-b border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* 1. APPROVED BATSCORE LOGO */}
          <Logo size="md" href="/" />

          {/* 2. SEARCH BAR IN TOP NAVIGATION */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-2 sm:mx-4">
            <Suspense fallback={null}>
              <TopNavSearchBar />
            </Suspense>
          </div>

          {/* 3. DESKTOP NAVIGATION LINKS */}
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
