"use server";

import { revalidatePath } from "next/cache";
import {
  computeMonthlyReview,
  monthKey,
  type MonthlyReviewView,
} from "@/lib/monthly-review";
import { getOrCreateMongoUser } from "@/lib/users";

export type GenerateMonthlyReviewResult =
  | { ok: true; review: MonthlyReviewView }
  | { ok: false; error: string };

/**
 * Manually trigger a monthly-review generation for the currently signed-in
 * user. If `month` is omitted, generates for the current month. The result is
 * persisted to the MonthlyReview collection (idempotent — re-running updates
 * the same document).
 */
export async function generateMonthlyReview(
  month?: string,
): Promise<GenerateMonthlyReviewResult> {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập." };
  }

  const target = month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey();

  const review = await computeMonthlyReview(user.clerkId, target, {
    persist: true,
  });

  revalidatePath("/tong-ket-thang");

  return { ok: true, review };
}
