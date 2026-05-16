export type Gender = "male" | "female";

export type Goal = "weight_loss" | "muscle_gain" | "toning" | "strength";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves"
  | "core"
  | "full_body";

export type Equipment =
  | "dumbbell"
  | "barbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "resistance_band";

export type TargetUser = "female_weight_loss" | "male_beginner";

export type Exercise = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  description: string;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  difficulty: Difficulty;
  goalTags: Goal[];
  instructions: string[];
  commonMistakes: string[];
  tips: string[];
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  alternativeSlugs?: string[];
};

export type SessionExercise = {
  exerciseSlug: string;
  sets: number;
  reps: string;
  restSeconds: number;
  note?: string;
};

export type CardioBlock = {
  title: string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high";
  note?: string;
};

export type WorkoutSession = {
  id: string;
  title: string;
  dayIndex: number;
  focus: Muscle[];
  exercises: SessionExercise[];
  cardio?: CardioBlock;
};

export type WorkoutPlan = {
  id: string;
  title: string;
  slug: string;
  targetUser: TargetUser;
  level: Difficulty;
  daysPerWeek: number;
  goal: string;
  description: string;
  sessions: WorkoutSession[];
};

export type SetLog = {
  setIndex: number;
  reps?: number;
  weight?: number;
  completed: boolean;
};

export type ExerciseProgress = {
  exerciseSlug: string;
  sets: SetLog[];
  updatedAt: string;
};

export type SessionProgress = {
  planSlug: string;
  sessionId: string;
  date: string;
  startedAt: string;
  completedAt?: string;
  exercises: Record<string, ExerciseProgress>;
};

export type SessionCompletion = {
  planSlug: string;
  sessionId: string;
  dayIndex: number;
  date: string;
  completedAt: string;
};

export type DailyTodoTask = {
  id: string;
  title: string;
  category: "workout" | "nutrition" | "recovery" | "habit";
  completed: boolean;
  required: boolean;
};

export type DailyTodo = {
  id: string;
  userId: string;
  date: string;
  planDayIndex?: number;
  type: "training" | "rest" | "recovery";
  title: string;
  tasks: DailyTodoTask[];
  waterLiters?: number;
  sleepHours?: number;
  steps?: number;
  bodyWeight?: number;
  mood?: "bad" | "normal" | "good" | "great";
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  completionRate: number;
  note?: string;
};

export const MUSCLE_LABELS_VI: Record<Muscle, string> = {
  chest: "Ngực",
  back: "Lưng",
  shoulders: "Vai",
  biceps: "Tay trước",
  triceps: "Tay sau",
  abs: "Bụng",
  glutes: "Mông",
  quads: "Đùi trước",
  hamstrings: "Đùi sau",
  calves: "Bắp chuối",
  core: "Core",
  full_body: "Toàn thân",
};

export const EQUIPMENT_LABELS_VI: Record<Equipment, string> = {
  dumbbell: "Dumbbell",
  barbell: "Barbell",
  cable: "Cable",
  machine: "Máy",
  bodyweight: "Tay không",
  kettlebell: "Kettlebell",
  resistance_band: "Dây kháng lực",
};

export const DIFFICULTY_LABELS_VI: Record<Difficulty, string> = {
  beginner: "Người mới",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export const GOAL_LABELS_VI: Record<Goal, string> = {
  weight_loss: "Giảm cân",
  muscle_gain: "Tăng cơ",
  toning: "Săn chắc",
  strength: "Tăng sức mạnh",
};
