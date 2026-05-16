import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { connectMongoDB } from "@/lib/mongodb";
import { UserModel, type UserDocument } from "@/models/User";

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
};

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

  const created = await UserModel.create({
    clerkId,
    email,
    displayName,
  });

  return serializeUser(created);
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
  const doc = await UserModel.findOneAndUpdate(
    { clerkId: payload.clerkId },
    {
      $set: {
        email: payload.email ?? undefined,
        displayName: payload.displayName ?? undefined,
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
