import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import CommunityCard from '@/components/community/CommunityCard';
import { getUserAndRole } from '@/lib/auth';
import Link from 'next/link';
import { Users, PlusCircle } from 'lucide-react';
import { getPublicCommunities } from '@/actions/community';

export default async function CommunityPage() {
  const { user, role: userRole } = await getUserAndRole();
  const isMasterOrAdmin = userRole === 'MASTER' || userRole === 'ADMIN';

  const dbCommunities = await getPublicCommunities();

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

  const allCommunities = dbCommunities.length > 0 ? dbCommunities : sampleCommunities;

  return (
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        
        {/* TABS & CREATE BUTTON */}
        <div className="flex items-center justify-between border-b border-[#173541] pb-3">
          <button className="px-3.5 py-1.5 bg-[#19D89A] text-[#050A1A] font-extrabold text-xs rounded-xl shadow-md">
            Discover Communities
          </button>

          {isMasterOrAdmin && (
            <Link 
              href="/master/dashboard?tab=community" 
              className="px-3.5 py-1.5 bg-[#19D89A]/15 hover:bg-[#19D89A]/25 border border-[#19D89A]/40 text-[#19D89A] font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> 
              <span>Create</span>
            </Link>
          )}
        </div>

        {/* COMMUNITY DIRECTORY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCommunities.map((c: any) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
