import React from 'react';
import { createClient } from '@/lib/supabase/server';
import UserManagementTable from './UserManagementTable';
import { Users } from 'lucide-react';

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
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-purple-400" />
          Registered Users Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search registered accounts, view profiles, and manage system roles.
        </p>
      </div>

      <UserManagementTable profiles={profilesWithRoles} />
    </div>
  );
}
