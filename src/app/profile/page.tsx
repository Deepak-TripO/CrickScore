import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { User, Edit, Mail, MapPin } from 'lucide-react';

export default async function ProfilePage() {
  const { user, role: userRole } = await getUserAndRole();
  if (!user) redirect('/login');

  const profile = await getCurrentUserProfile(user);

  return (
    <div className="min-h-screen bg-[#050A1A] text-white flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} userProfile={profile} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
        
        {/* PROFILE HEADER AREA (APPROVED IDENTITY DISPLAY) */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#111A2D] border-2 border-[#19D89A]/50 shrink-0 overflow-hidden flex items-center justify-center font-black text-2xl text-[#19D89A] uppercase shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile?.full_name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[#19D89A]" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white truncate">{profile?.full_name || 'User Profile'}</h1>
              <p className="text-xs text-[#AAB5CC] truncate">@{profile?.username || user.email?.split('@')[0]}</p>
              <p className="text-xs text-[#71809A] truncate">{profile?.email || user.email}</p>
              
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {profile?.roles?.map((role: string) => (
                  <span 
                    key={role}
                    className={`px-3 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                      role === 'ADMIN'
                        ? 'bg-[#D927A8]/20 text-[#D927A8] border-[#D927A8]/40'
                        : role === 'MASTER'
                        ? 'bg-[#19D89A]/20 text-[#19D89A] border-[#19D89A]/40'
                        : 'bg-[#111A2D] text-[#AAB5CC] border-[#173541]'
                    }`}
                  >
                    {role} Role
                  </span>
                ))}
              </div>
            </div>

            <Link 
              href="/profile/edit"
              className="px-4 py-2.5 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#173541] text-xs text-[#AAB5CC]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#71809A]" />
              <span className="truncate">{profile?.email || user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#71809A]" />
              <span>{profile?.city || 'City'}, {profile?.state || 'State'}</span>
            </div>
          </div>
        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
