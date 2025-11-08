import { NextResponse } from 'next/server';

// Simple in-memory store to track callback calls for debugging
const callbackLogs: Array<{ timestamp: Date; body: any }> = [];

export function logCallback(body: any) {
  callbackLogs.push({ timestamp: new Date(), body });
  // Keep only last 10 callbacks
  if (callbackLogs.length > 10) {
    callbackLogs.shift();
  }
}

export async function GET() {
  return NextResponse.json({
    callbacksReceived: callbackLogs.length,
    recentCallbacks: callbackLogs.slice(-5).map(log => ({
      timestamp: log.timestamp.toISOString(),
      hasJobId: !!(log.body?.jobId || log.body?.result?.jobId),
      body: log.body,
    })),
  });
}

