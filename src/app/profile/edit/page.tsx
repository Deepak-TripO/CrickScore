import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import EditProfileForm from './EditProfileForm';
import { getUserAndRole, getCurrentUserProfile } from '@/lib/auth';

export default async function EditProfilePage() {
  const { user, role: userRole } = await getUserAndRole();
  if (!user) redirect('/login');

  const profile = await getCurrentUserProfile(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-black tracking-tight text-center text-slate-900">Edit Profile</h1>
        <EditProfileForm profile={profile} />
      </div>
    </div>
  );
}
