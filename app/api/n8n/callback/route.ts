import { NextResponse } from 'next/server';
import { completeJob } from '@/lib/job-tracker';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Log the callback for debugging
    console.log('=== n8n CALLBACK RECEIVED ===');
    console.log('Full body:', JSON.stringify(body, null, 2));
    
    // Extract jobId - N8n should include this in the callback
    const jobId = body.jobId || body.job_id || body.result?.jobId;
    
    // Extract error message (for error callbacks)
    const rawError =
      body.error ||
      body.llmerror ||
      body.llmError ||
      body.errorMessage ||
      body.message ||
      body.result?.error ||
      body.Results?.error;
    const error =
      typeof rawError === 'string'
        ? rawError
        : rawError?.message || (rawError ? JSON.stringify(rawError) : undefined);
    
    // Extract success data (for success callbacks)
    const videoId = body.videoId || body.result?.videoId || body.Results?.videoId;
    const youtubeUrl = body.youtubeUrl || body.result?.youtubeUrl || body.Results?.youtubeUrl;
    
    // Log important fields
    console.log('Callback data:', {
      jobId,
      videoId,
      youtubeUrl,
      error,
      rawError:
        typeof rawError === 'string' ? undefined : rawError,
    });
    
    // If we have a jobId, update the job status
    if (jobId) {
      // Prepare result object
      const result: {
        youtubeUrl?: string;
        videoId?: string;
        error?: string;
      } = {};
      
      if (error) {
        // Error case
        result.error = error;
        console.log(`Updating job ${jobId} with error:`, error);
        await completeJob(jobId, result);
      } else if (youtubeUrl || videoId) {
        // Success case
        result.youtubeUrl = youtubeUrl;
        result.videoId = videoId;
        console.log(`Updating job ${jobId} with success:`, result);
        await completeJob(jobId, result);
      } else {
        // No error and no success data - might be a status update
        console.log(`Job ${jobId} callback received but no error or success data`);
      }
    } else {
      console.warn('N8n callback received without jobId - cannot update job status');
    }
    
    // Return success response to n8n
    return NextResponse.json({
      ok: true,
      message: 'Callback received successfully',
      received: {
        jobId,
        videoId,
        youtubeUrl,
        error,
        llmerror: body.llmerror || body.llmError,
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

