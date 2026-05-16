"use client";

import { BookmarkPlus, Loader2 } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleFavoritePlan } from "@/app/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialFavorited: boolean;
  signedIn: boolean;
};

export function FavoritePlanButton({
  slug,
  initialFavorited,
  signedIn,
}: Props) {
  const [optimistic, applyOptimistic] = useOptimistic(
    initialFavorited,
    (_state, next: boolean) => next,
  );
  const [isPending, startTransition] = useTransition();

  if (!signedIn) return null;

  const handleClick = () => {
    startTransition(async () => {
      const next = !optimistic;
      applyOptimistic(next);
      const result = await toggleFavoritePlan(slug);
      if (!result.ok) {
        console.error(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant={optimistic ? "primary" : "outline"}
      size="md"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <BookmarkPlus
          className={cn("h-4 w-4", optimistic && "fill-current")}
          aria-hidden
        />
      )}
      {optimistic ? "Đã lưu giáo án" : "Lưu giáo án"}
    </Button>
  );
}
