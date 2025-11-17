import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI!;
const SCOPE = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

export async function GET() {
  try {
    if (!CLIENT_ID || !REDIRECT_URI) {
      return NextResponse.json({ error: 'Missing Google OAuth environment variables' }, { status: 500 });
    }

    // Check authentication first
    const supabase = await createSupabaseServerClient();
    
    // Debug: Check what cookies are available
    const cookieDebug = await cookies();
    const allCookies = cookieDebug.getAll();
    const cookieNames = allCookies.map(c => c.name);
    console.log('Available cookies:', cookieNames);

    // Validate Supabase project ref vs cookie name to catch env mismatches
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const refMatch = supabaseUrl.match(/https?:\/\/([a-z0-9]{20,}).supabase.co/i);
      const projectRef = refMatch?.[1];
      if (projectRef) {
        const expectedCookieBase = `sb-${projectRef}-auth-token`;
        const hasSupabaseCookie = cookieNames.some((name) => {
          return name === expectedCookieBase || name.startsWith(`${expectedCookieBase}.`);
        });
        if (!hasSupabaseCookie) {
          console.error('Supabase cookie missing. Expected base:', expectedCookieBase, 'Found:', cookieNames);
        }
      }
    } catch {}

    // Server-verified user fetch (avoids session.user warning)
    const {
      data: { user: userData },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('GetUser error:', userError);
    }
    const user = userData || null;

    if (!user) {
      console.error('No authenticated user found');
      // Redirect with a more helpful message
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}?error=not_authenticated&message=Please sign in first using the Sign In button`);
    }

    // Create a signed state parameter with user_id to verify in callback
    const state = crypto
      .createHash('sha256')
      .update(`${user.id}:${Date.now()}`)
      .digest('hex')
      .substring(0, 32);

    // Store state in a secure httpOnly cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('youtube_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Also store user_id in a separate cookie for callback
    cookieStore.set('youtube_oauth_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPE);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error('Authorize error:', err);
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
  }
}