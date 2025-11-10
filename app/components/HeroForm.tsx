"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import ProgressModal from "./ProgressModal";

type StepStatus = "pending" | "processing" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface JobStatus {
  id: string;
  url: string;
  status: "pending" | "processing" | "completed" | "error";
  currentStep: number;
  steps: Step[];
  result?: {
    youtubeUrl?: string;
    videoId?: string;
    error?: string;
  };
}

export default function HeroForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValid = useMemo(() => validateVideoUrl(url), [url]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for job status when jobId is set
  useEffect(() => {
    if (!jobId) return;

    // Start polling
    const pollJobStatus = async () => {
      try {
        const res = await fetch(`/api/job/status?jobId=${jobId}`);
        const json = await res.json();
        
        if (json?.ok && json?.job) {
          setJobStatus(json.job);
          
          // Stop polling if job is completed or has error
          if (json.job.status === "completed" || json.job.status === "error") {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    // Poll immediately, then every 2 seconds
    pollJobStatus();
    pollingIntervalRef.current = setInterval(pollJobStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobId]);

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
              // Store jobId and open progress modal
              setJobId(n8nJson.jobId);
              setIsModalOpen(true);
              setUrl(""); // Clear form
              setLoading(false);
              setError(null);
              setSuccess(null);
            } else {
              const errorMsg = n8nJson?.message || n8nJson?.error || 'Failed to trigger automation workflow.';
              setError(errorMsg);
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
      {jobStatus && (
        <ProgressModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // Clean up polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            // Reset job tracking after a delay to allow modal to close
            setTimeout(() => {
              setJobId(null);
              setJobStatus(null);
            }, 300);
          }}
          steps={jobStatus.steps}
          currentStep={jobStatus.currentStep}
          message={
            jobStatus.status === "processing"
              ? "Processing your video..."
              : jobStatus.status === "completed"
              ? "Automation completed successfully!"
              : jobStatus.status === "error"
              ? "An error occurred during automation"
              : "Starting automation..."
          }
          result={jobStatus.result}
        />
      )}
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
