import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    // Fetch YouTube token data for the user
    const { data, error } = await admin
      .from('youtube_tokens')
      .select('access_token, refresh_token, channel_id, channel_name')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        error: 'no_tokens_found',
        message: 'No YouTube tokens found for this user' 
      }, { status: 404 });
    }

    return NextResponse.json({
      access_token: data.access_token,
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

