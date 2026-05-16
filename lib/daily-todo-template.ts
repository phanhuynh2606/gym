import dayjs from "dayjs";
import { EXERCISES } from "@/server/seed/exercises";
import type { WorkoutPlan } from "@/types";

const EXERCISE_NAMES: Record<string, string> = Object.fromEntries(
  EXERCISES.map((ex) => [ex.slug, ex.nameVi]),
);

/**
 * Map JS weekday (0=Sun … 6=Sat) → plan session `dayIndex` (1-5) or `null`
 * for active rest. Gives 5 training + 2 rest per week.
 */
const WEEKDAY_TO_SESSION: Record<number, number | null> = {
  0: null, // Sun  → rest
  1: 1, // Mon
  2: 2, // Tue
  3: 3, // Wed
  4: null, // Thu  → rest
  5: 4, // Fri
  6: 5, // Sat
};

export type DailyTaskTemplate = {
  taskId: string;
  title: string;
  category: "workout" | "nutrition" | "recovery" | "habit";
  required: boolean;
};

export type DailyTodoTemplate = {
  date: string;
  planSlug: string;
  planDayIndex?: number;
  type: "training" | "rest" | "recovery";
  title: string;
  tasks: DailyTaskTemplate[];
};

const HABIT_TASKS: DailyTaskTemplate[] = [
  {
    taskId: "habit:water",
    title: "Uống đủ 2L nước",
    category: "habit",
    required: false,
  },
  {
    taskId: "habit:sleep",
    title: "Ngủ đủ 7-8 tiếng",
    category: "habit",
    required: false,
  },
  {
    taskId: "nutrition:protein",
    title: "Ăn đủ protein (1-1.6g/kg cân nặng)",
    category: "nutrition",
    required: false,
  },
];

const REST_TASKS: DailyTaskTemplate[] = [
  {
    taskId: "recovery:walk",
    title: "Đi bộ nhẹ 30 phút hoặc yoga giãn cơ",
    category: "recovery",
    required: true,
  },
  ...HABIT_TASKS,
];

export function buildDailyTodoForDate(
  date: string,
  plan: WorkoutPlan,
): DailyTodoTemplate {
  const weekday = dayjs(date).day();
  const sessionDayIndex = WEEKDAY_TO_SESSION[weekday];

  if (sessionDayIndex == null) {
    return {
      date,
      planSlug: plan.slug,
      type: "rest",
      title: "Ngày nghỉ chủ động",
      tasks: REST_TASKS,
    };
  }

  const session = plan.sessions.find((s) => s.dayIndex === sessionDayIndex);
  if (!session) {
    return {
      date,
      planSlug: plan.slug,
      type: "rest",
      title: "Ngày nghỉ chủ động",
      tasks: REST_TASKS,
    };
  }

  const workoutTasks: DailyTaskTemplate[] = session.exercises.map((ex) => ({
    taskId: `workout:${ex.exerciseSlug}`,
    title: `${EXERCISE_NAMES[ex.exerciseSlug] ?? ex.exerciseSlug} — ${ex.sets}×${ex.reps}`,
    category: "workout",
    required: true,
  }));

  if (session.cardio) {
    workoutTasks.push({
      taskId: "workout:cardio",
      title: `Cardio: ${session.cardio.title} (${session.cardio.durationMinutes} phút)`,
      category: "workout",
      required: true,
    });
  }

  return {
    date,
    planSlug: plan.slug,
    planDayIndex: session.dayIndex,
    type: "training",
    title: session.title,
    tasks: [...workoutTasks, ...HABIT_TASKS],
  };
}

export function buildDailyTodosForRange(
  startDate: string,
  numDays: number,
  plan: WorkoutPlan,
): DailyTodoTemplate[] {
  const todos: DailyTodoTemplate[] = [];
  for (let i = 0; i < numDays; i++) {
    const date = dayjs(startDate).add(i, "day").format("YYYY-MM-DD");
    todos.push(buildDailyTodoForDate(date, plan));
  }
  return todos;
}

export function today(): string {
  return dayjs().format("YYYY-MM-DD");
}
