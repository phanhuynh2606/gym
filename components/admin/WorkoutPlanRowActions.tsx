"use client";

import { useTransition } from "react";
import {
  deletePlanAction,
  togglePublishPlanAction,
} from "@/app/actions/admin-workout-plans";
import { Button } from "@/components/ui/button";

export function WorkoutPlanRowActions({
  slug,
  isPublished,
  allowDelete,
}: {
  slug: string;
  isPublished: boolean;
  allowDelete: boolean;
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
            await togglePublishPlanAction(slug, !isPublished);
          });
        }}
      >
        {isPublished ? "Ẩn" : "Hiện"}
      </Button>
      {allowDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-state-error hover:bg-state-error/10"
          disabled={pending}
          onClick={() => {
            const ok = window.confirm(`Xoá giáo án "${slug}"?`);
            if (!ok) return;
            startTransition(async () => {
              await deletePlanAction(slug);
            });
          }}
        >
          Xoá
        </Button>
      )}
    </div>
  );
}
