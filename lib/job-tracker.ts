// In-memory job tracker
// In production, you'd want to use Redis or a database

type JobStatus = "pending" | "processing" | "completed" | "error";

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

// In-memory store (replace with Redis/DB in production)
const jobs = new Map<string, Job>();

// Default workflow steps
const DEFAULT_STEPS: JobStep[] = [
  { id: "get-tiktok-data", label: "Get TikTok video page data", status: "pending" },
  { id: "scrape-video-url", label: "Scrape raw video URL", status: "pending" },
  { id: "remove-watermark", label: "Output video file without watermark", status: "pending" },
  { id: "generate-llm", label: "Generate basic LLM chain", status: "pending" },
  { id: "upload-youtube", label: "Upload the video into YouTube", status: "pending" },
];

export function createJob(url: string): string {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const job: Job = {
    id: jobId,
    url,
    status: "pending",
    currentStep: 0,
    steps: DEFAULT_STEPS.map((s) => ({ ...s })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  jobs.set(jobId, job);
  return jobId;
}

export function getJob(jobId: string): Job | null {
  return jobs.get(jobId) || null;
}

export function updateJobStep(jobId: string, stepId: string, status: StepStatus): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;

  const stepIndex = job.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) return false;

  job.steps[stepIndex].status = status;
  job.updatedAt = new Date();

  // Update current step
  if (status === "processing") {
    job.currentStep = stepIndex;
    job.status = "processing";
  } else if (status === "completed") {
    job.currentStep = Math.max(job.currentStep, stepIndex + 1);
    // Check if all steps are complete
    if (job.steps.every((s) => s.status === "completed")) {
      job.status = "completed";
    }
  } else if (status === "error") {
    job.status = "error";
  }

  jobs.set(jobId, job);
  return true;
}

export function completeJob(jobId: string, result: Job["result"]): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;

  job.status = result?.error ? "error" : "completed";
  job.result = result;
  job.updatedAt = new Date();
  
  // Mark all remaining steps as completed if successful
  if (!result?.error) {
    job.steps.forEach((step) => {
      if (step.status === "pending" || step.status === "processing") {
        step.status = "completed";
      }
    });
    job.currentStep = job.steps.length;
  }

  jobs.set(jobId, job);
  return true;
}

// Cleanup old jobs (older than 1 hour)
export function cleanupOldJobs() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(jobId);
    }
  }
}

// Run cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldJobs, 30 * 60 * 1000);
}

