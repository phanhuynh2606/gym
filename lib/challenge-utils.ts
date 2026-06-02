/**
 * Pure weekly-challenge math (unit-tested in isolation). No `server-only` /
 * Mongo imports — `lib/challenges.ts` wraps these with the DB fetch and
 * notification side effects.
 */
import dayjs from "dayjs";

/** Training days required to clear the weekly challenge. */
export const WEEKLY_GOAL_DAYS = 4;

export type WeeklyChallenge = {
  goal: number;
  trainedDays: number;
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  /** Sunday of the week, YYYY-MM-DD. */
  weekEnd: string;
  /** Progress toward the goal, 0–100 (clamped). */
  percent: number;
  completed: boolean;
};

/** Monday→Sunday bounds for the week containing `referenceISO` (VN convention). */
export function weekBounds(referenceISO: string): {
  start: string;
  end: string;
} {
  const ref = dayjs(referenceISO);
  const offsetToMonday = (ref.day() + 6) % 7; // day(): 0=Sun…6=Sat
  const start = ref.subtract(offsetToMonday, "day");
  return {
    start: start.format("YYYY-MM-DD"),
    end: start.add(6, "day").format("YYYY-MM-DD"),
  };
}

/**
 * Build the weekly-challenge snapshot from a list of todos. Counts distinct
 * training days with progress (rate > 0) that fall inside the reference week.
 */
export function buildWeeklyChallenge(
  todos: ReadonlyArray<{ date: string; type: string; completionRate?: number }>,
  referenceISO: string,
): WeeklyChallenge {
  const { start, end } = weekBounds(referenceISO);

  const trainedDays = new Set(
    todos
      .filter(
        (t) =>
          t.type === "training" &&
          (t.completionRate ?? 0) > 0 &&
          t.date >= start &&
          t.date <= end,
      )
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
