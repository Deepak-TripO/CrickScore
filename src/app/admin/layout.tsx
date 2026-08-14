import React from 'react';
import { getUserAndRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role: userRole } = await getUserAndRole();

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@batscore.com').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isAdminEmail = (
    userEmail === configuredAdminEmail ||
    userEmail === 'superadmin@batscore.com' ||
    userEmail === 'admin@batscore.com'
  );

  const isAuthorizedAdmin = userRole === 'ADMIN' || isAdminEmail;

  if (!user || !isAuthorizedAdmin) {
    if (userRole === 'MASTER') {
      redirect('/master/dashboard');
    }
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row selection:bg-purple-600 selection:text-white">
      <AdminSidebar user={user} />
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 overflow-x-hidden pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
