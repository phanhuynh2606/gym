"use server";

import { revalidatePath } from "next/cache";
import { connectMongoDB } from "@/lib/mongodb";
import {
  buildDailyTodosForRange,
  today,
} from "@/lib/daily-todo-template";
import { getOrCreateMongoUser } from "@/lib/users";
import { DailyTodoModel } from "@/models/DailyTodo";
import { UserModel } from "@/models/User";
import { getPlanBySlug, WORKOUT_PLANS } from "@/server/seed/workout-plans";

const VALID_PLAN_SLUGS = new Set(WORKOUT_PLANS.map((p) => p.slug));

const TARGET_USER_TO_GOAL: Record<string, "weight_loss" | "muscle_gain"> = {
  female_weight_loss: "weight_loss",
  male_beginner: "muscle_gain",
};

const TARGET_USER_TO_GENDER: Record<string, "female" | "male"> = {
  female_weight_loss: "female",
  male_beginner: "male",
};

export type EnrollPlanResult =
  | { ok: true; planSlug: string; todosCreated: number }
  | { ok: false; error: string };

export async function enrollPlan(planSlug: string): Promise<EnrollPlanResult> {
  if (!VALID_PLAN_SLUGS.has(planSlug)) {
    return { ok: false, error: "Giáo án không hợp lệ." };
  }

  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập để chọn giáo án." };
  }

  const plan = getPlanBySlug(planSlug);
  if (!plan) {
    return { ok: false, error: "Không tìm thấy giáo án." };
  }

  await connectMongoDB();

  await UserModel.updateOne(
    { clerkId: user.clerkId },
    {
      $set: {
        activePlanSlug: plan.slug,
        activePlanStartedAt: new Date(),
        gender: TARGET_USER_TO_GENDER[plan.targetUser],
        goal: TARGET_USER_TO_GOAL[plan.targetUser],
      },
    },
  );

  const todos = buildDailyTodosForRange(today(), 30, plan).map((t) => ({
    ...t,
    userId: user.clerkId,
  }));

  await Promise.all(
    todos.map((t) =>
      DailyTodoModel.updateOne(
        { userId: t.userId, date: t.date },
        { $set: t },
        { upsert: true },
      ),
    ),
  );

  revalidatePath("/hom-nay");
  revalidatePath("/todo");
  revalidatePath("/lich-tap");

  return { ok: true, planSlug: plan.slug, todosCreated: todos.length };
}

/**
 * Ensures the next `numDays` days have a `DailyTodo` for the current user.
 * Used to refill at month rollover or when the user enrolled long ago.
 */
export async function generateMonthlyTodos(
  numDays = 30,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập." };
  }
  if (!user.activePlanSlug) {
    return { ok: false, error: "Bạn chưa chọn giáo án." };
  }
  const plan = getPlanBySlug(user.activePlanSlug);
  if (!plan) {
    return { ok: false, error: "Giáo án hiện tại đã bị xoá." };
  }

  await connectMongoDB();

  const todos = buildDailyTodosForRange(today(), numDays, plan).map((t) => ({
    ...t,
    userId: user.clerkId,
  }));

  // Only insert dates that don't already have a todo (preserve completion state).
  const existing = await DailyTodoModel.find({
    userId: user.clerkId,
    date: { $in: todos.map((t) => t.date) },
  })
    .select({ date: 1, _id: 0 })
    .lean();
  const existingDates = new Set(existing.map((e) => e.date));
  const toInsert = todos.filter((t) => !existingDates.has(t.date));

  if (toInsert.length > 0) {
    await DailyTodoModel.insertMany(toInsert);
  }

  revalidatePath("/hom-nay");
  revalidatePath("/todo");
  revalidatePath("/lich-tap");

  return { ok: true, created: toInsert.length };
}
