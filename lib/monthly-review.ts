import "server-only";

import dayjs from "dayjs";
import { connectMongoDB } from "@/lib/mongodb";
import { DailyTodoModel } from "@/models/DailyTodo";
import {
  MonthlyReviewModel,
  type MonthlyReviewDocument,
} from "@/models/MonthlyReview";
import { ProgressLogModel } from "@/models/ProgressLog";
import { UserModel } from "@/models/User";
import { getPlanBySlug } from "@/server/seed/workout-plans";

/** Format a date string (YYYY-MM-DD) or Date into a YYYY-MM month key. */
export function monthKey(input: string | Date = new Date()): string {
  return dayjs(input).format("YYYY-MM");
}

/** Return the YYYY-MM key for the month immediately preceding `month`. */
export function previousMonth(month: string): string {
  return dayjs(`${month}-01`).subtract(1, "month").format("YYYY-MM");
}

/** First/last YYYY-MM-DD day of a YYYY-MM month, inclusive. */
export function monthRange(month: string): { from: string; to: string } {
  const start = dayjs(`${month}-01`);
  return {
    from: start.format("YYYY-MM-DD"),
    to: start.endOf("month").format("YYYY-MM-DD"),
  };
}

/** Localised label e.g. `Tháng 5/2026`. */
export function monthLabel(month: string): string {
  const d = dayjs(`${month}-01`);
  return `Tháng ${d.format("M/YYYY")}`;
}

export type MonthlyStats = {
  month: string;
  numDays: number;
  trainingDays: number;
  restDays: number;
  totalSessions: number;
  plannedSessions: number;
  completedTrainingDays: number;
  completedTodoDays: number;
  missedDays: number;
  completionRate: number;
  longestStreak: number;
  totalVolume: number;
  avgSleepHours: number | null;
  avgWaterLiters: number | null;
  avgEnergyLevel: number | null;
  avgSteps: number | null;
  bodyWeightStart: number | null;
  bodyWeightEnd: number | null;
  weightDeltaKg: number | null;
  cardioPlanned: number;
  cardioCompleted: number;
  bestProgressExerciseSlug: string | null;
  bestProgressNote: string | null;
  recordedMetricsDays: number;
};

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

type DailyTodoLean = {
  date: string;
  type: "training" | "rest" | "recovery";
  tasks?: Array<{ taskId: string; completed?: boolean; required?: boolean }>;
  completionRate?: number;
  bodyWeight?: number;
  sleepHours?: number;
  waterLiters?: number;
  steps?: number;
  energyLevel?: number;
};

type ProgressLogLean = {
  date: string;
  totalVolume?: number;
  exerciseLogs?: Array<{
    exerciseSlug: string;
    completed?: boolean;
    sets?: Array<{ weight?: number; reps?: number }>;
  }>;
};

function avg(values: number[], digits = 1): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  const factor = 10 ** digits;
  return Math.round((sum / values.length) * factor) / factor;
}

