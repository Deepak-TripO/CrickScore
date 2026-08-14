'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, newRole: 'USER' | 'MASTER' | 'ADMIN') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify current user is ADMIN
  const adminClient = createAdminClient();
  const { data: userRoles } = await adminClient
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const roles = userRoles ? userRoles.map((ur: any) => ur.roles?.name) : [];
  if (!roles.includes('ADMIN')) {
    return { error: 'Only admins can change user roles.' };
  }

  // Get target role ID
  const { data: roleData, error: roleError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', newRole)
    .single();

  if (roleError || !roleData) {
    return { error: 'Invalid role specified.' };
  }

  // Delete existing roles for user and insert new role
  await adminClient.from('user_roles').delete().eq('user_id', userId);
  const { error: insertError } = await adminClient
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleData.id });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/masters');
  return { success: true };
}
