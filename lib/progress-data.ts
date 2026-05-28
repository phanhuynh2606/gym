import "server-only";

import dayjs from "dayjs";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { DailyTodoModel } from "@/models/DailyTodo";
import { ProgressLogModel } from "@/models/ProgressLog";

export type WeightPoint = { date: string; bodyWeight: number };
export type CompletionPoint = {
  date: string;
  completionRate: number;
  type: "training" | "rest" | "recovery";
};
export type VolumePoint = { date: string; totalVolume: number };
export type MetricsSummary = {
  numDays: number;
  trainingDays: number;
  restDays: number;
  avgCompletionRate: number;
  avgSleepHours: number | null;
  avgWaterLiters: number | null;
  totalSteps: number;
  avgSteps: number;
  totalSessions: number;
  totalVolume: number;
  lastBodyWeight: number | null;
  firstBodyWeight: number | null;
  weightDeltaKg: number | null;
};

/** Returns the YYYY-MM-DD string `daysBack` days before today (inclusive). */
function rangeStart(daysBack: number): string {
  return dayjs(today())
    .subtract(daysBack - 1, "day")
    .format("YYYY-MM-DD");
}

export async function loadProgressForUser(
  clerkId: string,
  daysBack = 30,
): Promise<{
  weight: WeightPoint[];
  completion: CompletionPoint[];
  volume: VolumePoint[];
  summary: MetricsSummary;
}> {
  await connectMongoDB();
  const from = rangeStart(daysBack);
  const to = today();

  const [todos, sessions] = await Promise.all([
    DailyTodoModel.find({
      userId: clerkId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean(),
    ProgressLogModel.find({
      userId: clerkId,
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean(),
  ]);

  const weight: WeightPoint[] = todos
    .filter((t) => typeof t.bodyWeight === "number" && t.bodyWeight > 0)
    .map((t) => ({
      date: t.date,
      bodyWeight: Number(t.bodyWeight),
    }));

  const completion: CompletionPoint[] = todos.map((t) => ({
    date: t.date,
    completionRate: t.completionRate ?? 0,
    type: t.type,
  }));

  const volumeByDate = new Map<string, number>();
  for (const s of sessions) {
    volumeByDate.set(
      s.date,
      (volumeByDate.get(s.date) ?? 0) + (s.totalVolume ?? 0),
    );
  }
  const volume: VolumePoint[] = [...volumeByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalVolume]) => ({ date, totalVolume }));

  const trainingDays = todos.filter((t) => t.type === "training").length;
  const restDays = todos.filter((t) => t.type !== "training").length;

  const completionRates = todos.map((t) => t.completionRate ?? 0);
  const avgCompletionRate =
    completionRates.length === 0
      ? 0
      : Math.round(
          completionRates.reduce((a, b) => a + b, 0) / completionRates.length,
        );

  const sleepValues = todos
    .map((t) => t.sleepHours)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgSleepHours =
    sleepValues.length === 0
      ? null
      : Math.round(
          (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10,
        ) / 10;

  const waterValues = todos
    .map((t) => t.waterLiters)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgWaterLiters =
    waterValues.length === 0
      ? null
      : Math.round(
          (waterValues.reduce((a, b) => a + b, 0) / waterValues.length) * 10,
        ) / 10;

  const stepsValues = todos
    .map((t) => t.steps)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const totalSteps = stepsValues.reduce((a, b) => a + b, 0);
  const avgSteps =
    stepsValues.length === 0
      ? 0
      : Math.round(totalSteps / stepsValues.length);

  const totalVolume = volume.reduce((a, b) => a + b.totalVolume, 0);

  const firstBodyWeight = weight[0]?.bodyWeight ?? null;
  const lastBodyWeight = weight[weight.length - 1]?.bodyWeight ?? null;
  const weightDeltaKg =
    firstBodyWeight !== null && lastBodyWeight !== null
      ? Math.round((lastBodyWeight - firstBodyWeight) * 10) / 10
      : null;

  const summary: MetricsSummary = {
    numDays: daysBack,
    trainingDays,
    restDays,
    avgCompletionRate,
    avgSleepHours,
    avgWaterLiters,
    totalSteps,
    avgSteps,
    totalSessions: sessions.length,
    totalVolume,
    lastBodyWeight,
    firstBodyWeight,
    weightDeltaKg,
  };

  return { weight, completion, volume, summary };
}
