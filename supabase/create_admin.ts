import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = process.argv[2] || 'admin@batscore.com';
  const password = process.argv[3] || 'AdminPassword123!';

  console.log(`Setting up Admin account for: ${email}...`);

  const { data: usersData } = await supabase.auth.admin.listUsers();
  let user = usersData?.users.find(u => u.email === email);

  if (!user) {
    // Try sign up
    const { data: created, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'BatScore Admin', username: 'admin_' + Date.now() } }
    });

    if (error || !created.user) {
      console.error('Signup error:', error?.message);
      return;
    }
    user = created.user;
  } else {
    // Update password
    await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  }

  // Ensure ADMIN role
  const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'ADMIN').single();
  if (adminRole && user) {
    await supabase.from('user_roles').upsert({
      user_id: user.id,
      role_id: adminRole.id
    });
    console.log('✓ ADMIN role assigned to user_roles successfully.');
  }

  console.log('\n=============================================');
  console.log('🎉 ADMIN CREDENTIALS READY');
  console.log('=============================================');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('=============================================\n');
}

main().catch(console.error);
