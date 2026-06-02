"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { syncAndEvaluateAchievements } from "@/lib/achievements-data";
import { notifyWeeklyChallengeIfComplete } from "@/lib/challenges";
import { connectMongoDB } from "@/lib/mongodb";
import { computeCompletionRate } from "@/lib/serializers";
import { DailyTodoModel } from "@/models/DailyTodo";

export type ToggleTaskResult =
  | { ok: true; completed: boolean; completionRate: number }
  | { ok: false; error: string };

export async function toggleTodoTask(
  date: string,
  taskId: string,
): Promise<ToggleTaskResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };

  await connectMongoDB();
  const todo = await DailyTodoModel.findOne({ userId, date });
  if (!todo) return { ok: false, error: "Không có to-do cho ngày này." };

  const task = todo.tasks.find((t) => t.taskId === taskId);
  if (!task) return { ok: false, error: "Không tìm thấy task." };

  task.completed = !task.completed;
  todo.completionRate = computeCompletionRate(todo.tasks);
  todo.markModified("tasks");
  await todo.save();

  // Unlock any achievements this completion may have earned + notify. Best
  // effort: a gamification failure must never break the core to-do toggle.
  try {
    await syncAndEvaluateAchievements(userId);
    await notifyWeeklyChallengeIfComplete(userId);
  } catch {
    // ignore
  }

  revalidatePath("/hom-nay");
  revalidatePath("/todo");
  revalidatePath("/lich-tap");
  revalidatePath("/thanh-tich");

  return {
    ok: true,
    completed: task.completed,
    completionRate: todo.completionRate,
  };
}

export type DailyMetrics = {
  waterLiters?: number;
  sleepHours?: number;
  steps?: number;
  bodyWeight?: number;
  mood?: "bad" | "normal" | "good" | "great";
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  note?: string;
};

export type SaveMetricsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveDailyMetrics(
  date: string,
  metrics: DailyMetrics,
): Promise<SaveMetricsResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };

  await connectMongoDB();

  const update: Record<string, unknown> = {};
  if (metrics.waterLiters !== undefined)
    update.waterLiters = metrics.waterLiters;
  if (metrics.sleepHours !== undefined) update.sleepHours = metrics.sleepHours;
  if (metrics.steps !== undefined) update.steps = metrics.steps;
  if (metrics.bodyWeight !== undefined) update.bodyWeight = metrics.bodyWeight;
  if (metrics.mood !== undefined) update.mood = metrics.mood;
  if (metrics.energyLevel !== undefined)
    update.energyLevel = metrics.energyLevel;
  if (metrics.note !== undefined) update.note = metrics.note;

  if (Object.keys(update).length === 0) return { ok: true };

  const result = await DailyTodoModel.updateOne(
    { userId, date },
    { $set: update },
  );

  if (result.matchedCount === 0) {
    return { ok: false, error: "Không có to-do cho ngày này." };
  }

  revalidatePath("/hom-nay");
  revalidatePath("/todo");

  return { ok: true };
}
