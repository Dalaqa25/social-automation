import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getValidYouTubeAccessToken } from '@/lib/youtube/token';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    try {
      const { accessToken, updated } = await getValidYouTubeAccessToken(user.id);
      return NextResponse.json({ access_token: accessToken, refreshed: updated });
    } catch (e: any) {
      if (e?.message === 'missing_refresh_token') {
        return NextResponse.json({ error: 'missing_refresh_token', message: 'Reconnect your YouTube account.' }, { status: 401 });
      }
      if (e?.message === 'refresh_failed') {
        return NextResponse.json({ error: 'refresh_failed', message: 'Token refresh failed. Reconnect may be required.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'unknown', message: String(e?.message || e) }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'server_error', message: String(err) }, { status: 500 });
  }
}


