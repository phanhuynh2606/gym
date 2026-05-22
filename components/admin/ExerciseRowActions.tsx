"use client";

import { useTransition } from "react";
import {
  deleteExerciseAction,
  togglePublishExerciseAction,
} from "@/app/actions/admin-exercises";
import { Button } from "@/components/ui/button";

export function ExerciseRowActions({
  slug,
  isPublished,
}: {
  slug: string;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await togglePublishExerciseAction(slug, !isPublished);
          });
        }}
      >
        {isPublished ? "Ẩn" : "Hiện"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-state-error hover:bg-state-error/10"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(`Xoá bài tập "${slug}"?`);
          if (!ok) return;
          startTransition(async () => {
            await deleteExerciseAction(slug);
          });
        }}
      >
        Xoá
      </Button>
    </div>
  );
}
