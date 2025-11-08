import { NextResponse } from 'next/server';
import { getCallbackLogs } from '@/lib/job-tracker';

export async function GET() {
  const logs = getCallbackLogs();
  return NextResponse.json({
    callbacksReceived: logs.length,
    recentCallbacks: logs,
  });
}

