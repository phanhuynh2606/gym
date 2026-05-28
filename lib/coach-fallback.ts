import "server-only";

import {
  buildCoachContext,
  expandEquipmentTypes,
  type CoachContext,
} from "@/lib/coach-context";
import { EXERCISES } from "@/server/seed/exercises";
import { MUSCLE_LABELS_VI, type Equipment, type Muscle } from "@/types";

export type FallbackTopic =
  | "motivation"
  | "missed_workout"
  | "plateau"
  | "weight_progress"
  | "nutrition"
  | "alternative"
  | "rest_pain"
  | "form_question"
  | "default";

/**
 * Cheap keyword classifier so the fallback engine can pick the right
 * response. Order matters — earlier rules win for ambiguous phrasing.
 */
function classify(message: string): FallbackTopic {
  const m = message.toLowerCase();

  if (
    /(đau|nhức|chấn thương|injury|sore|mỏi gối|đau lưng|đau vai)/.test(m)
  ) {
    return "rest_pain";
  }
  if (
    /(thay thế|thay bài|bài khác|alternative|bài tương đương|swap)/.test(m)
  ) {
    return "alternative";
  }
  if (
    /(ăn|calo|protein|dinh dưỡng|thực đơn|meal|diet|kcal|carb)/.test(m)
  ) {
    return "nutrition";
  }
  if (
    /(kỹ thuật|form|tư thế|cách tập|hướng dẫn|đúng kỹ thuật|how to)/.test(m)
  ) {
    return "form_question";
  }
  if (
    /(không có động lực|lười|chán|bỏ tập|muốn bỏ|motivation|encourage)/.test(
      m,
    )
  ) {
    return "motivation";
  }
  if (
    /(miss|lỡ|bỏ|nghỉ|skip).*(buổi|hôm qua|hôm nay|tuần)/.test(m) ||
    /miss.*workout/.test(m)
  ) {
    return "missed_workout";
  }
  if (/(không tiến|plateau|đứng|chậm|chưa thấy kết quả|stuck)/.test(m)) {
    return "plateau";
  }
  if (/(cân|tăng cân|giảm cân|weight|kg)/.test(m)) {
    return "weight_progress";
  }
  return "default";
}

const MUSCLE_KEYWORDS: Record<Muscle, RegExp> = {
  chest: /(ngực|chest|push up|đẩy ngực|bench)/i,
  back: /(lưng|back|row|kéo lưng|pull)/i,
  shoulders: /(vai|shoulder|press|deltoid)/i,
  biceps: /(tay trước|biceps|curl)/i,
  triceps: /(tay sau|triceps|tricep)/i,
  abs: /(bụng|abs)/i,
  glutes: /(mông|glute|hip thrust)/i,
  quads: /(đùi trước|quad|squat)/i,
  hamstrings: /(đùi sau|hamstring|deadlift|rdl)/i,
  calves: /(bắp chuối|calf|calves)/i,
  core: /(core|plank)/i,
  full_body: /(toàn thân|full body|compound)/i,
};

function detectTargetMuscle(message: string): Muscle | null {
  for (const muscle of Object.keys(MUSCLE_KEYWORDS) as Muscle[]) {
    if (MUSCLE_KEYWORDS[muscle].test(message)) return muscle;
  }
  return null;
}

function fmtList(items: string[]): string {
  return items.map((s) => `• ${s}`).join("\n");
}

