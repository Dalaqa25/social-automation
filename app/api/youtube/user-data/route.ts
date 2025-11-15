import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getValidYouTubeAccessToken } from '@/lib/youtube/token';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    // Get valid (refreshed if needed) access token
    let accessToken: string;
    try {
      const tokenResult = await getValidYouTubeAccessToken(user.id);
      accessToken = tokenResult.accessToken;
    } catch (tokenError: any) {
      if (tokenError?.message === 'No YouTube tokens found for user' || tokenError?.message === 'missing_refresh_token') {
        return NextResponse.json({ 
          error: 'no_tokens_found',
          message: 'No YouTube tokens found for this user' 
        }, { status: 404 });
      }
      if (tokenError?.message === 'refresh_failed') {
        console.error('Token refresh failed for user:', user.id);
        return NextResponse.json({ 
          error: 'refresh_failed',
          message: 'Failed to refresh YouTube token. Please reconnect your YouTube account.' 
        }, { status: 401 });
      }
      throw tokenError;
    }

    // Fetch channel info and refresh_token
    const { data, error } = await admin
      .from('youtube_tokens')
      .select('refresh_token, channel_id, channel_name')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        error: 'no_tokens_found',
        message: 'No YouTube tokens found for this user' 
      }, { status: 404 });
    }

    return NextResponse.json({
      access_token: accessToken, // Use the refreshed token
      refresh_token: data.refresh_token,
      channel_id: data.channel_id,
      channel_name: data.channel_name,
    });
  } catch (err) {
    console.error('User data fetch error:', err);
    return NextResponse.json({ 
      error: 'server_error', 
      message: String(err) 
    }, { status: 500 });
  }
}

