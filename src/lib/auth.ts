import { createClient } from './supabase/server';

export interface UserProfile {
  id: string;
  full_name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  state?: string;
  created_at: string;
  roles: string[];
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentUserProfile(existingUser?: any): Promise<UserProfile | null> {
  const user = existingUser || await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  
  // Fetch profile and roles in parallel
  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
  ]);

  if (profileResult.error || !profileResult.data) return null;

  const roles = rolesResult.data
    ? rolesResult.data.map((ur: any) => ur.roles?.name).filter(Boolean)
    : ['USER'];

  return {
    ...profileResult.data,
    roles
  };
}

export async function getUserRole(): Promise<'ADMIN' | 'MASTER' | 'USER'> {
  const { role } = await getUserAndRole();
  return role;
}

/**
 * Combined helper: fetches user + role in minimal DB calls.
 * Use this instead of separate getCurrentUser() + getUserRole() calls.
 */
export async function getUserAndRole(): Promise<{ user: any; role: 'ADMIN' | 'MASTER' | 'USER' }> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, role: 'USER' };

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@batscore.com').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const isAdminEmail = (
    userEmail === configuredAdminEmail ||
    userEmail === 'superadmin@batscore.com' ||
    userEmail === 'admin@batscore.com'
  );

  const [userRolesResult, appResult] = await Promise.all([
    supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id),
    supabase
      .from('master_applications')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'APPROVED')
      .limit(1)
      .maybeSingle()
  ]);

  const roles = userRolesResult.data ? userRolesResult.data.map((ur: any) => ur.roles?.name).filter(Boolean) : [];
  const isApprovedMaster = !!appResult.data;

  let role: 'ADMIN' | 'MASTER' | 'USER' = 'USER';
  if (roles.includes('ADMIN') || isAdminEmail) role = 'ADMIN';
  else if (roles.includes('MASTER') || isApprovedMaster) role = 'MASTER';

  return { user, role };
}
