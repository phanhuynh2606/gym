"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { connectMongoDB } from "@/lib/mongodb";
import { ExerciseModel } from "@/models/Exercise";

const DifficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);
const MuscleEnum = z.enum([
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "core",
  "full_body",
]);
const EquipmentEnum = z.enum([
  "dumbbell",
  "barbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "resistance_band",
]);
const GoalEnum = z.enum(["weight_loss", "muscle_gain", "toning", "strength"]);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ExerciseInputSchema = z.object({
  nameVi: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  slug: z.string().regex(slugPattern, {
    message: "slug chỉ chứa a-z, 0-9 và dấu gạch nối",
  }),
  description: z.string().max(2000).optional().default(""),
  primaryMuscles: z.array(MuscleEnum).min(1),
  secondaryMuscles: z.array(MuscleEnum).optional().default([]),
  equipment: z.array(EquipmentEnum).min(1),
  difficulty: DifficultyEnum,
  goalTags: z.array(GoalEnum).optional().default([]),
  instructions: z.array(z.string().min(1).max(500)).optional().default([]),
  commonMistakes: z.array(z.string().min(1).max(500)).optional().default([]),
  tips: z.array(z.string().min(1).max(500)).optional().default([]),
  imageUrl: z.string().url().optional().or(z.literal("")).default(""),
  gifUrl: z.string().url().optional().or(z.literal("")).default(""),
  videoUrl: z.string().url().optional().or(z.literal("")).default(""),
  youtubeVideoId: z.string().max(32).optional().default(""),
  alternativeSlugs: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export type ExerciseFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; slug: string };

function parseLines(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCsv(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formToExercise(form: FormData) {
  return {
    nameVi: String(form.get("nameVi") ?? "").trim(),
    nameEn: String(form.get("nameEn") ?? "").trim(),
    slug: String(form.get("slug") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    primaryMuscles: parseCsv(form.get("primaryMuscles")),
    secondaryMuscles: parseCsv(form.get("secondaryMuscles")),
    equipment: parseCsv(form.get("equipment")),
    difficulty: String(form.get("difficulty") ?? "beginner"),
    goalTags: parseCsv(form.get("goalTags")),
    instructions: parseLines(form.get("instructions")),
    commonMistakes: parseLines(form.get("commonMistakes")),
    tips: parseLines(form.get("tips")),
    imageUrl: String(form.get("imageUrl") ?? "").trim(),
    gifUrl: String(form.get("gifUrl") ?? "").trim(),
    videoUrl: String(form.get("videoUrl") ?? "").trim(),
    youtubeVideoId: String(form.get("youtubeVideoId") ?? "").trim(),
    alternativeSlugs: parseCsv(form.get("alternativeSlugs")),
    isPublished: form.get("isPublished") === "on",
  };
}

function revalidateExerciseRoutes(slug: string) {
  revalidatePath("/admin/exercises");
  revalidatePath("/bai-tap");
  revalidatePath(`/bai-tap/${slug}`);
}

export async function createExerciseAction(
  _prev: ExerciseFormState,
  form: FormData,
): Promise<ExerciseFormState> {
  await requireAdmin();
  const parsed = ExerciseInputSchema.safeParse(formToExercise(form));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại các trường được tô đỏ.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  await connectMongoDB();
  const existing = await ExerciseModel.findOne({ slug: parsed.data.slug });
  if (existing) {
    return {
      status: "error",
      message: `Slug "${parsed.data.slug}" đã tồn tại — chọn slug khác.`,
    };
  }
  await ExerciseModel.create({
    ...parsed.data,
    imageUrl: parsed.data.imageUrl || undefined,
    gifUrl: parsed.data.gifUrl || undefined,
    videoUrl: parsed.data.videoUrl || undefined,
    youtubeVideoId: parsed.data.youtubeVideoId || undefined,
  });
  revalidateExerciseRoutes(parsed.data.slug);
  return { status: "success", slug: parsed.data.slug };
}

export async function updateExerciseAction(
  _prev: ExerciseFormState,
  form: FormData,
): Promise<ExerciseFormState> {
  await requireAdmin();
  const originalSlug = String(form.get("originalSlug") ?? "").trim();
  if (!originalSlug) {
    return { status: "error", message: "Thiếu slug bài tập gốc." };
  }
  const parsed = ExerciseInputSchema.safeParse(formToExercise(form));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại các trường được tô đỏ.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  await connectMongoDB();
  if (parsed.data.slug !== originalSlug) {
    const clashing = await ExerciseModel.findOne({ slug: parsed.data.slug });
    if (clashing) {
      return {
        status: "error",
        message: `Slug "${parsed.data.slug}" đã được dùng.`,
      };
    }
  }
  await ExerciseModel.findOneAndUpdate(
    { slug: originalSlug },
    {
      $set: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
        gifUrl: parsed.data.gifUrl || null,
        videoUrl: parsed.data.videoUrl || null,
        youtubeVideoId: parsed.data.youtubeVideoId || null,
      },
    },
    { upsert: true, new: true },
  );
  revalidateExerciseRoutes(parsed.data.slug);
  if (parsed.data.slug !== originalSlug) {
    revalidatePath(`/bai-tap/${originalSlug}`);
  }
  return { status: "success", slug: parsed.data.slug };
}

export async function deleteExerciseAction(slug: string): Promise<void> {
  await requireAdmin();
  await connectMongoDB();
  await ExerciseModel.deleteOne({ slug });
  revalidateExerciseRoutes(slug);
}

export async function togglePublishExerciseAction(
  slug: string,
  publish: boolean,
): Promise<void> {
  await requireAdmin();
  await connectMongoDB();
  await ExerciseModel.findOneAndUpdate(
    { slug },
    { $set: { isPublished: publish } },
  );
  revalidateExerciseRoutes(slug);
}
