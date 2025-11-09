import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Log the callback for debugging (no job tracking needed)
    console.log('=== n8n CALLBACK RECEIVED ===');
    console.log('Full body:', JSON.stringify(body, null, 2));
    
    // Extract data for logging
    const videoId = body.videoId || body.result?.videoId || body.Results?.videoId;
    const youtubeUrl = body.youtubeUrl || body.result?.youtubeUrl || body.Results?.youtubeUrl;
    const status = body.status || body.result?.status || body.Results?.status || 'success';
    const error = body.error || body.result?.error || body.Results?.error;
    
    // Log important fields
    console.log('Callback data:', {
      videoId,
      youtubeUrl,
      status,
      error,
    });
    
    // Return success response to n8n
    return NextResponse.json({
      ok: true,
      message: 'Callback received successfully',
      received: {
        videoId,
        youtubeUrl,
        status,
      },
    });
  } catch (e: any) {
    console.error('n8n callback error:', e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || 'Failed to process callback',
      },
      { status: 500 }
    );
  }
}

