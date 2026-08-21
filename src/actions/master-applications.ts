'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function submitMasterApplication(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to apply.' };
  }

  const adminClient = createAdminClient();

  const fullName = formData.get('fullName') as string;
  const organization = formData.get('organization') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;

  if (!fullName || !city || !state) {
    return { error: 'Please fill in all required fields.' };
  }

  // Check existing pending application
  try {
    const { data: existing, error: checkErr } = await adminClient
      .from('master_applications')
      .select('id, status, reviewed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkErr && checkErr.message?.includes('schema cache')) {
      return { 
        error: 'Database setup required: Please run the corrective migration (20260811000000_batscore_corrections.sql) in your Supabase SQL Editor to set up the master_applications table.' 
      };
    }

    if (existing) {
      if (existing.status === 'PENDING') {
        return { error: 'You already have a pending Master application under review.' };
      }
      if (existing.status === 'REJECTED') {
        const rejectionTime = new Date(existing.reviewed_at || existing.created_at).getTime();
        const now = Date.now();
        const diffHours = (now - rejectionTime) / (1000 * 60 * 60);
        if (diffHours < 24) {
          return { error: 'Your master application is rejected. Please try again after 24 hours.' };
        }
      }
    }
  } catch (e: any) {
    // continue
  }

  // Ensure profile exists for user.id to satisfy foreign key constraint
  try {
    await adminClient.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      full_name: fullName || user.user_metadata?.full_name || 'Cricket Fan',
      username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
      city: city || null,
      state: state || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) {}

  const { error } = await adminClient.from('master_applications').insert({
    user_id: user.id,
    full_name: fullName,
    organization,
    city,
    state,
    status: 'PENDING'
  });

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      return { 
        error: 'Database setup required: The master_applications table is not ready. Please run the SQL migrations in your Supabase SQL Editor.' 
      };
    }
    return { error: error.message };
  }

  // Create notification
  try {
    await adminClient.from('notifications').insert({
      user_id: user.id,
      title: 'Master Application Submitted',
      message: 'Your application to become a Master has been submitted and is pending Admin review.',
      type: 'INFO'
    });
  } catch (e) {}

  revalidatePath('/apply-master');
  return { success: true };
}

export async function reviewMasterApplication(
  applicationId: string,
  userId: string,
  action: 'APPROVE' | 'REJECT',
  rejectionReason?: string
) {
  const supabase = createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  if (action === 'APPROVE') {
    const { error: appError } = await adminClient
      .from('master_applications')
      .update({
        status: 'APPROVED',
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (appError) return { error: appError.message };

    // Update profile role to MASTER permanently
    await adminClient
      .from('profiles')
      .update({ role: 'MASTER', updated_at: new Date().toISOString() })
      .eq('id', userId);

    const { data: masterRole } = await adminClient
      .from('roles')
      .select('id')
      .eq('name', 'MASTER')
      .single();

    if (masterRole) {
      await adminClient
        .from('user_roles')
        .upsert(
          { user_id: userId, role_id: masterRole.id },
          { onConflict: 'user_id,role_id' }
        );
    }

    await adminClient.from('notifications').insert({
      user_id: userId,
      title: 'Master Status Approved!',
      message: 'Congratulations! Your application to become a BatScore Master has been approved.',
      type: 'SUCCESS'
    });
  } else {
    const { error: appError } = await adminClient
      .from('master_applications')
      .update({
        status: 'REJECTED',
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || 'Application did not meet requirements.'
      })
      .eq('id', applicationId);

    if (appError) return { error: appError.message };

    await adminClient
      .from('profiles')
      .update({ role: 'USER', updated_at: new Date().toISOString() })
      .eq('id', userId);

    await adminClient.from('notifications').insert({
      user_id: userId,
      title: 'Master Application Update',
      message: `Your application to become a Master was not approved.`,
      type: 'WARNING'
    });
  }

  revalidatePath('/admin/master-applications');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/masters');
  revalidatePath('/admin/users');
  revalidatePath('/apply-master');
  revalidatePath('/master/dashboard');
  revalidatePath('/');
  return { success: true };
}
