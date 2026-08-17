'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Star, User } from 'lucide-react';

interface MobileNavProps {
  userRole?: string;
}

export default function MobileNav({ userRole = 'USER' }: MobileNavProps) {
  const pathname = usePathname();

  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';
  const masterHref = isMasterOrAdmin ? '/master/dashboard' : '/apply-master';

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Community',
      href: '/community',
      icon: Users,
      isActive: pathname.startsWith('/community'),
    },
    {
      label: 'Master',
      href: masterHref,
      icon: Star,
      isActive: pathname.startsWith('/master') || pathname === '/apply-master',
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#070D1D]/90 backdrop-blur-2xl border-t border-[#1E2D4A]/80 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] pt-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] px-3 w-full max-w-full">
      <div className="grid grid-cols-4 w-full max-w-md mx-auto items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200 text-center w-full group ${
                item.isActive
                  ? 'text-[#19D89A]'
                  : 'text-[#6C7A9C] hover:text-[#C5D1E8] hover:bg-white/[0.03]'
              }`}
            >
              {/* Active top indicator pill */}
              {item.isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-1 bg-[#19D89A] rounded-full shadow-[0_0_10px_#19D89A]" />
              )}

              {/* Icon container with subtle scale animation when active */}
              <div className={`relative transition-transform duration-200 ${item.isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                <Icon className={`w-5 h-5 mx-auto ${item.isActive ? 'stroke-[2.5px] filter drop-shadow-[0_0_8px_rgba(25,216,154,0.4)]' : 'stroke-[1.8px]'}`} />
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight block transition-colors duration-200 ${
                item.isActive ? 'font-black text-[#19D89A]' : 'font-semibold'
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

