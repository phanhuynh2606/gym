import "server-only";

import { connectMongoDB, isMongoConfigured } from "@/lib/mongodb";
import {
  WorkoutPlanModel,
  type WorkoutPlanDocument,
} from "@/models/WorkoutPlan";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";
import type {
  Difficulty,
  Muscle,
  TargetUser,
  WorkoutPlan,
  WorkoutSession,
} from "@/types";

function serializePlanDoc(doc: WorkoutPlanDocument): WorkoutPlan {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    targetUser: doc.targetUser as TargetUser,
    level: doc.level as Difficulty,
    daysPerWeek: doc.daysPerWeek,
    goal: doc.goal ?? "",
    description: doc.description ?? "",
    sessions: (doc.sessions ?? []).map(serializeSession),
  };
}

function serializeSession(
  s: WorkoutPlanDocument["sessions"][number],
): WorkoutSession {
  return {
    id: s.sessionId,
    title: s.title,
    dayIndex: s.dayIndex,
    focus: (s.focus ?? []) as Muscle[],
    exercises: (s.exercises ?? []).map((e) => ({
      exerciseSlug: e.exerciseSlug,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds,
      note: e.note ?? undefined,
    })),
    cardio: s.cardio
      ? {
          title: s.cardio.title,
          durationMinutes: s.cardio.durationMinutes,
          intensity: s.cardio.intensity,
          note: s.cardio.note ?? undefined,
        }
      : undefined,
  };
}

/** Public listing — DB-backed when available + populated, seed otherwise. */
export async function listWorkoutPlans(): Promise<WorkoutPlan[]> {
  if (isMongoConfigured()) {
    await connectMongoDB();
    const docs = await WorkoutPlanModel.find({ isPublished: true })
      .sort({ targetUser: 1, daysPerWeek: 1 })
      .lean<WorkoutPlanDocument[]>();
    if (docs.length > 0) return docs.map(serializePlanDoc);
  }
  return WORKOUT_PLANS;
}

export async function getWorkoutPlanBySlug(
  slug: string,
): Promise<WorkoutPlan | null> {
  if (isMongoConfigured()) {
    await connectMongoDB();
    const doc = await WorkoutPlanModel.findOne({ slug, isPublished: true })
      .lean<WorkoutPlanDocument | null>();
    if (doc) return serializePlanDoc(doc);
  }
  return WORKOUT_PLANS.find((p) => p.slug === slug) ?? null;
}

export type AdminWorkoutPlan = WorkoutPlan & { isPublished: boolean };

export async function listAdminWorkoutPlans(): Promise<AdminWorkoutPlan[]> {
  if (!isMongoConfigured()) {
    return WORKOUT_PLANS.map((p) => ({ ...p, isPublished: true }));
  }
  await connectMongoDB();
  const docs = await WorkoutPlanModel.find({})
    .sort({ targetUser: 1, daysPerWeek: 1 })
    .lean<WorkoutPlanDocument[]>();
  if (docs.length === 0) {
    return WORKOUT_PLANS.map((p) => ({ ...p, isPublished: true }));
  }
  return docs.map((doc) => ({
    ...serializePlanDoc(doc),
    isPublished: doc.isPublished ?? true,
  }));
}

export async function getAdminWorkoutPlanBySlug(
  slug: string,
): Promise<AdminWorkoutPlan | null> {
  if (isMongoConfigured()) {
    await connectMongoDB();
    const doc = await WorkoutPlanModel.findOne({ slug })
      .lean<WorkoutPlanDocument | null>();
    if (doc) {
      return { ...serializePlanDoc(doc), isPublished: doc.isPublished ?? true };
    }
  }
  const seed = WORKOUT_PLANS.find((p) => p.slug === slug);
  return seed ? { ...seed, isPublished: true } : null;
}
