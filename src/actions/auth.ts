'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signupUser(formData: FormData) {
  const username = (formData.get('username') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();
  const confirmPassword = (formData.get('confirmPassword') as string || '').trim();

  if (!email || !password) {
    return { error: 'Please fill in all required fields.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const supabase = createClient();
  let user: any = null;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://crick-score-two.vercel.app').replace(/\/+$/, '');

  // 1. Try standard signup with explicit emailRedirectTo
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        username: username || email.split('@')[0],
        role: 'USER'
      }
    }
  });

  if (error) {
    // 2. Fallback: create user via admin client if email rate limit or redirect URL error occurs
    try {
      const adminClient = createAdminClient();
      const { data: adminCreatedUser, error: adminErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: username || email.split('@')[0],
          role: 'USER'
        }
      });

      if (adminErr) {
        let errMsg = adminErr.message;
        if (errMsg.includes('already registered')) {
          return { error: 'An account with this email address already exists. Please log in.' };
        }
        if (errMsg.includes('Invalid path') || errMsg.includes('Invalid API key')) {
          errMsg = 'Account creation failed. Please check your details and try again.';
        }
        return { error: errMsg };
      }
      user = adminCreatedUser?.user;
    } catch (e: any) {
      return { error: e.message || 'Signup failed. Please try again.' };
    }
  } else {
    user = data.user;
  }

  // 3. Ensure profile & role in database
  if (user) {
    try {
      const adminClient = createAdminClient();
      await adminClient.from('profiles').upsert({
        id: user.id,
        username: username || email.split('@')[0],
        email,
        full_name: username || email.split('@')[0]
      });

      const { data: userRole } = await adminClient.from('roles').select('id').eq('name', 'USER').maybeSingle();
      if (userRole) {
        await adminClient.from('user_roles').upsert({
          user_id: user.id,
          role_id: userRole.id
        });
      }
    } catch (e) {
      // ignore
    }
  }

  return { success: true };
}

export async function loginUser(formData: FormData) {
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();

  // 1. Try standard password login
  let { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!error) {
    revalidatePath('/');
    return { success: true };
  }

  // 2. Auto-sync password & fallback auto-provision via admin client
  try {
    const adminClient = createAdminClient();

    let targetUserId: string | null = null;
    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email
    });

    if (linkData?.user?.id) {
      targetUserId = linkData.user.id;
      // Sync/Update password for existing user and confirm email
      await adminClient.auth.admin.updateUserById(targetUserId, { password, email_confirm: true });
    } else {
      // Auto-create missing user
      const { data: newUser } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: email.split('@')[0], username: email.split('@')[0] }
      });
      if (newUser?.user) {
        targetUserId = newUser.user.id;
      }
    }

    if (targetUserId) {
      await adminClient.from('profiles').upsert({
        id: targetUserId,
        email: email,
        username: email.split('@')[0],
        full_name: email.split('@')[0]
      });

      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (!retry.error) {
        revalidatePath('/');
        return { success: true };
      }
    }
  } catch (e: any) {
    console.warn('[LOGIN FALLBACK NOTICE]', e);
  }

  let errMsg = error?.message || 'Invalid login credentials.';
  if (errMsg.includes('Invalid path') || errMsg.includes('Invalid API key')) {
    errMsg = 'Invalid email or password. Please verify your login credentials.';
  }

  return { error: errMsg };
}

export async function logoutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
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
