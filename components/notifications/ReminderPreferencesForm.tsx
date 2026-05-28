"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  updateReminderPreferences,
  type ReminderPreferences,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";

type Props = {
  initial: ReminderPreferences;
  emailEnabledServer: boolean;
  userEmail: string | null;
};

export function ReminderPreferencesForm({
  initial,
  emailEnabledServer,
  userEmail,
}: Props) {
  const [reminderEnabled, setReminderEnabled] = useState(initial.reminderEnabled);
  const [reminderHour, setReminderHour] = useState(initial.reminderHour);
  const [reminderEmailEnabled, setReminderEmailEnabled] = useState(
    initial.reminderEmailEnabled,
  );
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; message: string }
    | { kind: "err"; message: string }
  >({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  // Read the current browser tz offset on each submit (rather than in a
  // useEffect) so the saved value always reflects the user's "now", including
  // after daylight-saving changes. Falls back to the server value when the
  // form runs in a non-browser context (defensive — shouldn't happen).
  function currentTzOffset(): number {
    if (typeof window === "undefined") return initial.timezoneOffsetMinutes;
    // getTimezoneOffset() returns minutes WEST of UTC, so negate to get the
    // offset "ahead of UTC" we store in `timezoneOffsetMinutes`.
    return -new Date().getTimezoneOffset();
  }

  function submit() {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await updateReminderPreferences({
        reminderEnabled,
        reminderHour,
        reminderEmailEnabled,
        timezoneOffsetMinutes: currentTzOffset(),
      });
      if (result.ok) {
        setStatus({ kind: "ok", message: "Đã lưu cài đặt." });
      } else {
        setStatus({ kind: "err", message: result.error });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
          />
          <div>
            <p className="text-sm font-medium">Bật nhắc nhở trong app</p>
            <p className="text-xs text-text-secondary">
              Mỗi ngày một thông báo khi đến giờ tập / chưa hoàn thành to-do.
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="reminder-hour" className="text-sm font-medium">
          Giờ nhắc (theo múi giờ của bạn)
        </label>
        <select
          id="reminder-hour"
          value={reminderHour}
          onChange={(e) => setReminderHour(Number(e.target.value))}
          disabled={!reminderEnabled}
          className="h-9 w-full max-w-xs rounded-md border border-border bg-surface px-3 text-sm disabled:opacity-50"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <p className="text-xs text-text-muted">
          Múi giờ sẽ được phát hiện tự động khi bấm “Lưu cài đặt”. Cron chạy
          hằng giờ; reminder kích hoạt vào giờ này theo giờ địa phương của bạn.
        </p>
      </div>

      <div className="space-y-2 border-t border-border-subtle pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reminderEmailEnabled}
            onChange={(e) => setReminderEmailEnabled(e.target.checked)}
            disabled={!reminderEnabled}
            className="mt-0.5 h-4 w-4 rounded border-border accent-brand disabled:opacity-50"
          />
          <div>
            <p className="text-sm font-medium">Gửi email reminder</p>
            <p className="text-xs text-text-secondary">
              Email sẽ gửi tới{" "}
              <span className="font-medium text-text-primary">
                {userEmail ?? "(chưa có email)"}
              </span>{" "}
              khi reminder tạo ra. Không bao giờ gửi quá 1 email/ngày.
            </p>
            {!emailEnabledServer ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-state-warning">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                Server chưa cấu hình{" "}
                <code className="rounded bg-state-warning/10 px-1">
                  RESEND_API_KEY
                </code>{" "}
                — đang ở chế độ chỉ trong app.
              </p>
            ) : !userEmail ? (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-state-warning">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                Tài khoản Clerk chưa có email — vào Clerk để cập nhật.
              </p>
            ) : null}
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Đang lưu...
            </>
          ) : (
            "Lưu cài đặt"
          )}
        </Button>
        {status.kind === "ok" ? (
          <span className="inline-flex items-center gap-1 text-sm text-state-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {status.message}
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
