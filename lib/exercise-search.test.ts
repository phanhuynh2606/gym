import { describe, expect, it } from "vitest";
import {
  filterExercises,
  matchesQuery,
  normalizeText,
} from "@/lib/exercise-search";
import type { Exercise } from "@/types";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "1",
    nameVi: "Đẩy tạ đòn",
    nameEn: "Barbell Bench Press",
    slug: "barbell-bench-press",
    description: "",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    goalTags: ["muscle_gain"],
    instructions: [],
    commonMistakes: [],
    tips: [],
    ...overrides,
  };
}

describe("normalizeText", () => {
  it("lower-cases and strips Vietnamese diacritics", () => {
    expect(normalizeText("Đẩy Tạ Đòn")).toBe("day ta don");
    expect(normalizeText("Ngồi")).toBe("ngoi");
    expect(normalizeText("  HÍT Đất  ")).toBe("hit dat");
  });
});

describe("matchesQuery", () => {
  const ex = makeExercise();

  it("matches accent-insensitively on the Vietnamese name", () => {
    expect(matchesQuery(ex, "day ta")).toBe(true);
    expect(matchesQuery(ex, "ĐẨY TẠ")).toBe(true);
  });

  it("matches the English name and slug", () => {
    expect(matchesQuery(ex, "bench")).toBe(true);
    expect(matchesQuery(ex, "barbell-bench")).toBe(true);
  });

  it("requires every whitespace-separated token to be present", () => {
    expect(matchesQuery(ex, "day nguc")).toBe(false); // "nguc" absent
    expect(matchesQuery(ex, "ta don")).toBe(true);
  });

  it("treats an empty/whitespace query as a match", () => {
    expect(matchesQuery(ex, "")).toBe(true);
    expect(matchesQuery(ex, "   ")).toBe(true);
  });
});

describe("filterExercises", () => {
  const bench = makeExercise({
    id: "1",
    nameVi: "Đẩy tạ đòn",
    slug: "barbell-bench-press",
    primaryMuscles: ["chest"],
    equipment: ["barbell"],
    difficulty: "intermediate",
  });
  const squat = makeExercise({
    id: "2",
    nameVi: "Gánh tạ",
    nameEn: "Barbell Squat",
    slug: "barbell-squat",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
    equipment: ["barbell"],
    difficulty: "advanced",
    goalTags: ["strength"],
  });
  const pushup = makeExercise({
    id: "3",
    nameVi: "Hít đất",
    nameEn: "Push Up",
    slug: "push-up",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    goalTags: ["toning"],
  });
  const all = [bench, squat, pushup];

  it("returns everything when no criteria are set", () => {
    expect(filterExercises(all, {})).toHaveLength(3);
  });

  it("filters by text query (accent-insensitive)", () => {
    expect(filterExercises(all, { q: "hit dat" })).toEqual([pushup]);
  });

  it("filters by facet and respects secondary muscles", () => {
    expect(filterExercises(all, { muscle: "chest" })).toEqual([bench, pushup]);
    expect(filterExercises(all, { muscle: "glutes" })).toEqual([squat]);
    expect(filterExercises(all, { equipment: "bodyweight" })).toEqual([pushup]);
    expect(filterExercises(all, { difficulty: "advanced" })).toEqual([squat]);
  });

  it("combines text query with facet filters", () => {
    // "barbell" matches bench + squat by slug/name, then chest narrows to bench.
    expect(filterExercises(all, { q: "barbell", muscle: "chest" })).toEqual([
      bench,
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterExercises(all, { q: "yoga" })).toEqual([]);
  });
});
