import "server-only";

import dayjs from "dayjs";
import { loadProgressForUser, type MetricsSummary } from "@/lib/progress-data";
import { today } from "@/lib/daily-todo-template";
import type { MongoUser } from "@/lib/users";
import { getPlanBySlug } from "@/server/seed/workout-plans";
import {
  GOAL_LABELS_VI,
  DIFFICULTY_LABELS_VI,
  EQUIPMENT_LABELS_VI,
  type Equipment as ExerciseEquipment,
} from "@/types";

export type CoachContext = {
  profile: {
    displayName: string;
    gender: "male" | "female" | null;
    goal: MongoUser["goal"];
    level: MongoUser["level"];
    equipment: MongoUser["equipment"];
    heightCm: number | null;
    currentWeightKg: number | null;
    targetWeightKg: number | null;
    bmi: number | null;
    weightToGoKg: number | null;
  };
  plan: {
    slug: string | null;
    title: string | null;
    daysPerWeek: number | null;
    targetUser: string | null;
  };
  progress: {
    last7DaysCompletion: number;
    last30DaysCompletion: number;
    last7DaysTrainingDays: number;
    last30DaysTrainingDays: number;
    weightDeltaKg30d: number | null;
    consecutiveMissedDays: number;
    streakDays: number;
  };
};

export type SerializedCoachContext = CoachContext;

const EQUIPMENT_LABELS_AVAIL: Record<string, string> = {
  full_gym: "Gym đầy đủ (máy + tạ đòn + dumbbell + cable)",
  home_dumbbell: "Dumbbell tại nhà / dây kháng lực",
  bodyweight: "Tay không",
};

/**
 * Builds a complete snapshot of who the user is + how they're doing recently.
 * Used by both the LLM prompt builder and the fallback advisor.
 */
export async function buildCoachContext(
  user: MongoUser,
): Promise<CoachContext> {
  const { summary, completion } = await loadProgressForUser(user.clerkId, 30);

  const todayStr = today();
  const last7Cutoff = dayjs(todayStr).subtract(6, "day").format("YYYY-MM-DD");

  const last7 = completion.filter((c) => c.date >= last7Cutoff);
  const last7TrainingDays = last7.filter((c) => c.type === "training").length;
  const last7Avg =
    last7.length === 0
      ? 0
      : Math.round(
          last7.reduce((a, b) => a + b.completionRate, 0) / last7.length,
        );

  const sortedDesc = [...completion].sort((a, b) => b.date.localeCompare(a.date));
  let consecutiveMissedDays = 0;
  for (const c of sortedDesc) {
    if (c.type !== "training") continue;
    if ((c.completionRate ?? 0) >= 50) break;
    consecutiveMissedDays++;
  }

  let streakDays = 0;
  for (const c of sortedDesc) {
    if (c.type !== "training") continue;
    if ((c.completionRate ?? 0) >= 50) {
      streakDays++;
    } else {
      break;
    }
  }

  const heightCm = user.heightCm;
  const currentWeightKg = user.currentWeightKg;
  const targetWeightKg = user.targetWeightKg;

  const bmi =
    heightCm && currentWeightKg
      ? Math.round(((currentWeightKg / (heightCm / 100) ** 2) * 10)) / 10
      : null;
  const weightToGoKg =
    currentWeightKg && targetWeightKg
      ? Math.round((targetWeightKg - currentWeightKg) * 10) / 10
      : null;

  const plan = user.activePlanSlug ? getPlanBySlug(user.activePlanSlug) : null;

  return {
    profile: {
      displayName: user.displayName ?? "bạn",
      gender: user.gender,
      goal: user.goal,
      level: user.level,
      equipment: user.equipment,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      bmi,
      weightToGoKg,
    },
    plan: {
      slug: plan?.slug ?? null,
      title: plan?.title ?? null,
      daysPerWeek: plan?.daysPerWeek ?? null,
      targetUser: plan?.targetUser ?? null,
    },
    progress: {
      last7DaysCompletion: last7Avg,
      last30DaysCompletion: summary.avgCompletionRate,
      last7DaysTrainingDays: last7TrainingDays,
      last30DaysTrainingDays: summary.trainingDays,
      weightDeltaKg30d: summary.weightDeltaKg,
      consecutiveMissedDays,
      streakDays,
    },
  };
}

