import React from 'react';
import Navbar from '@/components/navigation/Navbar';
import CreateMatchForm from './CreateMatchForm';
import { getUserAndRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CreateMatchPage() {
  const { user, role: userRole } = await getUserAndRole();

  if (userRole !== 'MASTER' && userRole !== 'ADMIN') redirect('/apply-master');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar user={user} userRole={userRole} />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create New Match</h1>
          <p className="text-xs text-slate-400">Configure team profile images, players, overs, and match category.</p>
        </div>

        <CreateMatchForm />
      </div>
    </div>
  );
}
