import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectMongoDB } from "@/lib/mongodb";
import { UserModel, type UserDocument } from "@/models/User";

export type EquipmentAvailability =
  | "full_gym"
  | "home_dumbbell"
  | "bodyweight";

export type MongoUser = {
  clerkId: string;
  email: string | null;
  displayName: string | null;
  gender: "male" | "female" | null;
  goal: "weight_loss" | "muscle_gain" | "toning" | "strength" | null;
  activePlanSlug: string | null;
  activePlanStartedAt: string | null;
  role: "user" | "admin";
  favoriteExerciseSlugs: string[];
  favoritePlanSlugs: string[];
  level: "beginner" | "intermediate" | "advanced" | null;
  equipment: EquipmentAvailability[];
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  birthYear: number | null;
  onboardingCompletedAt: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderEmailEnabled: boolean;
  timezoneOffsetMinutes: number;
  profileSlug: string | null;
  profileVisibility: "public" | "private";
  profileBio: string | null;
};

const EQUIPMENT_VALUES: ReadonlySet<EquipmentAvailability> = new Set([
  "full_gym",
  "home_dumbbell",
  "bodyweight",
]);

function serializeUser(doc: UserDocument): MongoUser {
  return {
    clerkId: doc.clerkId,
    email: doc.email ?? null,
    displayName: doc.displayName ?? null,
    gender: doc.gender ?? null,
    goal: doc.goal ?? null,
    activePlanSlug: doc.activePlanSlug ?? null,
    activePlanStartedAt: doc.activePlanStartedAt
      ? new Date(doc.activePlanStartedAt).toISOString()
      : null,
    role: doc.role ?? "user",
    favoriteExerciseSlugs: doc.favoriteExerciseSlugs ?? [],
    favoritePlanSlugs: doc.favoritePlanSlugs ?? [],
    level: doc.level ?? null,
    equipment: (doc.equipment ?? []).filter((e): e is EquipmentAvailability =>
      EQUIPMENT_VALUES.has(e as EquipmentAvailability),
    ),
    heightCm: doc.heightCm ?? null,
    currentWeightKg: doc.currentWeightKg ?? null,
    targetWeightKg: doc.targetWeightKg ?? null,
    birthYear: doc.birthYear ?? null,
    onboardingCompletedAt: doc.onboardingCompletedAt
      ? new Date(doc.onboardingCompletedAt).toISOString()
      : null,
    reminderEnabled: doc.reminderEnabled ?? true,
    reminderHour:
      typeof doc.reminderHour === "number" && doc.reminderHour >= 0 && doc.reminderHour <= 23
        ? doc.reminderHour
        : 18,
    reminderEmailEnabled: doc.reminderEmailEnabled ?? false,
    timezoneOffsetMinutes:
      typeof doc.timezoneOffsetMinutes === "number"
        ? doc.timezoneOffsetMinutes
        : 420,
    profileSlug: typeof doc.profileSlug === "string" ? doc.profileSlug : null,
    profileVisibility:
      doc.profileVisibility === "public" ? "public" : "private",
    profileBio: typeof doc.profileBio === "string" ? doc.profileBio : null,
  };
}

/**
 * Returns the current Clerk user's MongoDB record, creating it if missing.
 * Returns null when the request is unauthenticated.
 *
 * This is the "lazy webhook fallback" — even without the Clerk webhook
 * configured, signed-in users get an upserted Mongo record on first request.
 */
export async function getOrCreateMongoUser(): Promise<MongoUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  await connectMongoDB();

  const existing = await UserModel.findOne({ clerkId });
  if (existing) return serializeUser(existing);

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    fullName || clerkUser.username || email?.split("@")[0] || "Bạn";

  // Atomic upsert (race-safe): if a concurrent request already inserted this
  // clerkId, `$setOnInsert` is skipped and we return the existing document
  // instead of throwing an E11000 duplicate-key error.
  const doc = await UserModel.findOneAndUpdate(
    { clerkId },
    { $setOnInsert: { clerkId, email, displayName } },
    { upsert: true, new: true },
  );

  return serializeUser(doc);
}

/**
 * Upserts a Mongo user from a Clerk webhook payload (`user.created` /
 * `user.updated`). Returns the resulting Mongo record.
 */
export async function upsertUserFromWebhook(payload: {
  clerkId: string;
  email: string | null;
  displayName: string | null;
}): Promise<MongoUser> {
  await connectMongoDB();
  // Pass `null` through to `$set` (don't coerce to undefined) so that
  // removing the email/name in Clerk clears the field in Mongo instead of
  // leaving the stale value.
  const doc = await UserModel.findOneAndUpdate(
    { clerkId: payload.clerkId },
    {
      $set: {
        email: payload.email,
        displayName: payload.displayName,
      },
      $setOnInsert: { clerkId: payload.clerkId },
    },
    { upsert: true, new: true },
  );
  return serializeUser(doc);
}

export async function deleteUserFromWebhook(clerkId: string): Promise<void> {
  await connectMongoDB();
  await UserModel.deleteOne({ clerkId });
}
