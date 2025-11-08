import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Browser/client-side Supabase instance with cookie sync for SSR
// Using @supabase/ssr ensures the auth session is mirrored into cookies
// so server Route Handlers can read it via cookies().
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, options: { maxAge?: number; path?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean } = {}) {
  if (typeof document === 'undefined') return;
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  parts.push(`SameSite=${options.sameSite ?? 'lax'}`);
  if (options.secure ?? (process.env.NODE_ENV === 'production')) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Ensure they are set in .env.local and restart dev server.');
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        get: (name: string) => getCookie(name),
        set: (name: string, value: string, options) => setCookie(name, value, { maxAge: options.maxAge, path: options.path, sameSite: (options.sameSite as any) ?? 'lax', secure: options.secure }),
        remove: (name: string, options) => setCookie(name, '', { maxAge: 0, path: options.path, sameSite: (options.sameSite as any) ?? 'lax', secure: options.secure }),
      },
    }) as unknown as SupabaseClient;
  }
  return browserClient;
}

export type { SupabaseClient };


