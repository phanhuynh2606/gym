"use server";

import { revalidatePath } from "next/cache";
import { connectMongoDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/users";
import { UserModel } from "@/models/User";
import { EXERCISES } from "@/server/seed/exercises";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

const EXERCISE_SLUGS = new Set(EXERCISES.map((e) => e.slug));
const PLAN_SLUGS = new Set(WORKOUT_PLANS.map((p) => p.slug));

export type FavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: string };

async function toggleFavorite(
  field: "favoriteExerciseSlugs" | "favoritePlanSlugs",
  slug: string,
  validSet: Set<string>,
): Promise<FavoriteResult> {
  if (!validSet.has(slug)) {
    return { ok: false, error: "Slug không hợp lệ." };
  }

  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập." };
  }

  await connectMongoDB();

  const current =
    field === "favoriteExerciseSlugs"
      ? user.favoriteExerciseSlugs
      : user.favoritePlanSlugs;
  const isFavorited = current.includes(slug);

  await UserModel.updateOne(
    { clerkId: user.clerkId },
    isFavorited
      ? { $pull: { [field]: slug } }
      : { $addToSet: { [field]: slug } },
  );

  revalidatePath("/yeu-thich");
  if (field === "favoriteExerciseSlugs") {
    revalidatePath(`/bai-tap/${slug}`);
  } else {
    revalidatePath(`/giao-an/${slug}`);
  }

  return { ok: true, favorited: !isFavorited };
}

export async function toggleFavoriteExercise(
  slug: string,
): Promise<FavoriteResult> {
  return toggleFavorite("favoriteExerciseSlugs", slug, EXERCISE_SLUGS);
}

export async function toggleFavoritePlan(
  slug: string,
): Promise<FavoriteResult> {
  return toggleFavorite("favoritePlanSlugs", slug, PLAN_SLUGS);
}
