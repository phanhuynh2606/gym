"use client";

import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateProfileSettings } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";

type Props = {
  initial: {
    profileSlug: string | null;
    profileVisibility: "public" | "private";
    profileBio: string | null;
    displayName: string | null;
  };
  baseUrl: string;
};

export function ProfileSettingsForm({ initial, baseUrl }: Props) {
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [slug, setSlug] = useState(initial.profileSlug ?? "");
  const [bio, setBio] = useState(initial.profileBio ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    initial.profileVisibility,
  );
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; message: string; slug: string | null }
    | { kind: "err"; message: string }
  >({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  function submit() {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await updateProfileSettings({
        displayName: displayName.trim() || null,
        profileSlug: slug.trim() || null,
        profileBio: bio.trim() || null,
        profileVisibility: visibility,
      });
      if (result.ok) {
        setStatus({
          kind: "ok",
          message: "Đã lưu profile.",
          slug: result.profile.profileSlug,
        });
        setSlug(result.profile.profileSlug ?? "");
      } else {
        setStatus({ kind: "err", message: result.error });
      }
    });
  }

  const previewUrl = slug.trim() ? `${baseUrl}/u/${slug.trim()}` : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="display-name" className="text-sm font-medium">
          Tên hiển thị
        </label>
        <input
          id="display-name"
          type="text"
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Bạn tập"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm"
        />
        <p className="text-xs text-text-muted">
          Hiển thị trên profile công khai và bảng xếp hạng.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-slug" className="text-sm font-medium">
          Slug profile
        </label>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-3">
          <span className="text-xs text-text-muted">/u/</span>
          <input
            id="profile-slug"
            type="text"
            maxLength={30}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="ten-cua-ban"
            className="h-9 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
        </div>
        <p className="text-xs text-text-muted">
          3-30 ký tự, chữ thường, số và dấu gạch nối. Không trùng với route hệ
          thống (admin, api, coach, ...).
        </p>
        {previewUrl ? (
          <p className="text-xs text-text-secondary">
            Link xem trước:{" "}
            <Link
              href={`/u/${slug.trim()}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-brand hover:underline"
            >
              {previewUrl}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-bio" className="text-sm font-medium">
          Bio (tuỳ chọn)
        </label>
        <textarea
          id="profile-bio"
          maxLength={280}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Vài câu giới thiệu hành trình tập của bạn..."
          className="min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <p className="text-xs text-text-muted">
          {bio.length}/280 ký tự.
        </p>
      </div>

      <div className="space-y-2 border-t border-border-subtle pt-4">
        <p className="text-sm font-medium">Quyền riêng tư</p>
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
              className="mt-0.5 h-4 w-4 accent-brand"
            />
            <div>
              <p className="text-sm font-medium">Riêng tư (mặc định)</p>
              <p className="text-xs text-text-secondary">
                Chỉ bạn xem được. Không xuất hiện trên bảng xếp hạng và{" "}
                <code className="rounded bg-border-subtle px-1">/u/...</code>{" "}
                trả 404.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
              className="mt-0.5 h-4 w-4 accent-brand"
            />
            <div>
              <p className="text-sm font-medium">Công khai</p>
              <p className="text-xs text-text-secondary">
                Hiển thị tên, slug, mục tiêu, streak, và thống kê 30 ngày. Số
                đo cơ thể / cân nặng / mood luôn được giấu.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Đang lưu...
            </>
          ) : (
            "Lưu profile"
          )}
        </Button>
        {status.kind === "ok" ? (
          <span className="inline-flex items-center gap-1 text-sm text-state-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {status.message}{" "}
            {status.slug ? (
              <Link
                href={`/u/${status.slug}`}
                target="_blank"
                className="ml-1 text-brand hover:underline"
              >
                Xem profile
              </Link>
            ) : null}
          </span>
        ) : null}
        {status.kind === "err" ? (
          <span
            role="alert"
            className="inline-flex items-center gap-1 text-sm text-state-error"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {status.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
