'use client';

import React, { useState } from 'react';
import CommunityCard from './CommunityCard';
import { ArrowLeft, UserCheck, Users, Loader2 } from 'lucide-react';
import { getCommunityMembersAction, CommunityMemberItem } from '@/actions/community';

interface PublicCommunityClientProps {
  communities: any[];
}

export default function PublicCommunityClient({ communities }: PublicCommunityClientProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberItem[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

  const handleSelectCommunity = async (comm: any) => {
    setSelectedCommunity(comm);
    setLoadingMembers(true);
    try {
      const res = await getCommunityMembersAction(comm.id);
      setCommunityMembers(res.members || []);
      setMemberCount(res.count || 0);
    } catch {
      setCommunityMembers([]);
      setMemberCount(0);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCloseMemberPage = () => {
    setSelectedCommunity(null);
    setCommunityMembers([]);
    setMemberCount(0);
  };

  // IF VIEWING SELECTED COMMUNITY MEMBER PAGE (IMAGE 2 REFERENCE)
  if (selectedCommunity) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* BACK ACTION BUTTON (RENAMED TO "Back" WITHOUT VISIBLE COMMUNITY ID BADGE) */}
        <div className="flex items-center justify-between border-b border-[#173541] pb-4">
          <button
            type="button"
            onClick={handleCloseMemberPage}
            className="px-4 py-2 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-extrabold text-xs rounded-xl border border-[#173541] flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#19D89A]" />
            <span>Back</span>
          </button>
        </div>

        {/* COMMUNITY BANNER & INFO HEADER CARD */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-3xl overflow-hidden shadow-2xl space-y-0">
          <div className="relative h-36 sm:h-48 w-full bg-[#050A1A] overflow-hidden">
            <img 
              src={selectedCommunity.coverImage} 
              alt={selectedCommunity.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/30" />
          </div>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6 relative space-y-3 sm:space-y-4">
            <div className="-mt-10 sm:-mt-12 flex items-end justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#050A1A] border-4 border-[#0D1528] overflow-hidden shadow-xl shrink-0">
                <img 
                  src={selectedCommunity.profileImage} 
                  alt={selectedCommunity.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#19D89A]/15 text-[#19D89A] border border-[#19D89A]/30">
                Active Community
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">{selectedCommunity.name}</h2>
              <p className="text-xs text-[#AAB5CC] leading-relaxed max-w-3xl">
                {selectedCommunity.bio || selectedCommunity.desc || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* COMMUNITY MEMBERS SECTION */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#173541] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#19D89A]" />
              <h3 className="text-base font-black text-white">Community Members</h3>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#050A1A] text-[#19D89A] border border-[#173541]">
              {loadingMembers ? 'Loading...' : `${memberCount} Members`}
            </span>
          </div>

          {loadingMembers ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#19D89A]" />
              <p className="text-xs text-[#AAB5CC] font-bold">Loading community members...</p>
            </div>
          ) : communityMembers.length === 0 ? (
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#111A2D] border border-[#173541] flex items-center justify-center text-[#AAB5CC]">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No members have joined this community yet.</h4>
                <p className="text-xs text-[#AAB5CC]">When players or scorers join this community, they will appear here automatically.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {communityMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-[#050A1A] border border-[#173541] rounded-2xl p-4 flex items-center gap-3.5 shadow-md hover:border-[#19D89A]/40 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#111A2D] border border-[#173541] overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      member.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate">{member.fullName}</h4>
                    {member.username && (
                      <span className="text-[10px] text-[#AAB5CC] block truncate">@{member.username}</span>
                    )}
                    <span className="text-[9px] font-extrabold text-[#19D89A] uppercase tracking-wider block">
                      {member.role || 'Member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // DISCOVER COMMUNITIES DIRECTORY VIEW
  return (
    <div className="space-y-6">
      {/* TABS (DISCOVER COMMUNITIES ONLY — NO CREATE BUTTON) */}
      <div className="flex items-center justify-between border-b border-[#173541] pb-3">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-[#19D89A] text-[#050A1A] font-extrabold text-xs rounded-xl shadow-md">
            Discover Communities
          </button>
        </div>
      </div>

      {/* COMMUNITY DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((c: any) => (
          <CommunityCard 
            key={c.id} 
            community={c} 
            onSelect={() => handleSelectCommunity(c)}
          />
        ))}
      </div>
    </div>
  );
}
