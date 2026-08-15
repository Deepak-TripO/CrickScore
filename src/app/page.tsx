import React from 'react';
import HomePageWrapper from '@/components/home/HomePageWrapper';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { fetchMatchesSafely } from '@/lib/fetchMatches';

export default async function HomePage() {
  const { user, role: userRole } = await getUserAndRole();
  const profile = user ? await getCurrentUserProfile(user) : null;

  const allMatches = await fetchMatchesSafely({ limit: 50 });

  return (
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col selection:bg-[#19D89A] selection:text-[#050A1A] font-sans pb-20 md:pb-0">
      <HomePageWrapper 
        user={user}
        userRole={userRole}
        userProfile={profile}
        allMatches={allMatches}
      />

      <MobileNav userRole={userRole} />

      <footer className="border-t border-[#173541] bg-[#050A1A] py-6 text-center text-xs text-[#71809A] mb-16 md:mb-0">
        <p>© 2026 BatScore Cricket Platform. Built for players, scorers, and fans.</p>
      </footer>
    </div>
  );
}
