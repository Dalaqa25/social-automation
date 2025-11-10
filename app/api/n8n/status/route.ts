import { NextResponse } from 'next/server';
import { getLatestCallback } from '@/lib/n8n-status';

export async function GET() {
  const latest = getLatestCallback();
  return NextResponse.json(
    {
      ok: true,
      callback: latest,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

