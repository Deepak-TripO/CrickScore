import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { User, Edit, Mail, MapPin } from 'lucide-react';
import { isValidImageUrl, sanitizeImageUrl } from '@/lib/imageUtils';

export default async function ProfilePage() {
  const { user, role: userRole } = await getUserAndRole();
  if (!user) redirect('/login');

  const profile = await getCurrentUserProfile(user);

  return (
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} userProfile={profile} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-8 space-y-4">
        
        {/* CLEAN & COMPACT PROFILE MODULE */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#050A1A] border-2 border-[#19D89A]/50 shrink-0 overflow-hidden flex items-center justify-center font-black text-xl text-[#19D89A] uppercase shadow-lg">
                {isValidImageUrl(profile?.avatar_url) ? (
                  <img 
                    src={sanitizeImageUrl(profile?.avatar_url)} 
                    alt={profile?.full_name || 'Profile'} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-8 h-8 text-[#19D89A]" />
                )}
              </div>

              <div className="min-w-0 space-y-0.5">
                <h1 className="text-lg sm:text-xl font-black text-white truncate">{profile?.full_name || 'User Profile'}</h1>
                <p className="text-xs font-semibold text-[#19D89A] truncate">@{profile?.username || user.email?.split('@')[0]}</p>
                
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {profile?.roles?.map((role: string) => (
                    <span 
                      key={role}
                      className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                        role === 'ADMIN'
                          ? 'bg-[#D927A8]/20 text-[#D927A8] border-[#D927A8]/40'
                          : role === 'MASTER'
                          ? 'bg-[#19D89A]/20 text-[#19D89A] border-[#19D89A]/40'
                          : 'bg-[#050A1A] text-[#AAB5CC] border-[#173541]'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Link 
              href="/profile/edit"
              className="px-3.5 py-2 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-md active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" /> 
              <span>Edit</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-[#173541] text-xs text-[#AAB5CC]">
            <div className="flex items-center gap-2 bg-[#050A1A]/60 border border-[#173541]/50 p-2.5 rounded-xl">
              <Mail className="w-4 h-4 text-[#19D89A] shrink-0" />
              <span className="truncate">{profile?.email || user.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#050A1A]/60 border border-[#173541]/50 p-2.5 rounded-xl">
              <MapPin className="w-4 h-4 text-[#19D89A] shrink-0" />
              <span className="truncate">{profile?.city || 'City'}, {profile?.state || 'State'}</span>
            </div>
          </div>

        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