function pickAlternatives(
  message: string,
  ctx: CoachContext,
  limit = 5,
): { reply: string } {
  const muscle = detectTargetMuscle(message);
  const allowed = new Set<Equipment>(expandEquipmentTypes(ctx.profile.equipment));
  const level = ctx.profile.level;

  const candidates = EXERCISES.filter((ex) => {
    if (allowed.size > 0 && !ex.equipment.some((e) => allowed.has(e))) return false;
    if (level && ex.difficulty !== level && level !== "advanced") return false;
    if (muscle && !ex.primaryMuscles.includes(muscle) && !ex.secondaryMuscles.includes(muscle))
      return false;
    return true;
  });

  if (candidates.length === 0) {
    return {
      reply:
        muscle === null
          ? "Mình chưa rõ bạn muốn thay bài nào. Bạn nói rõ nhóm cơ (ngực/lưng/vai/chân) hoặc tên bài muốn thay nhé."
          : `Trong danh mục bài tập hiện có, mình không tìm được bài tập nào cho nhóm ${MUSCLE_LABELS_VI[muscle]} mà phù hợp với dụng cụ của bạn. Bạn có thể mở /bai-tap?muscle=${muscle} để xem toàn bộ.`,
    };
  }

  const picks = candidates.slice(0, limit).map((ex) => {
    const muscles = ex.primaryMuscles
      .map((m) => MUSCLE_LABELS_VI[m])
      .join(", ");
    return `[${ex.nameVi}](/bai-tap/${ex.slug}) — ${muscles} · ${ex.difficulty}`;
  });

  const muscleLabel = muscle
    ? ` cho nhóm ${MUSCLE_LABELS_VI[muscle]}`
    : "";

  return {
    reply: `Một vài lựa chọn${muscleLabel} phù hợp với dụng cụ + trình độ của bạn:\n${fmtList(picks)}\n\nKhi đổi bài, giữ nguyên rep range và rest time của giáo án để khối lượng tập không bị xáo trộn.`,
  };
}

function motivationReply(ctx: CoachContext): { reply: string } {
  const { streakDays, last7DaysCompletion, consecutiveMissedDays } = ctx.progress;
  if (streakDays >= 7) {
    return {
      reply: `Bạn đang có streak ${streakDays} buổi training liên tiếp — cực kỳ ấn tượng. Đừng phá streak, hôm nay chỉ cần check-in 1 task nhỏ thôi cũng đủ giữ momentum.`,
    };
  }
  if (consecutiveMissedDays >= 3) {
    return {
      reply: `Mình hiểu — ${consecutiveMissedDays} buổi miss liên tiếp là dấu hiệu cần một bài tập "nhẹ" để break the seal. Gợi ý: hôm nay chỉ làm 50% volume — ví dụ 3 bài chính, mỗi bài 2 set thay vì 4. Mục tiêu chỉ là MỞ APP và TICK. Tuần sau quay lại full volume.`,
    };
  }
  if (last7DaysCompletion < 50) {
    return {
      reply: `7 ngày qua completion ${last7DaysCompletion}% — đang chững lại. Có 2 cách tiếp cận: (1) giảm độ khó (tạm chuyển sang plan beginner 3 buổi/tuần), hoặc (2) gắn workout với 1 thói quen có sẵn (ví dụ ngay sau bữa sáng). Bạn thích cách nào?`,
    };
  }
  return {
    reply: `Bạn đang đi đúng hướng — 7 ngày qua ${last7DaysCompletion}% completion. Nếu thấy lười hôm nay: nguyên tắc "2-minute rule" — chỉ cần mặc đồ tập + làm 1 set warm-up. 90% xác suất bạn sẽ tiếp tục cả buổi.`,
  };
}

function missedWorkoutReply(ctx: CoachContext): { reply: string } {
  const { consecutiveMissedDays, last7DaysCompletion } = ctx.progress;
  if (consecutiveMissedDays === 0) {
    return {
      reply: `Theo dữ liệu mình thấy, bạn không thực sự miss buổi nào gần đây (last 7 days: ${last7DaysCompletion}%). Có thể bạn quên check vào checklist. Hãy thử mở /todo và tick lại các task đã hoàn thành.`,
    };
  }
  if (consecutiveMissedDays >= 5) {
    return {
      reply: `Đã miss ${consecutiveMissedDays} buổi training liên tiếp. Thay vì cố "bù", mình khuyên reset: hôm nay làm 1 buổi short (30 phút, 50% volume), ngày mai làm full. Đừng tăng volume để "bù" — risk overuse injury rất cao.`,
    };
  }
  return {
    reply: `${consecutiveMissedDays} buổi miss — chưa nghiêm trọng. Cách xử lý:\n${fmtList([
      "Hôm nay làm buổi đầu tiên BẠN MISS (theo đúng thứ tự day_index, không skip).",
      "Giảm 1 rep mỗi set để khởi động lại cường độ.",
      "Tăng warm-up: 5 phút cardio nhẹ + 10 reps mobility trước khi vào set chính.",
    ])}\n\nTuần sau quay lại đúng lịch.`,
  };
}

