"use client";

import { useMemo, useState } from "react";

export default function HeroForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isValid = useMemo(() => validateYouTubeUrl(url), [url]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Please paste a valid public YouTube URL.");
      return;
    }
    setError(null);
    // Minimal behavior for now – wire to your flow later
    console.log("Starting automation for:", url);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <label htmlFor="youtube-url" className="sr-only">
        Paste YouTube video public URL
      </label>
      <div className="group relative">
        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-2 py-2 shadow-lg backdrop-blur-xl focus-within:ring-2 focus-within:ring-indigo-500/70 dark:border-white/10 dark:bg-white/5">
          <input
            id="youtube-url"
            name="youtubeUrl"
            type="url"
            inputMode="url"
            placeholder="Paste YouTube video public URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-base text-gray-900 placeholder-gray-500 outline-none sm:text-lg dark:text-gray-100 dark:placeholder-gray-400"
            aria-invalid={!!error}
            aria-describedby={error ? "youtube-url-error" : undefined}
          />
          <button
            type="submit"
            className="m-1 whitespace-nowrap rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 px-5 py-2.5 font-medium text-white shadow-md cursor-pointer transition duration-200 ease-out hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isValid}
          >
            Start
          </button>
        </div>
      </div>
      {error ? (
        <p id="youtube-url-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function validateYouTubeUrl(candidate: string): boolean {
  if (!candidate) return false;
  try {
    const u = new URL(candidate);
    const hostname = u.hostname.replace(/^www\./, "");
    const hosts = new Set([
      "youtube.com",
      "m.youtube.com",
      "youtu.be",
      "music.youtube.com",
    ]);
    if (!hosts.has(hostname)) return false;
    // Accept common paths: watch?v=, youtu.be/<id>, shorts/<id>, embed/<id>
    if (hostname === "youtu.be") return u.pathname.length > 1;
    if (u.pathname === "/watch") return u.searchParams.has("v");
    if (u.pathname.startsWith("/shorts/")) return true;
    if (u.pathname.startsWith("/embed/")) return true;
    return false;
  } catch {
    return false;
  }
}


