"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import ProgressModal from "./ProgressModal";

type StepStatus = "pending" | "processing" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

export default function HeroForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([
    { id: "get-tiktok-data", label: "Get TikTok video page data", status: "pending" },
    { id: "scrape-video-url", label: "Scrape raw video URL", status: "pending" },
    { id: "remove-watermark", label: "Output video file without watermark", status: "pending" },
    { id: "generate-llm", label: "Generate basic LLM chain", status: "pending" },
    { id: "upload-youtube", label: "Upload the video into YouTube", status: "pending" },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<{ youtubeUrl?: string; videoId?: string; error?: string } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const isValid = useMemo(() => validateVideoUrl(url), [url]);

  function isTikTokUrl(url: string): boolean {
    try {
      const u = new URL(url);
      const hostname = u.hostname.replace(/^www\./, "");
      const ttHosts = ["tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
      return ttHosts.includes(hostname);
    } catch {
      return false;
    }
  }

  // Poll for job status updates
  useEffect(() => {
    if (!jobId || !showModal) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
      return;
    }

    // Initialize polling start time
    if (!pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
    }

    const MAX_POLLING_TIME = 10 * 60 * 1000; // 10 minutes max
    const MAX_POLLING_ATTEMPTS = 300; // Max 300 attempts (10 min / 2 sec intervals)

    const pollStatus = async () => {
      try {
        // Check timeout
        const elapsed = Date.now() - (pollingStartTimeRef.current || Date.now());
        if (elapsed > MAX_POLLING_TIME) {
          console.warn("Polling timeout reached (10 minutes). Stopping polling.");
          setError("Workflow is taking longer than expected. Please check n8n or try again.");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }

        // Check max attempts
        pollingAttemptsRef.current += 1;
        if (pollingAttemptsRef.current > MAX_POLLING_ATTEMPTS) {
          console.warn("Max polling attempts reached. Stopping polling.");
          setError("Workflow is taking longer than expected. Please check n8n or try again.");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }

        const res = await fetch(`/api/job/status?jobId=${jobId}`);
        
        // If 404, job doesn't exist (likely due to serverless cold start)
        // Stop polling to avoid spam
        if (res.status === 404) {
          console.warn("Job not found (may be due to serverless cold start). Stopping polling.");
          setError("Job not found. The workflow may have been lost. Please try again.");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }
        
        const json = await res.json();

        if (json.ok && json.job) {
          const job = json.job;
          setSteps(job.steps);
          setCurrentStep(job.currentStep);
          
          if (job.result) {
            setResult(job.result);
          }

          // Stop polling if job is complete or has error
          if (job.status === "completed" || job.status === "error") {
            console.log("Job completed. Stopping polling.");
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            pollingStartTimeRef.current = null;
            pollingAttemptsRef.current = 0;
          } else {
            // Log progress every 30 seconds
            if (pollingAttemptsRef.current % 15 === 0) {
              const minutesElapsed = Math.floor(elapsed / 60000);
              console.log(`Polling... (${minutesElapsed}m elapsed, attempt ${pollingAttemptsRef.current})`);
            }
          }
        } else {
          console.error("Job status error:", json);
          // Stop polling on persistent errors
          if (res.status >= 500) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error("Failed to poll job status:", err);
        // Stop polling on network errors after multiple failures
        if (pollingAttemptsRef.current > 10) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    };

    // Poll immediately, then every 2 seconds
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      pollingStartTimeRef.current = null;
      pollingAttemptsRef.current = 0;
    };
  }, [jobId, showModal]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Please paste a valid public YouTube or TikTok URL.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    // Verify public availability server-side via oEmbed
    (async () => {
      try {
        const res = await fetch('/api/validate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const json = await res.json();
        if (!json?.ok) {
          setError('This video appears to be private or unavailable.');
          setLoading(false);
          return;
        }
        if (json?.mismatch && json?.canonical_url && json?.canonical_url !== url) {
          setError('Note: your link redirects to a different public URL. Please paste the final URL and try again.');
          setLoading(false);
          return;
        }
        
        // If it's a TikTok URL, trigger n8n workflow
        if (isTikTokUrl(url)) {
          try {
            const n8nRes = await fetch('/api/trigger-n8n', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
            });
            const n8nJson = await n8nRes.json();
            if (n8nJson?.ok && n8nJson?.jobId) {
              // Reset modal state
              setSteps([
                { id: "get-tiktok-data", label: "Get TikTok video page data", status: "pending" },
                { id: "scrape-video-url", label: "Scrape raw video URL", status: "pending" },
                { id: "remove-watermark", label: "Output video file without watermark", status: "pending" },
                { id: "generate-llm", label: "Generate basic LLM chain", status: "pending" },
                { id: "upload-youtube", label: "Upload the video into YouTube", status: "pending" },
              ]);
              setCurrentStep(0);
              setResult(null);
              setJobId(n8nJson.jobId);
              setShowModal(true);
              setLoading(false); // Stop loading since modal will show progress
              // Mark first step as processing
              setSteps((prev) => {
                const updated = [...prev];
                updated[0].status = "processing";
                return updated;
              });
            } else {
              // Show detailed error message
              const errorMsg = n8nJson?.message || n8nJson?.error || 'Failed to trigger automation workflow.';
              const statusInfo = n8nJson?.status ? ` (Status: ${n8nJson.status})` : '';
              const details = n8nJson?.details ? ` Details: ${JSON.stringify(n8nJson.details)}` : '';
              setError(`${errorMsg}${statusInfo}${details}`);
              console.error('n8n error response:', n8nJson);
              setLoading(false);
            }
          } catch (n8nErr) {
            setError('Failed to trigger automation workflow. Please try again.');
            console.error('n8n error:', n8nErr);
            setLoading(false);
          }
        } else {
          // For YouTube URLs, just log for now
          console.log('Validated video:', json);
          setSuccess('Video validated successfully! (YouTube automation coming soon)');
          setLoading(false);
        }
      } catch (err) {
        setError('Could not validate the video. Please try again.');
        setLoading(false);
      }
    })();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <label htmlFor="youtube-url" className="sr-only">
        Paste YouTube video public URL
      </label>
      <div className="group relative">
        <div className="flex items-center gap-2 rounded-full border border-purple-300/40 bg-white/80 backdrop-blur-xl px-2 py-2 shadow-lg shadow-purple-500/10 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-400/60 dark:border-purple-400/30 dark:bg-purple-950/40 dark:shadow-purple-500/20">
          <input
            id="youtube-url"
            name="youtubeUrl"
            type="url"
            inputMode="url"
            placeholder="Paste YouTube or TikTok public video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-base text-gray-900 placeholder-gray-500 outline-none sm:text-lg dark:text-gray-100 dark:placeholder-gray-400"
            aria-invalid={!!error}
            aria-describedby={error ? "youtube-url-error" : undefined}
          />
          <button
            type="submit"
            className="m-1 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-5 py-2.5 font-medium text-white shadow-md cursor-pointer transition duration-200 ease-out hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isValid || loading}
          >
            {loading ? 'Processing...' : 'Start'}
          </button>
        </div>
      </div>
      {error ? (
        <p id="youtube-url-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-2 text-sm text-green-600">
          {success}
        </p>
      ) : null}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setJobId(null);
          setUrl(""); // Clear form after completion
        }}
        steps={steps}
        currentStep={currentStep}
        message={
          currentStep === 0 && steps[0].status === "processing"
            ? "Successfully triggered automation workflow!"
            : undefined
        }
        result={result || undefined}
      />
    </form>
  );
}

function validateVideoUrl(candidate: string): boolean {
  if (!candidate) return false;
  try {
    const u = new URL(candidate);
    const hostname = u.hostname.replace(/^www\./, "");
    // Supported platforms
    const ytHosts = new Set([
      "youtube.com",
      "m.youtube.com",
      "youtu.be",
      "music.youtube.com",
    ]);
    const ttHosts = new Set([
      "tiktok.com",
      "m.tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com",
    ]);

    if (ytHosts.has(hostname)) {
      // Accept common YouTube paths: watch?v=, youtu.be/<id>, shorts/<id>, embed/<id>
      if (hostname === "youtu.be") return u.pathname.length > 1;
      if (u.pathname === "/watch") return u.searchParams.has("v");
      if (u.pathname.startsWith("/shorts/")) return true;
      if (u.pathname.startsWith("/embed/")) return true;
      return false;
    }

    if (ttHosts.has(hostname)) {
      // Accept common TikTok forms:
      // - tiktok.com/@user/video/<id>
      // - vm.tiktok.com/... or vt.tiktok.com/... short links
      if (/\/video\/\d+/.test(u.pathname)) return true;
      if (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") return true;
      return false;
    }

    return false;
  } catch {
    return false;
  }
}


