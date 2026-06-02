import "server-only";

import dayjs from "dayjs";
import {
  evaluateAchievements,
  summarizeAchievements,
  type AchievementTier,
} from "@/lib/achievements";
import { computeLifetimeStats } from "@/lib/achievements-data";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { DailyTodoModel } from "@/models/DailyTodo";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";
import {
  GOAL_LABELS_VI,
  GENDER_LABELS_VI,
  LEVEL_LABELS_VI,
} from "@/types";

export type ProfileSnapshot = {
  slug: string;
  displayName: string;
  bio: string | null;
  goalLabel: string | null;
  genderLabel: string | null;
  levelLabel: string | null;
  activePlanSlug: string | null;
  activePlanTitle: string | null;
  joinedAt: string;
  stats: {
    trainingDays30: number;
    completedDays30: number;
    avgCompletion30: number;
    totalVolume30: number;
    currentStreak: number;
    longestStreak30: number;
  };
  gamification: {
    level: number;
    levelLabel: string;
    points: number;
    unlockedCount: number;
    totalBadges: number;
    badges: Array<{
      id: string;
      name: string;
      icon: string;
      tier: AchievementTier;
    }>;
  };
};

/**
 * Slug rules used by both the server action and the model index. Letters and
 * digits only (lowercase via normalisation), plus single hyphens between
 * segments. Reserved words guard against collisions with site routes.
 */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export const SLUG_MIN_LEN = 3;
export const SLUG_MAX_LEN = 30;

// Reserved slugs that conflict with existing routes / would be confusing.
// Kept in lower-case; comparison is case-insensitive via `normalizeSlug`.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "bai-tap",
  "bang-xep-hang",
  "cai-dat",
  "coach",
  "dinh-duong",
  "giao-an",
  "hom-nay",
  "lich-tap",
  "me",
  "nhom-co",
  "onboarding",
  "settings",
  "sign-in",
  "sign-up",
  "sitemap.xml",
  "robots.txt",
  "thanh-tich",
  "thong-bao",
  "tien-do",
  "todo",
  "tong-ket-thang",
  "u",
  "user",
  "yeu-thich",
]);

export function normalizeSlug(input: string): string | null {
  if (typeof input !== "string") return null;
  const lower = input.toLowerCase().trim();
  if (lower.length < SLUG_MIN_LEN || lower.length > SLUG_MAX_LEN) return null;
  if (!SLUG_RE.test(lower)) return null;
  if (RESERVED_SLUGS.has(lower)) return null;
  return lower;
}

function currentStreak(
  todos: Array<{ date: string; completionRate?: number }>,
): number {
  // Count back from today; stop at the first day with no completion.
  let streak = 0;
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate ?? 0);
  for (let i = 0; i < 365; i += 1) {
    const date = dayjs(today()).subtract(i, "day").format("YYYY-MM-DD");
    const rate = byDate.get(date);
    if (rate == null) {
      // No record at all on day i → streak ends. Allow today to be the only
      // "missing" day (user might not have ticked anything yet today).
      if (i === 0) continue;
      break;
    }
    if (rate <= 0) {
      if (i === 0) continue; // grace period for today's not-yet-checked day
      break;
    }
    streak += 1;
  }
  return streak;
}

function longestRun(
  todos: Array<{ date: string; completionRate?: number }>,
  from: string,
  to: string,
): number {
  // Iterate calendar day-by-day across [from, to] (inclusive). Missing
  // days break the streak — without this, e.g. a user with todos for
  // days 1-15 and 21-30 would falsely show a 25-day longest streak.
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate ?? 0);

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

/**
 * Build a redacted public snapshot for `/u/<slug>`. Caller is responsible
 * for verifying `profileVisibility === "public"` first; this helper does
 * NOT enforce visibility (so it can be reused by the owner's preview).
 */
