"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ConnectYouTubeButton() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Check YouTube connection status
  const checkConnectionStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/youtube/status', { cache: 'no-store' });
      const data = await res.json();
      setIsConnected(data.connected === true);
      setWarning(data?.reason === 'missing_refresh' ? 'Your YouTube session needs reconnection. Please reconnect.' : null);
    } catch (err) {
      console.error('Failed to check connection status:', err);
      setIsConnected(false);
      setWarning(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setIsAuthed(!!session);
        if (session) {
          await checkConnectionStatus();
        } else {
          setIsConnected(false);
        }
        setIsChecking(false);
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_evt: any, session: any) => {
      (async () => {
        if (!mounted) return;
        setIsAuthed(!!session);
        if (session) {
          await checkConnectionStatus();
        } else {
          setIsConnected(false);
          setIsChecking(false);
        }
      })();
    });
    sync();
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, checkConnectionStatus]);

  const disabled = isChecking || !isAuthed || isConnected === true || isLoading;

  async function handleClick() {
    if (disabled) return;
    
    setIsLoading(true);
    try {
      // Redirect to authorize endpoint which will handle OAuth flow
      window.location.href = '/api/youtube/authorize';
    } catch (error) {
      console.error('Failed to initiate YouTube connection:', error);
      setIsLoading(false);
    }
  }

  const buttonText = isConnected
    ? "YouTube Connected"
    : (isLoading || isChecking)
    ? "Checking..."
    : "Connect your YouTube account";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        className={
          `inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-medium shadow-md transition duration-200 ease-out focus:outline-none focus:ring-2 ` +
          (disabled
            ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
            : "bg-gradient-to-r from-indigo-600 to-pink-600 text-white cursor-pointer hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:ring-indigo-500/70")
        }
        onClick={handleClick}
      >
        {isConnected ? (
        // Chain/check icon when connected
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="opacity-95">
          <path fill="currentColor" d="M7.778 14.121a3 3 0 0 1 0-4.242l2.829-2.829a3 3 0 1 1 4.243 4.243l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 1 0-1.414-1.414l-2.829 2.829a1 1 0 1 0 1.414 1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a3 3 0 0 1-4.243 0Z"/>
          <path fill="currentColor" d="M9.172 16.95a5 5 0 0 1 0-7.071l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a3 3 0 1 0 4.243 4.243l.707-.707a1 1 0 0 1 1.414 1.414l-.707.707a5 5 0 0 1-7.071 0Z"/>
        </svg>
        ) : (isLoading || isChecking) ? (
        // Small spinner while checking/connecting
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="opacity-95 animate-spin">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
        </svg>
        ) : (
        // YouTube logo when not connected / during connect
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" className="opacity-95">
          <path fill="#FF0000" d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.7 3 12 3 12 3s-6.7 0-8.7.4A4 4 0 0 0 .5 6.2 41.6 41.6 0 0 0 0 12c0 1.9.2 3.8.5 5.8a4 4 0 0 0 2.8 2.8C5.3 21 12 21 12 21s6.7 0 8.7-.4a4 4 0 0 0 2.8-2.8c.3-2 .5-3.9.5-5.8 0-1.9-.2-3.8-.5-5.8Z"/>
          <path fill="#fff" d="M10 15.5V8.5l6 3.5-6 3.5Z"/>
        </svg>
        )}
        {buttonText}
      </button>
      {!!warning && (
        <div className="text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded-md px-3 py-1">
          {warning}
        </div>
      )}
    </div>
  );
}


