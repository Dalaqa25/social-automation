'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Completing sign-in…');
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const run = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      if (session) {
        setStatus('Signed in! Redirecting…');
        router.replace('/');
      } else {
        setStatus('No session found.');
      }
    };
    run();
  }, [router, supabase]);

  return <p>{status}</p>;
}


