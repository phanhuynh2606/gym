"use client";

import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  useTransition,
} from "react";
import { completeWorkoutSession } from "@/app/actions/log-exercise";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MuscleBadge } from "@/components/exercise/ExerciseCard";
import { ProgressChecklist } from "@/components/workout/ProgressChecklist";
import { RestTimer, type RestTimerHandle } from "@/components/workout/RestTimer";
import {
  clearSessionProgress,
  getTodayIso,
  loadCompletions,
  loadSessionProgress,
  recordCompletion,
  subscribeWorkoutStorage,
} from "@/lib/workout-storage";
import type {
  CardioBlock,
  Exercise,
  Muscle,
  SessionCompletion,
  SessionExercise,
  SessionProgress,
} from "@/types";

const EMPTY_COMPLETIONS: SessionCompletion[] = [];

type Props = {
  planSlug: string;
  session: {
    id: string;
    title: string;
    dayIndex: number;
    focus: Muscle[];
    exercises: SessionExercise[];
    cardio?: CardioBlock;
  };
  exercises: Record<string, Exercise | undefined>;
};

export function WorkoutSession({ planSlug, session, exercises }: Props) {
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<RestTimerHandle | null>(null);

  const getProgress = useCallback(
    () => loadSessionProgress(planSlug, session.id),
    [planSlug, session.id],
  );
  const getServerProgress = useCallback((): SessionProgress | null => null, []);

  const progress = useSyncExternalStore<SessionProgress | null>(
    subscribeWorkoutStorage,
    getProgress,
    getServerProgress,
  );

  const getCompletions = useCallback(
    () => loadCompletions(planSlug),
    [planSlug],
  );
  const getServerCompletions = useCallback(
    () => EMPTY_COMPLETIONS,
    [],
  );

  const completions = useSyncExternalStore<SessionCompletion[]>(
    subscribeWorkoutStorage,
    getCompletions,
    getServerCompletions,
  );

  const todayIso = getTodayIso();
  const completedToday = completions.some(
    (c) => c.sessionId === session.id && c.date === todayIso,
  );

  const totalSets = useMemo(
    () => session.exercises.reduce((sum, ex) => sum + ex.sets, 0),
    [session.exercises],
  );

  const completedSets = useMemo(() => {
    if (!progress) return 0;
    return session.exercises.reduce((sum, ex) => {
      const sets = progress.exercises[ex.exerciseSlug]?.sets ?? [];
      return sum + sets.filter((s) => s.completed).length;
    }, 0);
  }, [progress, session.exercises]);

  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  function handleSetCompleted(restSeconds: number) {
    timerRef.current?.startWithSeconds(restSeconds);
  }

  function handleResetProgress() {
    if (typeof window === "undefined") return;
    if (
      !window.confirm(
        "Xoá tiến độ buổi tập này? Bạn sẽ phải tick lại các hiệp đã xong.",
      )
    ) {
      return;
    }
    clearSessionProgress(planSlug, session.id);
  }

  function handleCompleteSession() {
    const today = getTodayIso();
    recordCompletion({
      planSlug,
      sessionId: session.id,
      dayIndex: session.dayIndex,
      date: today,
      completedAt: new Date().toISOString(),
    });
    startTransition(async () => {
      await completeWorkoutSession({
        planSlug,
        sessionId: session.id,
        dayIndex: session.dayIndex,
        date: today,
      });
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>{session.title}</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {session.focus.map((m) => (
                  <MuscleBadge key={m} muscle={m} primary />
                ))}
              </div>
            </div>
            <div className="text-right text-sm text-text-secondary space-y-0.5">
              <p>
                <span className="tabular-nums text-text-primary font-medium">
                  {session.exercises.length}
                </span>{" "}
                bài • {totalSets} hiệp
              </p>
              {session.cardio && (
                <p>+ Cardio {session.cardio.durationMinutes}p</p>
              )}
              <p className="tabular-nums">
                Tiến độ:{" "}
                <span className="font-semibold text-brand">{pct}%</span>{" "}
                ({completedSets}/{totalSets})
              </p>
            </div>
          </div>

          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
            aria-hidden
          >
            <div
              className="h-full bg-brand transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          {completedToday && (
            <div className="inline-flex items-center gap-2 self-start rounded-sm bg-state-success/10 px-2.5 py-1 text-xs font-medium text-state-success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Buổi tập hôm nay đã hoàn thành
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <RestTimer ref={timerRef} className="md:max-w-sm" />

          <ul className="rounded-md border border-border-subtle divide-y divide-border-subtle bg-surface">
            {session.exercises.map((item, idx) => (
              <ProgressChecklist
                key={`${item.exerciseSlug}-${idx}`}
                planSlug={planSlug}
                sessionId={session.id}
                index={idx}
                item={item}
                exercise={exercises[item.exerciseSlug]}
                onSetCompleted={handleSetCompleted}
              />
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="positive"
              onClick={handleCompleteSession}
              disabled={isPending || completedToday}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {completedToday
                ? "Đã hoàn thành"
                : isPending
                  ? "Đang lưu…"
                  : "Hoàn thành buổi tập"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetProgress}
              disabled={!progress}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Xoá tiến độ
            </Button>
            <p className="text-xs text-text-muted">
              Tiến độ lưu cục bộ trên trình duyệt. PR #3 sẽ sync vào tài khoản
              Clerk.
            </p>
          </div>
        </CardContent>
      </Card>

      {session.cardio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" aria-hidden />
              Cardio: {session.cardio.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary space-y-1">
            <p>
              Thời lượng:{" "}
              <span className="text-text-primary font-medium">
                {session.cardio.durationMinutes} phút
              </span>
            </p>
            <p>
              Cường độ:{" "}
              <Badge
                variant={
                  session.cardio.intensity === "high"
                    ? "error"
                    : session.cardio.intensity === "moderate"
                      ? "default"
                      : "secondary"
                }
                className="ml-1"
              >
                {session.cardio.intensity === "low"
                  ? "Thấp"
                  : session.cardio.intensity === "moderate"
                    ? "Trung bình"
                    : "Cao"}
              </Badge>
            </p>
            {session.cardio.note && <p>{session.cardio.note}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
