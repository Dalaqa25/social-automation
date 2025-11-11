"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import AutomationDialog from "./AutomationDialog";

type NoticeType = "success" | "error" | "info";

interface AutomationNotice {
  type: NoticeType;
  title: string;
  message: string;
  receivedAt: string;
}

export default function HeroForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [automationNotice, setAutomationNotice] = useState<AutomationNotice | null>(null);
  const [listeningForCallback, setListeningForCallback] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastReceivedRef = useRef<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const isValid = useMemo(() => validateVideoUrl(url), [url]);

  // Initial callbacks are no longer loaded on mount; we only show dialog for new callbacks.

  useEffect(() => {
    if (!listeningForCallback) return;

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/n8n/status", { cache: "no-store" });
        const json = await res.json();
        if (cancelled || !json?.ok || !json?.callback) return;
        const { receivedAt, summary } = json.callback;
        if (receivedAt && receivedAt !== lastReceivedRef.current) {
          lastReceivedRef.current = receivedAt;
          // Normalize technical LLM errors into a user-friendly message
          const rawMessage = summary.message || "";
          const lc = String(rawMessage).toLowerCase();
          const looksLikeLlmRateLimit =
            lc.includes("rate limit") ||
            lc.includes("429") ||
            lc.includes("quota") ||
            lc.includes("token") ||
            lc.includes("openrouter") ||
            lc.includes("openai") ||
            lc.includes("llm");

          const friendlyMessage = looksLikeLlmRateLimit
            ? "Our AI text generator hit a temporary usage limit and can’t generate descriptions right now. Please wait a bit and try again later."
            : rawMessage;

          setAutomationNotice({
            type: looksLikeLlmRateLimit ? "error" : summary.type,
            title: looksLikeLlmRateLimit ? "AI Service Temporarily Limited" : summary.title,
            message: friendlyMessage,
            receivedAt,
          });
          setSuccess(null);
          setListeningForCallback(false);
          setDialogOpen(true);
          pollAttemptsRef.current = 0;
        } else {
          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current >= 15) {
            setListeningForCallback(false);
            pollAttemptsRef.current = 0;
            setAutomationNotice({
              type: "info",
              title: "Waiting for automation response",
              message: "We haven’t heard back from the automation yet. It may still be running—feel free to refresh or try again later.",
              receivedAt: new Date().toISOString(),
            });
            setSuccess(null);
            setDialogOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch automation status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      pollAttemptsRef.current = 0;
    };
  }, [listeningForCallback]);

  function isTikTokUrl(candidate: string): boolean {
    try {
      const u = new URL(candidate);
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

    (async () => {
      try {
        const res = await fetch("/api/validate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const json = await res.json();
        if (!json?.ok) {
          setError("This video appears to be private or unavailable.");
          setLoading(false);
          return;
        }
        if (json?.mismatch && json?.canonical_url && json?.canonical_url !== url) {
          setError("Note: your link redirects to a different public URL. Please paste the final URL and try again.");
          setLoading(false);
          return;
        }

        if (isTikTokUrl(url)) {
          try {
            const n8nRes = await fetch("/api/trigger-n8n", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            });
            const n8nJson = await n8nRes.json();
            if (n8nJson?.ok) {
              setUrl("");
              setLoading(false);
              setSuccess("Automation workflow triggered. Waiting for response…");
              setAutomationNotice(null);
              setDialogOpen(false);
              lastReceivedRef.current = null;
              pollAttemptsRef.current = 0;
              setListeningForCallback(true);
            } else {
              const errorMsg = n8nJson?.message || n8nJson?.error || "Failed to trigger automation workflow.";
              setError(errorMsg);
              setLoading(false);
            }
          } catch (n8nErr) {
            setError("Failed to trigger automation workflow. Please try again.");
            console.error("n8n error:", n8nErr);
            setLoading(false);
          }
        } else {
          console.log("Validated video:", json);
          setSuccess("Video validated successfully! (YouTube automation coming soon)");
          setLoading(false);
        }
      } catch (err) {
        setError("Could not validate the video. Please try again.");
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
            {loading ? "Processing..." : "Start"}
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

      <AutomationDialog
        open={dialogOpen && !!automationNotice}
        title={automationNotice?.title || "Automation Update"}
        message={automationNotice?.message || ""}
        variant={
          automationNotice?.type === "error"
            ? "error"
            : automationNotice?.type === "success"
            ? "success"
            : "info"
        }
        onClose={() => {
          setDialogOpen(false);
          setAutomationNotice(null);
          setListeningForCallback(false);
          setSuccess(null);
        }}
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
      if (hostname === "youtu.be") return u.pathname.length > 1;
      if (u.pathname === "/watch") return u.searchParams.has("v");
      if (u.pathname.startsWith("/shorts/")) return true;
      if (u.pathname.startsWith("/embed/")) return true;
      return false;
    }

    if (ttHosts.has(hostname)) {
      if (/\/video\/\d+/.test(u.pathname)) return true;
      if (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") return true;
      return false;
    }

    return false;
  } catch {
    return false;
  }
}
