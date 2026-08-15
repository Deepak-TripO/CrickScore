import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://tpnjvhiweqletwwvokcy.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbmp2aGl3ZXFsZXR3d3Zva2N5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjEwMTAwNSwiZXhwIjoyMTAxNjc3MDA1fQ.84RzEwuqh2GmeMeKpIfj3S417Niu_Zox0bcB_sCMG28';

const formatUrl = (raw?: string) => (raw || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
const formatKey = (raw?: string, fallback?: string) => (raw || fallback || '').trim();

export function createAdminClient() {
  const supabaseUrl = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = formatKey(process.env.SUPABASE_SERVICE_ROLE_KEY, DEFAULT_SERVICE_ROLE_KEY);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
