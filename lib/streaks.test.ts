import { describe, expect, it } from "vitest";
import { currentStreak, longestRun, type DayRate } from "@/lib/streaks";

const r = (date: string, completionRate: number): DayRate => ({
  date,
  completionRate,
});

describe("currentStreak", () => {
  it("counts consecutive days back from the reference", () => {
    const todos = [r("2024-06-10", 100), r("2024-06-09", 50), r("2024-06-08", 80)];
    expect(currentStreak(todos, "2024-06-10")).toBe(3);
  });

  it("gives the reference day a grace period when missing", () => {
    // No record for 06-10, but the two prior days count.
    const todos = [r("2024-06-09", 100), r("2024-06-08", 100)];
    expect(currentStreak(todos, "2024-06-10")).toBe(2);
  });

  it("breaks on the first zero/missing day before the reference", () => {
    const todos = [r("2024-06-09", 100), r("2024-06-08", 0), r("2024-06-07", 100)];
    expect(currentStreak(todos, "2024-06-10")).toBe(1);
  });

  it("returns 0 with no data", () => {
    expect(currentStreak([], "2024-06-10")).toBe(0);
  });

  it("never counts beyond the lookback window", () => {
    const todos = Array.from({ length: 10 }, (_, i) =>
      r(`2024-06-${String(10 - i).padStart(2, "0")}`, 100),
    );
    expect(currentStreak(todos, "2024-06-10", 3)).toBe(3);
  });
});

describe("longestRun", () => {
  it("finds the longest consecutive run in the window", () => {
    const todos = [
      r("2024-06-01", 100),
      r("2024-06-02", 100),
      r("2024-06-03", 100),
      // 06-04 missing → break
      r("2024-06-05", 100),
      r("2024-06-06", 100),
      r("2024-06-07", 100),
      r("2024-06-08", 100),
    ];
    expect(longestRun(todos, "2024-06-01", "2024-06-08")).toBe(4);
  });

  it("treats a zero-completion day as a break", () => {
    const todos = [r("2024-06-01", 100), r("2024-06-02", 0), r("2024-06-03", 100)];
    expect(longestRun(todos, "2024-06-01", "2024-06-03")).toBe(1);
  });

  it("returns 0 with no data", () => {
    expect(longestRun([], "2024-06-01", "2024-06-30")).toBe(0);
  });
});
