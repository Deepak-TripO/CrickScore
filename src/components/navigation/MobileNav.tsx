'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Star, User } from 'lucide-react';

interface MobileNavProps {
  userRole?: string;
}

export default function MobileNav({ userRole = 'USER' }: MobileNavProps) {
  const pathname = usePathname();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';
  const masterHref = isMasterOrAdmin ? '/master/dashboard' : '/apply-master';

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      // If visual viewport height is significantly less than window innerHeight, keyboard is open
      const keyboardActive = window.innerHeight - vv.height > 150;
      setIsKeyboardOpen(keyboardActive);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      href: '/community',
      label: 'Community',
      icon: Users,
      isActive: pathname.startsWith('/community')
    },
    {
      href: masterHref,
      label: 'Master',
      icon: Star,
      isActive: pathname.startsWith('/master') || pathname === '/apply-master'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      isActive: pathname.startsWith('/profile')
    }
  ];

  if (isKeyboardOpen) {
    return null; // Hide bottom navigation when keyboard opens so it never covers inputs
  }

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#070D1D]/95 backdrop-blur-2xl border-t border-[#19D89A]/20 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] w-full transform-gpu transition-all duration-200 ease-out"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-300 relative group ${
                isActive
                  ? 'bg-gradient-to-b from-[#19D89A]/20 to-[#19D89A]/5 text-[#19D89A] font-extrabold shadow-[0_2px_16px_rgba(25,216,154,0.15)] border border-[#19D89A]/30'
                  : 'text-[#8F9BB3] hover:text-white hover:bg-[#111A2D]/60 font-medium border border-transparent'
              }`}
            >
              {/* Active top glowing bar */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-[#19D89A] via-emerald-300 to-[#19D89A] rounded-full shadow-[0_0_10px_#19D89A] transition-all duration-300" />
              )}

              <Icon className={`w-5 h-5 transition-all duration-300 ${
                isActive ? 'text-[#19D89A] scale-110 drop-shadow-[0_0_6px_rgba(25,216,154,0.5)]' : 'text-[#8F9BB3] group-hover:text-white'
              }`} />

              <span className={`text-[10px] tracking-tight mt-0.5 text-center transition-all duration-300 ${
                isActive ? 'text-[#19D89A] font-black' : 'text-[#8F9BB3]'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
