'use client';

import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setIsAuthed(!!session);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (mounted) setIsAuthed(!!session);
    });
    sync();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (isAuthed === null) return null;
  if (isAuthed) return null;

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'http://localhost:3000/auth/callback' },
      });
    } finally {
      // Supabase will redirect away; this is a safety in case it doesn't
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      aria-label="Continue with Google"
      disabled={isLoading}
      className="group inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
   >
      {/* Google G logo */}
      <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 32.658 29.329 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.157 7.961 3.039l5.657-5.657C33.64 6.053 29.083 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.162-7.582 19.162-20 0-1.341-.138-2.641-.39-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.379 16.173 18.826 12 24 12c3.059 0 5.842 1.157 7.961 3.039l5.657-5.657C33.64 6.053 29.083 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.258 0 10.055-1.97 13.691-5.182l-6.316-5.346C29.329 36 25.094 38 24 38c-5.305 0-9.788-3.389-11.396-8.086l-6.52 5.027C9.39 39.63 16.159 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.357 3.658-5.497 8-11.303 8-5.305 0-9.788-3.389-11.396-8.086l-6.52 5.027C9.39 39.63 16.159 44 24 44c10.493 0 19.162-7.582 19.162-20 0-1.341-.138-2.641-.39-3.917z"/>
      </svg>
      <span className="transition-transform group-hover:translate-x-px">Continue with Google</span>
      {isLoading && (
        <svg className="ml-2 h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
    </button>
  );
}


