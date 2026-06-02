import "server-only";

import { connectMongoDB } from "@/lib/mongodb";
import {
  buildAchievements,
  buildSuggestions,
  buildSummaryText,
  computeMonthlyStats,
  monthLabel,
  monthRange,
  previousMonth,
  suggestNextPlanSlug,
  type DailyTodoLean,
  type MonthlyStats,
  type ProgressLogLean,
} from "@/lib/monthly-review-utils";
import { DailyTodoModel } from "@/models/DailyTodo";
import {
  MonthlyReviewModel,
  type MonthlyReviewDocument,
} from "@/models/MonthlyReview";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";
import { getPlanBySlug } from "@/server/seed/workout-plans";

export {
  monthKey,
  monthLabel,
  monthRange,
  previousMonth,
} from "@/lib/monthly-review-utils";
export type { MonthlyStats } from "@/lib/monthly-review-utils";

export type MonthlyReviewView = {
  month: string;
  label: string;
  stats: MonthlyStats;
  summaryText: string;
  achievements: string[];
  suggestions: string[];
  suggestedNextPlanSlug: string | null;
  persisted: boolean;
  generatedAt: string | null;
};

/**
 * Read-only aggregation: compute monthly stats from DailyTodo + ProgressLog.
 * Does not write anything to the database.
 */
export async function aggregateMonthlyStats(
  clerkId: string,
  month: string,
): Promise<MonthlyStats> {
  await connectMongoDB();
  const { from, to } = monthRange(month);

  const [todos, logs] = await Promise.all([
    DailyTodoModel.find({
      userId: clerkId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean<DailyTodoLean[]>(),
    ProgressLogModel.find({
      userId: clerkId,
      date: { $gte: from, $lte: to },
    })
      .lean<ProgressLogLean[]>(),
  ]);

  return computeMonthlyStats(month, todos, logs);
}

/**
 * Compute (and optionally persist) a MonthlyReview for the given user + month.
 * Returns the same payload regardless of whether it was newly written.
 */
export async function computeMonthlyReview(
  clerkId: string,
  month: string,
  options: { persist?: boolean } = {},
): Promise<MonthlyReviewView> {
  await connectMongoDB();
  const user = await UserModel.findOne({ clerkId }).lean<{
    activePlanSlug?: string;
    goal?: "weight_loss" | "muscle_gain" | "toning" | "strength";
  } | null>();
  const stats = await aggregateMonthlyStats(clerkId, month);

  const summaryText = buildSummaryText(stats);
  const achievements = buildAchievements(stats);
  const suggestions = buildSuggestions(stats, { goal: user?.goal ?? null });
  const suggestedNextPlanSlug = suggestNextPlanSlug(
    user?.activePlanSlug ?? null,
    stats,
  );

  let persistedAt: string | null = null;

  if (options.persist) {
    const doc = await MonthlyReviewModel.findOneAndUpdate(
      { userId: clerkId, month },
      {
        $set: {
          userId: clerkId,
          month,
          stats: {
            totalSessions: stats.totalSessions,
            plannedSessions: stats.plannedSessions,
            completionRate: stats.completionRate,
            totalVolume: stats.totalVolume,
            avgSleepHours: stats.avgSleepHours ?? undefined,
            avgWaterLiters: stats.avgWaterLiters ?? undefined,
            avgEnergyLevel: stats.avgEnergyLevel ?? undefined,
            bodyWeightStart: stats.bodyWeightStart ?? undefined,
            bodyWeightEnd: stats.bodyWeightEnd ?? undefined,
          },
          summaryText,
          achievements,
          suggestions,
          // Use null (not undefined) so a previously-set slug can be cleared
          // when re-running — Mongoose strips undefined values from $set.
          suggestedNextPlanSlug: suggestedNextPlanSlug ?? null,
        },
      },
      { upsert: true, new: true },
    );
    persistedAt = doc.updatedAt
      ? new Date(doc.updatedAt as unknown as Date).toISOString()
      : new Date().toISOString();
  }

  return {
    month,
    label: monthLabel(month),
    stats,
    summaryText,
    achievements,
    suggestions,
    suggestedNextPlanSlug,
    persisted: Boolean(options.persist),
    generatedAt: persistedAt,
  };
}

/**
 * Load an existing MonthlyReview document or fall back to a live computation.
 */
export async function getOrComputeReview(
  clerkId: string,
  month: string,
): Promise<MonthlyReviewView> {
  await connectMongoDB();
  const existing = await MonthlyReviewModel.findOne({
    userId: clerkId,
    month,
  }).lean<MonthlyReviewDocument | null>();

  if (existing) {
    // Always use freshly aggregated stats so derived fields like
    // weightDeltaKg stay arithmetically consistent with bodyWeightStart /
    // bodyWeightEnd. The persisted document only carries a subset of stat
    // fields, so mixing stored and fresh values previously yielded
    // impossible deltas (e.g. shown end weight 71 with hint "+3 kg"). Only
    // the human-readable fields (summaryText / achievements / suggestions
    // / suggestedNextPlanSlug) are sourced from the persisted snapshot.
    const stats = await aggregateMonthlyStats(clerkId, month);
    return {
      month,
      label: monthLabel(month),
      stats,
      summaryText: existing.summaryText ?? buildSummaryText(stats),
      achievements: existing.achievements ?? [],
      suggestions: existing.suggestions ?? [],
      suggestedNextPlanSlug: existing.suggestedNextPlanSlug ?? null,
      persisted: true,
      generatedAt: existing.updatedAt
        ? new Date(existing.updatedAt as unknown as Date).toISOString()
        : null,
    };
  }

  return computeMonthlyReview(clerkId, month, { persist: false });
}

/**
 * Load (or compute) reviews for `numMonths` ending at `endMonth` (newest first).
 */
export async function getRecentReviews(
  clerkId: string,
  endMonth: string,
  numMonths: number,
): Promise<MonthlyReviewView[]> {
  const months: string[] = [];
  let cursor = endMonth;
  for (let i = 0; i < numMonths; i++) {
    months.push(cursor);
    cursor = previousMonth(cursor);
  }
  const reviews = await Promise.all(
    months.map((m) => getOrComputeReview(clerkId, m)),
  );
  return reviews;
}

/** Resolve a plan slug to a human-readable title for UI display. */
export function describePlan(
  slug: string | null,
): { slug: string; title: string; goal: string } | null {
  if (!slug) return null;
  const plan = getPlanBySlug(slug);
  if (!plan) return null;
  return { slug: plan.slug, title: plan.title, goal: plan.goal };
}
