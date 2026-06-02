import { describe, expect, it } from "vitest";
import {
  buildWeeklyChallenge,
  WEEKLY_GOAL_DAYS,
  weekBounds,
} from "@/lib/challenge-utils";

// 2024-06-10 is a Monday; 2024-06-16 the following Sunday.
describe("weekBounds", () => {
  it("anchors to Monday for a midweek date", () => {
    expect(weekBounds("2024-06-12")).toEqual({
      start: "2024-06-10",
      end: "2024-06-16",
    });
  });

  it("keeps Sunday in the same (Mon–Sun) week", () => {
    expect(weekBounds("2024-06-16")).toEqual({
      start: "2024-06-10",
      end: "2024-06-16",
    });
  });

  it("returns the same Monday when given a Monday", () => {
    expect(weekBounds("2024-06-10").start).toBe("2024-06-10");
  });
});

const train = (date: string, completionRate: number) => ({
  date,
  type: "training",
  completionRate,
});

describe("buildWeeklyChallenge", () => {
  it("counts distinct in-week training days with progress", () => {
    const todos = [
      train("2024-06-10", 50),
      train("2024-06-11", 100),
      train("2024-06-11", 0), // same day, no progress → ignored
      { date: "2024-06-12", type: "rest", completionRate: 100 }, // not training
      train("2024-06-13", 80),
      train("2024-06-20", 100), // next week → excluded
    ];
    const c = buildWeeklyChallenge(todos, "2024-06-12");
    expect(c.trainedDays).toBe(3);
    expect(c.goal).toBe(WEEKLY_GOAL_DAYS);
    expect(c.percent).toBe(75);
    expect(c.completed).toBe(false);
    expect(c.weekStart).toBe("2024-06-10");
    expect(c.weekEnd).toBe("2024-06-16");
  });

  it("marks complete and clamps percent at the goal", () => {
    const todos = [
      train("2024-06-10", 100),
      train("2024-06-11", 100),
      train("2024-06-12", 100),
      train("2024-06-13", 100),
      train("2024-06-14", 100),
      train("2024-06-15", 100),
    ];
    const c = buildWeeklyChallenge(todos, "2024-06-12");
    expect(c.trainedDays).toBe(6);
    expect(c.completed).toBe(true);
    expect(c.percent).toBe(100);
  });

  it("is empty when nothing falls in the week", () => {
    const c = buildWeeklyChallenge([train("2024-06-01", 100)], "2024-06-12");
    expect(c.trainedDays).toBe(0);
    expect(c.percent).toBe(0);
    expect(c.completed).toBe(false);
  });
});
