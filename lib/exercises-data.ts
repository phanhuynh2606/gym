import "server-only";

import { connectMongoDB, isMongoConfigured } from "@/lib/mongodb";
import { ExerciseModel, type ExerciseDocument } from "@/models/Exercise";
import { EXERCISES } from "@/server/seed/exercises";
import type {
  Difficulty,
  Equipment,
  Exercise,
  Goal,
  Muscle,
} from "@/types";

/**
 * Read exercises from MongoDB if it's configured + has data, otherwise fall
 * back to the bundled seed array. This lets the public pages keep working in
 * dev without a database while admins can override exercises by writing to
 * Mongo from /admin.
 *
 * Once Mongo has *any* exercise (published or not), the collection is
 * authoritative for both list and detail reads. This is the only way to
 * respect an admin unpublishing a row that also lives in the seed — see the
 * Devin Review thread on the original PR #6.
 */
async function hasAnyDbExercises(): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  await connectMongoDB();
  const count = await ExerciseModel.estimatedDocumentCount();
  return count > 0;
}

function serializeExerciseDoc(doc: ExerciseDocument): Exercise {
  return {
    id: doc._id.toString(),
    nameVi: doc.nameVi,
    nameEn: doc.nameEn,
    slug: doc.slug,
    description: doc.description ?? "",
    primaryMuscles: (doc.primaryMuscles ?? []) as Muscle[],
    secondaryMuscles: (doc.secondaryMuscles ?? []) as Muscle[],
    equipment: (doc.equipment ?? []) as Equipment[],
    difficulty: doc.difficulty as Difficulty,
    goalTags: (doc.goalTags ?? []) as Goal[],
    instructions: doc.instructions ?? [],
    commonMistakes: doc.commonMistakes ?? [],
    tips: doc.tips ?? [],
    imageUrl: doc.imageUrl ?? undefined,
    gifUrl: doc.gifUrl ?? undefined,
    videoUrl: doc.videoUrl ?? undefined,
    youtubeVideoId: doc.youtubeVideoId ?? undefined,
    alternativeSlugs: doc.alternativeSlugs ?? [],
  };
}

/** All exercises visible to the public app (DB if available, seed otherwise). */
export async function listExercises(): Promise<Exercise[]> {
  if (await hasAnyDbExercises()) {
    const docs = await ExerciseModel.find({ isPublished: true })
      .sort({ nameVi: 1 })
      .lean<ExerciseDocument[]>();
    return docs.map(serializeExerciseDoc);
  }
  return EXERCISES;
}

/**
 * One exercise by slug. When Mongo is authoritative we return `null` for
 * unpublished rows or unknown slugs — we deliberately do NOT fall back to the
 * seed in that case, because the seed could otherwise re-surface a row the
 * admin just unpublished at its direct URL.
 */
export async function getExerciseBySlug(slug: string): Promise<Exercise | null> {
  if (await hasAnyDbExercises()) {
    const doc = await ExerciseModel.findOne({ slug, isPublished: true })
      .lean<ExerciseDocument | null>();
    return doc ? serializeExerciseDoc(doc) : null;
  }
  return EXERCISES.find((e) => e.slug === slug) ?? null;
}

/**
 * Admin listing — includes unpublished exercises. Returns the full document
 * shape so /admin can render publish badges + edit links.
 */
export type AdminExercise = Exercise & { isPublished: boolean };

export async function listAdminExercises(): Promise<AdminExercise[]> {
  if (!isMongoConfigured()) {
    return EXERCISES.map((e) => ({ ...e, isPublished: true }));
  }
  await connectMongoDB();
  const docs = await ExerciseModel.find({})
    .sort({ nameVi: 1 })
    .lean<ExerciseDocument[]>();
  if (docs.length === 0) {
    return EXERCISES.map((e) => ({ ...e, isPublished: true }));
  }
  return docs.map((doc) => ({
    ...serializeExerciseDoc(doc),
    isPublished: doc.isPublished ?? true,
  }));
}

export async function getAdminExerciseBySlug(
  slug: string,
): Promise<AdminExercise | null> {
  if (isMongoConfigured()) {
    await connectMongoDB();
    const doc = await ExerciseModel.findOne({ slug })
      .lean<ExerciseDocument | null>();
    if (doc) {
      return { ...serializeExerciseDoc(doc), isPublished: doc.isPublished ?? true };
    }
  }
  const seed = EXERCISES.find((e) => e.slug === slug);
  return seed ? { ...seed, isPublished: true } : null;
}
