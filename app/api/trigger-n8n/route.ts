import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getValidYouTubeAccessToken } from '@/lib/youtube/token';

const N8N_WEBHOOK_URL = 'https://n8n-1-490z.onrender.com/webhook/c15bf8fe-4f46-4197-a0a5-186a354e4c77';
const CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/n8n/callback`
  : 'http://localhost:3000/api/n8n/callback';

function isValidTikTokUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, '');
    const ttHosts = ['tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'];
    
    if (ttHosts.includes(hostname)) {
      // Accept common TikTok forms:
      // - tiktok.com/@user/video/<id>
      // - vm.tiktok.com/... or vt.tiktok.com/... short links
      if (/\/video\/\d+/.test(u.pathname)) return true;
      if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') return true;
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Require URL in request body
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing or invalid url. Please provide a TikTok URL.',
        },
        { status: 400 }
      );
    }

    // Validate it's a TikTok URL
    if (!isValidTikTokUrl(url)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid TikTok URL. Please provide a valid TikTok video URL.',
        },
        { status: 400 }
      );
    }

    // Get authenticated user and YouTube token data
    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User must be authenticated to trigger automation workflow.',
        },
        { status: 401 }
      );
    }

    // Get valid (refreshed if needed) access token for the user
    let accessToken: string;
    let tokenWasRefreshed = false;
    try {
      const tokenResult = await getValidYouTubeAccessToken(user.id);
      accessToken = tokenResult.accessToken;
      tokenWasRefreshed = tokenResult.updated;
    } catch (tokenError: any) {
      if (tokenError?.message === 'No YouTube tokens found for user' || tokenError?.message === 'missing_refresh_token') {
        return NextResponse.json(
          {
            ok: false,
            error: 'YouTube account not connected. Please connect your YouTube account first.',
          },
          { status: 400 }
        );
      }
      if (tokenError?.message === 'refresh_failed') {
        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to refresh YouTube token. Please reconnect your YouTube account.',
          },
          { status: 400 }
        );
      }
      throw tokenError;
    }

    // Fetch channel info (only channel_name needed)
    const { data: youtubeData, error: youtubeError } = await admin
      .from('youtube_tokens')
      .select('channel_name')
      .eq('user_id', user.id)
      .single();

    if (youtubeError || !youtubeData) {
      return NextResponse.json(
        {
          ok: false,
          error: 'YouTube account not connected. Please connect your YouTube account first.',
        },
        { status: 400 }
      );
    }

    // Generate a lightweight job identifier for logging / callbacks
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Format callback URL - remove protocol if present to match required format
    let formattedCallbackUrl = CALLBACK_URL;
    if (formattedCallbackUrl.startsWith('http://') || formattedCallbackUrl.startsWith('https://')) {
      formattedCallbackUrl = formattedCallbackUrl.replace(/^https?:\/\//, '');
    }

    // Send TikTok URL, jobId, callback URL, access token, and channel name to n8n webhook
    const payload = { 
      tiktok_url: url,
      jobId: jobId,
      callback_url: formattedCallbackUrl,
      access_token: accessToken,
      channel_name: youtubeData.channel_name,
    };

    // Log the request we're sending (without sensitive token data)
    const sanitizedPayload = {
      ...payload,
      access_token: '[REDACTED]',
    };
    console.log('=== SENDING REQUEST TO N8N ===');
    console.log('URL:', N8N_WEBHOOK_URL);
    console.log('Payload:', JSON.stringify(sanitizedPayload, null, 2));

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      // Send POST request to n8n webhook
      // Match Postman request format exactly
      response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        // Don't use cache for webhooks
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            ok: false,
            error: 'Request to n8n webhook timed out after 30 seconds',
          },
          { status: 504 }
        );
      }
      throw fetchError; // Re-throw other errors
    }

    // Try to get response text first (in case it's not JSON)
    const responseText = await response.text();
    console.log('=== N8N RESPONSE ===');
    console.log('Status:', response.status, response.statusText);
    console.log('Response Text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {
        raw: responseText,
        status: response.status,
        statusText: response.statusText,
      };
    }

    if (!response.ok) {
      console.error('=== N8N ERROR ===');
      console.error('Status:', response.status);
      console.error('Response:', responseData);
      
      return NextResponse.json(
        {
          ok: false,
          error: 'n8n webhook returned an error',
          status: response.status,
          statusText: response.statusText,
          details: responseData,
          message: typeof responseData === 'object' && responseData.message 
            ? responseData.message 
            : responseData.raw || 'Unknown error from n8n',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Successfully triggered automation workflow',
      jobId: jobId,
      tokenRefreshed: tokenWasRefreshed,
      n8nResponse: responseData,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || 'Failed to trigger n8n webhook',
      },
      { status: 500 }
    );
  }
}

// GET method removed - this endpoint now requires a TikTok URL via POST

