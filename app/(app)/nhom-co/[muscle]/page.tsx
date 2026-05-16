import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { MUSCLE_LABELS_VI, type Muscle } from "@/types";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import {
  EXERCISES,
  getExercisesByMuscle,
} from "@/server/seed/exercises";

type Props = { params: Promise<{ muscle: string }> };

const VALID_MUSCLES: Muscle[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "core",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "full_body",
];

export function generateStaticParams() {
  return VALID_MUSCLES.map((m) => ({ muscle: m }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { muscle } = await params;
  if (!VALID_MUSCLES.includes(muscle as Muscle)) return {};
  const label = MUSCLE_LABELS_VI[muscle as Muscle];
  return buildMetadata({
    title: `Bài tập ${label}`,
    description: `Tổng hợp các bài tập gym cho nhóm cơ ${label.toLowerCase()}, có hướng dẫn từng bước và bài tập thay thế.`,
    path: `/nhom-co/${muscle}`,
  });
}

export default async function MuscleDetailPage({ params }: Props) {
  const { muscle } = await params;
  if (!VALID_MUSCLES.includes(muscle as Muscle)) notFound();

  const label = MUSCLE_LABELS_VI[muscle as Muscle];
  const exercises = getExercisesByMuscle(muscle);

  const breadcrumbs = [
    { name: "Trang chủ", href: "/" },
    { name: "Nhóm cơ", href: "/nhom-co" },
    { name: label, href: `/nhom-co/${muscle}` },
  ];

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-2">
        <h1>Bài tập {label}</h1>
        <p className="text-text-secondary">
          {exercises.length} bài tập trên tổng số {EXERCISES.length} bài.
        </p>
      </header>

      {exercises.length === 0 ? (
        <p className="text-text-secondary">Chưa có bài tập cho nhóm cơ này.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}

      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </div>
  );
}