function plateauReply(ctx: CoachContext): { reply: string } {
  const { last30DaysCompletion, weightDeltaKg30d } = ctx.progress;
  const goal = ctx.profile.goal;

  if (last30DaysCompletion < 60) {
    return {
      reply: `30 ngày qua completion chỉ ${last30DaysCompletion}% — không phải plateau, mà là **chưa tập đủ**. Trước khi tăng độ khó hoặc đổi plan, hãy đạt 80%+ completion trong 2 tuần liên tiếp đã. Mọi sự thay đổi trước đó sẽ không phản ánh tín hiệu thật.`,
    };
  }

  const bits: string[] = [];
  bits.push(
    `30 ngày qua: completion ${last30DaysCompletion}% — execution tốt. Plateau là tín hiệu hợp lệ để thay đổi.`,
  );
  if (goal === "muscle_gain" || goal === "strength") {
    bits.push(
      "Thử progressive overload: +2.5kg cho mỗi compound (squat/bench/deadlift/row/OHP) tuần tới. Nếu không lên được rep target → giảm 5-10% và build lại.",
    );
  } else if (goal === "weight_loss") {
    if (weightDeltaKg30d !== null && weightDeltaKg30d > -0.5) {
      bits.push(
        "Cân không xuống tương ứng → có thể đang ăn nhiều hơn nghĩ. 1 tuần track macros thật chính xác (cân thức ăn), rồi đánh giá lại.",
      );
    } else {
      bits.push(
        "Cân vẫn xuống nhẹ → không phải plateau cân, có thể là plateau về cảm giác. Thử thêm 1 buổi cardio LISS (zone 2, 30-45 phút) thay vì tăng workout intensity.",
      );
    }
    bits.push(
      "Thử deload week (giảm 40-50% volume) — paradoxically thường tăng kết quả tuần kế.",
    );
  } else {
    bits.push(
      "Đổi mode rep: chuyển từ 8-12 reps sang 5-8 reps (sức mạnh) hoặc 12-15 reps (sức bền) trong 4 tuần.",
    );
  }

  return { reply: bits.join("\n\n") };
}

