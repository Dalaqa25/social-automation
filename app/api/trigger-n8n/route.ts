import { NextResponse } from 'next/server';
import { createJob } from '@/lib/job-tracker';

const N8N_WEBHOOK_URL = 'https://n8n-1-490z.onrender.com/webhook/c15bf8fe-4f46-4197-a0a5-186a354e4c77';

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

    // Create a job to track progress
    const jobId = createJob(url);

    // Send URL and jobId to n8n webhook so it can call back with updates
    const payload = { 
      url,
      jobId,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/n8n/callback`
    };

    // Send POST request to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const responseData = await response.json().catch(() => ({
      status: response.status,
      statusText: response.statusText,
    }));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'n8n webhook returned an error',
          status: response.status,
          response: responseData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Successfully triggered automation workflow',
      jobId,
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

