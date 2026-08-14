import React from 'react';
import { createClient } from '@/lib/supabase/server';
import UserManagementTable from './UserManagementTable';
import { Users, Award } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage() {
  const supabase = createClient();

  // Fetch all profiles
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch user roles mapping
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id, roles(name)');

  const roleMap: Record<string, string[]> = {};
  if (userRoles) {
    userRoles.forEach((ur: any) => {
      if (!roleMap[ur.user_id]) roleMap[ur.user_id] = [];
      if (ur.roles?.name) roleMap[ur.user_id].push(ur.roles.name);
    });
  }

  const profilesWithRoles = (rawProfiles || []).map((p: any) => ({
    ...p,
    roles: roleMap[p.id] && roleMap[p.id].length > 0 ? roleMap[p.id] : ['USER']
  }));

  return (
    <div className="space-y-6">
      {/* PAGE HEADER WITH SECTION TOGGLE NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            User & Team Management
          </h1>
        </div>

        {/* SECTION TOGGLE BUTTON / NAVIGATION CONTROL */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/admin/users"
            className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all"
          >
            <Users className="w-4 h-4" />
            Users
          </Link>
          <Link
            href="/admin/masters"
            className="flex-1 sm:flex-initial px-4 py-2 text-slate-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800/60 transition-all"
          >
            <Award className="w-4 h-4 text-purple-400" />
            Approved Masters
          </Link>
        </div>
      </div>

      <UserManagementTable profiles={profilesWithRoles} />
    </div>
  );
}
