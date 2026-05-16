import type { Metadata } from "next";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import { ExerciseFilters } from "./ExerciseFilters";
import {
  DIFFICULTY_LABELS_VI,
  EQUIPMENT_LABELS_VI,
  GOAL_LABELS_VI,
  MUSCLE_LABELS_VI,
  type Difficulty,
  type Equipment,
  type Goal,
  type Muscle,
} from "@/types";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { EXERCISES } from "@/server/seed/exercises";

export const metadata: Metadata = buildMetadata({
  title: "Thư viện bài tập gym",
  description:
    "Thư viện 30+ bài tập gym với hướng dẫn từng bước, lỗi thường gặp và bài tập thay thế. Lọc theo nhóm cơ, dụng cụ, độ khó.",
  path: "/bai-tap",
});

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Bài tập", href: "/bai-tap" },
];

type SearchParams = {
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  goal?: string;
};

export default async function ExercisesIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const muscle = params.muscle as Muscle | undefined;
  const equipment = params.equipment as Equipment | undefined;
  const difficulty = params.difficulty as Difficulty | undefined;
  const goal = params.goal as Goal | undefined;

  const filtered = EXERCISES.filter((e) => {
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
    return true;
  });

  const activeFilters: { key: string; label: string }[] = [];
  if (muscle)
    activeFilters.push({ key: "muscle", label: MUSCLE_LABELS_VI[muscle] });
  if (equipment)
    activeFilters.push({
      key: "equipment",
      label: EQUIPMENT_LABELS_VI[equipment],
    });
  if (difficulty)
    activeFilters.push({
      key: "difficulty",
      label: DIFFICULTY_LABELS_VI[difficulty],
    });
  if (goal)
    activeFilters.push({
      key: "goal",
      label: GOAL_LABELS_VI[goal],
    });

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-2">
        <h1>Thư viện bài tập</h1>
        <p className="text-text-secondary max-w-prose">
          Hơn {EXERCISES.length} bài tập gym thông dụng với hướng dẫn, lỗi
          thường gặp và bài thay thế.
        </p>
      </header>

      <ExerciseFilters />

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-secondary">Đang lọc:</span>
          {activeFilters.map((f) => (
            <Badge key={f.key} variant="default">
              {f.label}
            </Badge>
          ))}
          <span className="text-xs text-text-secondary">
            • {filtered.length} kết quả
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-surface p-12 text-center">
          <p className="text-text-secondary">
            Không có bài tập nào khớp. Thử bộ lọc khác nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}

      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </div>
  );
}
