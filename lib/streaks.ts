/**
 * Pure streak math shared by the leaderboard (and unit-tested in isolation).
 * No `server-only` / Mongo imports so it can run in Vitest. The conventions
 * mirror `lib/profile.ts`: "today" gets a grace period, and any gap in the
 * day-by-day records breaks a run.
 */
import dayjs from "dayjs";

export type DayRate = { date: string; completionRate: number };

/**
 * Consecutive-day streak counting backwards from `referenceISO`. The reference
 * day itself is a grace day — a missing/zero record there doesn't end the
 * streak, but the first such day *before* it does.
 */
export function currentStreak(
  todos: readonly DayRate[],
  referenceISO: string,
  lookbackDays = 90,
): number {
  const byDate = new Map<string, number>();
  for (const t of todos) byDate.set(t.date, t.completionRate);

  let streak = 0;
  for (let i = 0; i < lookbackDays; i += 1) {
    const date = dayjs(referenceISO).subtract(i, "day").format("YYYY-MM-DD");
    const rate = byDate.get(date);
    if (rate == null || rate <= 0) {
      if (i === 0) continue; // grace period for the reference day
      break;
    }
    streak += 1;
  }
  return streak;
}

/**
 * Longest run of consecutive calendar days with completion > 0 across the
 * inclusive `[from, to]` window. A gap in the records resets the run.
 */
export function longestRun(
  todos: readonly DayRate[],
  from: string,
  to: string,
): number {
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
