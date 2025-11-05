import { NextResponse } from 'next/server';

type ValidateResult = {
  ok: boolean;
  platform?: 'tiktok' | 'youtube';
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  reason?: string;
  canonical_url?: string;
  mismatch?: boolean;
};

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !url) {
      return NextResponse.json<ValidateResult>({ ok: false, reason: 'Missing url' }, { status: 400 });
    }

    const u = new URL(url);
    const hostname = u.hostname.replace(/^www\./, '');

    // Resolve potential redirects to determine a canonical destination
    let finalUrl = url;
    try {
      const head = await fetch(url, {
        method: 'GET', // some providers reject HEAD; GET with no-store keeps it light
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; SocialAutomationBot/1.0)' },
      });
      if (head?.url) finalUrl = head.url;
    } catch {
      // ignore redirect resolution errors; continue with original url
    }

    // Pick oEmbed endpoint based on platform
    let endpoint: string | null = null;
    let platform: 'tiktok' | 'youtube' | null = null;

    if (['tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(hostname)) {
      endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`;
      platform = 'tiktok';
    } else if (['youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'].includes(hostname)) {
      // YouTube requires format=json for some endpoints
      endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(finalUrl)}`;
      platform = 'youtube';
    }

    if (!endpoint || !platform) {
      return NextResponse.json<ValidateResult>({ ok: false, reason: 'Unsupported host' }, { status: 400 });
    }

    const res = await fetch(endpoint, {
      // Avoid caching to reflect current visibility (public/private)
      cache: 'no-store',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; SocialAutomationBot/1.0)' },
    });

    if (!res.ok) {
      // oEmbed returns 404/401 for private/unavailable videos
      return NextResponse.json<ValidateResult>({ ok: false, reason: `oEmbed ${res.status}` }, { status: 200 });
    }

    const data = await res.json();

    // Compare normalized input URL vs final/canonical URL
    const mismatch = !urlsLikelyEqual(url, finalUrl);
    return NextResponse.json<ValidateResult>({
      ok: true,
      platform,
      title: data?.title,
      author_name: data?.author_name,
      thumbnail_url: data?.thumbnail_url,
      canonical_url: finalUrl,
      mismatch,
    });
  } catch (e: any) {
    return NextResponse.json<ValidateResult>({ ok: false, reason: e?.message ?? 'Unknown error' }, { status: 200 });
  }
}

function urlsLikelyEqual(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    const normHost = (h: string) => h.replace(/^www\./, '').toLowerCase();
    const normPath = (p: string) => p.replace(/\/$/, '');
    const sameHost = normHost(ua.hostname) === normHost(ub.hostname);
    const samePath = normPath(ua.pathname) === normPath(ub.pathname);
    // For YouTube watch URLs, compare video id param
    if (normHost(ua.hostname).includes('youtube') && normHost(ub.hostname).includes('youtube')) {
      const va = ua.searchParams.get('v');
      const vb = ub.searchParams.get('v');
      if (va && vb) return sameHost && va === vb;
    }
    return sameHost && samePath;
  } catch {
    return true; // don't block if we can't parse
  }
}


