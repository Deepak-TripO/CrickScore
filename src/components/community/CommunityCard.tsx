'use client';

import React, { useState, useEffect } from 'react';
import { joinCommunityAction } from '@/actions/community';
import { Check, Loader2 } from 'lucide-react';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_PROFILE = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80';

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    bio?: string;
    desc?: string;
    profileImage?: string;
    coverImage?: string;
    memberCount?: number;
    members?: string;
    isJoined?: boolean;
  };
  onSelect?: () => void;
  onJoinChange?: (communityId: string, isJoined: boolean, newCount: number) => void;
}

export default function CommunityCard({ community, onSelect, onJoinChange }: CommunityCardProps) {
  // Use original uploaded images directly from database as single source of truth
  const initialCover = community.coverImage || DEFAULT_COVER;
  const initialProfile = community.profileImage || DEFAULT_PROFILE;

  const [coverSrc, setCoverSrc] = useState<string>(initialCover);
  const [profileSrc, setProfileSrc] = useState<string>(initialProfile);
  const [isJoinedState, setIsJoinedState] = useState<boolean>(!!community.isJoined);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [localCount, setLocalCount] = useState<number | null>(null);

  // Sync state when props change (vital for account switching and revalidation)
  useEffect(() => {
    setIsJoinedState(!!community.isJoined);
    setCoverSrc(community.coverImage || DEFAULT_COVER);
    setProfileSrc(community.profileImage || DEFAULT_PROFILE);
    setLocalCount(null);
  }, [community.id, community.isJoined, community.coverImage, community.profileImage]);

  const baseCount = typeof community.memberCount === 'number'
    ? community.memberCount
    : (community.members ? parseInt(community.members.replace(/[^0-9]/g, ''), 10) || 0 : 0);

  const displayCount = localCount !== null
    ? localCount
    : ((isJoinedState && !community.isJoined) ? baseCount + 1 : baseCount);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJoinedState || isJoining) return;
    setIsJoining(true);

    try {
      const res = await joinCommunityAction(community.id);
      if (res.success || res.isJoined) {
        setIsJoinedState(true);
        const newCount = res.membersCount !== undefined ? res.membersCount : baseCount + 1;
        setLocalCount(newCount);
        onJoinChange?.(community.id, true, newCount);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.warn('[JOIN COMMUNITY ERROR]', err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div 
      onClick={() => isJoinedState && onSelect?.()}
      className={`bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all group flex flex-col justify-between ${isJoinedState && onSelect ? 'cursor-pointer hover:border-orange-500 active:scale-[0.99]' : ''}`}
    >
      <div>
        {/* COVER IMAGE BANNER (COMPACT ON MOBILE) */}
        <div className="relative h-28 sm:h-40 w-full bg-slate-100 overflow-hidden">
          <img 
            src={coverSrc} 
            alt={`${community.name} Cover`} 
            loading="lazy"
            decoding="async"
            onError={() => setCoverSrc(DEFAULT_COVER)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
        </div>

        {/* PROFILE IMAGE & DETAILS (COMPACT ON MOBILE) */}
        <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 relative space-y-2 sm:space-y-3">
          <div className="-mt-7 sm:-mt-10 flex items-end justify-between">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white border-3 sm:border-4 border-white overflow-hidden shadow-md shrink-0 relative z-10">
              <img 
                src={profileSrc} 
                alt={community.name} 
                loading="lazy"
                decoding="async"
                onError={() => setProfileSrc(DEFAULT_PROFILE)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-1 pt-0.5 sm:pt-1">
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate sm:whitespace-normal">
              {community.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {community.bio || community.desc || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION FOOTER */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-600">
          👥 {displayCount} Members
        </span>
        {isJoinedState ? (
          <button 
            disabled 
            onClick={(e) => e.stopPropagation()}
            className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 bg-orange-50 border border-orange-200 text-[11px] sm:text-xs font-black text-orange-600 rounded-xl flex items-center gap-1.5 cursor-default shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Joined</span>
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleJoinClick}
            disabled={isJoining}
            className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] sm:text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <span>Join Community</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