/**
 * Render the context as a compact Vietnamese paragraph that can be embedded
 * in either an LLM system prompt or shown to the user in a sidebar.
 */
export function renderContextAsParagraph(ctx: CoachContext): string {
  const lines: string[] = [];
  const p = ctx.profile;
  const g = ctx.progress;

  const genderVi = p.gender === "female" ? "nữ" : p.gender === "male" ? "nam" : "—";
  const goalVi = p.goal ? GOAL_LABELS_VI[p.goal] : "chưa đặt mục tiêu";
  const levelVi = p.level ? DIFFICULTY_LABELS_VI[p.level] : "—";
  const equipmentVi = p.equipment.length
    ? p.equipment.map((e) => EQUIPMENT_LABELS_AVAIL[e] ?? e).join(", ")
    : "—";

  lines.push(
    `Hồ sơ: ${p.displayName}, giới tính ${genderVi}, mục tiêu ${goalVi}, trình độ ${levelVi}.`,
  );
  if (p.heightCm || p.currentWeightKg || p.targetWeightKg) {
    const bmiText = p.bmi !== null ? ` (BMI ${p.bmi})` : "";
    const toGo =
      p.weightToGoKg !== null
        ? `, cần ${p.weightToGoKg > 0 ? "+" : ""}${p.weightToGoKg}kg để đạt mục tiêu`
        : "";
    lines.push(
      `Thể trạng: ${p.heightCm ?? "—"}cm / ${p.currentWeightKg ?? "—"}kg → ${p.targetWeightKg ?? "—"}kg${bmiText}${toGo}.`,
    );
  }
  lines.push(`Dụng cụ: ${equipmentVi}.`);
  if (ctx.plan.slug && ctx.plan.title) {
    lines.push(
      `Đang theo giáo án: "${ctx.plan.title}" (${ctx.plan.daysPerWeek ?? "?"} buổi/tuần).`,
    );
  } else {
    lines.push(`Chưa đăng ký giáo án nào.`);
  }
  lines.push(
    `7 ngày qua: ${g.last7DaysCompletion}% completion, ${g.last7DaysTrainingDays} buổi training; 30 ngày: ${g.last30DaysCompletion}%, ${g.last30DaysTrainingDays} buổi.`,
  );
  if (g.weightDeltaKg30d !== null) {
    const sign = g.weightDeltaKg30d > 0 ? "+" : "";
    lines.push(`Cân nặng 30 ngày: ${sign}${g.weightDeltaKg30d}kg.`);
  }
  if (g.streakDays > 0) {
    lines.push(`Streak hiện tại: ${g.streakDays} buổi training liên tiếp.`);
  } else if (g.consecutiveMissedDays > 0) {
    lines.push(`Đã miss ${g.consecutiveMissedDays} buổi training gần nhất.`);
  }

  return lines.join(" ");
}

/**
 * Equipment availability → concrete exercise equipment types the user can do.
 * Used by the fallback engine when suggesting alternatives.
 */
export function expandEquipmentTypes(
  equipment: MongoUser["equipment"],
): ExerciseEquipment[] {
  const out = new Set<ExerciseEquipment>();
  for (const e of equipment) {
    if (e === "full_gym") {
      ["dumbbell", "barbell", "cable", "machine", "bodyweight"].forEach((x) =>
        out.add(x as ExerciseEquipment),
      );
    } else if (e === "home_dumbbell") {
      ["dumbbell", "resistance_band", "bodyweight"].forEach((x) =>
        out.add(x as ExerciseEquipment),
      );
    } else if (e === "bodyweight") {
      out.add("bodyweight");
    }
  }
  return [...out];
}

// Re-export so it can be referenced by callers that already imported from this
// module without pulling in @/types.
export const EQUIPMENT_AVAIL_LABEL = EQUIPMENT_LABELS_AVAIL;
export { EQUIPMENT_LABELS_VI };
export type { MetricsSummary };
