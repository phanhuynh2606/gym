import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

type YouTubeItem = {
  id: { videoId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium?: { url: string };
      high?: { url: string };
      default?: { url: string };
    };
  };
};

/**
 * GET /api/youtube/search?q=...&maxResults=10
 *
 * Admin-only proxy for the YouTube Data API v3 `search.list` endpoint.
 * Returns 503 when YOUTUBE_API_KEY is missing so the UI can show a banner.
 */
export async function GET(req: Request) {
  const auth = await authorizeAdminApi();
  if (auth.status === "unauthenticated") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (auth.status === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "youtube_not_configured",
        message: "Set YOUTUBE_API_KEY in .env.local to enable search.",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ items: [] });
  }
  const maxResults = Math.min(
    Math.max(parseInt(url.searchParams.get("maxResults") ?? "10", 10) || 10, 1),
    25,
  );

  const ytUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  ytUrl.searchParams.set("part", "snippet");
  ytUrl.searchParams.set("type", "video");
  ytUrl.searchParams.set("maxResults", String(maxResults));
  ytUrl.searchParams.set("safeSearch", "moderate");
  ytUrl.searchParams.set("q", q);
  ytUrl.searchParams.set("key", apiKey);

  const res = await fetch(ytUrl.toString(), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      {
        error: "youtube_request_failed",
        status: res.status,
        message: text.slice(0, 500),
      },
      { status: 502 },
    );
  }
  const data = (await res.json()) as { items?: YouTubeItem[] };
  const items = (data.items ?? [])
    .filter((it) => it.id.videoId)
    .map((it) => ({
      videoId: it.id.videoId as string,
      title: it.snippet.title,
      channelTitle: it.snippet.channelTitle,
      publishedAt: it.snippet.publishedAt,
      thumbnail:
        it.snippet.thumbnails.medium?.url ??
        it.snippet.thumbnails.high?.url ??
        it.snippet.thumbnails.default?.url ??
        "",
    }));

  return NextResponse.json({ items });
}
