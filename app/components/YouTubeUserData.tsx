'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface YouTubeUserData {
  access_token: string | null;
  refresh_token: string | null;
  channel_id: string | null;
  channel_name: string | null;
}

export default function YouTubeUserData() {
  const supabase = getSupabaseBrowserClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<YouTubeUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async (session: Session | null) => {
      if (!session || !mounted) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/youtube/user-data');
        const result = await response.json();

        if (!response.ok) {
          if (result.error === 'not_authenticated') {
            setError('Not authenticated');
          } else if (result.error === 'no_tokens_found') {
            setError('No YouTube tokens found');
          } else {
            setError(result.message || 'Failed to fetch data');
          }
          setData(null);
          return;
        }

        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch YouTube data');
          setData(null);
          console.error('Error fetching YouTube data:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthenticated(!!session);
      if (session) {
        await fetchData(session);
      } else {
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        setIsAuthenticated(!!session);
        if (session) {
          await fetchData(session);
        } else {
          setData(null);
          setLoading(false);
        }
      }
    );

    sync();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (isAuthenticated === null || loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && !data) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-purple-200 bg-white/70 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">YouTube Account Data</h3>
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium text-gray-600">Channel Name:</span>{' '}
          <span className="text-gray-800">{data.channel_name || 'N/A'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Channel ID:</span>{' '}
          <span className="text-gray-800 font-mono">{data.channel_id || 'N/A'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Access Token:</span>{' '}
          <span className="text-gray-800 font-mono text-[10px] break-all">
            {data.access_token ? `${data.access_token.substring(0, 20)}...` : 'N/A'}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Refresh Token:</span>{' '}
          <span className="text-gray-800 font-mono text-[10px] break-all">
            {data.refresh_token ? `${data.refresh_token.substring(0, 20)}...` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

