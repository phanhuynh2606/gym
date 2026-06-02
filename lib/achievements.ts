/**
 * Gamification engine (PR #11). Pure, dependency-free definitions + evaluation
 * so it can be imported by both server components (`/thanh-tich`, profile
 * snapshot) and unit tests without pulling in `server-only` / Mongo.
 *
 * Achievements are evaluated against a `LifetimeStats` snapshot. Each badge
 * targets a single numeric `metric` and unlocks once `value >= threshold`.
 * Streak badges intentionally key off `longestStreak` (not the live streak)
 * so a badge, once earned, never disappears when a streak resets.
 */

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementCategory =
  | "streak"
  | "consistency"
  | "perfect"
  | "volume"
  | "community";

export type AchievementMetric =
  | "longestStreak"
  | "trainingDaysCompleted"
  | "perfectDays"
  | "totalVolume"
  | "favoritesCount"
  | "profilePublic";

/** Lifetime aggregates that badges are evaluated against. */
export type LifetimeStats = {
  /** Longest run of consecutive calendar days with completion > 0, all-time. */
  longestStreak: number;
  /** Current consecutive-day streak (today gets a grace period). */
  currentStreak: number;
  /** Distinct training days the user actually made progress on (rate > 0). */
  trainingDaysCompleted: number;
  /** Days fully completed (completionRate >= 100). */
  perfectDays: number;
  /** Sum of `ProgressLog.totalVolume` across all time (kg). */
  totalVolume: number;
  /** Saved exercises + plans. */
  favoritesCount: number;
  /** Whether the user opted their profile into the public leaderboard. */
  profilePublic: boolean;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  /** lucide-react icon name; mapped to a component at render time. */
  icon: string;
  tier: AchievementTier;
  category: AchievementCategory;
  metric: AchievementMetric;
  /** Numeric goal. Boolean metrics use a threshold of 1. */
  threshold: number;
  /** Awarded on unlock; drives the player level. */
  points: number;
};

export type AchievementStatus = Achievement & {
  unlocked: boolean;
  /** Current metric value for this user. */
  value: number;
  /** Clamped progress toward `threshold` in the range [0, 1]. */
  progress: number;
};

export const TIER_POINTS: Record<AchievementTier, number> = {
  bronze: 10,
  silver: 25,
  gold: 50,
  platinum: 100,
};

export const CATEGORY_LABELS_VI: Record<AchievementCategory, string> = {
  streak: "Chuỗi ngày",
  consistency: "Chăm chỉ",
  perfect: "Hoàn hảo",
  volume: "Khối lượng",
  community: "Cộng đồng",
};

export const TIER_LABELS_VI: Record<AchievementTier, string> = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  platinum: "Bạch kim",
};

function tier(t: AchievementTier): { tier: AchievementTier; points: number } {
  return { tier: t, points: TIER_POINTS[t] };
}

