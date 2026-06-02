import "server-only";

import dayjs from "dayjs";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { createNotification } from "@/lib/notifications";
import { DailyTodoModel } from "@/models/DailyTodo";

/** Training days required to clear the weekly challenge. */
export const WEEKLY_GOAL_DAYS = 4;

export type WeeklyChallenge = {
  goal: number;
  trainedDays: number;
  /** Monday of the current week, YYYY-MM-DD. */
  weekStart: string;
  /** Sunday of the current week, YYYY-MM-DD. */
  weekEnd: string;
  /** Progress toward the goal, 0–100 (clamped). */
  percent: number;
  completed: boolean;
};

/** Monday→Sunday bounds for the week containing today (VN convention). */
function weekBounds(): { start: string; end: string } {
  const t = dayjs(today());
  const offsetToMonday = (t.day() + 6) % 7; // day(): 0=Sun…6=Sat
  const start = t.subtract(offsetToMonday, "day");
  return {
    start: start.format("YYYY-MM-DD"),
    end: start.add(6, "day").format("YYYY-MM-DD"),
  };
}

/**
 * Read-only snapshot of the user's current-week training challenge: how many
 * distinct training days they've made progress on vs. the weekly goal.
 */
export async function computeWeeklyChallenge(
  clerkId: string,
): Promise<WeeklyChallenge> {
  await connectMongoDB();
  const { start, end } = weekBounds();

  const todos = await DailyTodoModel.find({
    userId: clerkId,
    date: { $gte: start, $lte: end },
  })
    .select({ date: 1, type: 1, completionRate: 1, _id: 0 })
    .lean<Array<{ date: string; type: string; completionRate?: number }>>();

  const trainedDays = new Set(
    todos
      .filter((t) => t.type === "training" && (t.completionRate ?? 0) > 0)
      .map((t) => t.date),
  ).size;

  return {
    goal: WEEKLY_GOAL_DAYS,
    trainedDays,
    weekStart: start,
    weekEnd: end,
    percent: Math.min(Math.round((trainedDays / WEEKLY_GOAL_DAYS) * 100), 100),
    completed: trainedDays >= WEEKLY_GOAL_DAYS,
  };
}

/**
 * Fire a one-time notification when the weekly challenge is cleared. Deduped by
 * `weekly:<weekStart>` so it sends exactly once per week regardless of how many
 * extra sessions follow. Best-effort — callers should not let it throw.
 */
export async function notifyWeeklyChallengeIfComplete(
  clerkId: string,
): Promise<void> {
  const ch = await computeWeeklyChallenge(clerkId);
  if (!ch.completed) return;
  await createNotification({
    userId: clerkId,
    type: "challenge_completed",
    title: "Hoàn thành thử thách tuần!",
    body: `Bạn đã tập ${ch.trainedDays}/${ch.goal} buổi trong tuần này. Tuyệt vời!`,
    href: "/thanh-tich",
    dedupeKey: `weekly:${ch.weekStart}`,
  });
}
