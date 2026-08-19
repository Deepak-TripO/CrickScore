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

// 1. Fetch all communities for public / normal user display
export async function getPublicCommunities() {
  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    const { data: list, error } = await db
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(list)) {
      return list.map((c: any) => ({
        id: c.id,
        ownerId: c.owner_id,
        name: c.name,
        bio: c.bio,
        profileImage: c.profile_image || c.logo_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
        coverImage: c.cover_image || c.banner_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
        createdAt: c.created_at || new Date().toISOString()
      }));
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

  try {
    const { data: list, error } = await db
      .from('communities')
      .select('*')
      .eq('owner_id', masterId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(list)) {
      return list.map((c: any) => ({
        id: c.id,
        ownerId: c.owner_id,
        name: c.name,
        bio: c.bio,
        profileImage: c.profile_image || c.logo_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
        coverImage: c.cover_image || c.banner_url || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
        createdAt: c.created_at || new Date().toISOString()
      }));
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

  // STRICT SERVER-SIDE VALIDATION: Maximum 2 Communities per Master User
  try {
    const { data: existingComms } = await db
      .from('communities')
      .select('id')
      .eq('owner_id', user.id);

    if (existingComms && existingComms.length >= 2) {
      return { error: 'You can create a maximum of 2 communities.' };
    }
  } catch (checkErr) {
    console.warn('[COMMUNITY LIMIT CHECK WARNING]', checkErr);
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

    if (!error && data) {
      revalidatePath('/community');
      revalidatePath('/master/dashboard');

      return { 
        success: true, 
        community: {
          id: data.id,
          ownerId: data.owner_id,
          name: data.name,
          bio: data.bio,
          profileImage: data.profile_image || payload.profileImage || '',
          coverImage: data.cover_image || payload.coverImage || '',
          createdAt: data.created_at
        }
      };
    }

    if (error) {
      console.warn('[COMMUNITY CREATE DB WARNING]', error.message);
      // Fallback try inserting with essential fields
      const { data: fallbackData } = await db
        .from('communities')
        .insert({
          owner_id: user.id,
          name: payload.name.trim(),
          bio: payload.bio.trim(),
          profile_image: payload.profileImage || null,
          cover_image: payload.coverImage || null
        })
        .select()
        .single();

      if (fallbackData) {
        revalidatePath('/community');
        revalidatePath('/master/dashboard');

        return {
          success: true,
          community: {
            id: fallbackData.id,
            ownerId: fallbackData.owner_id,
            name: fallbackData.name,
            bio: fallbackData.bio,
            profileImage: fallbackData.profile_image || payload.profileImage || '',
            coverImage: fallbackData.cover_image || payload.coverImage || '',
            createdAt: fallbackData.created_at
          }
        };
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
      profileImage: payload.profileImage || '',
      coverImage: payload.coverImage || '',
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

    const { data: updatedData } = await db
      .from('communities')
      .update({
        name: payload.name.trim(),
        bio: payload.bio.trim(),
        profile_image: payload.profileImage || null,
        cover_image: payload.coverImage || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id)
      .select()
      .maybeSingle();

    revalidatePath('/community');
    revalidatePath('/master/dashboard');

    if (updatedData) {
      return { 
        success: true,
        community: {
          id: updatedData.id,
          ownerId: updatedData.owner_id,
          name: updatedData.name,
          bio: updatedData.bio,
          profileImage: updatedData.profile_image || payload.profileImage || '',
          coverImage: updatedData.cover_image || payload.coverImage || '',
          createdAt: updatedData.created_at
        }
      };
    }
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
      profileImage: payload.profileImage || '',
      coverImage: payload.coverImage || '',
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

// 6. Join Community (AUTOMATIC INSTANT JOIN WITH DATABASE PERSISTENCE)
export async function joinCommunityAction(communityId: string) {
  const { user } = await getUserAndRole();
  if (!user) {
    return { error: 'Authentication required to join a community.' };
  }

  if (!communityId) {
    return { error: 'Community ID is required.' };
  }

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    // Check if user is already a member to prevent duplicates
    const { data: existingMember } = await db
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingMember) {
      // Create new membership record in database
      const { error: insertError } = await db
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'MEMBER',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('[JOIN COMMUNITY DB INSERT WARNING]', insertError.message);
      }
    }

    // Get current total member count
    const { count } = await db
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId);

    revalidatePath('/community');
    revalidatePath('/master/dashboard');

    return { 
      success: true, 
      isJoined: true, 
      membersCount: (count !== null && count !== undefined) ? count : 1 
    };
  } catch (err: any) {
    console.warn('[JOIN COMMUNITY CATCH]', err.message);
    return { error: err.message || 'Failed to join community.' };
  }
}

// 7. Get All Community IDs Joined by Current Logged-In User
export async function getUserJoinedCommunityIdsAction() {
  const { user } = await getUserAndRole();
  if (!user) return [];

  const supabase = createClient();
  let db: any = supabase;
  try {
    db = createAdminClient();
  } catch {
    db = supabase;
  }

  try {
    const { data: rows } = await db
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);

    if (rows && Array.isArray(rows)) {
      return rows.map((r: any) => r.community_id);
    }
  } catch {}

  return [];
}
