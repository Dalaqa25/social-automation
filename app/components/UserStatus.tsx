'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function UserStatus() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
    });

    sync();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) return null;
  if (!email) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-700 shadow-sm">
      <span className="truncate">Signed in as <strong>{email}</strong></span>
      <button
        onClick={handleSignOut}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
      >
        Sign out
      </button>
    </div>
  );
}


