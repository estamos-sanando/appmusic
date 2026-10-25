import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. SERVER ONLY — bypasses RLS and column grants.
 * Used exclusively for reading/writing Spotify tokens and provisioning users.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() must never run in the browser');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
