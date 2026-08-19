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
  const initialCover = community.coverImage && community.coverImage.length > 5 && (community.coverImage.startsWith('http') || community.coverImage.startsWith('/') || community.coverImage.startsWith('data:'))
    ? community.coverImage
    : DEFAULT_COVER;

  const initialProfile = community.profileImage && community.profileImage.length > 5 && (community.profileImage.startsWith('http') || community.profileImage.startsWith('/') || community.profileImage.startsWith('data:'))
    ? community.profileImage
    : DEFAULT_PROFILE;

  const [coverSrc, setCoverSrc] = useState<string>(initialCover);
  const [profileSrc, setProfileSrc] = useState<string>(initialProfile);

  return (
    <div className="bg-[#0D1528] border border-[#173541] rounded-3xl overflow-hidden shadow-xl hover:border-[#19D89A]/40 transition-all group flex flex-col justify-between">
      <div>
        {/* COVER IMAGE BANNER */}
        <div className="relative h-36 sm:h-40 w-full bg-[#050A1A] overflow-hidden">
          <img 
            src={coverSrc} 
            alt={`${community.name} Cover`} 
            onError={() => setCoverSrc(DEFAULT_COVER)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/20" />
        </div>

        {/* PROFILE IMAGE & DETAILS */}
        <div className="px-5 pb-5 relative space-y-3">
          <div className="-mt-10 flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl bg-[#050A1A] border-4 border-[#0D1528] overflow-hidden shadow-lg shrink-0 relative z-10">
              <img 
                src={profileSrc} 
                alt={community.name} 
                onError={() => setProfileSrc(DEFAULT_PROFILE)}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#19D89A]/15 text-[#19D89A] border border-[#19D89A]/30">
              {community.members || 'Active Club'}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h3 className="text-base font-black text-white group-hover:text-[#19D89A] transition-colors">
              {community.name}
            </h3>
            <p className="text-xs text-[#AAB5CC] line-clamp-3 leading-relaxed">
              {community.bio || community.desc || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION FOOTER */}
      <div className="px-5 py-3.5 bg-[#050A1A]/60 border-t border-[#173541] flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#AAB5CC]">Master Created</span>
        <button className="px-4 py-1.5 bg-[#111A2D] hover:bg-[#19D89A] hover:text-[#050A1A] border border-[#173541] text-xs font-extrabold text-[#19D89A] rounded-xl transition-all shadow-sm">
          Join Community
        </button>
      </div>
    </div>
  );
}