export async function buildProfileSnapshot(
  clerkId: string,
): Promise<ProfileSnapshot | null> {
  await connectMongoDB();

  const user = await UserModel.findOne({ clerkId })
    .select({
      clerkId: 1,
      displayName: 1,
      goal: 1,
      gender: 1,
      level: 1,
      activePlanSlug: 1,
      profileSlug: 1,
      profileBio: 1,
      createdAt: 1,
      _id: 0,
    })
    .lean<{
      clerkId: string;
      displayName?: string | null;
      goal?: string | null;
      gender?: string | null;
      level?: string | null;
      activePlanSlug?: string | null;
      profileSlug?: string | null;
      profileBio?: string | null;
      createdAt?: Date | string;
    } | null>();
  if (!user || !user.profileSlug) return null;

  const from = dayjs(today()).subtract(29, "day").format("YYYY-MM-DD");
  const to = today();

  const [todos, logs] = await Promise.all([
    DailyTodoModel.find({ userId: clerkId, date: { $gte: from, $lte: to } })
      .select({ date: 1, type: 1, completionRate: 1, _id: 0 })
      .sort({ date: 1 })
      .lean<
        Array<{
          date: string;
          type: "training" | "rest" | "recovery";
          completionRate?: number;
        }>
      >(),
    ProgressLogModel.find({
      userId: clerkId,
      date: { $gte: from, $lte: to },
    })
      .select({ totalVolume: 1, _id: 0 })
      .lean<Array<{ totalVolume?: number }>>(),
  ]);

  const trainingDays = todos.filter((t) => t.type === "training").length;
  const completedDays = todos.filter(
    (t) => (t.completionRate ?? 0) >= 80,
  ).length;
  const avgCompletion =
    todos.length === 0
      ? 0
      : Math.round(
          todos.reduce((a, t) => a + (t.completionRate ?? 0), 0) /
            todos.length,
        );
  const totalVolume = logs.reduce((a, l) => a + (l.totalVolume ?? 0), 0);

  const activePlan =
    user.activePlanSlug != null
      ? WORKOUT_PLANS.find((p) => p.slug === user.activePlanSlug) ?? null
      : null;

  // Lifetime-based gamification flair (PR #11). Read-only here: unlocks are
  // persisted/notified via `syncAndEvaluateAchievements`, not on profile view.
  const lifetimeStats = await computeLifetimeStats(clerkId);
  const statuses = evaluateAchievements(lifetimeStats);
  const summary = summarizeAchievements(statuses);
  const tierRank: Record<AchievementTier, number> = {
    platinum: 0,
    gold: 1,
    silver: 2,
    bronze: 3,
  };
  const badges = statuses
    .filter((s) => s.unlocked)
    .sort((a, b) => tierRank[a.tier] - tierRank[b.tier])
    .map((s) => ({ id: s.id, name: s.name, icon: s.icon, tier: s.tier }));

  return {
    slug: user.profileSlug,
    displayName: user.displayName?.trim() || "Bạn tập",
    bio: user.profileBio?.trim() || null,
    goalLabel:
      user.goal && user.goal in GOAL_LABELS_VI
        ? GOAL_LABELS_VI[user.goal as keyof typeof GOAL_LABELS_VI]
        : null,
    genderLabel:
      user.gender && user.gender in GENDER_LABELS_VI
        ? GENDER_LABELS_VI[user.gender as keyof typeof GENDER_LABELS_VI]
        : null,
    levelLabel:
      user.level && user.level in LEVEL_LABELS_VI
        ? LEVEL_LABELS_VI[user.level as keyof typeof LEVEL_LABELS_VI]
        : null,
    activePlanSlug: user.activePlanSlug ?? null,
    activePlanTitle: activePlan?.title ?? null,
    joinedAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : new Date().toISOString(),
    stats: {
      trainingDays30: trainingDays,
      completedDays30: completedDays,
      avgCompletion30: avgCompletion,
      totalVolume30: Math.round(totalVolume),
      currentStreak: currentStreak(todos),
      longestStreak30: longestRun(todos, from, to),
    },
    gamification: {
      level: summary.level,
      levelLabel: summary.levelLabel,
      points: summary.points,
      unlockedCount: summary.unlockedCount,
      totalBadges: summary.total,
      badges,
    },
  };
}

export async function resolvePublicSnapshotBySlug(
  slug: string,
): Promise<ProfileSnapshot | null> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  await connectMongoDB();

  const user = await UserModel.findOne({
    profileSlug: normalized,
    profileVisibility: "public",
  })
    .select({ clerkId: 1, _id: 0 })
    .lean<{ clerkId: string } | null>();
  if (!user) return null;

  return buildProfileSnapshot(user.clerkId);
}
