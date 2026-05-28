import "server-only";

import type { DailyTodoDocument } from "@/models/DailyTodo";

export type DailyTodoView = {
  date: string;
  planSlug: string | null;
  planDayIndex: number | null;
  type: "training" | "rest" | "recovery";
  title: string;
  tasks: Array<{
    taskId: string;
    title: string;
    category: "workout" | "nutrition" | "recovery" | "habit";
    completed: boolean;
    required: boolean;
  }>;
  waterLiters: number | null;
  sleepHours: number | null;
  steps: number | null;
  bodyWeight: number | null;
  mood: "bad" | "normal" | "good" | "great" | null;
  energyLevel: number | null;
  completionRate: number;
  note: string | null;
};

export function serializeDailyTodo(doc: DailyTodoDocument): DailyTodoView {
  return {
    date: doc.date,
    planSlug: doc.planSlug ?? null,
    planDayIndex: doc.planDayIndex ?? null,
    type: doc.type,
    title: doc.title,
    tasks: (doc.tasks ?? []).map((t) => ({
      taskId: t.taskId,
      title: t.title,
      category: t.category,
      completed: Boolean(t.completed),
      required: Boolean(t.required),
    })),
    waterLiters: doc.waterLiters ?? null,
    sleepHours: doc.sleepHours ?? null,
    steps: doc.steps ?? null,
    bodyWeight: doc.bodyWeight ?? null,
    mood: doc.mood ?? null,
    energyLevel: doc.energyLevel ?? null,
    completionRate: doc.completionRate ?? 0,
    note: doc.note ?? null,
  };
}

export function computeCompletionRate(
  tasks: Array<{ completed: boolean }>,
): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.completed).length;
  return Math.round((done / tasks.length) * 100);
}
