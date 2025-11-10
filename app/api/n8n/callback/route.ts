import { NextResponse } from 'next/server';
import { setLatestCallback } from '@/lib/n8n-status';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const record = setLatestCallback(body);

    console.log('=== n8n CALLBACK RECEIVED ===');
    console.log('Received at:', record.receivedAt);
    console.log('Summary:', record.summary);
    console.log('Full body:', JSON.stringify(body, null, 2));

    return NextResponse.json({
      ok: true,
      message: 'Callback received successfully',
      received: record,
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

