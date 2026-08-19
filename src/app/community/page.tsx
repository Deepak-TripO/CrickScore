import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import { getUserAndRole } from '@/lib/auth';
import Link from 'next/link';
import { Users, PlusCircle, Sparkles, Shield } from 'lucide-react';
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
          {allCommunities.map((c: any) => {
            const defaultCover = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';
            const defaultProfile = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80';

            const coverUrl = c.coverImage || c.cover_image || c.banner_url || defaultCover;
            const profileUrl = c.profileImage || c.profile_image || c.logo_url || defaultProfile;

            return (
              <div 
                key={c.id} 
                className="bg-[#0D1528] border border-[#173541] rounded-2xl overflow-hidden shadow-lg hover:border-[#19D89A]/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* COVER IMAGE BANNER */}
                  <div className="relative h-24 sm:h-28 w-full bg-[#050A1A] overflow-hidden">
                    <img 
                      src={coverUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultCover;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/20" />
                  </div>

                  {/* PROFILE IMAGE & DETAILS */}
                  <div className="px-4 pb-4 relative space-y-2">
                    <div className="-mt-7 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#050A1A] border-2 border-[#0D1528] overflow-hidden shadow-md shrink-0">
                        <img 
                          src={profileUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = defaultProfile;
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-white group-hover:text-[#19D89A] transition-colors line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-xs text-[#AAB5CC] line-clamp-2 leading-relaxed">
                        {c.bio || c.desc || 'No community description provided.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION FOOTER */}
                <div className="px-4 py-2.5 bg-[#050A1A]/60 border-t border-[#173541] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#AAB5CC]">Master Created</span>
                  <button className="px-3 py-1 bg-[#111A2D] hover:bg-[#19D89A] hover:text-[#050A1A] border border-[#173541] text-xs font-black text-[#19D89A] rounded-lg transition-all shadow-sm">
                    Join
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
