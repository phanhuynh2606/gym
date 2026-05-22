"use client";

import { Heart, Loader2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleFavoriteExercise } from "@/app/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialFavorited: boolean;
  signedIn: boolean;
  variant?: "compact" | "full";
};

export function FavoriteExerciseButton({
  slug,
  initialFavorited,
  signedIn,
  variant = "full",
}: Props) {
  const [optimistic, applyOptimistic] = useOptimistic(
    initialFavorited,
    (_state, next: boolean) => next,
  );
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return null;
  }

  const handleClick = () => {
    startTransition(async () => {
      const next = !optimistic;
      applyOptimistic(next);
      const result = await toggleFavoriteExercise(slug);
      if (!result.ok) {
        console.error(result.error);
      }
    });
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={optimistic}
        aria-label={optimistic ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          optimistic
            ? "border-state-error/30 bg-state-error/5 text-state-error hover:bg-state-error/10"
            : "border-border-subtle bg-surface text-text-secondary hover:border-state-error/40 hover:text-state-error",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Heart
            className={cn("h-4 w-4", optimistic && "fill-state-error")}
            aria-hidden
          />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={optimistic ? "negative" : "outline"}
      size="md"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Heart
          className={cn("h-4 w-4", optimistic && "fill-white")}
          aria-hidden
        />
      )}
      {optimistic ? "Đã yêu thích" : "Thêm vào yêu thích"}
    </Button>
  );
}
