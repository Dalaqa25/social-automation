import { NextResponse } from 'next/server';
import { getJob, updateJobStep, completeJob, logCallback } from '@/lib/job-tracker';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Log the full callback data for debugging
    console.log('=== n8n CALLBACK RECEIVED ===');
    console.log('Full body:', JSON.stringify(body, null, 2));
    
    // Track callback for debugging
    logCallback(body);
    
    // Extract jobId - n8n should send this back
    // Check multiple possible locations: direct, result, Results (capital R), or body
    let jobId = body.jobId || 
                body.result?.jobId || 
                body.Results?.jobId ||  // Handle capital R "Results"
                body.body?.jobId;
    
    // Extract the data that n8n is sending
    // Check result, Results (capital R), or direct body
    const result = body.result || body.Results || body;
    const url = result.url || body.url || body.body?.url;
    
    // If no jobId but we have a URL, try to find the job by URL
    if (!jobId && url) {
      console.log('No jobId found, attempting to find job by URL:', url);
      // We'll need to add a function to find job by URL
      // For now, log a warning
      console.warn('Cannot find job without jobId. Make sure n8n sends jobId in callback.');
    }
    
    if (!jobId) {
      console.warn('⚠️ n8n callback missing jobId - job status cannot be updated!');
      console.warn('Make sure your n8n HTTP Request node includes: { "jobId": "{{ $json.body.jobId }}" }');
    } else {
      console.log('✅ Found jobId:', jobId);
    }
    
    // Extract the rest of the data that n8n is sending
    // Check result, Results (capital R), or direct body
    const youtubeUrl = result.youtubeUrl || body.youtubeUrl || body.Results?.youtubeUrl;
    const videoId = result.videoId || body.videoId || body.Results?.videoId;
    const status = result.status || body.status || body.Results?.status || 'success';
    const error = result.error || body.error || body.Results?.error;
    const step = result.step || body.step || body.Results?.step; // Optional: which step is being updated
    
    // If jobId exists, update the job
    if (jobId) {
      if (step) {
        // Update specific step
        const stepMap: Record<string, string> = {
          'get-tiktok-data': 'get-tiktok-data',
          'scrape-video-url': 'scrape-video-url',
          'remove-watermark': 'remove-watermark',
          'generate-llm': 'generate-llm',
          'upload-youtube': 'upload-youtube',
        };
        
        const stepId = stepMap[step] || step;
        if (error) {
          await updateJobStep(jobId, stepId, 'error');
        } else if (status === 'completed' || youtubeUrl) {
          await updateJobStep(jobId, stepId, 'completed');
        } else {
          await updateJobStep(jobId, stepId, 'processing');
        }
      }
      
      // If this is the final result (has youtubeUrl or error), complete the job
      // This will mark all steps as completed
      if (youtubeUrl || error) {
        await completeJob(jobId, {
          youtubeUrl,
          videoId,
          error,
        });
      } else if (!step && jobId) {
        // If no step specified but we have a jobId, mark first step as processing
        // This handles the case where n8n sends a callback without step info
        const job = await getJob(jobId);
        if (job && job.steps[0].status === 'pending') {
          await updateJobStep(jobId, 'get-tiktok-data', 'processing');
        }
      }
    }
    
    // Log important fields
    console.log('Extracted data:', {
      jobId,
      originalUrl: url,
      youtubeUrl,
      videoId,
      status,
      error,
      step,
    });
    
    // Return success response to n8n
    return NextResponse.json({
      ok: true,
      message: 'Callback received successfully',
      received: {
        url,
        youtubeUrl,
        videoId,
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

