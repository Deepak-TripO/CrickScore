import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import HomePageClient from '@/components/home/HomePageClient';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { fetchMatchesSafely } from '@/lib/fetchMatches';

export default async function HomePage() {
  const { user, role: userRole } = await getUserAndRole();
  const profile = user ? await getCurrentUserProfile(user) : null;

  const allMatches = await fetchMatchesSafely({ limit: 20 });

  return (
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col selection:bg-[#19D89A] selection:text-[#050A1A] font-sans pb-20 md:pb-0">
      <Navbar user={user} userRole={userRole} userProfile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HomePageClient 
          user={user}
          userRole={userRole}
          allMatches={allMatches}
        />
      </main>

      <MobileNav userRole={userRole} />

      <footer className="border-t border-[#173541] bg-[#050A1A] py-6 text-center text-xs text-[#71809A] mb-16 md:mb-0">
        <p>© 2026 BatScore Cricket Platform. Built for players, scorers, and fans.</p>
      </footer>
    </div>
  );
}
