import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { getPublicCommunities, getUserJoinedCommunityIdsAction } from '@/actions/community';
import CommunityCard from '@/components/community/CommunityCard';

export default async function CommunityPage() {
  const { user, role: userRole } = await getUserAndRole();
  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';

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
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TABS & CREATE ACTION BAR */}
        <div className="flex items-center justify-between border-b border-[#173541] pb-3">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-extrabold text-xs rounded-xl shadow-md">
              Discover Communities
            </button>
          </div>

          {/* CREATE COMMUNITY BUTTON — SHOWN ONLY TO MASTER / ADMIN USERS */}
          {isMasterOrAdmin && (
            <Link 
              href="/master/dashboard?tab=community" 
              className="px-4 py-2 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black text-xs rounded-xl shadow-lg shadow-[#19D89A]/20 transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> 
              <span>Create Community</span>
            </Link>
          )}
        </div>

        {/* COMMUNITY DIRECTORY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCommunities.map((c: any) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
