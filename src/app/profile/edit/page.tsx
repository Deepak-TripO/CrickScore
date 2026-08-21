import React from 'react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';
import EditProfileForm from './EditProfileForm';
import { getUserAndProfile } from '@/lib/auth';

export default async function EditProfilePage() {
  const { user, role: userRole, profile } = await getUserAndProfile();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-8">
        <EditProfileForm profile={profile} />
      </div>
    </div>
  );
}
