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

function NavbarContent({ user, userRole = 'USER' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(searchParams.get('q') || '');
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

  // Update search input value if query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchVal(q);
      setIsSearchOpen(true);
    }
  }, [searchParams]);

  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';
  const masterHref = isMasterOrAdmin ? '/master/dashboard' : '/apply-master';

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    const params = new URLSearchParams(window.location.search);
    if (val.trim()) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearSearch = () => {
    setSearchVal('');
    setIsSearchOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-[#050A1A]/95 backdrop-blur-md border-b border-[#173541] shadow-xl' : 'bg-[#050A1A] border-b border-[#173541]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* 1. WEBSITE LOGO + WEBSITE NAME (FIXED & UNCHANGED) */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#19D89A] p-0.5 shadow-md shadow-[#19D89A]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#050A1A]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#19D89A] transition-colors">
              BatScore
            </span>
          </Link>

          {/* EXPANDABLE INLINE TOP NAV SEARCH INPUT WHEN SEARCH ICON IS CLICKED */}
          {isSearchOpen ? (
            <div className="flex-1 max-w-md mx-2 relative animate-in fade-in zoom-in-95 duration-150">
              <Search className="w-4 h-4 text-[#19D89A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by team name (e.g., Chennai Warriors)..."
                className="w-full bg-[#0D1528] border border-[#19D89A] text-white text-xs pl-9 pr-8 py-2 rounded-xl outline-none transition-all placeholder-[#71809A] font-medium shadow-inner"
              />
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#71809A] hover:text-white bg-[#050A1A] rounded-lg transition-colors"
                title="Close search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* 2. DESKTOP NAVIGATION LINKS (DEFAULT STATE) */
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
          )}

          {/* 3. RIGHT HEADER ACTIONS: SEARCH ICON, NOTIFICATION BELL, LOGOUT */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* SEARCH ICON BUTTON (TOGGLES INLINE SEARCH INPUT IN TOP NAV) */}
            <button 
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl transition-colors ${
                isSearchOpen || searchVal 
                  ? 'text-[#19D89A] bg-[#0D1528] border border-[#19D89A]/40' 
                  : 'text-[#AAB5CC] hover:text-white hover:bg-[#0D1528]'
              }`} 
              title="Search Team Name"
              aria-label="Search Team Name"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* NOTIFICATION BELL BUTTON (STRICTLY PRESERVED) */}
            <button 
              type="button"
              className="p-2 rounded-xl text-[#AAB5CC] hover:text-white hover:bg-[#0D1528] transition-colors relative" 
              title="Notification"
              aria-label="Notification"
            >
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#19D89A] absolute top-2 right-2 animate-ping" />
            </button>

            {/* LOGOUT BUTTON (STRICTLY PRESERVED) */}
            {user ? (
              <form action={logoutUser}>
                <button 
                  type="submit"
                  className="p-2 text-[#AAB5CC] hover:text-[#E5232F] hover:bg-[#0D1528] rounded-xl transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
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

export default function Navbar(props: NavbarProps) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 bg-[#050A1A] border-b border-[#173541]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#19D89A] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#050A1A]" />
            </div>
            <span className="font-extrabold text-xl text-white">BatScore</span>
          </Link>
        </div>
      </header>
    }>
      <NavbarContent {...props} />
    </Suspense>
  );
}
