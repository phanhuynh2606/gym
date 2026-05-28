"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hit = {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
};

export function YouTubeSearchPanel({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (res.status === 503) {
        setError(
          "YOUTUBE_API_KEY chưa cấu hình. Set trong .env.local để bật search.",
        );
        return;
      }
      if (!res.ok) {
        setError(`Search endpoint trả về ${res.status}`);
        return;
      }
      const data = (await res.json()) as { items: Hit[] };
      setResults(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="vd: bench press technique"
          disabled={!enabled || loading}
        />
        <Button type="submit" variant="primary" disabled={!enabled || loading}>
          {loading ? "Đang tìm…" : "Tìm"}
        </Button>
      </form>

      {!enabled && (
        <p className="rounded-md border border-state-warning/40 bg-state-warning/5 px-3 py-2 text-sm text-text-secondary">
          <code>YOUTUBE_API_KEY</code> chưa được cấu hình — search bị tắt.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-state-error/40 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((hit) => (
            <li
              key={hit.videoId}
              className="rounded-md border border-border-subtle bg-surface overflow-hidden"
            >
              <a
                href={`https://www.youtube.com/watch?v=${hit.videoId}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hit.thumbnail}
                  alt={hit.title}
                  className="aspect-video w-full object-cover"
                />
              </a>
              <div className="space-y-1.5 p-3">
                <p className="line-clamp-2 text-sm font-medium text-text-primary">
                  {hit.title}
                </p>
                <p className="text-xs text-text-secondary">
                  {hit.channelTitle} ·{" "}
                  {new Date(hit.publishedAt).toLocaleDateString("vi-VN")}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <code className="rounded-sm bg-border-subtle/60 px-1.5 py-0.5 text-[10px] text-text-secondary">
                    {hit.videoId}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(hit.videoId)}
                  >
                    Copy ID
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
