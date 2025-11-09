// Database-backed job tracker using Supabase
import { getSupabaseServerClient } from '@/lib/supabase/server';

type JobStatus = "pending" | "processing" | "completed" | "error";

// Simple in-memory store to track callback calls for debugging
const callbackLogs: Array<{ timestamp: Date; body: any }> = [];

export function logCallback(body: any) {
  callbackLogs.push({ timestamp: new Date(), body });
  // Keep only last 10 callbacks
  if (callbackLogs.length > 10) {
    callbackLogs.shift();
  }
}

export function getCallbackLogs() {
  return callbackLogs.slice(-5).map(log => ({
    timestamp: log.timestamp.toISOString(),
    hasJobId: !!(log.body?.jobId || log.body?.result?.jobId),
    body: log.body,
  }));
}

type StepStatus = "pending" | "processing" | "completed" | "error";

interface JobStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface Job {
  id: string;
  url: string;
  status: JobStatus;
  currentStep: number;
  steps: JobStep[];
  result?: {
    youtubeUrl?: string;
    videoId?: string;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Database row type (snake_case)
interface JobRow {
  id: string;
  url: string;
  status: JobStatus;
  current_step: number;
  steps: JobStep[];
  result?: {
    youtubeUrl?: string;
    videoId?: string;
    error?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// Default workflow steps
const DEFAULT_STEPS: JobStep[] = [
  { id: "get-tiktok-data", label: "Get TikTok video page data", status: "pending" },
  { id: "scrape-video-url", label: "Scrape raw video URL", status: "pending" },
  { id: "remove-watermark", label: "Output video file without watermark", status: "pending" },
  { id: "generate-llm", label: "Generate basic LLM chain", status: "pending" },
  { id: "upload-youtube", label: "Upload the video into YouTube", status: "pending" },
];

// Convert database row to Job interface
function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    url: row.url,
    status: row.status,
    currentStep: row.current_step,
    steps: row.steps,
    result: row.result || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createJob(url: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { error } = await supabase
    .from('jobs')
    .insert({
      id: jobId,
      url,
      status: 'pending',
      current_step: 0,
      steps: DEFAULT_STEPS.map((s) => ({ ...s })),
      result: null,
    });

  if (error) {
    console.error('Error creating job:', error);
    throw new Error(`Failed to create job: ${error.message}`);
  }

  return jobId;
}

export async function getJob(jobId: string): Promise<Job | null> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error getting job:', error);
    return null;
  }

  return rowToJob(data as JobRow);
}

export async function updateJobStep(jobId: string, stepId: string, status: StepStatus): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  
  // First, get the current job
  const { data: jobData, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !jobData) {
    return false;
  }

  const job = rowToJob(jobData as JobRow);
  const stepIndex = job.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) return false;

  // Update the step
  job.steps[stepIndex].status = status;

  // Update current step and status
  let newCurrentStep = job.currentStep;
  let newStatus = job.status;

  if (status === "processing") {
    newCurrentStep = stepIndex;
    newStatus = "processing";
  } else if (status === "completed") {
    newCurrentStep = Math.max(job.currentStep, stepIndex + 1);
    // Check if all steps are complete
    if (job.steps.every((s) => s.status === "completed")) {
      newStatus = "completed";
    }
  } else if (status === "error") {
    newStatus = "error";
  }

  // Update in database
  const { error } = await supabase
    .from('jobs')
    .update({
      steps: job.steps,
      current_step: newCurrentStep,
      status: newStatus,
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job step:', error);
    return false;
  }

  return true;
}

export async function completeJob(jobId: string, result: Job["result"]): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  
  // First, get the current job
  const { data: jobData, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !jobData) {
    return false;
  }

  const job = rowToJob(jobData as JobRow);
  const newStatus = result?.error ? "error" : "completed";
  
  // Mark all remaining steps as completed if successful
  if (!result?.error) {
    job.steps.forEach((step) => {
      if (step.status === "pending" || step.status === "processing") {
        step.status = "completed";
      }
    });
  }

  // Update in database
  const { error } = await supabase
    .from('jobs')
    .update({
      status: newStatus,
      result: result || null,
      steps: job.steps,
      current_step: result?.error ? job.currentStep : job.steps.length,
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error completing job:', error);
    return false;
  }

  return true;
}

// Cleanup old jobs (older than 1 hour) - can be called manually or via cron
export async function cleanupOldJobs(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('jobs')
    .delete()
    .lt('created_at', oneHourAgo)
    .select();

  if (error) {
    console.error('Error cleaning up old jobs:', error);
    return 0;
  }

  return data?.length || 0;
}
