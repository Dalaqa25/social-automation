import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase helpers. Do NOT import this in client components.

const serverUrl = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverAnonKey = process.env.SUPABASE_ANON_PUBLIC_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!serverUrl) {
  throw new Error('Missing SUPABASE_PROJECT_URL (or NEXT_PUBLIC_SUPABASE_URL).');
}
if (!serverAnonKey) {
  throw new Error('Missing SUPABASE_ANON_PUBLIC_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).');
}

export function getSupabaseServerClient(): SupabaseClient {
  return createClient(serverUrl as string, serverAnonKey as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!serviceRoleKey) {
    throw new Error('Missing SERVICE_ROLE_KEY for admin client.');
  }
  return createClient(serverUrl as string, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export type { SupabaseClient };


