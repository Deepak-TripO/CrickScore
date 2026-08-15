'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import HomePageClient from './HomePageClient';

interface HomePageWrapperProps {
  user: any;
  userRole: string;
  userProfile: any;
  allMatches: any[];
}

export default function HomePageWrapper({
  user,
  userRole,
  userProfile,
  allMatches = []
}: HomePageWrapperProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Navbar 
        user={user} 
        userRole={userRole} 
        userProfile={userProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HomePageClient 
          user={user}
          userRole={userRole}
          allMatches={allMatches}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </main>
    </>
  );
}
