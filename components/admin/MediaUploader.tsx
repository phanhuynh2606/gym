"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Sign = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

type Uploaded = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
};

export function MediaUploader({ disabled }: { disabled: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      if (signRes.status === 503) {
        setError(
          "Cloudinary chưa cấu hình. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET trong .env.local.",
        );
        return;
      }
      if (!signRes.ok) {
        setError(`Sign endpoint trả về ${signRes.status}`);
        return;
      }
      const sign: Sign = await signRes.json();
      const out: Uploaded[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sign.apiKey);
        fd.append("timestamp", String(sign.timestamp));
        fd.append("signature", sign.signature);
        fd.append("folder", sign.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`,
          { method: "POST", body: fd },
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Cloudinary lỗi ${res.status}: ${text.slice(0, 200)}`);
        }
        const data = await res.json();
        out.push({
          url: data.secure_url as string,
          publicId: data.public_id as string,
          width: data.width as number,
          height: data.height as number,
          format: data.format as string,
        });
      }
      setUploaded((prev) => [...out, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="inline-flex items-center gap-2">
          <input
            type="file"
            accept="image/*,video/mp4"
            multiple
            disabled={disabled || uploading}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
            className="block text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark disabled:opacity-50"
          />
        </label>
        <p className="mt-1 text-xs text-text-secondary">
          Ảnh JPG/PNG/WebP hoặc video MP4. Upload tới folder{" "}
          <code>gymvn/admin</code>.
        </p>
      </div>

      {uploading && (
        <p className="text-sm text-text-secondary">Đang upload…</p>
      )}
      {error && (
        <p className="rounded-md border border-state-error/40 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          {error}
        </p>
      )}

      {uploaded.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Đã upload trong phiên ({uploaded.length})
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uploaded.map((u) => (
              <li
                key={u.publicId}
                className="rounded-md border border-border-subtle bg-surface overflow-hidden"
              >
                {u.format === "mp4" ? (
                  <video
                    src={u.url}
                    controls
                    className="aspect-video w-full bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.url}
                    alt={u.publicId}
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="p-3 space-y-2 text-xs">
                  <div className="truncate font-mono text-text-secondary">
                    {u.publicId}.{u.format}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(u.url)}
                  >
                    Copy URL
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
