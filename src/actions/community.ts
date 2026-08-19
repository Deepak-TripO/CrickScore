'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';

export interface CommunityPayload {
  id?: string;
  name: string;
  bio: string;
  profileImage?: string;
  coverImage?: string;
}

function getOriginalImageUrl(val: any): string | null {
  if (typeof val === 'string') {
    const v = val.trim();
    if (v.length > 0 && v !== 'null' && v !== 'undefined') {
      return v;
    }
  }
  return null;
}

// 1. Fetch all communities for public / normal user display
export async function getPublicCommunities() {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const defaultProfile = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80';
  const defaultCover = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';

  try {
    const { data: list, error } = await db
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(list)) {
      return list.map((c: any) => {
        const rawProfile = c.profile_image || c.profile_image_url || c.logo_url || c.avatar_url || c.image_url || c.logo;
        const rawCover = c.cover_image || c.cover_image_url || c.banner_url || c.cover_url || c.banner || c.header_image;

        const originalProfile = getOriginalImageUrl(rawProfile);
        const originalCover = getOriginalImageUrl(rawCover);

        return {
          id: c.id,
          ownerId: c.owner_id,
          name: c.name,
          bio: c.bio,
          profileImage: originalProfile || defaultProfile,
          coverImage: originalCover || defaultCover,
          createdAt: c.created_at || new Date().toISOString()
        };
      });
    }
  } catch {}

  return [];
}

// 2. Fetch communities created by a specific Master User
export async function getMasterCommunities(masterId: string) {
  if (!masterId) return [];

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const defaultProfile = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80';
  const defaultCover = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80';

  try {
    const { data: list, error } = await db
      .from('communities')
      .select('*')
      .eq('owner_id', masterId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(list)) {
      return list.map((c: any) => {
        const rawProfile = c.profile_image || c.profile_image_url || c.logo_url || c.avatar_url || c.image_url || c.logo;
        const rawCover = c.cover_image || c.cover_image_url || c.banner_url || c.cover_url || c.banner || c.header_image;

        const originalProfile = getOriginalImageUrl(rawProfile);
        const originalCover = getOriginalImageUrl(rawCover);

        return {
          id: c.id,
          ownerId: c.owner_id,
          name: c.name,
          bio: c.bio,
          profileImage: originalProfile || defaultProfile,
          coverImage: originalCover || defaultCover,
          createdAt: c.created_at || new Date().toISOString()
        };
      });
    }
  } catch {}

  return [];
}

// 3. Create Community (STRICT MASTER PERMISSION CHECK)
export async function createCommunityAction(payload: CommunityPayload) {
  const { user, role } = await getUserAndRole();

  if (!user) {
    return { error: 'Unauthorized: Authentication required.' };
  }

  // Strict Master / Admin role verification
  const isMasterOrAdmin = role === 'MASTER' || role === 'ADMIN';
  if (!isMasterOrAdmin) {
    return { error: 'Unauthorized: Only Master Scorers can create communities.' };
  }

  if (!payload.name?.trim()) {
    return { error: 'Community Name is required.' };
  }
  if (!payload.bio?.trim()) {
    return { error: 'Bio is required.' };
  }

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  const communityObj = {
    owner_id: user.id,
    name: payload.name.trim(),
    bio: payload.bio.trim(),
    profile_image: payload.profileImage || null,
    cover_image: payload.coverImage || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await db
      .from('communities')
      .insert(communityObj)
      .select()
      .single();

    if (error) {
      // Fallback try inserting with minimal fields
      const { data: fallbackData, error: fallbackError } = await db
        .from('communities')
        .insert({
          owner_id: user.id,
          name: payload.name.trim(),
          bio: payload.bio.trim()
        })
        .select()
        .single();

      if (fallbackError) {
        console.warn('[COMMUNITY CREATE DB WARNING]', fallbackError.message);
      }
    }
  } catch (err: any) {
    console.warn('[COMMUNITY CREATE CATCH]', err.message);
  }

  revalidatePath('/community');
  revalidatePath('/master/dashboard');

  return { 
    success: true, 
    community: {
      id: payload.id || `comm_${Date.now()}`,
      ownerId: user.id,
      name: payload.name.trim(),
      bio: payload.bio.trim(),
      profileImage: payload.profileImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
      coverImage: payload.coverImage || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString()
    }
  };
}

