"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { connectMongoDB } from "@/lib/mongodb";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";

const DifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);
const TargetEnum = z.enum(["female_weight_loss", "male_beginner"]);
const IntensityEnum = z.enum(["low", "moderate", "high"]);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SessionExerciseSchema = z.object({
  exerciseSlug: z.string().min(1).max(120),
  sets: z.number().int().min(1).max(20),
  reps: z.string().min(1).max(40),
  restSeconds: z.number().int().min(0).max(600),
  note: z.string().max(200).optional(),
});

const CardioSchema = z
  .object({
    title: z.string().min(1).max(80),
    durationMinutes: z.number().int().min(1).max(180),
    intensity: IntensityEnum,
    note: z.string().max(200).optional(),
  })
  .optional();

const SessionSchema = z.object({
  sessionId: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  dayIndex: z.number().int().min(1).max(7),
  focus: z.array(z.string()).min(1).max(6),
  exercises: z.array(SessionExerciseSchema).max(20),
  cardio: CardioSchema,
});

const PlanInputSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z.string().regex(slugPattern),
  targetUser: TargetEnum,
  level: DifficultyEnum,
  daysPerWeek: z.number().int().min(1).max(7),
  goal: z.string().max(400).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  sessions: z.array(SessionSchema).min(1).max(7),
  isPublished: z.boolean().optional().default(true),
});

export type WorkoutPlanFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; slug: string };

function revalidatePlanRoutes(slug: string) {
  revalidatePath("/admin/workout-plans");
  revalidatePath("/giao-an");
  revalidatePath(`/giao-an/${slug}`);
}

function parseSessionsJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formToPlan(form: FormData) {
  return {
    title: String(form.get("title") ?? "").trim(),
    slug: String(form.get("slug") ?? "").trim(),
    targetUser: String(form.get("targetUser") ?? "female_weight_loss"),
    level: String(form.get("level") ?? "beginner"),
    daysPerWeek: Number(form.get("daysPerWeek") ?? 0),
    goal: String(form.get("goal") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    sessions: parseSessionsJson(form.get("sessionsJson")),
    isPublished: form.get("isPublished") === "on",
  };
}

export async function updateWorkoutPlanAction(
  _prev: WorkoutPlanFormState,
  form: FormData,
): Promise<WorkoutPlanFormState> {
  await requireAdmin();
  const originalSlug = String(form.get("originalSlug") ?? "").trim();
  const input = formToPlan(form);
  if (input.sessions === null) {
    return {
      status: "error",
      message: "Lịch tuần không phải JSON hợp lệ.",
    };
  }
  const parsed = PlanInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại các trường được tô đỏ.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  await connectMongoDB();
  if (originalSlug && parsed.data.slug !== originalSlug) {
    const clashing = await WorkoutPlanModel.findOne({ slug: parsed.data.slug });
    if (clashing) {
      return {
        status: "error",
        message: `Slug "${parsed.data.slug}" đã được dùng.`,
      };
    }
  }
  await WorkoutPlanModel.findOneAndUpdate(
    { slug: originalSlug || parsed.data.slug },
    { $set: parsed.data },
    { upsert: true, new: true },
  );
  revalidatePlanRoutes(parsed.data.slug);
  if (originalSlug && parsed.data.slug !== originalSlug) {
    revalidatePath(`/giao-an/${originalSlug}`);
  }
  return { status: "success", slug: parsed.data.slug };
}

export async function togglePublishPlanAction(
  slug: string,
  publish: boolean,
): Promise<void> {
  await requireAdmin();
  await connectMongoDB();
  await WorkoutPlanModel.findOneAndUpdate(
    { slug },
    { $set: { isPublished: publish } },
  );
  revalidatePlanRoutes(slug);
}

export async function deletePlanAction(slug: string): Promise<void> {
  await requireAdmin();
  await connectMongoDB();
  await WorkoutPlanModel.deleteOne({ slug });
  revalidatePlanRoutes(slug);
}
