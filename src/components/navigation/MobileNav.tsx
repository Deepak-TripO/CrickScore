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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1528] border-t border-[#173541] px-3 py-2 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* 1. HOME */}
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 text-center ${
            pathname === '/' ? 'text-[#19D89A] font-black' : 'text-[#AAB5CC] hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mx-auto" />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </Link>

        {/* 2. COMMUNITY */}
        <Link 
          href="/community" 
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 text-center ${
            pathname.startsWith('/community') ? 'text-[#19D89A] font-black' : 'text-[#AAB5CC] hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 mx-auto" />
          <span className="text-[10px] font-bold tracking-tight">Community</span>
        </Link>

        {/* 3. MASTER */}
        <Link 
          href={masterHref} 
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 text-center ${
            pathname.startsWith('/master') || pathname === '/apply-master' ? 'text-[#19D89A] font-black' : 'text-[#AAB5CC] hover:text-white'
          }`}
        >
          <Star className="w-5 h-5 mx-auto" />
          <span className="text-[10px] font-bold tracking-tight">Master</span>
        </Link>

        {/* 4. PROFILE */}
        <Link 
          href="/profile" 
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 text-center ${
            pathname.startsWith('/profile') ? 'text-[#19D89A] font-black' : 'text-[#AAB5CC] hover:text-white'
          }`}
        >
          <User className="w-5 h-5 mx-auto" />
          <span className="text-[10px] font-bold tracking-tight">Profile</span>
        </Link>

      </div>
    </nav>
  );
}
