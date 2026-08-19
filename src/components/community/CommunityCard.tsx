'use client';

import React, { useState } from 'react';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_PROFILE = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80';

interface CommunityCardProps {
  community: any;
}

export default function CommunityCard({ community: c }: CommunityCardProps) {
  const [coverSrc, setCoverSrc] = useState<string>(
    c.coverImage || c.cover_image || c.banner_url || DEFAULT_COVER
  );
  const [profileSrc, setProfileSrc] = useState<string>(
    c.profileImage || c.profile_image || c.logo_url || DEFAULT_PROFILE
  );

  return (
    <div className="bg-[#0D1528] border border-[#173541] rounded-2xl overflow-hidden shadow-lg hover:border-[#19D89A]/40 transition-all group flex flex-col justify-between">
      <div>
        {/* COVER IMAGE BANNER */}
        <div className="relative h-24 sm:h-28 w-full bg-[#050A1A] overflow-hidden">
          <img 
            src={coverSrc} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setCoverSrc(DEFAULT_COVER)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/20" />
        </div>

        {/* PROFILE IMAGE & DETAILS */}
        <div className="px-4 pb-4 relative space-y-2">
          <div className="-mt-7 flex items-end justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#050A1A] border-2 border-[#0D1528] overflow-hidden shadow-md shrink-0">
              <img 
                src={profileSrc} 
                alt="" 
                className="w-full h-full object-cover"
                onError={() => setProfileSrc(DEFAULT_PROFILE)}
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
}
