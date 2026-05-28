"use client";

import { Check, ChevronDown, ChevronRight, Dumbbell, Repeat, Timer } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildInitialSets,
  loadSessionProgress,
  saveExerciseProgress,
  subscribeWorkoutStorage,
} from "@/lib/workout-storage";
import { cn } from "@/lib/utils";
import { formatRest } from "@/lib/utils";
import type { Exercise, SessionExercise, SetLog } from "@/types";

type Props = {
  planSlug: string;
  sessionId: string;
  index: number;
  item: SessionExercise;
  exercise?: Exercise;
  onSetCompleted: (restSeconds: number) => void;
};

function allDone(sets: SetLog[]): boolean {
  return sets.length > 0 && sets.every((s) => s.completed);
}

function doneCount(sets: SetLog[]): number {
  return sets.filter((s) => s.completed).length;
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function ProgressChecklist({
  planSlug,
  sessionId,
  index,
  item,
  exercise,
  onSetCompleted,
}: Props) {
  const getSnapshot = useCallback(() => {
    const progress = loadSessionProgress(planSlug, sessionId);
    return progress?.exercises[item.exerciseSlug]?.sets ?? null;
  }, [planSlug, sessionId, item.exerciseSlug]);

  const storedSets = useSyncExternalStore<SetLog[] | null>(
    subscribeWorkoutStorage,
    getSnapshot,
    () => null,
  );

  const sets: SetLog[] = storedSets ?? buildInitialSets(item.sets);

  const [expanded, setExpanded] = useState<boolean>(false);

  function commit(next: SetLog[]) {
    saveExerciseProgress(planSlug, sessionId, item.exerciseSlug, next);
  }

  function updateSet(setIndex: number, patch: Partial<SetLog>) {
    const next = sets.map((s) =>
      s.setIndex === setIndex ? { ...s, ...patch } : s,
    );
    commit(next);
  }

  function toggleSet(setIndex: number) {
    const target = sets.find((s) => s.setIndex === setIndex);
    if (!target) return;
    const willComplete = !target.completed;
    updateSet(setIndex, { completed: willComplete });
    if (willComplete) {
      onSetCompleted(item.restSeconds);
    }
  }

  const completed = allDone(sets);
  const done = doneCount(sets);

  return (
    <li
      className={cn(
        "border-t border-border-subtle first:border-t-0 py-3",
        completed && "opacity-90",
      )}
    >
      <div className="grid grid-cols-12 gap-2 items-center text-sm">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={`exercise-${item.exerciseSlug}-detail`}
          className="col-span-1 flex items-center justify-center text-text-muted hover:text-brand"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">
            {expanded ? "Thu gọn" : "Mở rộng"} bài tập {index + 1}
          </span>
        </button>

        <span className="col-span-1 text-text-muted">{index + 1}.</span>

        <div className="col-span-10 md:col-span-5 flex items-center gap-2">
          <Link
            href={`/bai-tap/${item.exerciseSlug}`}
            className="font-medium text-text-primary hover:text-brand"
          >
            {exercise?.nameVi ?? item.exerciseSlug}
          </Link>
          {completed && (
            <Badge variant="success" className="ml-1">
              Xong
            </Badge>
          )}
        </div>

        <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
          <Dumbbell className="h-3.5 w-3.5" aria-hidden />
          <span className="tabular-nums">
            {done}/{item.sets}
          </span>
          <span className="text-text-muted">hiệp</span>
        </span>

        <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
          <Repeat className="h-3.5 w-3.5" aria-hidden />
          {item.reps}
        </span>

        <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {formatRest(item.restSeconds)}
        </span>

        {item.note && (
          <span className="col-span-12 text-xs text-text-muted">
            Lưu ý: {item.note}
          </span>
        )}
      </div>

      {expanded && (
        <div
          id={`exercise-${item.exerciseSlug}-detail`}
          className="mt-3 rounded-md border border-border-subtle bg-bg p-3"
        >
          <div className="grid grid-cols-12 gap-2 px-1 pb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            <span className="col-span-2 md:col-span-1">Hiệp</span>
            <span className="col-span-4">Reps</span>
            <span className="col-span-4">Tạ (kg)</span>
            <span className="col-span-2 md:col-span-3 text-right">Xong</span>
          </div>

          <ul className="space-y-1.5">
            {sets.map((set) => (
              <li
                key={set.setIndex}
                className={cn(
                  "grid grid-cols-12 gap-2 items-center rounded-sm px-1 py-1.5",
                  set.completed && "bg-state-success/5",
                )}
              >
                <span className="col-span-2 md:col-span-1 text-sm font-medium tabular-nums text-text-secondary">
                  {set.setIndex + 1}
                </span>
                <div className="col-span-4">
                  <Label
                    htmlFor={`reps-${item.exerciseSlug}-${set.setIndex}`}
                    className="sr-only"
                  >
                    Reps thực hiện cho hiệp {set.setIndex + 1}
                  </Label>
                  <Input
                    id={`reps-${item.exerciseSlug}-${set.setIndex}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={999}
                    placeholder={item.reps}
                    value={set.reps ?? ""}
                    onChange={(e) =>
                      updateSet(set.setIndex, {
                        reps: parseNumber(e.target.value),
                      })
                    }
                    className="h-8"
                  />
                </div>
                <div className="col-span-4">
                  <Label
                    htmlFor={`weight-${item.exerciseSlug}-${set.setIndex}`}
                    className="sr-only"
                  >
                    Tạ kg cho hiệp {set.setIndex + 1}
                  </Label>
                  <Input
                    id={`weight-${item.exerciseSlug}-${set.setIndex}`}
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min={0}
                    max={999}
                    placeholder="kg"
                    value={set.weight ?? ""}
                    onChange={(e) =>
                      updateSet(set.setIndex, {
                        weight: parseNumber(e.target.value),
                      })
                    }
                    className="h-8"
                  />
                </div>
                <div className="col-span-2 md:col-span-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant={set.completed ? "positive" : "outline"}
                    onClick={() => toggleSet(set.setIndex)}
                    aria-pressed={set.completed}
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5",
                        !set.completed && "opacity-40",
                      )}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {set.completed
                        ? `Hiệp ${set.setIndex + 1} đã xong`
                        : `Đánh dấu hiệp ${set.setIndex + 1} xong`}
                    </span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
