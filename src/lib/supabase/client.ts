import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://tpnjvhiweqletwwvokcy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbmp2aGl3ZXFsZXR3d3Zva2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDEwMDUsImV4cCI6MjEwMTY3NzAwNX0.KwXJb-tR3F140_ezMPI_UQB2fL7aEsdgMsWIzt1kl8o';

const formatUrl = (raw?: string) => (raw || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
const formatKey = (raw?: string, fallback?: string) => (raw || fallback || '').trim();

export function createClient() {
  const url = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = formatKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

  return createBrowserClient(url, key);
}
