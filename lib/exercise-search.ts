import type {
  Difficulty,
  Equipment,
  Exercise,
  Goal,
  Muscle,
} from "@/types";

/**
 * Lower-case and strip Vietnamese diacritics so a search for "ngoi" matches
 * "Ngồi" and "day ta" matches "Đẩy tạ". NFD splits accented letters into a
 * base char plus a combining mark which we drop; `đ`/`Đ` don't decompose, so
 * they're handled explicitly after lower-casing.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export type ExerciseFilterCriteria = {
  q?: string;
  muscle?: Muscle;
  equipment?: Equipment;
  difficulty?: Difficulty;
  goal?: Goal;
};

/**
 * Accent-insensitive match against the exercise's Vietnamese/English names and
 * slug. Every whitespace-separated token in the query must appear, so
 * "day nguc" narrows to exercises containing both words.
 */
export function matchesQuery(exercise: Exercise, q: string): boolean {
  const needle = normalizeText(q);
  if (!needle) return true;
  const haystack = normalizeText(
    [exercise.nameVi, exercise.nameEn, exercise.slug].join(" "),
  );
  return needle.split(/\s+/).every((token) => haystack.includes(token));
}

/** Apply all active criteria (text query + facet filters) to the list. */
export function filterExercises(
  exercises: readonly Exercise[],
  criteria: ExerciseFilterCriteria,
): Exercise[] {
  const { q, muscle, equipment, difficulty, goal } = criteria;
  return exercises.filter((e) => {
    if (
      muscle &&
      !e.primaryMuscles.includes(muscle) &&
      !e.secondaryMuscles.includes(muscle)
    ) {
      return false;
    }
    if (equipment && !e.equipment.includes(equipment)) return false;
    if (difficulty && e.difficulty !== difficulty) return false;
    if (goal && !e.goalTags.includes(goal)) return false;
    if (q && !matchesQuery(e, q)) return false;
    return true;
  });
}
