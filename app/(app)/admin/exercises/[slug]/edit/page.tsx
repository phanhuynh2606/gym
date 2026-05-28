import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExerciseForm } from "@/components/admin/ExerciseForm";
import { Card } from "@/components/ui/card";
import { getAdminExerciseBySlug } from "@/lib/exercises-data";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exercise = await getAdminExerciseBySlug(slug);
  if (!exercise) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Bài tập
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Sửa: {exercise.nameVi}</h2>
        <p className="text-xs text-text-secondary">{exercise.slug}</p>
      </div>
      <Card className="p-5">
        <ExerciseForm
          mode="edit"
          originalSlug={exercise.slug}
          defaults={{
            slug: exercise.slug,
            nameVi: exercise.nameVi,
            nameEn: exercise.nameEn,
            description: exercise.description,
            primaryMuscles: exercise.primaryMuscles,
            secondaryMuscles: exercise.secondaryMuscles,
            equipment: exercise.equipment,
            difficulty: exercise.difficulty,
            goalTags: exercise.goalTags,
            instructions: exercise.instructions,
            commonMistakes: exercise.commonMistakes,
            tips: exercise.tips,
            imageUrl: exercise.imageUrl,
            gifUrl: exercise.gifUrl,
            videoUrl: exercise.videoUrl,
            youtubeVideoId: exercise.youtubeVideoId,
            alternativeSlugs: exercise.alternativeSlugs,
            isPublished: exercise.isPublished,
          }}
        />
      </Card>
    </div>
  );
}
