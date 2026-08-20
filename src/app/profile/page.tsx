import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import MobileNav from '@/components/navigation/MobileNav';
import Link from 'next/link';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';
import { User, Edit, Mail, MapPin, Settings, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { isValidImageUrl, sanitizeImageUrl } from '@/lib/imageUtils';

export default async function ProfilePage() {
  const { user, role: userRole } = await getUserAndRole();
  if (!user) redirect('/login');

  const profile = await getCurrentUserProfile(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-24 md:pb-0">
      <Navbar user={user} userRole={userRole} userProfile={profile} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 sm:py-8 space-y-4">
        
        {/* CLEAN & COMPACT PROFILE MODULE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border-2 border-orange-500 shrink-0 overflow-hidden flex items-center justify-center font-black text-xl text-orange-600 uppercase shadow-sm">
                {isValidImageUrl(profile?.avatar_url) ? (
                  <img 
                    src={sanitizeImageUrl(profile?.avatar_url)} 
                    alt={profile?.full_name || 'Profile'} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-8 h-8 text-orange-500" />
                )}
              </div>

              <div className="min-w-0 space-y-0.5">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">{profile?.full_name || 'User Profile'}</h1>
                <p className="text-xs font-semibold text-orange-600 truncate">@{profile?.username || user.email?.split('@')[0]}</p>
                
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {profile?.roles?.map((role: string) => (
                    <span 
                      key={role}
                      className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                        role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : role === 'MASTER'
                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
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
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" /> 
              <span>Edit</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <Mail className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">{profile?.email || user.email}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="truncate">{profile?.city || 'City'}, {profile?.state || 'State'}</span>
            </div>
          </div>

        </div>

        {/* PROFILE OPTIONS CARD (SETTINGS, HELP, ABOUT) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">
            Account & Support
          </h2>

          <div className="space-y-1.5">
            <Link
              href="/settings"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 text-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
            </Link>

            <Link
              href="/help"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 text-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
            </Link>

            <Link
              href="/about"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 text-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                  <Info className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">About BatScore</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
            </Link>
          </div>
        </div>

      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}
