import "server-only";

import {
  buildWeeklyChallenge,
  weekBounds,
  WEEKLY_GOAL_DAYS,
  type WeeklyChallenge,
} from "@/lib/challenge-utils";
import { today } from "@/lib/daily-todo-template";
import { connectMongoDB } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { DailyTodoModel } from "@/models/DailyTodo";

export { WEEKLY_GOAL_DAYS };
export type { WeeklyChallenge };

/**
 * Read-only snapshot of the user's current-week training challenge: how many
 * distinct training days they've made progress on vs. the weekly goal.
 */
export async function computeWeeklyChallenge(
  clerkId: string,
): Promise<WeeklyChallenge> {
  await connectMongoDB();
  const ref = today();
  const { start, end } = weekBounds(ref);

  const todos = await DailyTodoModel.find({
    userId: clerkId,
    date: { $gte: start, $lte: end },
  })
    .select({ date: 1, type: 1, completionRate: 1, _id: 0 })
    .lean<Array<{ date: string; type: string; completionRate?: number }>>();

  return buildWeeklyChallenge(todos, ref);
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
