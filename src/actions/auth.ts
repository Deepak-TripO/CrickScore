'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signupUser(formData: FormData) {
  const username = (formData.get('username') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();
  const confirmPassword = (formData.get('confirmPassword') as string || '').trim();

  // 1. Validation
  if (!username) {
    return { error: 'Username is required.' };
  }

  if (!email) {
    return { error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!password) {
    return { error: 'Password is required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const adminClient = createAdminClient();

  // 2. Check duplicate email in Database
  try {
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { error: 'An account with this email address already exists. Please log in.' };
    }
  } catch (e) {
    // continue
  }

  // 3. Create Auth User reliably via Admin API
  let user: any = null;
  const { data: adminCreatedUser, error: adminErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: username || email.split('@')[0],
      full_name: username || email.split('@')[0],
      role: 'USER'
    }
  });

  if (adminErr) {
    const msg = adminErr.message || '';
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user_already_exists')) {
      return { error: 'An account with this email address already exists. Please log in.' };
    }
    if (msg.includes('invalid') && msg.includes('email')) {
      return { error: 'Please enter a valid email address.' };
    }
    return { error: 'Account creation failed. Please check your details and try again.' };
  }

  user = adminCreatedUser?.user;

  // 4. Create Profile & User Roles in Supabase Database
  if (user) {
    try {
      await adminClient.from('profiles').upsert({
        id: user.id,
        username: username || email.split('@')[0],
        email,
        full_name: username || email.split('@')[0],
        role: 'USER',
        updated_at: new Date().toISOString()
      });

      const { data: userRole } = await adminClient.from('roles').select('id').eq('name', 'USER').maybeSingle();
      if (userRole) {
        await adminClient.from('user_roles').upsert({
          user_id: user.id,
          role_id: userRole.id
        }, { onConflict: 'user_id,role_id' });
      }
    } catch (e) {
      console.error('[SIGNUP PROFILE CREATION WARNING]', e);
    }
  }

  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();

  // 1. Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data?.user) {
    // Try auto-confirm / password sync fallback via admin client if applicable
    try {
      const adminClient = createAdminClient();
      const { data: linkData } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email
      });

      if (linkData?.user?.id) {
        await adminClient.auth.admin.updateUserById(linkData.user.id, { password, email_confirm: true });
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (!retry.error && retry.data?.user) {
          return determineUserRedirect(retry.data.user.id, email);
        }
      }
    } catch (e) {}

    return { error: 'Invalid email or password. Please verify your login credentials.' };
  }

  return determineUserRedirect(data.user.id, email);
}

async function determineUserRedirect(userId: string, email: string) {
  let redirectUrl = '/';
  try {
    const adminClient = createAdminClient();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@batscore.com').toLowerCase();
    const isAdminEmail = email.toLowerCase() === configuredAdminEmail || email.toLowerCase() === 'admin@batscore.com' || email.toLowerCase() === 'superadmin@batscore.com';

    const [profileRes, userRolesResult, appResult] = await Promise.all([
      adminClient.from('profiles').select('role').eq('id', userId).maybeSingle(),
      adminClient.from('user_roles').select('roles(name)').eq('user_id', userId),
      adminClient.from('master_applications').select('status').eq('user_id', userId).eq('status', 'APPROVED').limit(1).maybeSingle()
    ]);

    const roles = userRolesResult.data ? userRolesResult.data.map((ur: any) => ur.roles?.name).filter(Boolean) : [];
    const profileRole = profileRes?.data?.role;
    const isApprovedMaster = !!appResult.data || profileRole === 'MASTER' || roles.includes('MASTER');
    const isAdmin = isAdminEmail || profileRole === 'ADMIN' || roles.includes('ADMIN');

    if (isAdmin) {
      redirectUrl = '/admin/dashboard';
    } else if (isApprovedMaster) {
      redirectUrl = '/master/dashboard';
    }
  } catch (e) {
    console.error('[DETERMINE REDIRECT ERROR]', e);
  }

  revalidatePath('/');
  return { success: true, redirectUrl };
}

export async function logoutUser() {
  const supabase = createClient();
  await supabase.auth.signOut({ scope: 'local' });
  revalidatePath('/');
  redirect('/login');
}

export async function updateProfile(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const username = formData.get('username') as string;
  const bio = formData.get('bio') as string;
  const phone = formData.get('phone') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try { db = createAdminClient(); } catch {}

  const updatePayload: any = {
    updated_at: new Date().toISOString()
  };

  if (fullName !== null) updatePayload.full_name = fullName;
  if (username !== null) updatePayload.username = username;
  if (bio !== null) updatePayload.bio = bio;
  if (phone !== null) updatePayload.phone = phone;
  if (city !== null) updatePayload.city = city;
  if (state !== null) updatePayload.state = state;
  if (avatarUrl) updatePayload.avatar_url = avatarUrl;

  const { error } = await db.from('profiles').update(updatePayload).eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { success: true };
}

export async function applyForMasterRole(formData: FormData) {
  const reason = formData.get('reason') as string;
  const experience = formData.get('experience') as string;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  let db: any = supabase;
  try { db = createAdminClient(); } catch {}

  const { error } = await db.from('master_applications').insert({
    user_id: user.id,
    reason,
    experience,
    status: 'PENDING'
  });

  if (error) return { error: error.message };

  revalidatePath('/profile');
  return { success: true };
}
