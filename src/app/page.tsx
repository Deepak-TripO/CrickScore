import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import HomePageClient from '@/components/home/HomePageClient';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { fetchMatchesSafely } from '@/lib/fetchMatches';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const { user, role: userRole } = await getUserAndRole();

  if (!user) {
    redirect('/login');
  }

  const profile = await getCurrentUserProfile(user);
  const allMatches = await fetchMatchesSafely({ limit: 20, onlyMasterCreated: true });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white font-sans pb-20 md:pb-0">
      <Navbar user={user} userRole={userRole} userProfile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HomePageClient 
          user={user}
          userRole={userRole}
          allMatches={allMatches}
        />
      </main>

      <MobileNav userRole={userRole} />

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mb-16 md:mb-0">
        <p>© 2026 BatScore Cricket Platform. Built for players, scorers, and fans.</p>
      </footer>
    </div>
  );
}
