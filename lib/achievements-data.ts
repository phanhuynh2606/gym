import "server-only";

import dayjs from "dayjs";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { createNotification } from "@/lib/notifications";
import {
  evaluateAchievements,
  summarizeAchievements,
  ACHIEVEMENTS,
  type AchievementStatus,
  type AchievementSummary,
  type LifetimeStats,
} from "@/lib/achievements";
import { DailyTodoModel } from "@/models/DailyTodo";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";

type TodoRow = { date: string; type: string; completionRate?: number };

function currentStreak(todos: TodoRow[]): number {
  // Count back from today; today gets a grace period (may be un-ticked).
  // Mirrors lib/profile.ts so the value matches the dashboard/profile.
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate ?? 0);
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const date = dayjs(today()).subtract(i, "day").format("YYYY-MM-DD");
    const rate = byDate.get(date);
    if (rate == null) {
      if (i === 0) continue;
      break;
    }
    if (rate <= 0) {
      if (i === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

function longestStreak(todos: TodoRow[]): number {
  // Walk calendar days from the earliest record to today; a gap (missing day
  // or completion <= 0) breaks the run. Iterating actual dates — not array
  // indices — prevents non-consecutive records from inflating the streak.
  if (todos.length === 0) return 0;
  const byDate = new Map<string, number>();
  let earliest = todos[0].date;
  for (const t of todos) {
    byDate.set(t.date, t.completionRate ?? 0);
    if (t.date < earliest) earliest = t.date;
  }

  let longest = 0;
  let cur = 0;
  let cursor = dayjs(earliest);
  const end = dayjs(today());
  while (!cursor.isAfter(end)) {
    const rate = byDate.get(cursor.format("YYYY-MM-DD"));
    if (rate != null && rate > 0) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else {
      cur = 0;
    }
    cursor = cursor.add(1, "day");
  }
  return longest;
}

/**
 * Compute all-time aggregates used by the gamification engine. Unlike the
 * 30-day profile snapshot, these are lifetime so that, e.g., a 100-workout
 * badge reflects the user's entire history.
 */
export async function computeLifetimeStats(
  clerkId: string,
): Promise<LifetimeStats> {
  await connectMongoDB();

  const [todos, volumeAgg, user] = await Promise.all([
    DailyTodoModel.find({ userId: clerkId })
      .select({ date: 1, type: 1, completionRate: 1, _id: 0 })
      .sort({ date: 1 })
      .lean<TodoRow[]>(),
    ProgressLogModel.aggregate<{ _id: null; total: number }>([
      { $match: { userId: clerkId } },
      { $group: { _id: null, total: { $sum: "$totalVolume" } } },
    ]),
    UserModel.findOne({ clerkId })
      .select({
        favoriteExerciseSlugs: 1,
        favoritePlanSlugs: 1,
        profileVisibility: 1,
        _id: 0,
      })
      .lean<{
        favoriteExerciseSlugs?: string[];
        favoritePlanSlugs?: string[];
        profileVisibility?: string;
      } | null>(),
  ]);

  const trainingDaysCompleted = todos.filter(
    (t) => t.type === "training" && (t.completionRate ?? 0) > 0,
  ).length;
  const perfectDays = todos.filter(
    (t) => (t.completionRate ?? 0) >= 100,
  ).length;
  const favoritesCount =
    (user?.favoriteExerciseSlugs?.length ?? 0) +
    (user?.favoritePlanSlugs?.length ?? 0);

  return {
    longestStreak: longestStreak(todos),
    currentStreak: currentStreak(todos),
    trainingDaysCompleted,
    perfectDays,
    totalVolume: Math.round(volumeAgg[0]?.total ?? 0),
    favoritesCount,
    profilePublic: user?.profileVisibility === "public",
  };
}

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export type AchievementsResult = {
  statuses: AchievementStatus[];
  summary: AchievementSummary;
  /** Achievement ids unlocked for the first time during this call. */
  newlyUnlocked: string[];
};

/**
 * Evaluate achievements for `clerkId`, persist any newly-unlocked ids onto the
 * user document, and emit an in-app notification per new unlock (deduped by
 * `achievement:<id>` so it fires exactly once). Safe to call on every page
 * render or to-do toggle.
 */
export async function syncAndEvaluateAchievements(
  clerkId: string,
): Promise<AchievementsResult> {
  const stats = await computeLifetimeStats(clerkId);
  const statuses = evaluateAchievements(stats);
  const summary = summarizeAchievements(statuses);
  const unlockedIds = statuses.filter((s) => s.unlocked).map((s) => s.id);

  const user = await UserModel.findOne({ clerkId })
    .select({ unlockedAchievements: 1, _id: 0 })
    .lean<{
      unlockedAchievements?: Array<{ id: string; unlockedAt?: Date }>;
    } | null>();
  const stored = new Set(
    (user?.unlockedAchievements ?? []).map((a) => a.id),
  );
  const newlyUnlocked = unlockedIds.filter((id) => !stored.has(id));

  if (newlyUnlocked.length > 0) {
    const now = new Date();
    await UserModel.updateOne(
      { clerkId },
      {
        $push: {
          unlockedAchievements: {
            $each: newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
          },
        },
      },
    );

    // Best-effort notifications — never let a delivery failure break the
    // primary flow (page render / to-do toggle).
    await Promise.allSettled(
      newlyUnlocked.map((id) => {
        const a = ACHIEVEMENT_BY_ID.get(id);
        if (!a) return Promise.resolve();
        return createNotification({
          userId: clerkId,
          type: "achievement_unlocked",
          title: `Mở khoá thành tích: ${a.name}`,
          body: `${a.description} +${a.points} điểm.`,
          href: "/thanh-tich",
          dedupeKey: `achievement:${id}`,
        });
      }),
    );
  }

  return { statuses, summary, newlyUnlocked };
}
