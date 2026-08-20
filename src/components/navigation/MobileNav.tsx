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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-x border-slate-200/80 rounded-t-2xl sm:rounded-t-3xl py-2 px-3 w-full pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-4 w-full max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-center w-full ${
                item.isActive
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2px]" />
              <span className={`text-[11px] tracking-tight block mt-1 ${
                item.isActive ? 'font-bold' : 'font-medium'
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


