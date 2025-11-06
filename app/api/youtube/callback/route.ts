import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('youtube_oauth_state')?.value;
    const userId = cookieStore.get('youtube_oauth_user_id')?.value;

    if (!state || !storedState || state !== storedState) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User session expired. Please try again.' }, { status: 401 });
    }

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);

    // Fetch channel info from YouTube
    const channelRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const channelData = await channelRes.json();
    const channel = channelData?.items?.[0]?.snippet || {};
    const channelId = channelData?.items?.[0]?.id || null;

    // Get Supabase clients
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    
    // Try to get user from session first (preferred method)
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    // Use session user if available, otherwise fall back to userId from cookie
    // (We trust the userId cookie because we verified authentication in authorize route)
    const user = sessionUser || { id: userId, email: null };

    // If we don't have a session user, we need to fetch email from database
    let userEmail = sessionUser?.email;
    if (!userEmail) {
      const { data: tokenData } = await admin
        .from('youtube_tokens')
        .select('email')
        .eq('user_id', userId)
        .single();
      userEmail = tokenData?.email || null;
    }

    // Check if record exists to preserve created_at
    const { data: existing } = await admin
      .from('youtube_tokens')
      .select('created_at')
      .eq('user_id', userId)
      .single();

    const now = new Date().toISOString();
    
    // Insert or update tokens in Supabase without relying on a unique constraint
    // Some environments may not have a unique index on user_id, so we perform
    // a delete-then-insert to emulate an upsert safely.
    const { error: deleteError } = await admin
      .from('youtube_tokens')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
    }

    const { error } = await admin.from('youtube_tokens').insert({
      user_id: userId,
      email: userEmail,
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate.toISOString(),
      channel_id: channelId,
      channel_name: channel.title || null,
      created_at: existing?.created_at || now,
      updated_at: now,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save tokens' }, { status: 500 });
    }

    // Clear OAuth cookies
    cookieStore.delete('youtube_oauth_state');
    cookieStore.delete('youtube_oauth_user_id');

    // Redirect back to home; the UI will reflect connected status and disable the button
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?connected=youtube`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
