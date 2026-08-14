import React from 'react';
import { createClient } from '@/lib/supabase/server';
import UserManagementTable from './UserManagementTable';

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
      <UserManagementTable profiles={profilesWithRoles} />
    </div>
  );
}