function weightProgressReply(ctx: CoachContext): { reply: string } {
  const { weightDeltaKg30d } = ctx.progress;
  const { currentWeightKg, targetWeightKg, weightToGoKg } = ctx.profile;
  const goal = ctx.profile.goal;

  if (currentWeightKg === null || targetWeightKg === null) {
    return {
      reply: `Mình chưa có dữ liệu cân hiện tại / cân mục tiêu. Bạn cập nhật ở /onboarding?redo=1 nhé — sau đó mình có thể tính rate cân nặng kỳ vọng và đánh giá xu hướng.`,
    };
  }

  const lines: string[] = [];
  lines.push(
    `Bạn đang ${currentWeightKg}kg → mục tiêu ${targetWeightKg}kg (${weightToGoKg !== null ? (weightToGoKg > 0 ? `+${weightToGoKg}` : `${weightToGoKg}`) : "?"}kg).`,
  );

  if (weightDeltaKg30d === null) {
    lines.push(
      "Chưa có đủ dữ liệu cân nặng 30 ngày để đánh giá xu hướng. Hãy ghi cân hằng ngày ở /hom-nay (mục Số liệu) — chỉ cần 7-10 lần là mình có thể đưa ra phân tích chính xác.",
    );
  } else {
    const sign = weightDeltaKg30d > 0 ? "+" : "";
    lines.push(`30 ngày qua: ${sign}${weightDeltaKg30d}kg.`);

    if (goal === "weight_loss") {
      if (weightDeltaKg30d <= -1.5 && weightDeltaKg30d >= -3.5) {
        lines.push(
          "Rate giảm cân 1.5-3.5kg/tháng là sustainable — bạn đang đi đúng hướng, giữ nguyên calo + protein.",
        );
      } else if (weightDeltaKg30d < -3.5) {
        lines.push(
          "Rate giảm quá nhanh (>3.5kg/tháng) → tăng risk mất cơ + metabolic adaptation. Tăng 200-300kcal/ngày, ưu tiên protein 1.6-2.0g/kg.",
        );
      } else if (weightDeltaKg30d > 0) {
        lines.push(
          "Cân đang tăng dù mục tiêu giảm → calorie balance đang surplus. Track macros 1 tuần để xác định nguồn calo dư.",
        );
      } else {
        lines.push(
          "Giảm cân quá chậm — cắt thêm 100-200kcal/ngày hoặc tăng cardio 1-2 buổi/tuần.",
        );
      }
    } else if (goal === "muscle_gain") {
      if (weightDeltaKg30d >= 0.5 && weightDeltaKg30d <= 1.5) {
        lines.push(
          "Tăng 0.5-1.5kg/tháng là lean bulk rate — perfect.",
        );
      } else if (weightDeltaKg30d > 1.5) {
        lines.push(
          "Tăng quá nhanh (>1.5kg/tháng) → khả năng cao đang tích mỡ. Cắt 200kcal/ngày, monitor 2 tuần.",
        );
      } else {
        lines.push(
          "Tăng cân chậm hoặc đứng yên — tăng 200-300kcal/ngày, ưu tiên carb sau workout.",
        );
      }
    }
  }

  return { reply: lines.join("\n\n") };
}

function nutritionReply(ctx: CoachContext): { reply: string } {
  const { currentWeightKg, goal } = ctx.profile;
  const lines: string[] = [];

  if (currentWeightKg === null) {
    lines.push(
      "Hãy cập nhật cân nặng ở /onboarding?redo=1 để mình tính macro chính xác. Quy tắc chung:",
    );
  } else {
    const proteinMin = Math.round(currentWeightKg * 1.6);
    const proteinMax = Math.round(currentWeightKg * 2.2);
    lines.push(
      `Với cân nặng ${currentWeightKg}kg, target protein: **${proteinMin}-${proteinMax}g/ngày**.`,
    );
  }

  if (goal === "weight_loss") {
    lines.push(fmtList([
      "Calorie: TDEE - 300 đến -500kcal/ngày (đừng cắt sâu hơn -25% TDEE)",
      "Protein: 1.8-2.2g/kg (giữ cơ khi deficit)",
      "Carb: ưu tiên quanh workout, slow carb (gạo, khoai, oat)",
      "Fat: 0.6-1.0g/kg",
      "Fiber: 25-35g/ngày (giúp no lâu)",
      "Bữa ăn: 3-4 bữa, tránh mini-fasts > 6h",
    ]));
  } else if (goal === "muscle_gain" || goal === "strength") {
    lines.push(fmtList([
      "Calorie: TDEE + 200-400kcal/ngày (lean bulk)",
      "Protein: 1.6-2.0g/kg",
      "Carb: 4-7g/kg (cao quanh workout)",
      "Fat: 0.8-1.0g/kg",
      "Pre-workout: carb + ít protein, 1-2h trước",
      "Post-workout: 20-40g protein + 50-80g carb trong 1h",
    ]));
  } else {
    lines.push(fmtList([
      "Calorie: maintenance (TDEE)",
      "Protein: 1.4-1.8g/kg",
      "Carb: 3-5g/kg",
      "Fat: 0.8-1.2g/kg",
      "Cân bằng 3 bữa chính + 1-2 snack nhỏ",
    ]));
  }

  lines.push(
    "Xem chi tiết hơn ở [/dinh-duong](/dinh-duong).",
  );

  return { reply: lines.join("\n\n") };
}