function longestRunOfCompletion(todos: DailyTodoLean[]): number {
  // todos sorted by date ascending
  let longest = 0;
  let current = 0;
  for (const t of todos) {
    if ((t.completionRate ?? 0) > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function findBestProgressExercise(logs: ProgressLogLean[]): {
  slug: string | null;
  note: string | null;
} {
  type AggEntry = { firstMax: number; lastMax: number; firstDate: string; lastDate: string };
  const byExercise = new Map<string, AggEntry>();
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  for (const log of sorted) {
    for (const ex of log.exerciseLogs ?? []) {
      const maxWeight = (ex.sets ?? [])
        .map((s) => s.weight ?? 0)
        .reduce((acc, w) => Math.max(acc, w), 0);
      if (maxWeight <= 0) continue;
      const entry = byExercise.get(ex.exerciseSlug);
      if (!entry) {
        byExercise.set(ex.exerciseSlug, {
          firstMax: maxWeight,
          lastMax: maxWeight,
          firstDate: log.date,
          lastDate: log.date,
        });
      } else {
        entry.lastMax = maxWeight;
        entry.lastDate = log.date;
      }
    }
  }

  let bestSlug: string | null = null;
  let bestDelta = 0;
  let bestEntry: AggEntry | null = null;
  for (const [slug, entry] of byExercise) {
    const delta = entry.lastMax - entry.firstMax;
    if (delta > bestDelta) {
      bestSlug = slug;
      bestDelta = delta;
      bestEntry = entry;
    }
  }

  if (!bestSlug || !bestEntry || bestDelta <= 0) {
    return { slug: null, note: null };
  }
  return {
    slug: bestSlug,
    note: `Mức tạ tăng từ ${bestEntry.firstMax} kg lên ${bestEntry.lastMax} kg (+${bestDelta} kg).`,
  };
}

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

  const numDays = todos.length;
  const trainingTodos = todos.filter((t) => t.type === "training");
  const restTodos = todos.filter((t) => t.type !== "training");
  const trainingDays = trainingTodos.length;
  const restDays = restTodos.length;

  // A training day is "completed" if its completionRate ≥ 80%.
  const completedTrainingDays = trainingTodos.filter(
    (t) => (t.completionRate ?? 0) >= 80,
  ).length;
  const completedTodoDays = todos.filter(
    (t) => (t.completionRate ?? 0) >= 80,
  ).length;
  const missedDays = trainingDays - completedTrainingDays;

  const completionRates = todos.map((t) => t.completionRate ?? 0);
  const completionRate =
    completionRates.length === 0
      ? 0
      : Math.round(
          completionRates.reduce((a, b) => a + b, 0) / completionRates.length,
        );

  const longestStreak = longestRunOfCompletion(todos);

  const totalVolume = logs.reduce((acc, l) => acc + (l.totalVolume ?? 0), 0);

  const sleepValues = todos
    .map((t) => t.sleepHours)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const waterValues = todos
    .map((t) => t.waterLiters)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const energyValues = todos
    .map((t) => t.energyLevel)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const stepsValues = todos
    .map((t) => t.steps)
    .filter((v): v is number => typeof v === "number" && v > 0);

  const avgSleepHours = avg(sleepValues, 1);
  const avgWaterLiters = avg(waterValues, 1);
  const avgEnergyLevel = avg(energyValues, 1);
  const avgSteps =
    stepsValues.length === 0
      ? null
      : Math.round(stepsValues.reduce((a, b) => a + b, 0) / stepsValues.length);

  const weightEntries = todos
    .filter((t) => typeof t.bodyWeight === "number" && t.bodyWeight! > 0)
    .map((t) => ({ date: t.date, bodyWeight: t.bodyWeight! }));
  const bodyWeightStart = weightEntries[0]?.bodyWeight ?? null;
  const bodyWeightEnd =
    weightEntries[weightEntries.length - 1]?.bodyWeight ?? null;
  const weightDeltaKg =
    bodyWeightStart !== null && bodyWeightEnd !== null
      ? Math.round((bodyWeightEnd - bodyWeightStart) * 10) / 10
      : null;

  // Cardio adherence: count training tasks where taskId === "workout:cardio".
  let cardioPlanned = 0;
  let cardioCompleted = 0;
  for (const t of trainingTodos) {
    for (const task of t.tasks ?? []) {
      if (task.taskId === "workout:cardio") {
        cardioPlanned += 1;
        if (task.completed) cardioCompleted += 1;
      }
    }
  }

  const { slug: bestProgressExerciseSlug, note: bestProgressNote } =
    findBestProgressExercise(logs);

  const recordedMetricsDays = todos.filter(
    (t) =>
      typeof t.bodyWeight === "number" ||
      typeof t.sleepHours === "number" ||
      typeof t.waterLiters === "number" ||
      typeof t.steps === "number",
  ).length;

  return {
    month,
    numDays,
    trainingDays,
    restDays,
    totalSessions: logs.length,
    plannedSessions: trainingDays,
    completedTrainingDays,
    completedTodoDays,
    missedDays,
    completionRate,
    longestStreak,
    totalVolume,
    avgSleepHours,
    avgWaterLiters,
    avgEnergyLevel,
    avgSteps,
    bodyWeightStart,
    bodyWeightEnd,
    weightDeltaKg,
    cardioPlanned,
    cardioCompleted,
    bestProgressExerciseSlug,
    bestProgressNote,
    recordedMetricsDays,
  };
}

function buildSummaryText(stats: MonthlyStats): string {
  const parts: string[] = [];

  if (stats.trainingDays > 0) {
    parts.push(
      `Bạn hoàn thành ${stats.completedTrainingDays}/${stats.trainingDays} buổi tập theo kế hoạch.`,
    );
  } else {
    parts.push("Tháng này chưa có buổi tập nào trong giáo án.");
  }

  parts.push(`Tỷ lệ hoàn thành to-do trung bình đạt ${stats.completionRate}%.`);

  if (stats.longestStreak >= 3) {
    parts.push(`Streak dài nhất: ${stats.longestStreak} ngày liên tiếp.`);
  }

  if (stats.bestProgressNote) {
    parts.push(stats.bestProgressNote);
  }

  if (stats.weightDeltaKg !== null && stats.bodyWeightStart !== null) {
    const sign = stats.weightDeltaKg > 0 ? "+" : "";
    parts.push(
      `Cân nặng: ${stats.bodyWeightStart} kg → ${stats.bodyWeightEnd} kg (${sign}${stats.weightDeltaKg} kg).`,
    );
  }

  return parts.join(" ");
}

function buildAchievements(stats: MonthlyStats): string[] {
  const out: string[] = [];

  if (stats.completionRate >= 85) {
    out.push(`Tỷ lệ hoàn thành ${stats.completionRate}% — rất xuất sắc.`);
  } else if (stats.completionRate >= 70) {
    out.push(`Tỷ lệ hoàn thành ${stats.completionRate}% — duy trì ổn định.`);
  }

  if (stats.longestStreak >= 7) {
    out.push(`Giữ streak ${stats.longestStreak} ngày liên tiếp.`);
  }

  if (stats.totalVolume > 0) {
    const volume =
      stats.totalVolume >= 1000
        ? `${(stats.totalVolume / 1000).toFixed(1)}k kg·rep`
        : `${stats.totalVolume.toLocaleString()} kg·rep`;
    out.push(`Tổng khối lượng tập luyện: ${volume}.`);
  }

  if (
    stats.cardioPlanned > 0 &&
    stats.cardioCompleted / stats.cardioPlanned >= 0.8
  ) {
    out.push(
      `Cardio đều đặn: ${stats.cardioCompleted}/${stats.cardioPlanned} buổi.`,
    );
  }

  if (
    stats.avgSleepHours !== null &&
    stats.avgSleepHours >= 7 &&
    stats.recordedMetricsDays >= 10
  ) {
    out.push(`Ngủ trung bình ${stats.avgSleepHours} giờ/ngày.`);
  }

  if (
    stats.avgWaterLiters !== null &&
    stats.avgWaterLiters >= 2 &&
    stats.recordedMetricsDays >= 10
  ) {
    out.push(`Uống đủ nước: ${stats.avgWaterLiters} L/ngày.`);
  }

  return out;
}

function buildSuggestions(
  stats: MonthlyStats,
  context: { goal: string | null },
): string[] {
  const out: string[] = [];

  if (stats.completionRate >= 85) {
    out.push(
      "Hoàn thành rất tốt — thử tăng nhẹ mức tạ (5%) hoặc thêm 1 set ở các bài compound.",
    );
  } else if (stats.completionRate >= 60) {
    out.push(
      "Giữ nguyên giáo án hiện tại trong tháng tới, tập trung kỹ thuật và mức tạ đang tăng đều.",
    );
  } else if (stats.trainingDays > 0) {
    out.push(
      "Tỷ lệ hoàn thành dưới 60% — cân nhắc giảm xuống 3-4 buổi/tuần hoặc đơn giản hoá to-do để tạo nhịp đều.",
    );
  }

  if (stats.cardioPlanned > 0 && stats.cardioCompleted / stats.cardioPlanned < 0.5) {
    out.push(
      "Bỏ lỡ nhiều buổi cardio — thử rút ngắn còn 10-15 phút HIIT để dễ duy trì.",
    );
  }

  if (stats.recordedMetricsDays < Math.floor(stats.numDays * 0.4)) {
    out.push(
      "Ghi cân nặng / nước / ngủ đều hơn trong trang Hôm nay để theo dõi tiến độ chính xác.",
    );
  }

  if (
    context.goal === "weight_loss" &&
    stats.weightDeltaKg !== null &&
    stats.weightDeltaKg >= 0 &&
    stats.numDays >= 14
  ) {
    out.push(
      "Mục tiêu giảm cân chưa tiến triển — thêm 1-2 buổi cardio ngắn/tuần hoặc rà soát dinh dưỡng.",
    );
  }

  if (
    context.goal === "muscle_gain" &&
    stats.bestProgressNote === null &&
    stats.totalSessions >= 8
  ) {
    out.push(
      "Mức tạ chưa tăng tháng này — đảm bảo ngủ đủ 7-8h và protein 1.6-2 g/kg để tăng cơ tốt hơn.",
    );
  }

  if (out.length === 0) {
    out.push("Tiếp tục duy trì lịch tập hiện tại. Tháng tới sẽ có thêm dữ liệu để gợi ý chi tiết hơn.");
  }

  return out;
}

function suggestNextPlanSlug(
  currentSlug: string | null,
  stats: MonthlyStats,
): string | null {
  if (!currentSlug) return null;
  if (stats.completionRate >= 60) {
    // Stay on the current plan — already adequate.
    return currentSlug;
  }
  // Below 60% completion → still suggest the same plan but flagged as
  // "giảm tải", because we only have 2 seed plans. The text suggestion
  // covers reducing days/intensity.
  return currentSlug;
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
