import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import {
  computeMonthlyReview,
  monthKey,
  previousMonth,
} from "@/lib/monthly-review";
import { UserModel } from "@/models/User";

export const dynamic = "force-dynamic";

type CronResultEntry =
  | { clerkId: string; month: string; ok: true; completionRate: number }
  | { clerkId: string; month: string; ok: false; error: string };

/**
 * Vercel cron endpoint: generate the previous month's MonthlyReview for every
 * user with an active plan. Designed to run once per day; the upsert is
 * idempotent so re-running mid-month is safe.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}`. When `CRON_SECRET` is unset
 * (e.g. local dev) the endpoint is open — set the env var to lock it down in
 * production.
 *
 * Vercel cron requests carry the same header automatically; see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
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
  const requestedMonth = url.searchParams.get("month");
  const targetMonth =
    requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
      ? requestedMonth
      : previousMonth(monthKey());

  await connectMongoDB();
  const users = await UserModel.find({
    activePlanSlug: { $exists: true, $ne: null },
  })
    .select({ clerkId: 1, _id: 0 })
    .lean<Array<{ clerkId: string }>>();

  const results: CronResultEntry[] = [];

  for (const user of users) {
    try {
      const review = await computeMonthlyReview(user.clerkId, targetMonth, {
        persist: true,
      });
      results.push({
        clerkId: user.clerkId,
        month: targetMonth,
        ok: true,
        completionRate: review.stats.completionRate,
      });
    } catch (err) {
      results.push({
        clerkId: user.clerkId,
        month: targetMonth,
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({
    month: targetMonth,
    totalUsers: users.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
