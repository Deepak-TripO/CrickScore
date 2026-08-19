'use client';

import React, { useState } from 'react';

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
    members?: string;
  };
}

export default function CommunityCard({ community }: CommunityCardProps) {
  // Use original uploaded images directly from database as single source of truth
  const initialCover = community.coverImage || DEFAULT_COVER;
  const initialProfile = community.profileImage || DEFAULT_PROFILE;

  const [coverSrc, setCoverSrc] = useState<string>(initialCover);
  const [profileSrc, setProfileSrc] = useState<string>(initialProfile);

  return (
    <div className="bg-[#0D1528] border border-[#173541] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:border-[#19D89A]/40 transition-all group flex flex-col justify-between">
      <div>
        {/* COVER IMAGE BANNER (COMPACT ON MOBILE) */}
        <div className="relative h-28 sm:h-40 w-full bg-[#050A1A] overflow-hidden">
          <img 
            src={coverSrc} 
            alt={`${community.name} Cover`} 
            onError={() => setCoverSrc(DEFAULT_COVER)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/20" />
        </div>

        {/* PROFILE IMAGE & DETAILS (COMPACT ON MOBILE) */}
        <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 relative space-y-2 sm:space-y-3">
          <div className="-mt-7 sm:-mt-10 flex items-end justify-between">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#050A1A] border-3 sm:border-4 border-[#0D1528] overflow-hidden shadow-lg shrink-0 relative z-10">
              <img 
                src={profileSrc} 
                alt={community.name} 
                onError={() => setProfileSrc(DEFAULT_PROFILE)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-1 pt-0.5 sm:pt-1">
            <h3 className="text-sm sm:text-base font-black text-white group-hover:text-[#19D89A] transition-colors truncate sm:whitespace-normal">
              {community.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#AAB5CC] line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {community.bio || community.desc || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION FOOTER */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-[#050A1A]/60 border-t border-[#173541] flex items-center justify-end">
        <button className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 bg-[#111A2D] hover:bg-[#19D89A] hover:text-[#050A1A] border border-[#173541] text-[11px] sm:text-xs font-extrabold text-[#19D89A] rounded-xl transition-all shadow-sm">
          Join Community
        </button>
      </div>
    </div>
  );
}
