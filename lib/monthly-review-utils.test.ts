import { describe, expect, it } from "vitest";
import {
  avg,
  buildAchievements,
  buildSuggestions,
  buildSummaryText,
  computeMonthlyStats,
  findBestProgressExercise,
  longestRunOfCompletion,
  monthKey,
  monthLabel,
  monthRange,
  previousMonth,
  suggestNextPlanSlug,
  type DailyTodoLean,
  type MonthlyStats,
  type ProgressLogLean,
} from "@/lib/monthly-review-utils";

describe("month date helpers", () => {
  it("derives the YYYY-MM key from a date string or Date", () => {
    expect(monthKey("2026-05-17")).toBe("2026-05");
    expect(monthKey(new Date("2026-12-01T10:00:00Z"))).toBe("2026-12");
  });

  it("steps back across year boundaries", () => {
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(previousMonth("2026-06")).toBe("2026-05");
  });

  it("returns inclusive first/last calendar day of the month", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    // 2024 is a leap year.
    expect(monthRange("2024-02").to).toBe("2024-02-29");
  });

  it("formats a localised label", () => {
    expect(monthLabel("2026-05")).toBe("Tháng 5/2026");
  });
});

describe("avg", () => {
  it("returns null for an empty list and rounds to the given digits", () => {
    expect(avg([])).toBeNull();
    expect(avg([1, 2])).toBe(1.5);
    expect(avg([1, 2, 2], 1)).toBe(1.7);
    expect(avg([10, 20, 33], 0)).toBe(21);
  });
});

describe("longestRunOfCompletion", () => {
  const day = (date: string, completionRate: number): DailyTodoLean => ({
    date,
    type: "training",
    completionRate,
  });

  it("counts the longest contiguous run of completed days", () => {
    expect(
      longestRunOfCompletion([
        day("2026-05-01", 100),
        day("2026-05-02", 50),
        day("2026-05-03", 0), // breaks the run
        day("2026-05-04", 80),
        day("2026-05-05", 90),
        day("2026-05-06", 100),
      ]),
    ).toBe(3);
  });

  it("is zero when no day has progress", () => {
    expect(longestRunOfCompletion([day("2026-05-01", 0)])).toBe(0);
  });
});

describe("findBestProgressExercise", () => {
  it("picks the exercise with the largest first→last max-weight gain", () => {
    const logs: ProgressLogLean[] = [
      {
        date: "2026-05-01",
        exerciseLogs: [
          { exerciseSlug: "squat", sets: [{ weight: 60 }, { weight: 80 }] },
          { exerciseSlug: "bench", sets: [{ weight: 40 }] },
        ],
      },
      {
        date: "2026-05-20",
        exerciseLogs: [
          { exerciseSlug: "squat", sets: [{ weight: 100 }] }, // +20
          { exerciseSlug: "bench", sets: [{ weight: 45 }] }, // +5
        ],
      },
    ];
    const best = findBestProgressExercise(logs);
    expect(best.slug).toBe("squat");
    expect(best.note).toContain("80 kg lên 100 kg (+20 kg)");
  });

  it("returns nulls when nothing improved", () => {
    const logs: ProgressLogLean[] = [
      { date: "2026-05-01", exerciseLogs: [{ exerciseSlug: "squat", sets: [{ weight: 80 }] }] },
      { date: "2026-05-10", exerciseLogs: [{ exerciseSlug: "squat", sets: [{ weight: 80 }] }] },
    ];
    expect(findBestProgressExercise(logs)).toEqual({ slug: null, note: null });
  });
});

describe("computeMonthlyStats", () => {
  it("aggregates training/rest counts, completion, streak and metrics", () => {
    const todos: DailyTodoLean[] = [
      { date: "2026-05-01", type: "training", completionRate: 100, sleepHours: 8, waterLiters: 2.5 },
      { date: "2026-05-02", type: "training", completionRate: 90, sleepHours: 7 },
      { date: "2026-05-03", type: "rest", completionRate: 0 }, // breaks streak
      { date: "2026-05-04", type: "training", completionRate: 50 }, // < 80 → not completed
      { date: "2026-05-05", type: "training", completionRate: 80, bodyWeight: 70 },
      { date: "2026-05-20", type: "training", completionRate: 100, bodyWeight: 69 },
    ];
    const logs: ProgressLogLean[] = [
      { date: "2026-05-01", totalVolume: 1000 },
      { date: "2026-05-02", totalVolume: 500 },
    ];

    const s = computeMonthlyStats("2026-05", todos, logs);
    expect(s.month).toBe("2026-05");
    expect(s.numDays).toBe(6);
    expect(s.trainingDays).toBe(5);
    expect(s.restDays).toBe(1);
    expect(s.completedTrainingDays).toBe(4); // 100,90,80,100 (50 excluded)
    expect(s.missedDays).toBe(1);
    expect(s.plannedSessions).toBe(5);
    expect(s.totalSessions).toBe(2);
    expect(s.totalVolume).toBe(1500);
    // Longest contiguous run with progress: 01,02 then break at 03; then 04,05,...,20 not contiguous by date but array order is used.
    expect(s.longestStreak).toBe(3); // 04,05,20 are consecutive non-zero entries in array order
    expect(s.avgSleepHours).toBe(7.5);
    expect(s.avgWaterLiters).toBe(2.5);
    expect(s.bodyWeightStart).toBe(70);
    expect(s.bodyWeightEnd).toBe(69);
    expect(s.weightDeltaKg).toBe(-1);
  });

  it("handles an empty month without dividing by zero", () => {
    const s = computeMonthlyStats("2026-05", [], []);
    expect(s.completionRate).toBe(0);
    expect(s.avgSleepHours).toBeNull();
    expect(s.weightDeltaKg).toBeNull();
    expect(s.bestProgressExerciseSlug).toBeNull();
  });

  it("counts cardio adherence from training tasks", () => {
    const todos: DailyTodoLean[] = [
      {
        date: "2026-05-01",
        type: "training",
        completionRate: 100,
        tasks: [
          { taskId: "workout:cardio", completed: true },
          { taskId: "workout:bench", completed: true },
        ],
      },
      {
        date: "2026-05-02",
        type: "training",
        completionRate: 100,
        tasks: [{ taskId: "workout:cardio", completed: false }],
      },
    ];
    const s = computeMonthlyStats("2026-05", todos, []);
    expect(s.cardioPlanned).toBe(2);
    expect(s.cardioCompleted).toBe(1);
  });
});

