import "server-only";

import type { EquipmentAvailability } from "@/lib/users";
import { listWorkoutPlans } from "@/lib/workout-plans-data";
import type { Difficulty, Gender, Goal, WorkoutPlan } from "@/types";

/**
 * Result of the recommendation engine. Always returns a `plan` (or null when
 * no published plan exists at all) plus a short Vietnamese explanation that
 * the wizard renders on the final step.
 */
export type PlanRecommendation = {
  plan: WorkoutPlan | null;
  rationale: string;
  alternatives: WorkoutPlan[];
};

export type OnboardingProfile = {
  gender: Gender;
  goal: Goal;
  level: Difficulty;
  equipment: EquipmentAvailability[];
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
};

/**
 * Score how well a published plan matches the user's profile. Higher is
 * better. The weights are deliberately small and explicit so the result is
 * easy to reason about and the wizard can explain the top pick to the user.
 */
function scorePlan(plan: WorkoutPlan, p: OnboardingProfile): number {
  let score = 0;

  // Strongest signal: exact targetUser match. Both seed plans encode the
  // intended audience, e.g. `female_weight_loss` for women cutting weight.
  if (p.gender === "female" && plan.targetUser === "female_weight_loss") {
    score += 50;
    if (p.goal === "weight_loss") score += 20;
  }
  if (p.gender === "male" && plan.targetUser === "male_beginner") {
    score += 50;
    if (p.goal === "muscle_gain" || p.goal === "strength") score += 20;
  }

  // Level alignment. Beginners get a hard preference for beginner plans so we
  // don't dump a 5-day intermediate split on someone who's never lifted.
  if (plan.level === p.level) score += 15;
  else if (plan.level === "beginner" && p.level === "intermediate") score += 5;
  else if (plan.level === "intermediate" && p.level === "advanced") score += 5;

  // Tiny goal heuristic from the plan's freeform `goal` text.
  const goalText = plan.goal.toLowerCase();
  if (p.goal === "weight_loss" && /giảm|cân|fat|cut/.test(goalText)) score += 5;
  if (
    (p.goal === "muscle_gain" || p.goal === "strength") &&
    /tăng|cơ|muscle|strength|sức/.test(goalText)
  )
    score += 5;

  return score;
}

function rationaleFor(plan: WorkoutPlan, p: OnboardingProfile): string {
  const bits: string[] = [];

  if (p.gender === "female" && plan.targetUser === "female_weight_loss") {
    bits.push("phù hợp với nữ muốn giảm cân");
  } else if (p.gender === "male" && plan.targetUser === "male_beginner") {
    bits.push("phù hợp với nam mới tập");
  }

  if (plan.level === p.level) {
    bits.push(`đúng trình độ ${plan.level}`);
  }

  if (plan.daysPerWeek) {
    bits.push(`${plan.daysPerWeek} buổi/tuần`);
  }

  if (p.goal === "weight_loss" && plan.goal.toLowerCase().includes("giảm")) {
    bits.push("trọng tâm giảm mỡ");
  }

  if (bits.length === 0) {
    return `Đây là giáo án gần nhất với mục tiêu ${p.goal} của bạn.`;
  }

  return `Gợi ý này vì ${bits.join(", ")}.`;
}

export async function recommendPlan(
  profile: OnboardingProfile,
): Promise<PlanRecommendation> {
  const plans = await listWorkoutPlans();
  if (plans.length === 0) {
    return {
      plan: null,
      rationale:
        "Hiện chưa có giáo án nào được xuất bản. Hãy quay lại sau, hoặc liên hệ admin.",
      alternatives: [],
    };
  }

  const ranked = [...plans]
    .map((plan) => ({ plan, score: scorePlan(plan, profile) }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0]!.plan;
  const alternatives = ranked
    .slice(1, 3)
    .filter((r) => r.score > 0)
    .map((r) => r.plan);

  return {
    plan: top,
    rationale: rationaleFor(top, profile),
    alternatives,
  };
}

export const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  {
    value: "weight_loss",
    label: "Giảm cân / giảm mỡ",
    description: "Giảm cân nặng, lộ rõ cơ bụng, gọn dáng.",
  },
  {
    value: "muscle_gain",
    label: "Tăng cơ",
    description: "Tăng khối lượng cơ, tăng cân theo hướng tốt.",
  },
  {
    value: "toning",
    label: "Săn chắc + giữ form",
    description: "Giữ cân nặng hiện tại, săn chắc cơ thể, khoẻ hơn.",
  },
  {
    value: "strength",
    label: "Tăng sức mạnh",
    description: "Nâng được tạ nặng hơn, đẩy mạnh squat/bench/deadlift.",
  },
];

export const LEVEL_OPTIONS: {
  value: Difficulty;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "Mới tập",
    description: "Chưa tập hoặc tập <3 tháng. Cần học kỹ thuật cơ bản.",
  },
  {
    value: "intermediate",
    label: "Trung cấp",
    description: "Đã tập đều đặn 3-12 tháng, biết các động tác chính.",
  },
  {
    value: "advanced",
    label: "Lâu năm",
    description: "Tập >1 năm, hiểu split & periodization.",
  },
];

export const EQUIPMENT_OPTIONS: {
  value: EquipmentAvailability;
  label: string;
  description: string;
}[] = [
  {
    value: "full_gym",
    label: "Gym đầy đủ",
    description: "Có máy + tạ đòn + dumbbell + cable.",
  },
  {
    value: "home_dumbbell",
    label: "Dumbbell tại nhà",
    description: "Có 1-2 cặp dumbbell hoặc resistance band.",
  },
  {
    value: "bodyweight",
    label: "Tay không",
    description: "Tập bodyweight, không có dụng cụ.",
  },
];
