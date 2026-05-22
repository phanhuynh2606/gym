"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enrollPlan } from "@/app/actions/user-plan";
import { connectMongoDB } from "@/lib/mongodb";
import { recommendPlan, type PlanRecommendation } from "@/lib/onboarding";
import { getOrCreateMongoUser } from "@/lib/users";
import { UserModel } from "@/models/User";

const OnboardingSchema = z.object({
  gender: z.enum(["male", "female"]),
  goal: z.enum(["weight_loss", "muscle_gain", "toning", "strength"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z
    .array(z.enum(["full_gym", "home_dumbbell", "bodyweight"]))
    .min(1, "Chọn ít nhất 1 mục."),
  heightCm: z
    .number()
    .int()
    .min(120, "Chiều cao tối thiểu 120cm.")
    .max(230, "Chiều cao tối đa 230cm.")
    .nullable(),
  currentWeightKg: z
    .number()
    .min(30, "Cân nặng tối thiểu 30kg.")
    .max(300, "Cân nặng tối đa 300kg.")
    .nullable(),
  targetWeightKg: z
    .number()
    .min(30, "Cân mục tiêu tối thiểu 30kg.")
    .max(300, "Cân mục tiêu tối đa 300kg.")
    .nullable(),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() - 5)
    .nullable(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export type SaveOnboardingResult =
  | {
      ok: true;
      recommendation: {
        planSlug: string | null;
        planTitle: string | null;
        rationale: string;
        alternativeSlugs: string[];
      };
    }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof OnboardingInput, string>> };

function flattenFieldErrors(
  zodIssues: z.ZodIssue[],
): Partial<Record<keyof OnboardingInput, string>> {
  const out: Partial<Record<keyof OnboardingInput, string>> = {};
  for (const issue of zodIssues) {
    const key = issue.path[0] as keyof OnboardingInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Persists the wizard answers on the user document and returns a personalised
 * plan recommendation. Does NOT auto-enroll — the wizard renders a confirm
 * step where the user can accept or skip.
 */
export async function saveOnboarding(
  raw: OnboardingInput,
): Promise<SaveOnboardingResult> {
  const parsed = OnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vui lòng kiểm tra lại các trường bên dưới.",
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }
  const input = parsed.data;

  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập trước khi onboarding." };
  }

  await connectMongoDB();

  // Pass `null` directly (not `?? undefined`). Mongoose silently strips
  // `undefined` from `$set`, which would mean blanking a field on redo would
  // leave the previous value in the document. `$set: { heightCm: null }` does
  // clear the field.
  await UserModel.updateOne(
    { clerkId: user.clerkId },
    {
      $set: {
        gender: input.gender,
        goal: input.goal,
        level: input.level,
        equipment: input.equipment,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        targetWeightKg: input.targetWeightKg,
        birthYear: input.birthYear,
        onboardingCompletedAt: new Date(),
      },
    },
  );

  const rec: PlanRecommendation = await recommendPlan(input);

  revalidatePath("/onboarding");
  revalidatePath("/hom-nay");
  revalidatePath("/tien-do");

  return {
    ok: true,
    recommendation: {
      planSlug: rec.plan?.slug ?? null,
      planTitle: rec.plan?.title ?? null,
      rationale: rec.rationale,
      alternativeSlugs: rec.alternatives.map((p) => p.slug),
    },
  };
}

/**
 * Enroll the user in the recommended plan. Wraps `enrollPlan` with
 * `preserveProfile: true` so the gender/goal the user just selected in the
 * wizard are not overwritten by the plan's `targetUser` mapping.
 */
export async function enrollRecommendedPlan(
  planSlug: string,
): Promise<{ ok: true; planSlug: string } | { ok: false; error: string }> {
  const result = await enrollPlan(planSlug, { preserveProfile: true });
  if (!result.ok) return result;

  revalidatePath("/onboarding");
  revalidatePath("/hom-nay");
  revalidatePath("/todo");
  revalidatePath("/lich-tap");

  return { ok: true, planSlug: result.planSlug };
}

/**
 * Marks onboarding as completed without saving a profile. Used by the "Bỏ
 * qua" link so we don't keep redirecting the user back to the wizard.
 */
export async function skipOnboarding(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập." };
  }

  await connectMongoDB();
  await UserModel.updateOne(
    { clerkId: user.clerkId },
    { $set: { onboardingCompletedAt: new Date() } },
  );

  revalidatePath("/onboarding");
  revalidatePath("/hom-nay");

  return { ok: true };
}
