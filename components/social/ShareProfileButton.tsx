"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  url: string;
  displayName?: string;
};

/**
 * Try `navigator.share()` first (mobile), fall back to clipboard copy with
 * a 2s "Đã copy" toast on success.
 */
export function ShareProfileButton({ url, displayName }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open in a new tab so the user can copy from address bar.
      window.open(url, "_blank", "noopener");
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: displayName ? `Profile của ${displayName}` : "GymVN profile",
          url,
        });
        return;
      } catch (err) {
        // User dismissed the share sheet — fall through to clipboard.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await copyToClipboard();
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" onClick={share}>
        <Share2 className="h-4 w-4" aria-hidden />
        Chia sẻ
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copyToClipboard}
        aria-label={copied ? "Đã copy" : "Copy link"}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-state-success" aria-hidden />
            Đã copy
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}
