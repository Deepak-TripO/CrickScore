import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import UserManagementTable from './UserManagementTable';
import { Users } from 'lucide-react';

export default async function AdminUsersPage() {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  // Fetch all registered user profiles directly from database using service role client
  const { data: rawProfiles } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch user roles mapping from database
  const { data: userRoles } = await db
    .from('user_roles')
    .select('user_id, roles(name)');

  const roleMap: Record<string, string[]> = {};
  if (userRoles) {
    userRoles.forEach((ur: any) => {
      if (!roleMap[ur.user_id]) roleMap[ur.user_id] = [];
      if (ur.roles?.name) roleMap[ur.user_id].push(ur.roles.name);
    });
  }

  // Deduplicate and resolve unique profiles with actual database roles (USER / MASTER / ADMIN)
  const profilesWithRoles = (rawProfiles || []).map((p: any) => {
    const roles = roleMap[p.id] && roleMap[p.id].length > 0 ? roleMap[p.id] : ['USER'];
    return {
      ...p,
      roles
    };
  });

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-400" />
            Registered Users Management ({profilesWithRoles.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time database records of all registered Normal Users and Master Users.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Users</span>
            <span className="text-lg font-black text-purple-400 font-mono">{profilesWithRoles.length}</span>
          </div>
        </div>
      </div>

      <UserManagementTable profiles={profilesWithRoles} />
    </div>
  );
}
