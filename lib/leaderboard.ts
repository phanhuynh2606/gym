import "server-only";

import dayjs from "dayjs";
import {
  evaluateAchievements,
  summarizeAchievements,
  type LifetimeStats,
} from "@/lib/achievements";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { DailyTodoModel } from "@/models/DailyTodo";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";

export type LeaderboardSort = "streak" | "volume" | "completion" | "points";

export type LeaderboardEntry = {
  rank: number;
  slug: string;
  displayName: string;
  goalLabel: string | null;
  trainingDays30: number;
  totalVolume30: number;
  avgCompletion30: number;
  currentStreak: number;
  longestStreak30: number;
  // Gamification (lifetime).
  points: number;
  level: number;
  levelLabel: string;
  badgeCount: number;
  totalBadges: number;
};

type AggregatedPerUser = {
  clerkId: string;
  slug: string;
  displayName: string;
  goal: string | null;
  favCount: number;
  /** Lifetime DailyTodo rows; 30-day metrics are derived in-memory. */
  todos: Array<{ date: string; completionRate: number; type: string }>;
  /** Lifetime ProgressLog volumes by date. */
  logs: Array<{ date: string; volume: number }>;
};

function streakFromToday(
  todos: Array<{ date: string; completionRate: number }>,
): number {
  // Same convention as `lib/profile.ts`: today gets a grace period, then
  // every consecutive past day with completion > 0 counts.
  let streak = 0;
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate);
  for (let i = 0; i < 90; i += 1) {
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

function longestRun(
  todos: Array<{ date: string; completionRate: number }>,
  from: string,
  to: string,
): number {
  // Iterate calendar day-by-day across [from, to] (inclusive). A gap in
  // DailyTodo records breaks the streak — see lib/profile.ts for the
  // same fix and rationale.
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate);

  let longest = 0;
  let cur = 0;
  let cursor = dayjs(from);
  const end = dayjs(to);
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

const GOAL_LABEL: Record<string, string> = {
  weight_loss: "Giảm cân",
  muscle_gain: "Tăng cơ",
  toning: "Săn chắc",
  strength: "Tăng sức mạnh",
};

/**
 * Load the top N public-profile users ranked by `sort`. Skips users without
 * a slug or with visibility != "public". Anyone with zero training days in
 * the last 30d is also filtered to keep the board active.
 */
export async function loadLeaderboard(
  sort: LeaderboardSort,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  await connectMongoDB();
  const from = dayjs(today()).subtract(29, "day").format("YYYY-MM-DD");
  const to = today();

  const users = await UserModel.find({
    profileVisibility: "public",
    profileSlug: { $type: "string" },
  })
    .select({
      clerkId: 1,
      displayName: 1,
      profileSlug: 1,
      goal: 1,
      favoriteExerciseSlugs: 1,
      favoritePlanSlugs: 1,
      _id: 0,
    })
    .lean<
      Array<{
        clerkId: string;
        displayName?: string | null;
        profileSlug: string;
        goal?: string | null;
        favoriteExerciseSlugs?: string[];
        favoritePlanSlugs?: string[];
      }>
    >();
  if (users.length === 0) return [];

  const clerkIds = users.map((u) => u.clerkId);

  // Lifetime fetch (no date filter): the gamification metrics (points/level/
  // badges) are all-time, and the 30-day columns are derived in-memory from
  // the same rows, so a single pass per collection covers both windows.
  const [todos, logs] = await Promise.all([
    DailyTodoModel.find({ userId: { $in: clerkIds } })
      .select({ userId: 1, date: 1, type: 1, completionRate: 1, _id: 0 })
      .lean<
        Array<{
          userId: string;
          date: string;
          type: string;
          completionRate?: number;
        }>
      >(),
    ProgressLogModel.find({ userId: { $in: clerkIds } })
      .select({ userId: 1, date: 1, totalVolume: 1, _id: 0 })
      .lean<Array<{ userId: string; date: string; totalVolume?: number }>>(),
  ]);

  // Aggregate per user.
  const perUser = new Map<string, AggregatedPerUser>();
  for (const u of users) {
    perUser.set(u.clerkId, {
      clerkId: u.clerkId,
      slug: u.profileSlug,
      displayName: u.displayName?.trim() || "Bạn tập",
      goal: u.goal ?? null,
      favCount:
        (u.favoriteExerciseSlugs?.length ?? 0) +
        (u.favoritePlanSlugs?.length ?? 0),
      todos: [],
      logs: [],
    });
  }
  for (const t of todos) {
    const entry = perUser.get(t.userId);
    if (!entry) continue;
    entry.todos.push({
      date: t.date,
      type: t.type,
      completionRate: t.completionRate ?? 0,
    });
  }
  for (const l of logs) {
    const entry = perUser.get(l.userId);
    if (!entry) continue;
    entry.logs.push({ date: l.date, volume: l.totalVolume ?? 0 });
  }

  // Materialise leaderboard rows, sort, slice.
  const rows: LeaderboardEntry[] = [];
  for (const agg of perUser.values()) {
    const sortedTodos = [...agg.todos].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // 30-day window (derived from the lifetime rows). The upper bound matters:
    // `generateMonthlyTodos` seeds DailyTodo records up to ~29 days into the
    // future, so without `<= to` those future (0%-completion) rows would
    // inflate trainingDays30 and drag down avgCompletion30.
    const todos30 = sortedTodos.filter((t) => t.date >= from && t.date <= to);
    const trainingDays30 = todos30.filter((t) => t.type === "training").length;
    if (trainingDays30 === 0) continue;
    const rates30 = todos30.map((t) => t.completionRate);
    const avgCompletion30 =
      rates30.length === 0
        ? 0
        : Math.round(rates30.reduce((a, b) => a + b, 0) / rates30.length);
    const totalVolume30 = agg.logs
      .filter((l) => l.date >= from && l.date <= to)
      .reduce((a, l) => a + l.volume, 0);

    // Lifetime gamification stats → points/level/badges (reuses the shared
    // achievement engine so values match the /thanh-tich page).
    const earliest = sortedTodos[0]?.date ?? to;
    const totalVolume = agg.logs.reduce((a, l) => a + l.volume, 0);
    const lifetime: LifetimeStats = {
      longestStreak: longestRun(sortedTodos, earliest, to),
      currentStreak: streakFromToday(agg.todos),
      trainingDaysCompleted: sortedTodos.filter(
        (t) => t.type === "training" && t.completionRate > 0,
      ).length,
      perfectDays: sortedTodos.filter((t) => t.completionRate >= 100).length,
      totalVolume,
      favoritesCount: agg.favCount,
      profilePublic: true,
    };
    const summary = summarizeAchievements(evaluateAchievements(lifetime));

    rows.push({
      rank: 0, // assigned after sort
      slug: agg.slug,
      displayName: agg.displayName,
      goalLabel: agg.goal ? GOAL_LABEL[agg.goal] ?? null : null,
      trainingDays30,
      totalVolume30: Math.round(totalVolume30),
      avgCompletion30,
      currentStreak: streakFromToday(agg.todos),
      longestStreak30: longestRun(todos30, from, to),
      points: summary.points,
      level: summary.level,
      levelLabel: summary.levelLabel,
      badgeCount: summary.unlockedCount,
      totalBadges: summary.total,
    });
  }

  const sortFns: Record<LeaderboardSort, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
    streak: (a, b) =>
      b.currentStreak - a.currentStreak ||
      b.longestStreak30 - a.longestStreak30 ||
      b.avgCompletion30 - a.avgCompletion30,
    volume: (a, b) =>
      b.totalVolume30 - a.totalVolume30 ||
      b.trainingDays30 - a.trainingDays30,
    completion: (a, b) =>
      b.avgCompletion30 - a.avgCompletion30 ||
      b.trainingDays30 - a.trainingDays30,
    points: (a, b) =>
      b.points - a.points ||
      b.badgeCount - a.badgeCount ||
      b.longestStreak30 - a.longestStreak30,
  };
  rows.sort(sortFns[sort]);

  return rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
}
