import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getBaseUrl } from "@/lib/constants";
import { createNotification, markEmailSent } from "@/lib/notifications";
import {
  isEmailConfigured,
  reminderEmailHtml,
  sendEmail,
} from "@/lib/email";
import { DailyTodoModel } from "@/models/DailyTodo";
import { UserModel } from "@/models/User";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Result =
  | {
      clerkId: string;
      ok: true;
      created: boolean;
      reason: "due" | "skipped";
      emailed?: "sent" | "skipped" | "failed";
    }
  | { clerkId: string; ok: false; error: string };

/**
 * Vercel cron endpoint: scan all opted-in users whose local "reminder hour"
 * matches the current UTC hour, and create an in-app reminder when today's
 * to-do is incomplete. Designed to run hourly via vercel.json so each user
 * fires at most once per day in their own timezone.
 *
 * - Dedupes via `Notification.dedupeKey = reminder:<date>:<userId>` so
 *   re-running mid-window is idempotent.
 * - Sends an optional Resend email when the user opted into email and
 *   `RESEND_API_KEY` is set. Email failure does NOT block the in-app
 *   notification.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (same pattern as the monthly
 * review cron). When `CRON_SECRET` is unset the endpoint is open — set the
 * env var to lock down in production.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    if (provided !== cronSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  // Allow `?force=1` (admin/manual run) to skip the per-user hour gate so
  // the endpoint stays useful during local testing. Cron requests don't
  // pass this flag, so production behaviour is unchanged.
  const force = url.searchParams.get("force") === "1";
  // Allow `?userId=<clerkId>` to target a single user (useful when admin
  // testing or when retrying a transient failure).
  const onlyUserId = url.searchParams.get("userId");

  const baseUrl = getBaseUrl();
  const emailEnabled = isEmailConfigured();
  const utcHour = new Date().getUTCHours();

  await connectMongoDB();
  const filter: Record<string, unknown> = {
    activePlanSlug: { $exists: true, $ne: null },
  };
  if (onlyUserId) filter.clerkId = onlyUserId;
  else filter.reminderEnabled = { $ne: false };

  const users = await UserModel.find(filter)
    .select({
      clerkId: 1,
      email: 1,
      displayName: 1,
      reminderEnabled: 1,
      reminderHour: 1,
      reminderEmailEnabled: 1,
      timezoneOffsetMinutes: 1,
      _id: 0,
    })
    .lean<
      Array<{
        clerkId: string;
        email?: string | null;
        displayName?: string | null;
        reminderEnabled?: boolean;
        reminderHour?: number;
        reminderEmailEnabled?: boolean;
        timezoneOffsetMinutes?: number;
      }>
    >();

  const results: Result[] = [];

  for (const user of users) {
    try {
      const hour =
        typeof user.reminderHour === "number" ? user.reminderHour : 18;
      const tzOffset =
        typeof user.timezoneOffsetMinutes === "number"
          ? user.timezoneOffsetMinutes
          : 420;

      // Convert the user's reminder hour (local) to UTC.
      // `Date.getTimezoneOffset()` returns minutes WEST of UTC, so for
      // ICT (UTC+7) it returns -420. We treat positive offsets as "ahead
      // of UTC" the way Intl exposes it: localHour = utcHour + tz/60.
      // Equivalently: utcHourForReminder = (localReminderHour - tz/60).
      const utcHourForReminder = ((hour - tzOffset / 60) % 24 + 24) % 24;
      // Round to integer hour so we match the cron grid (which fires once
      // per hour at minute 0). Users whose tz offset isn't a whole hour
      // will fire on the nearest hour boundary.
      const targetHour = Math.round(utcHourForReminder) % 24;

      if (!force && targetHour !== utcHour) {
        results.push({
          clerkId: user.clerkId,
          ok: true,
          created: false,
          reason: "skipped",
        });
        continue;
      }

      // Use the user's local "today" so that someone past midnight UTC but
      // still on yesterday's local day gets a reminder for the right todo.
      //
      // Compute from `Date.now()` (timezone-independent UTC ms) + the user's
      // tz offset, then format via `toISOString()` which always treats the
      // shifted value as UTC. This stays correct on a non-UTC server (e.g.
      // a local dev box), unlike `dayjs().add(tzOffset, "minute")` which
      // would double-count the server's own timezone offset.
      const localToday = new Date(Date.now() + tzOffset * 60_000)
        .toISOString()
        .slice(0, 10);

      const todo = await DailyTodoModel.findOne({
        userId: user.clerkId,
        date: localToday,
      })
        .select({ type: 1, title: 1, completionRate: 1, _id: 0 })
        .lean<{ type?: string; title?: string; completionRate?: number } | null>();

      if (!todo) {
        results.push({
          clerkId: user.clerkId,
          ok: true,
          created: false,
          reason: "skipped",
        });
        continue;
      }
      if ((todo.completionRate ?? 0) >= 1) {
        results.push({
          clerkId: user.clerkId,
          ok: true,
          created: false,
          reason: "skipped",
        });
        continue;
      }

      const isTraining = todo.type === "training";
      const title = isTraining
        ? "Đến giờ tập rồi!"
        : "Đừng quên check-in hôm nay";
      const body = isTraining
        ? `${todo.title ?? "Buổi tập hôm nay"} — vào ngay /hom-nay để tick từng set khi tập xong.`
        : "Ghi lại nước, ngủ, mood + tick các habit của hôm nay tại /hom-nay.";

      const { doc, created } = await createNotification({
        userId: user.clerkId,
        type: isTraining ? "reminder_workout" : "reminder_todo",
        title,
        body,
        href: "/hom-nay",
        dedupeKey: `reminder:${localToday}:${user.clerkId}`,
      });

      let emailed: "sent" | "skipped" | "failed" = "skipped";
      const shouldEmail =
        created &&
        emailEnabled &&
        user.reminderEmailEnabled === true &&
        typeof user.email === "string" &&
        user.email.length > 0;

      if (shouldEmail && user.email) {
        const send = await sendEmail({
          to: user.email,
          subject: title,
          text: `${body}\n\nMở /hom-nay: ${baseUrl}/hom-nay`,
          html: reminderEmailHtml({
            displayName: user.displayName ?? null,
            title,
            body,
            appUrl: baseUrl,
            ctaHref: "/hom-nay",
            ctaLabel: "Mở Hôm nay",
          }),
        });
        if (send.ok) {
          await markEmailSent(doc._id.toString());
          emailed = "sent";
        } else {
          // Graceful fallback: in-app notification stays, email is just skipped.
          emailed = "failed";
        }
      }

      results.push({
        clerkId: user.clerkId,
        ok: true,
        created,
        reason: "due",
        emailed,
      });
    } catch (err) {
      results.push({
        clerkId: user.clerkId,
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({
    utcHour,
    emailConfigured: emailEnabled,
    totalScanned: users.length,
    created: results.filter((r) => r.ok && r.created).length,
    skipped: results.filter((r) => r.ok && !r.created).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
