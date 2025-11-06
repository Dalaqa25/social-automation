import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    // Get an authenticated user (server-side verified)
    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp?.user || null;

    if (!user) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Check if user has YouTube tokens (use admin to bypass RLS)
    const { data, error } = await admin
      .from('youtube_tokens')
      .select('channel_id, channel_name, refresh_token')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Consider user connected if a token record exists.
    // If refresh token is missing, flag that a reconnect is required.
    const hasRefresh = !!data.refresh_token;
    return NextResponse.json({
      connected: hasRefresh,
      reason: hasRefresh ? undefined : 'missing_refresh',
      channel_id: data.channel_id,
      channel_name: data.channel_name,
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

