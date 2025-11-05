import { NextResponse } from 'next/server';

// Minimal health check to validate Supabase credentials by hitting an Auth endpoint
export async function GET() {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_PUBLIC_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing SUPABASE env vars' },
      { status: 500 }
    );
  }

  try {
    const keyToTest = serviceKey || anonKey;
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: keyToTest,
        Authorization: `Bearer ${keyToTest}`,
      },
      cache: 'no-store',
    });

    const ok = res.ok;
    const detail = ok ? 'connected' : `status ${res.status}`;
    return NextResponse.json({ ok, detail });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}


