import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExerciseForm } from "@/components/admin/ExerciseForm";
import { Card } from "@/components/ui/card";

export default function NewExercisePage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/exercises"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Bài tập
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Thêm bài tập mới</h2>
      </div>
      <Card className="p-5">
        <ExerciseForm mode="create" />
      </Card>
    </div>
  );
}
