import type { WorkoutPlan } from "@/types";

export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: "plan-nu-giam-can",
    title: "Nữ giảm cân 5 buổi/tuần",
    slug: "nu-giam-can",
    targetUser: "female_weight_loss",
    level: "beginner",
    daysPerWeek: 5,
    goal: "Giảm 0.5-1kg/tuần, săn chắc cơ thể, định hình mông-đùi-eo",
    description:
      "Giáo án 5 buổi/tuần cho nữ mới tập, tập trung giảm mỡ và săn chắc. Mỗi buổi 45-60 phút gồm khởi động, bài chính (compound + isolation), cardio đốt mỡ. Có 2 ngày nghỉ chủ động (đi bộ/yoga).",
    sessions: [
      {
        id: "session-1",
        title: "Mông + Đùi sau",
        dayIndex: 1,
        focus: ["glutes", "hamstrings"],
        exercises: [
          { exerciseSlug: "goblet-squat", sets: 3, reps: "12-15", restSeconds: 60 },
          { exerciseSlug: "romanian-deadlift", sets: 3, reps: "12", restSeconds: 75 },
          { exerciseSlug: "hip-thrust", sets: 4, reps: "12", restSeconds: 60 },
          { exerciseSlug: "lunge-dumbbell", sets: 3, reps: "10 mỗi bên", restSeconds: 60 },
          { exerciseSlug: "calf-raise-dung", sets: 3, reps: "15-20", restSeconds: 45 },
        ],
        cardio: {
          title: "Đi bộ dốc",
          durationMinutes: 15,
          intensity: "moderate",
          note: "Treadmill nghiêng 10%, tốc độ 5-6 km/h",
        },
      },
      {
        id: "session-2",
        title: "Đùi trước + Bắp chuối",
        dayIndex: 2,
        focus: ["quads", "calves"],
        exercises: [
          { exerciseSlug: "leg-press", sets: 4, reps: "12-15", restSeconds: 75 },
          { exerciseSlug: "bulgarian-split-squat", sets: 3, reps: "10 mỗi bên", restSeconds: 60 },
          { exerciseSlug: "lunge-dumbbell", sets: 3, reps: "12 mỗi bên", restSeconds: 60 },
          { exerciseSlug: "calf-raise-dung", sets: 4, reps: "15-20", restSeconds: 45 },
          { exerciseSlug: "plank", sets: 3, reps: "30-45s", restSeconds: 45 },
        ],
        cardio: {
          title: "HIIT nhẹ",
          durationMinutes: 10,
          intensity: "high",
          note: "Mountain climber + burpees, 30s tập 30s nghỉ",
        },
      },
      {
        id: "session-3",
        title: "Lưng + Vai + Cardio",
        dayIndex: 3,
        focus: ["back", "shoulders"],
        exercises: [
          { exerciseSlug: "lat-pulldown", sets: 4, reps: "12", restSeconds: 60 },
          { exerciseSlug: "keo-cap-ngoi", sets: 3, reps: "12", restSeconds: 60 },
          { exerciseSlug: "day-vai-dumbbell", sets: 3, reps: "12", restSeconds: 60 },
          { exerciseSlug: "dang-vai-dumbbell", sets: 3, reps: "12-15", restSeconds: 45 },
          { exerciseSlug: "face-pull", sets: 3, reps: "15", restSeconds: 45 },
        ],
        cardio: {
          title: "Đi bộ dốc",
          durationMinutes: 20,
          intensity: "moderate",
        },
      },
      {
        id: "session-4",
        title: "Bụng + Cardio đốt mỡ",
        dayIndex: 4,
        focus: ["abs", "core", "full_body"],
        exercises: [
          { exerciseSlug: "plank", sets: 3, reps: "30-60s", restSeconds: 45 },
          { exerciseSlug: "crunch", sets: 3, reps: "15-20", restSeconds: 45 },
          { exerciseSlug: "russian-twist", sets: 3, reps: "20", restSeconds: 45 },
          { exerciseSlug: "mountain-climber", sets: 3, reps: "30s", restSeconds: 45 },
        ],
        cardio: {
          title: "HIIT toàn thân",
          durationMinutes: 20,
          intensity: "high",
          note: "Burpees + jump rope, 40s tập 20s nghỉ x 10 hiệp",
        },
      },
      {
        id: "session-5",
        title: "Ngực + Tay + Bụng",
        dayIndex: 5,
        focus: ["chest", "biceps", "triceps", "abs"],
        exercises: [
          { exerciseSlug: "day-nguc-dumbbell", sets: 3, reps: "12", restSeconds: 60 },
          { exerciseSlug: "hit-dat", sets: 3, reps: "10-15", restSeconds: 45 },
          { exerciseSlug: "cuon-ta-dumbbell", sets: 3, reps: "12", restSeconds: 45 },
          { exerciseSlug: "tricep-pushdown", sets: 3, reps: "12", restSeconds: 45 },
          { exerciseSlug: "russian-twist", sets: 3, reps: "20", restSeconds: 45 },
        ],
        cardio: {
          title: "Đi bộ dốc",
          durationMinutes: 15,
          intensity: "moderate",
        },
      },
    ],
  },
  {
    id: "plan-nam-moi-tap",
    title: "Nam mới tập tăng cơ 5 buổi/tuần",
    slug: "nam-moi-tap",
    targetUser: "male_beginner",
    level: "beginner",
    daysPerWeek: 5,
    goal: "Tăng cơ nền tảng, học form chuẩn, nâng dần sức mạnh các bài compound",
    description:
      "Giáo án 5 buổi/tuần cho nam mới tập, chia push/pull/legs + 2 buổi phụ. Mỗi buổi 60-75 phút, ưu tiên compound (squat, deadlift, bench, row), thêm isolation cuối buổi. Mục tiêu xây nền tảng 3 tháng đầu.",
    sessions: [
      {
        id: "session-1",
        title: "Push (Ngực, Vai, Tay sau)",
        dayIndex: 1,
        focus: ["chest", "shoulders", "triceps"],
        exercises: [
          { exerciseSlug: "day-nguc-thanh-don", sets: 4, reps: "8-10", restSeconds: 90 },
          { exerciseSlug: "day-vai-dumbbell", sets: 3, reps: "10", restSeconds: 75 },
          { exerciseSlug: "day-nguc-dumbbell", sets: 3, reps: "10-12", restSeconds: 75 },
          { exerciseSlug: "dang-vai-dumbbell", sets: 3, reps: "12-15", restSeconds: 60 },
          { exerciseSlug: "day-nguc-hep", sets: 3, reps: "10", restSeconds: 75 },
          { exerciseSlug: "tricep-pushdown", sets: 3, reps: "12", restSeconds: 60 },
        ],
      },
      {
        id: "session-2",
        title: "Pull (Lưng, Tay trước)",
        dayIndex: 2,
        focus: ["back", "biceps"],
        exercises: [
          { exerciseSlug: "deadlift", sets: 4, reps: "5-6", restSeconds: 120, note: "Tập với tạ nhẹ học form trước" },
          { exerciseSlug: "lat-pulldown", sets: 4, reps: "10", restSeconds: 75 },
          { exerciseSlug: "keo-cap-ngoi", sets: 3, reps: "10-12", restSeconds: 75 },
          { exerciseSlug: "face-pull", sets: 3, reps: "15", restSeconds: 45 },
          { exerciseSlug: "cuon-ta-thanh-don", sets: 3, reps: "10", restSeconds: 60 },
          { exerciseSlug: "cuon-ta-dumbbell", sets: 3, reps: "12", restSeconds: 60 },
        ],
      },
      {
        id: "session-3",
        title: "Legs (Đùi, Mông)",
        dayIndex: 3,
        focus: ["quads", "glutes", "hamstrings"],
        exercises: [
          { exerciseSlug: "squat-thanh-don", sets: 4, reps: "8", restSeconds: 120 },
          { exerciseSlug: "romanian-deadlift", sets: 3, reps: "10", restSeconds: 90 },
          { exerciseSlug: "leg-press", sets: 3, reps: "12", restSeconds: 90 },
          { exerciseSlug: "lunge-dumbbell", sets: 3, reps: "10 mỗi bên", restSeconds: 60 },
          { exerciseSlug: "calf-raise-dung", sets: 4, reps: "15", restSeconds: 45 },
          { exerciseSlug: "plank", sets: 3, reps: "45s", restSeconds: 45 },
        ],
      },
      {
        id: "session-4",
        title: "Upper Body Phụ (Ngực + Lưng)",
        dayIndex: 4,
        focus: ["chest", "back"],
        exercises: [
          { exerciseSlug: "day-nguc-dumbbell", sets: 4, reps: "10", restSeconds: 75 },
          { exerciseSlug: "lat-pulldown", sets: 4, reps: "10", restSeconds: 75 },
          { exerciseSlug: "dang-nguc-dumbbell", sets: 3, reps: "12", restSeconds: 60 },
          { exerciseSlug: "keo-cap-ngoi", sets: 3, reps: "10-12", restSeconds: 75 },
          { exerciseSlug: "cuon-ta-dumbbell", sets: 3, reps: "10", restSeconds: 60 },
          { exerciseSlug: "tricep-pushdown", sets: 3, reps: "12", restSeconds: 60 },
        ],
      },
      {
        id: "session-5",
        title: "Lower Body Phụ + Core",
        dayIndex: 5,
        focus: ["glutes", "hamstrings", "abs"],
        exercises: [
          { exerciseSlug: "hip-thrust", sets: 4, reps: "10", restSeconds: 90 },
          { exerciseSlug: "bulgarian-split-squat", sets: 3, reps: "10 mỗi bên", restSeconds: 75 },
          { exerciseSlug: "romanian-deadlift", sets: 3, reps: "10", restSeconds: 75 },
          { exerciseSlug: "calf-raise-dung", sets: 4, reps: "15", restSeconds: 45 },
          { exerciseSlug: "plank", sets: 3, reps: "60s", restSeconds: 45 },
          { exerciseSlug: "crunch", sets: 3, reps: "20", restSeconds: 45 },
        ],
        cardio: {
          title: "Nhảy dây",
          durationMinutes: 10,
          intensity: "moderate",
        },
      },
    ],
  },
];

export function getPlanBySlug(slug: string): WorkoutPlan | undefined {
  return WORKOUT_PLANS.find((p) => p.slug === slug);
}