function formQuestionReply(message: string): { reply: string } {
  const muscle = detectTargetMuscle(message);
  if (muscle) {
    return {
      reply: `Mỗi bài tập đều có hướng dẫn kỹ thuật chi tiết + video. Xem các bài cho nhóm ${MUSCLE_LABELS_VI[muscle]}: [/nhom-co/${muscle}](/nhom-co/${muscle}). Trong trang chi tiết bạn sẽ thấy: hướng dẫn từng bước, lỗi thường gặp, mẹo tránh chấn thương, và video minh hoạ.\n\nNếu bạn cho mình biết tên bài cụ thể, mình có thể link trực tiếp.`,
    };
  }
  return {
    reply: `Mình có thư viện bài tập đầy đủ với hướng dẫn + video. Bạn nói rõ tên bài hoặc nhóm cơ, mình sẽ trỏ tới đúng trang chi tiết. Hoặc duyệt thẳng [/bai-tap](/bai-tap).`,
  };
}

function restPainReply(): { reply: string } {
  return {
    reply: `⚠️ Đau là tín hiệu cần xử lý ngay, KHÔNG được "tập tiếp xem sao". Nguyên tắc:\n${fmtList([
      "Dừng bài đang đau ngay lập tức (skip set còn lại)",
      "Áp dụng R.I.C.E. trong 48h: Rest, Ice, Compression, Elevation",
      "Bỏ buổi tập 3-5 ngày cho nhóm cơ đó (vẫn có thể tập nhóm khác nếu không đau lan)",
      "Quay lại với 50% volume, chỉ tăng dần khi 0% đau",
    ])}\n\nNếu sau 7 ngày vẫn đau, hoặc đau dữ dội/sưng/bầm → đi bác sĩ thể thao. KHÔNG tự kê đơn giảm đau dài hạn.`,
  };
}

function defaultReply(ctx: CoachContext): { reply: string } {
  const p = ctx.profile;
  const g = ctx.progress;

  const lines: string[] = [];
  lines.push(
    `Xin chào ${p.displayName}! Mình là HLV ảo của bạn (chế độ rule-based — không phải LLM).`,
  );
  lines.push(
    `Bạn đang ở: mục tiêu **${p.goal ?? "—"}**, trình độ **${p.level ?? "—"}**, 7 ngày qua **${g.last7DaysCompletion}%** completion.`,
  );
  lines.push("Mình có thể giúp bạn:");
  lines.push(fmtList([
    "Gợi ý bài thay thế (\"thay bài squat bằng gì?\")",
    "Phân tích cân nặng & xu hướng (\"cân của tôi thế nào?\")",
    "Xử lý khi miss buổi (\"hôm qua lỡ buổi rồi\")",
    "Tư vấn dinh dưỡng (\"tôi nên ăn bao nhiêu protein?\")",
    "Plateau & progressive overload (\"không tiến được\")",
    "Đau cơ / chấn thương (\"đau gối khi squat\")",
  ]));
  lines.push("Hỏi bằng tiếng Việt thoải mái — mình sẽ trả lời theo dữ liệu thật của bạn.");

  return { reply: lines.join("\n\n") };
}

export async function generateFallbackReply(
  message: string,
  ctx: CoachContext,
): Promise<{ reply: string; topic: FallbackTopic }> {
  const topic = classify(message);
  let r: { reply: string };
  switch (topic) {
    case "alternative":
      r = pickAlternatives(message, ctx);
      break;
    case "motivation":
      r = motivationReply(ctx);
      break;
    case "missed_workout":
      r = missedWorkoutReply(ctx);
      break;
    case "plateau":
      r = plateauReply(ctx);
      break;
    case "weight_progress":
      r = weightProgressReply(ctx);
      break;
    case "nutrition":
      r = nutritionReply(ctx);
      break;
    case "form_question":
      r = formQuestionReply(message);
      break;
    case "rest_pain":
      r = restPainReply();
      break;
    default:
      r = defaultReply(ctx);
  }
  return { reply: r.reply, topic };
}

export async function buildContextFromUser(user: Parameters<typeof buildCoachContext>[0]) {
  return buildCoachContext(user);
}
