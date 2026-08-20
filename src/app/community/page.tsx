import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import { getPublicCommunities, getUserJoinedCommunityIdsAction } from '@/actions/community';
import PublicCommunityClient from '@/components/community/PublicCommunityClient';

export default async function CommunityPage() {
  const { user, role: userRole } = await getUserAndRole();

  const [dbCommunities, joinedIds] = await Promise.all([
    getPublicCommunities(),
    getUserJoinedCommunityIdsAction()
  ]);

  const sampleCommunities = [
    { 
      id: '1', 
      name: 'Chennai Cricket Community', 
      desc: 'Active local league organizers & squad discussions in Chennai region.',
      profileImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
      coverImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      members: '2,450 Members' 
    },
    { 
      id: '2', 
      name: 'Coimbatore Cricket Club', 
      desc: 'Weekend turf matches, friendly tournaments, and umpire fixtures.',
      profileImage: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
      coverImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      members: '1,820 Members' 
    }
  ];

  const allCommunities = (dbCommunities.length > 0 ? dbCommunities : sampleCommunities).map((c: any) => ({
    ...c,
    isJoined: joinedIds.includes(c.id)
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <PublicCommunityClient communities={allCommunities} />
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
