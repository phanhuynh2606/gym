"use client";

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CircleSlash,
  Dot,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  completionMap,
  getTodayIso,
  loadCompletions,
  subscribeWorkoutStorage,
} from "@/lib/workout-storage";
import { cn } from "@/lib/utils";
import type { SessionCompletion, WorkoutPlan } from "@/types";

const EMPTY_COMPLETIONS: SessionCompletion[] = [];

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
const FULL_DAY_LABELS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
] as const;

type Props = {
  plans: WorkoutPlan[];
};

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  // 0 = Sun. Shift so Monday is the first day.
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatVi(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function WeekCalendar({ plans }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPlanSlug = searchParams.get("plan") ?? plans[0]?.slug;
  const [planSlug, setPlanSlug] = useState<string>(initialPlanSlug ?? "");
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );

  const getCompletions = useCallback(
    () => (planSlug ? loadCompletions(planSlug) : EMPTY_COMPLETIONS),
    [planSlug],
  );
  const getServerCompletions = useCallback(() => EMPTY_COMPLETIONS, []);

  const completions = useSyncExternalStore<SessionCompletion[]>(
    subscribeWorkoutStorage,
    getCompletions,
    getServerCompletions,
  );

  useEffect(() => {
    if (planSlug && plans.some((p) => p.slug === planSlug)) {
      router.replace(`${pathname}?plan=${encodeURIComponent(planSlug)}`, {
        scroll: false,
      });
    }
  }, [planSlug, pathname, plans, router]);

  const plan = useMemo(
    () => plans.find((p) => p.slug === planSlug) ?? plans[0],
    [plans, planSlug],
  );

  const days = useMemo(() => {
    if (!plan) return [];
    const completionByKey = completionMap(completions);
    const todayIso = getTodayIso();
    return Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(weekStart, offset);
      const iso = toIso(date);
      const dayIndex = offset + 1;
      const session = plan.sessions.find((s) => s.dayIndex === dayIndex);
      const completion = session
        ? completionByKey.get(`${iso}:${session.id}`)
        : undefined;
      return {
        offset,
        date,
        iso,
        dayIndex,
        session,
        completion,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
      };
    });
  }, [plan, weekStart, completions]);

  if (!plan) return null;

  const weekLabel = `${formatVi(weekStart)} – ${formatVi(addDays(weekStart, 6))}`;
  const completedCount = days.filter((d) => d.completion).length;
  const trainingDays = days.filter((d) => d.session).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{plan.title}</h2>
          <p className="text-sm text-text-secondary">
            {plan.daysPerWeek} buổi/tuần • {plan.goal}
          </p>
        </div>

        <Tabs
          value={planSlug}
          onValueChange={setPlanSlug}
          className="md:max-w-md"
        >
          <TabsList className="flex-wrap h-auto">
            {plans.map((p) => (
              <TabsTrigger key={p.slug} value={p.slug}>
                {p.title.split(" ").slice(0, 3).join(" ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              aria-label="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="text-sm font-medium tabular-nums">
              {weekLabel}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              aria-label="Tuần sau"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              Tuần này
            </Button>
          </div>

          <div className="text-xs text-text-secondary tabular-nums">
            <CalendarCheck className="h-3.5 w-3.5 text-state-success inline-block mr-1" aria-hidden />
            Đã xong{" "}
            <span className="font-semibold text-state-success">
              {completedCount}
            </span>{" "}
            / {trainingDays} buổi
          </div>
        </div>

        <ol className="grid grid-cols-7 gap-2" aria-label="Lịch tập 7 ngày">
          {days.map((d) => {
            const isTraining = Boolean(d.session);
            const isCompleted = Boolean(d.completion);
            const dayCellLabel = `${FULL_DAY_LABELS[d.offset]} ${formatVi(d.date)} — ${
              d.session
                ? `Buổi ${d.session.dayIndex}: ${d.session.title}`
                : "Nghỉ"
            }${isCompleted ? " (đã hoàn thành)" : ""}`;

            const inner = (
              <div
                className={cn(
                  "flex flex-col h-full gap-1.5 rounded-md border p-2 transition-colors text-left",
                  isCompleted
                    ? "border-state-success/40 bg-state-success/5"
                    : isTraining
                      ? "border-border-subtle bg-surface hover:border-brand"
                      : "border-border-subtle bg-bg",
                  d.isToday && "ring-2 ring-brand ring-offset-1",
                  !d.isToday && d.isPast && !isCompleted && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                    {DAY_LABELS[d.offset]}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-text-secondary">
                    {formatVi(d.date)}
                  </span>
                </div>

                {isTraining ? (
                  <>
                    <span className="text-xs font-medium text-text-primary line-clamp-2 min-h-[2rem]">
                      {d.session?.title}
                    </span>
                    <div className="mt-auto flex items-center justify-between">
                      <Badge
                        variant={isCompleted ? "success" : "default"}
                        className="text-[10px]"
                      >
                        Buổi {d.session?.dayIndex}
                      </Badge>
                      {isCompleted ? (
                        <CalendarCheck
                          className="h-4 w-4 text-state-success"
                          aria-hidden
                        />
                      ) : d.isToday ? (
                        <CircleDot className="h-4 w-4 text-brand" aria-hidden />
                      ) : (
                        <Dot
                          className="h-4 w-4 text-text-muted"
                          aria-hidden
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-text-secondary">Nghỉ</span>
                    <div className="mt-auto flex items-center justify-end">
                      <CircleSlash
                        className="h-4 w-4 text-text-muted"
                        aria-hidden
                      />
                    </div>
                  </>
                )}
              </div>
            );

            return (
              <li key={d.iso} className="min-h-[5.5rem]">
                {isTraining && d.session ? (
                  <Link
                    href={`/giao-an/${plan.slug}#${d.session.id}`}
                    aria-label={dayCellLabel}
                    className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div aria-label={dayCellLabel}>{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {completedCount === 0 && (
        <p className="text-xs text-text-muted">
          Chưa có buổi nào được đánh dấu hoàn thành trong tuần này. Bắt đầu một
          buổi tập từ trang giáo án và bấm <span className="font-medium">“Hoàn thành buổi tập”</span> để
          ghi nhận tiến độ.
        </p>
      )}
    </div>
  );
}
