import { cache } from 'react';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';

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

export const getUserAndProfile = cache(async function getUserAndProfile(): Promise<{
  user: any;
  role: 'ADMIN' | 'MASTER' | 'USER';
  profile: UserProfile | null;
}> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, role: 'USER', profile: null };

  let db: any = supabase;
  try { db = createAdminClient(); } catch {}

  const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@batscore.com').toLowerCase();
  const userEmail = (user.email || '').toLowerCase();
  const isAdminEmail = (
    userEmail === configuredAdminEmail ||
    userEmail === 'superadmin@batscore.com' ||
    userEmail === 'admin@batscore.com'
  );

  const [profileResult, userRolesResult, appResult] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    db.from('user_roles').select('roles(name)').eq('user_id', user.id),
    db.from('master_applications').select('status').eq('user_id', user.id).eq('status', 'APPROVED').limit(1).maybeSingle()
  ]);

  const profileData = profileResult.data || null;
  const meta = user.user_metadata || {};
  const emailName = userEmail ? userEmail.split('@')[0] : '';
  const fullName = profileData?.full_name || meta.full_name || meta.name || emailName || 'User';
  const username = profileData?.username || meta.username || emailName || 'user';
  const avatarUrl = profileData?.avatar_url || meta.avatar_url || meta.picture || null;

  const roles: string[] = userRolesResult.data
    ? userRolesResult.data.map((ur: any) => ur.roles?.name).filter(Boolean)
    : [];
  const profileRole = profileData?.role;
  const isApprovedMaster = !!appResult.data || profileRole === 'MASTER' || roles.includes('MASTER');

  let role: 'ADMIN' | 'MASTER' | 'USER' = 'USER';
  if (roles.includes('ADMIN') || isAdminEmail || profileRole === 'ADMIN') role = 'ADMIN';
  else if (isApprovedMaster) role = 'MASTER';

  const allRoles = Array.from(new Set([
    ...(roles || []),
    ...(profileRole ? [profileRole] : []),
    ...(isApprovedMaster ? ['MASTER'] : [])
  ])).filter(Boolean);

  const fullProfile: UserProfile = {
    ...(profileData || {}),
    id: user.id,
    email: profileData?.email || userEmail,
    full_name: fullName,
    username: username,
    avatar_url: avatarUrl,
    bio: profileData?.bio || meta.bio || '',
    phone: profileData?.phone || meta.phone || '',
    city: profileData?.city || meta.city || 'City',
    state: profileData?.state || meta.state || 'State',
    created_at: profileData?.created_at || user.created_at || new Date().toISOString(),
    roles: allRoles.length ? allRoles : ['USER']
  };

  return { user, role, profile: fullProfile };
});

export const getCurrentUserProfile = cache(async function getCurrentUserProfile(existingUser?: any): Promise<UserProfile | null> {
  if (!existingUser) {
    const { profile } = await getUserAndProfile();
    return profile;
  }
  const { profile } = await getUserAndProfile();
  return profile;
});

export async function getUserRole(): Promise<'ADMIN' | 'MASTER' | 'USER'> {
  const { role } = await getUserAndRole();
  return role;
}

export const getUserAndRole = cache(async function getUserAndRole(): Promise<{ user: any; role: 'ADMIN' | 'MASTER' | 'USER' }> {
  const { user, role } = await getUserAndProfile();
  return { user, role };
});