/**
 * The badge catalogue. Ordered within each category from easiest to hardest so
 * the UI can render a natural progression.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  // ── Streak ──────────────────────────────────────────────────────────────
  {
    id: "streak-3",
    name: "Bắt nhịp",
    description: "Tập luyện 3 ngày liên tiếp.",
    icon: "Flame",
    category: "streak",
    metric: "longestStreak",
    threshold: 3,
    ...tier("bronze"),
  },
  {
    id: "streak-7",
    name: "Tuần lửa",
    description: "Giữ chuỗi 7 ngày liên tiếp.",
    icon: "Flame",
    category: "streak",
    metric: "longestStreak",
    threshold: 7,
    ...tier("silver"),
  },
  {
    id: "streak-14",
    name: "Hai tuần kiên trì",
    description: "Giữ chuỗi 14 ngày liên tiếp.",
    icon: "Flame",
    category: "streak",
    metric: "longestStreak",
    threshold: 14,
    ...tier("gold"),
  },
  {
    id: "streak-30",
    name: "Cỗ máy 30 ngày",
    description: "Giữ chuỗi 30 ngày liên tiếp.",
    icon: "Crown",
    category: "streak",
    metric: "longestStreak",
    threshold: 30,
    ...tier("platinum"),
  },
  // ── Consistency ─────────────────────────────────────────────────────────
  {
    id: "days-1",
    name: "Buổi tập đầu tiên",
    description: "Hoàn thành buổi tập đầu tiên của bạn.",
    icon: "Star",
    category: "consistency",
    metric: "trainingDaysCompleted",
    threshold: 1,
    ...tier("bronze"),
  },
  {
    id: "days-10",
    name: "Mười buổi",
    description: "Hoàn thành 10 ngày tập.",
    icon: "CalendarCheck2",
    category: "consistency",
    metric: "trainingDaysCompleted",
    threshold: 10,
    ...tier("silver"),
  },
  {
    id: "days-30",
    name: "Ba mươi buổi",
    description: "Hoàn thành 30 ngày tập.",
    icon: "CalendarCheck2",
    category: "consistency",
    metric: "trainingDaysCompleted",
    threshold: 30,
    ...tier("gold"),
  },
  {
    id: "days-100",
    name: "Câu lạc bộ trăm buổi",
    description: "Hoàn thành 100 ngày tập.",
    icon: "Medal",
    category: "consistency",
    metric: "trainingDaysCompleted",
    threshold: 100,
    ...tier("platinum"),
  },
  // ── Perfect days ──────────────────────────────────────────────────────────
  {
    id: "perfect-1",
    name: "Trọn vẹn",
    description: "Hoàn thành 100% to-do trong một ngày.",
    icon: "Sparkles",
    category: "perfect",
    metric: "perfectDays",
    threshold: 1,
    ...tier("bronze"),
  },
  {
    id: "perfect-10",
    name: "Mười ngày hoàn hảo",
    description: "Đạt 100% to-do trong 10 ngày.",
    icon: "Sparkles",
    category: "perfect",
    metric: "perfectDays",
    threshold: 10,
    ...tier("gold"),
  },
  // ── Volume ────────────────────────────────────────────────────────────────
  {
    id: "volume-10k",
    name: "10 tấn",
    description: "Nâng tổng cộng 10.000 kg.",
    icon: "Dumbbell",
    category: "volume",
    metric: "totalVolume",
    threshold: 10_000,
    ...tier("bronze"),
  },
  {
    id: "volume-100k",
    name: "100 tấn",
    description: "Nâng tổng cộng 100.000 kg.",
    icon: "Dumbbell",
    category: "volume",
    metric: "totalVolume",
    threshold: 100_000,
    ...tier("silver"),
  },
  {
    id: "volume-500k",
    name: "Nửa triệu",
    description: "Nâng tổng cộng 500.000 kg.",
    icon: "Gem",
    category: "volume",
    metric: "totalVolume",
    threshold: 500_000,
    ...tier("platinum"),
  },
  // ── Community ─────────────────────────────────────────────────────────────
  {
    id: "favorites-5",
    name: "Nhà sưu tầm",
    description: "Lưu 5 bài tập hoặc giáo án yêu thích.",
    icon: "Heart",
    category: "community",
    metric: "favoritesCount",
    threshold: 5,
    ...tier("bronze"),
  },
  {
    id: "profile-public",
    name: "Hoà nhập cộng đồng",
    description: "Công khai hồ sơ và tham gia bảng xếp hạng.",
    icon: "Users",
    category: "community",
    metric: "profilePublic",
    threshold: 1,
    ...tier("silver"),
  },
] as const;

export function metricValue(
  stats: LifetimeStats,
  metric: AchievementMetric,
): number {
  switch (metric) {
    case "longestStreak":
      return stats.longestStreak;
    case "trainingDaysCompleted":
      return stats.trainingDaysCompleted;
    case "perfectDays":
      return stats.perfectDays;
    case "totalVolume":
      return stats.totalVolume;
    case "favoritesCount":
      return stats.favoritesCount;
    case "profilePublic":
      return stats.profilePublic ? 1 : 0;
  }
}

export function evaluateAchievements(
  stats: LifetimeStats,
): AchievementStatus[] {
  return ACHIEVEMENTS.map((a) => {
    const value = metricValue(stats, a.metric);
    const progress =
      a.threshold <= 0 ? 1 : Math.min(value / a.threshold, 1);
    return { ...a, value, progress, unlocked: value >= a.threshold };
  });
}

/** Player level thresholds keyed off total points. Lowest first. */
export const LEVELS: ReadonlyArray<{ minPoints: number; label: string }> = [
  { minPoints: 0, label: "Tân binh" },
  { minPoints: 50, label: "Chăm chỉ" },
  { minPoints: 150, label: "Kiên định" },
  { minPoints: 300, label: "Chiến binh" },
  { minPoints: 500, label: "Huyền thoại" },
];

export type AchievementSummary = {
  unlockedCount: number;
  total: number;
  points: number;
  level: number;
  levelLabel: string;
  /** Points required to reach the next level, or null if at the top. */
  nextLevelPoints: number | null;
  /** Points accumulated within the current level band. */
  pointsIntoLevel: number;
  /** Progress through the current level band in [0, 1] (1 when maxed out). */
  levelProgress: number;
};

export function summarizeAchievements(
  statuses: readonly AchievementStatus[],
): AchievementSummary {
  const unlocked = statuses.filter((s) => s.unlocked);
  const points = unlocked.reduce((sum, s) => sum + s.points, 0);

  let levelIdx = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (points >= LEVELS[i].minPoints) levelIdx = i;
  }
  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1] ?? null;

  const pointsIntoLevel = points - current.minPoints;
  const band = next ? next.minPoints - current.minPoints : 0;
  const levelProgress = next ? Math.min(pointsIntoLevel / band, 1) : 1;

  return {
    unlockedCount: unlocked.length,
    total: statuses.length,
    points,
    level: levelIdx + 1,
    levelLabel: current.label,
    nextLevelPoints: next ? next.minPoints : null,
    pointsIntoLevel,
    levelProgress,
  };
}