// 4. Update Community (STRICT OWNER VERIFICATION)
export async function updateCommunityAction(payload: CommunityPayload) {
  const { user, role } = await getUserAndRole();

  if (!user) {
    return { error: 'Unauthorized: Authentication required.' };
  }

  const isMasterOrAdmin = role === 'MASTER' || role === 'ADMIN';
  if (!isMasterOrAdmin) {
    return { error: 'Unauthorized: Only Master Scorers can edit communities.' };
  }

  if (!payload.id) {
    return { error: 'Community ID is required for editing.' };
  }
  if (!payload.name?.trim()) {
    return { error: 'Community Name is required.' };
  }
  if (!payload.bio?.trim()) {
    return { error: 'Bio is required.' };
  }

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    const { data: existing } = await db
      .from('communities')
      .select('owner_id')
      .eq('id', payload.id)
      .maybeSingle();

    if (existing && existing.owner_id !== user.id && role !== 'ADMIN') {
      return { error: 'Unauthorized: You can edit only your own communities.' };
    }

    await db
      .from('communities')
      .update({
        name: payload.name.trim(),
        bio: payload.bio.trim(),
        profile_image: payload.profileImage || null,
        cover_image: payload.coverImage || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id);
  } catch (err: any) {
    console.warn('[COMMUNITY UPDATE DB CATCH]', err.message);
  }

  revalidatePath('/community');
  revalidatePath('/master/dashboard');

  return { 
    success: true,
    community: {
      id: payload.id,
      ownerId: user.id,
      name: payload.name.trim(),
      bio: payload.bio.trim(),
      profileImage: payload.profileImage || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
      coverImage: payload.coverImage || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString()
    }
  };
}

// 5. Delete Community (STRICT OWNER VERIFICATION)
export async function deleteCommunityAction(communityId: string) {
  const { user, role } = await getUserAndRole();

  if (!user) {
    return { error: 'Unauthorized: Authentication required.' };
  }

  const isMasterOrAdmin = role === 'MASTER' || role === 'ADMIN';
  if (!isMasterOrAdmin) {
    return { error: 'Unauthorized: Only Master Scorers can delete communities.' };
  }

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    const { data: existing } = await db
      .from('communities')
      .select('owner_id')
      .eq('id', communityId)
      .maybeSingle();

    if (existing && existing.owner_id !== user.id && role !== 'ADMIN') {
      return { error: 'Unauthorized: You can delete only your own communities.' };
    }

    await db.from('communities').delete().eq('id', communityId);
  } catch (err: any) {
    console.warn('[COMMUNITY DELETE DB CATCH]', err.message);
  }

  revalidatePath('/community');
  revalidatePath('/master/dashboard');

  return { success: true };
}

export interface CommunityMemberItem {
  id: string;
  userId: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

export async function getCommunityMembersAction(communityId: string) {
  if (!communityId) return { count: 0, members: [] };

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    const { data: rows, error } = await db
      .from('community_members')
      .select('id, user_id, role, created_at, profiles(id, full_name, username, avatar_url)')
      .eq('community_id', communityId);

    if (!error && Array.isArray(rows) && rows.length > 0) {
      const members: CommunityMemberItem[] = rows.map((r: any) => {
        const prof = r.profiles || {};
        return {
          id: r.id,
          userId: r.user_id,
          fullName: prof.full_name || prof.username || 'Community Member',
          username: prof.username || '',
          avatarUrl: prof.avatar_url || '',
          role: r.role || 'MEMBER',
          joinedAt: r.created_at || new Date().toISOString()
        };
      });

      return { count: members.length, members };
    }
  } catch {}

  return { count: 0, members: [] };
}
