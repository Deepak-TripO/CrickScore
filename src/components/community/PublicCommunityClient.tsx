'use client';

import React, { useState } from 'react';
import CommunityCard from './CommunityCard';
import { ArrowLeft, UserCheck, Users, Loader2, LogOut } from 'lucide-react';
import { getCommunityMembersAction, leaveCommunityAction, CommunityMemberItem } from '@/actions/community';

interface PublicCommunityClientProps {
  communities: any[];
}

export default function PublicCommunityClient({ communities: initialCommunities }: PublicCommunityClientProps) {
  const [communityList, setCommunityList] = useState<any[]>(initialCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberItem[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);

  const handleSelectCommunity = async (comm: any) => {
    // Access Control: Only open member page for joined communities
    if (!comm.isJoined) return;

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

  const handleLeaveCommunity = async () => {
    if (!selectedCommunity || isLeaving) return;
    setIsLeaving(true);
    try {
      const res = await leaveCommunityAction(selectedCommunity.id);
      if (res.success) {
        setCommunityList(prev => prev.map(c => {
          if (c.id === selectedCommunity.id) {
            return { ...c, isJoined: false };
          }
          return c;
        }));
        handleCloseMemberPage();
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.warn('[LEAVE COMMUNITY ERROR]', err);
    } finally {
      setIsLeaving(false);
    }
  };

  // IF VIEWING DEDICATED JOINED COMMUNITY MEMBER PAGE (UNIFIED PAGE - IMAGE REFERENCE)
  if (selectedCommunity) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200 pb-12">
        
        {/* TOP NAVIGATION BAR: BACK (LEFT) & LEAVE (RIGHT) */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleCloseMemberPage}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleLeaveCommunity}
            disabled={isLeaving}
            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 font-extrabold text-xs rounded-xl border border-red-200 flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            {isLeaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span>Leave</span>
              </>
            )}
          </button>
        </div>

        {/* ONE SINGLE UNIFIED COMMUNITY CARD (CONTAINS COVER, PROFILE, DETAILS & MEMBERS) */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-0 text-slate-900">
          <div className="relative h-40 sm:h-52 w-full bg-slate-100 overflow-hidden">
            <img 
              src={selectedCommunity.coverImage} 
              alt={selectedCommunity.name} 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
          </div>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6 relative space-y-4">
            <div className="-mt-10 sm:-mt-12 flex items-end justify-between">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white overflow-hidden shadow-md shrink-0">
                <img 
                  src={selectedCommunity.profileImage} 
                  alt={selectedCommunity.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200">
                Active Community
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">{selectedCommunity.name}</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                {selectedCommunity.bio || selectedCommunity.desc || 'No description provided.'}
              </p>
            </div>

            {/* INTEGRATED COMMUNITY MEMBERS SECTION INSIDE UNIFIED CARD */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-black text-slate-900">Community Members</h3>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-50 text-orange-600 border border-slate-200">
                  {loadingMembers ? 'Loading...' : `${memberCount} Members`}
                </span>
              </div>

              {loadingMembers ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  <p className="text-xs text-slate-500 font-bold">Loading community members...</p>
                </div>
              ) : communityMembers.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">No members have joined this community yet.</h4>
                    <p className="text-[11px] text-slate-500">When players or scorers join this community, they will appear here automatically.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {communityMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-sm hover:border-orange-400 transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-black text-slate-700 text-xs">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.fullName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          member.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{member.fullName}</h4>
                        {member.username && (
                          <span className="text-[11px] text-slate-500 block truncate">@{member.username}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-md shrink-0">
                        {member.role || 'MEMBER'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    );
  }

  // DISCOVER COMMUNITIES DIRECTORY VIEW
  return (
    <div className="space-y-6">
      {/* TABS (DISCOVER COMMUNITIES ONLY — NO CREATE BUTTON) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-sm">
            Discover Communities
          </button>
        </div>
      </div>

      {/* COMMUNITY DIRECTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityList.map((c: any) => (
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