const baseStats = (overrides: Partial<MonthlyStats> = {}): MonthlyStats => ({
  month: "2026-05",
  numDays: 30,
  trainingDays: 20,
  restDays: 10,
  totalSessions: 18,
  plannedSessions: 20,
  completedTrainingDays: 18,
  completedTodoDays: 18,
  missedDays: 2,
  completionRate: 88,
  longestStreak: 8,
  totalVolume: 12000,
  avgSleepHours: 7.5,
  avgWaterLiters: 2.2,
  avgEnergyLevel: 4,
  avgSteps: 9000,
  bodyWeightStart: 72,
  bodyWeightEnd: 70,
  weightDeltaKg: -2,
  cardioPlanned: 8,
  cardioCompleted: 7,
  bestProgressExerciseSlug: "squat",
  bestProgressNote: "Mức tạ tăng từ 80 kg lên 100 kg (+20 kg).",
  recordedMetricsDays: 20,
  ...overrides,
});

describe("buildSummaryText", () => {
  it("summarises sessions, completion, streak and weight", () => {
    const text = buildSummaryText(baseStats());
    expect(text).toContain("18/20 buổi tập");
    expect(text).toContain("88%");
    expect(text).toContain("Streak dài nhất: 8");
    expect(text).toContain("72 kg → 70 kg (-2 kg)");
  });

  it("falls back when there are no training days", () => {
    const text = buildSummaryText(baseStats({ trainingDays: 0, longestStreak: 0 }));
    expect(text).toContain("chưa có buổi tập nào");
  });
});

describe("buildAchievements", () => {
  it("emits high-completion, streak, volume and cardio badges", () => {
    const out = buildAchievements(baseStats());
    expect(out.some((a) => a.includes("rất xuất sắc"))).toBe(true);
    expect(out.some((a) => a.includes("streak 8"))).toBe(true);
    expect(out.some((a) => a.includes("12.0k"))).toBe(true);
    expect(out.some((a) => a.includes("Cardio đều đặn"))).toBe(true);
  });

  it("omits sleep/water badges without enough recorded days", () => {
    const out = buildAchievements(baseStats({ recordedMetricsDays: 5 }));
    expect(out.some((a) => a.includes("Ngủ trung bình"))).toBe(false);
    expect(out.some((a) => a.includes("Uống đủ nước"))).toBe(false);
  });
});

describe("buildSuggestions", () => {
  it("nudges progression when completion is high", () => {
    const out = buildSuggestions(baseStats(), { goal: "muscle_gain" });
    expect(out.some((s) => s.includes("tăng nhẹ mức tạ"))).toBe(true);
  });

  it("flags stalled weight loss", () => {
    const out = buildSuggestions(
      baseStats({ completionRate: 70, weightDeltaKg: 1, numDays: 20 }),
      { goal: "weight_loss" },
    );
    expect(out.some((s) => s.includes("giảm cân chưa tiến triển"))).toBe(true);
  });

  it("always returns at least a fallback suggestion", () => {
    const out = buildSuggestions(
      baseStats({
        completionRate: 65,
        cardioPlanned: 0,
        recordedMetricsDays: 30,
        weightDeltaKg: null,
        bestProgressNote: "x",
      }),
      { goal: null },
    );
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("suggestNextPlanSlug", () => {
  it("returns null without a current plan and otherwise keeps the plan", () => {
    expect(suggestNextPlanSlug(null, baseStats())).toBeNull();
    expect(suggestNextPlanSlug("push-pull-legs", baseStats())).toBe("push-pull-legs");
    expect(
      suggestNextPlanSlug("push-pull-legs", baseStats({ completionRate: 40 })),
    ).toBe("push-pull-legs");
  });
});
