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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);
const anonClient = createClient(supabaseUrl, anonKey);

async function main() {
  console.log('--- TESTING SERVICE ROLE KEY vs ANON KEY ---');

  console.log('1. Testing master_applications with ADMIN CLIENT:');
  const res1 = await adminClient.from('master_applications').select('*').limit(1);
  console.log('Admin res:', res1.error ? res1.error.message : `Success (${res1.data?.length} rows)`);

  console.log('2. Testing master_applications with ANON CLIENT:');
  const res2 = await anonClient.from('master_applications').select('*').limit(1);
  console.log('Anon res:', res2.error ? res2.error.message : `Success (${res2.data?.length} rows)`);
}

main().catch(console.error);
