"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MUSCLES: Muscle[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
];

const EQUIPMENT: Equipment[] = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "cable",
  "machine",
];

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

const GOALS: Goal[] = ["weight_loss", "muscle_gain", "toning", "strength"];

export function ExerciseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const hasAny = Array.from(searchParams.keys()).length > 0;

  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);

  // Sync the input when the URL query changes externally (e.g. "clear all
  // filters" or back/forward navigation) using the render-time adjustment
  // pattern instead of an effect.
  const [prevUrlQuery, setPrevUrlQuery] = useState(currentQuery);
  if (currentQuery !== prevUrlQuery) {
    setPrevUrlQuery(currentQuery);
    setQuery(currentQuery);
  }

  // Debounce writing the text query into the URL so we don't push on
  // every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed === currentQuery) return;
      update("q", trimmed === "" ? null : trimmed);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, currentQuery, update]);

  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm bài tập theo tên…"
          aria-label="Tìm bài tập"
          className="pl-9"
        />
      </div>

      <FilterGroup label="Nhóm cơ">
        {MUSCLES.map((m) => (
          <Chip
            key={m}
            label={MUSCLE_LABELS_VI[m]}
            active={searchParams.get("muscle") === m}
            onClick={() => update("muscle", m)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Dụng cụ">
        {EQUIPMENT.map((e) => (
          <Chip
            key={e}
            label={EQUIPMENT_LABELS_VI[e]}
            active={searchParams.get("equipment") === e}
            onClick={() => update("equipment", e)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Độ khó">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            label={DIFFICULTY_LABELS_VI[d]}
            active={searchParams.get("difficulty") === d}
            onClick={() => update("difficulty", d)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Mục tiêu">
        {GOALS.map((g) => (
          <Chip
            key={g}
            label={GOAL_LABELS_VI[g]}
            active={searchParams.get("goal") === g}
            onClick={() => update("goal", g)}
          />
        ))}
      </FilterGroup>

      {hasAny && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname, { scroll: false })}
        >
          <X className="h-3.5 w-3.5" />
          Bỏ tất cả bộ lọc
        </Button>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium bg-brand text-white"
          : "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium border border-border text-text-secondary hover:border-brand hover:text-brand"
      }
    >
      {label}
    </button>
  );
}
