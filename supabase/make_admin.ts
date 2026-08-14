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
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx supabase/make_admin.ts <your-email>');
    process.exit(1);
  }

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData?.users.find(u => u.email === email);

  if (!user) {
    console.error(`User with email "${email}" not found in auth.users. Please sign up on http://localhost:3000/signup first!`);
    process.exit(1);
  }

  const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'ADMIN').single();
  if (adminRole) {
    await supabase.from('user_roles').upsert({
      user_id: user.id,
      role_id: adminRole.id
    });
    console.log(`\n🎉 SUCCESS! Granted ADMIN role to ${email}.`);
  }
}

main().catch(console.error);
