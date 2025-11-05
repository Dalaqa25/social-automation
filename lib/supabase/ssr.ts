import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client that persists auth via Next.js cookies
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const anyStore = cookieStore as any;
  const hasGet = typeof anyStore?.get === 'function';
  const hasSet = typeof anyStore?.set === 'function';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return hasGet ? anyStore.get(name)?.value : undefined;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          if (hasSet) {
            anyStore.set({ name, value, ...options });
          }
        } catch {
          // no-op in read-only render contexts
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          if (hasSet) {
            anyStore.set({ name, value: '', ...options, maxAge: 0 });
          }
        } catch {
          // no-op in read-only render contexts
        }
      },
    },
  });
}


