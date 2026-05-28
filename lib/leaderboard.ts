import "server-only";

import dayjs from "dayjs";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { DailyTodoModel } from "@/models/DailyTodo";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";

export type LeaderboardSort = "streak" | "volume" | "completion";

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
};

type AggregatedPerUser = {
  clerkId: string;
  slug: string;
  displayName: string;
  goal: string | null;
  todos: Array<{ date: string; completionRate: number; type: string }>;
  totalVolume: number;
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

function longestRun(rates: number[]): number {
  let longest = 0;
  let cur = 0;
  for (const r of rates) {
    if (r > 0) {
      cur += 1;
      longest = Math.max(longest, cur);
    } else {
      cur = 0;
    }
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
      _id: 0,
    })
    .lean<
      Array<{
        clerkId: string;
        displayName?: string | null;
        profileSlug: string;
        goal?: string | null;
      }>
    >();
  if (users.length === 0) return [];

  const clerkIds = users.map((u) => u.clerkId);

  const [todos, logs] = await Promise.all([
    DailyTodoModel.find({
      userId: { $in: clerkIds },
      date: { $gte: from, $lte: to },
    })
      .select({ userId: 1, date: 1, type: 1, completionRate: 1, _id: 0 })
      .lean<
        Array<{
          userId: string;
          date: string;
          type: string;
          completionRate?: number;
        }>
      >(),
    ProgressLogModel.find({
      userId: { $in: clerkIds },
      date: { $gte: from, $lte: to },
    })
      .select({ userId: 1, totalVolume: 1, _id: 0 })
      .lean<Array<{ userId: string; totalVolume?: number }>>(),
  ]);

  // Aggregate per user.
  const perUser = new Map<string, AggregatedPerUser>();
  for (const u of users) {
    perUser.set(u.clerkId, {
      clerkId: u.clerkId,
      slug: u.profileSlug,
      displayName: u.displayName?.trim() || "Bạn tập",
      goal: u.goal ?? null,
      todos: [],
      totalVolume: 0,
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
    entry.totalVolume += l.totalVolume ?? 0;
  }

  // Materialise leaderboard rows, sort, slice.
  const rows: LeaderboardEntry[] = [];
  for (const agg of perUser.values()) {
    const trainingDays = agg.todos.filter((t) => t.type === "training").length;
    if (trainingDays === 0) continue;
    const rates = agg.todos
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => t.completionRate);
    const avgCompletion =
      rates.length === 0
        ? 0
        : Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    rows.push({
      rank: 0, // assigned after sort
      slug: agg.slug,
      displayName: agg.displayName,
      goalLabel: agg.goal ? GOAL_LABEL[agg.goal] ?? null : null,
      trainingDays30: trainingDays,
      totalVolume30: Math.round(agg.totalVolume),
      avgCompletion30: avgCompletion,
      currentStreak: streakFromToday(agg.todos),
      longestStreak30: longestRun(rates),
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
  };
  rows.sort(sortFns[sort]);

  return rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
}
