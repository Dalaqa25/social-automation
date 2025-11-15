import { getSupabaseAdminClient } from '@/lib/supabase/server';

type TokenRow = {
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expiry_date: string | null;
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function getValidYouTubeAccessToken(userId: string): Promise<{ accessToken: string; updated: boolean }>
{
  const admin = getSupabaseAdminClient();

  const { data: row, error } = await admin
    .from('youtube_tokens')
    .select('user_id, access_token, refresh_token, expiry_date')
    .eq('user_id', userId)
    .single();

  if (error || !row) {
    throw new Error('No YouTube tokens found for user');
  }

  if (!row.refresh_token) {
    throw new Error('missing_refresh_token');
  }

  const now = Date.now();
  const expiresAt = row.expiry_date ? new Date(row.expiry_date).getTime() : 0;
  const refreshThreshold = 2 * 60 * 1000; // 2 minutes
  
  // Explicitly check if token is expired (expiry_date < NOW)
  // Also refresh if token will expire within 2 minutes (proactive refresh)
  const isExpired = expiresAt > 0 && now >= expiresAt;
  const willExpireSoon = expiresAt > 0 && now >= (expiresAt - refreshThreshold);
  const hasNoExpiry = expiresAt === 0; // No expiry_date in DB, treat as expired
  const needsRefresh = !row.access_token || isExpired || willExpireSoon || hasNoExpiry;

  if (!needsRefresh) {
    return { accessToken: row.access_token as string, updated: false };
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: row.refresh_token as string,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error('❌ [Token Refresh] Google API Error:', {
      status: tokenRes.status,
      statusText: tokenRes.statusText,
      error: tokenData.error || 'Unknown error',
      error_description: tokenData.error_description || 'No description',
      fullResponse: tokenData
    });
    throw new Error('refresh_failed');
  }

  const newAccess = tokenData.access_token as string;
  const newExpiry = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

  await admin
    .from('youtube_tokens')
    .update({ access_token: newAccess, expiry_date: newExpiry, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  return { accessToken: newAccess, updated: true };
}


