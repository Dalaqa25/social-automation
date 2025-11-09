import { NextResponse } from 'next/server';
import { getJob } from '@/lib/job-tracker';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing jobId parameter',
        },
        { status: 400 }
      );
    }

    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        url: job.url,
        status: job.status,
        currentStep: job.currentStep,
        steps: job.steps,
        result: job.result,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || 'Failed to get job status',
      },
      { status: 500 }
    );
  }
}

