"use client";

import { Apple, Check, Dumbbell, Heart, Loader2, Moon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleTodoTask } from "@/app/actions/daily-todo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DailyTodoView } from "@/lib/serializers";

const CATEGORY_META: Record<
  DailyTodoView["tasks"][number]["category"],
  { label: string; icon: typeof Dumbbell; tone: string }
> = {
  workout: {
    label: "Buổi tập",
    icon: Dumbbell,
    tone: "text-brand bg-brand/10",
  },
  nutrition: {
    label: "Dinh dưỡng",
    icon: Apple,
    tone: "text-state-success bg-state-success/10",
  },
  habit: {
    label: "Thói quen",
    icon: Moon,
    tone: "text-accent bg-accent/10",
  },
  recovery: {
    label: "Hồi phục",
    icon: Heart,
    tone: "text-state-warning bg-state-warning/10",
  },
};

const CATEGORY_ORDER: DailyTodoView["tasks"][number]["category"][] = [
  "workout",
  "recovery",
  "nutrition",
  "habit",
];

export function TodoChecklist({ todo }: { todo: DailyTodoView }) {
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    todo.tasks,
    (state, taskId: string) =>
      state.map((t) =>
        t.taskId === taskId ? { ...t, completed: !t.completed } : t,
      ),
  );
  const [isPending, startTransition] = useTransition();

  const handleToggle = (taskId: string) => {
    startTransition(async () => {
      applyOptimistic(taskId);
      const result = await toggleTodoTask(todo.date, taskId);
      if (!result.ok) {
        // Refresh to reset optimistic state — server-action revalidation will handle.
        console.error(result.error);
      }
    });
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    tasks: optimisticTasks.filter((t) => t.category === cat),
  })).filter((g) => g.tasks.length > 0);

  const completedCount = optimisticTasks.filter((t) => t.completed).length;
  const totalCount = optimisticTasks.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border-subtle bg-card p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-text-primary">
            Tiến độ hôm nay
          </span>
          <span className="tabular-nums text-text-secondary">
            {completedCount}/{totalCount} · {percent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border-subtle">
          <div
            className="h-full bg-brand transition-[width] duration-300"
            style={{ width: `${percent}%` }}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      {grouped.map(({ category, tasks }) => {
        const meta = CATEGORY_META[category];
        const Icon = meta.icon;
        return (
          <section key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  meta.tone,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">
                {meta.label}
              </h2>
              <Badge variant="outline" className="text-xs">
                {tasks.filter((t) => t.completed).length}/{tasks.length}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {tasks.map((task) => (
                <li key={task.taskId}>
                  <button
                    type="button"
                    onClick={() => handleToggle(task.taskId)}
                    disabled={isPending}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      task.completed
                        ? "border-state-success/30 bg-state-success/5"
                        : "border-border-subtle bg-card hover:border-brand/40",
                    )}
                    aria-pressed={task.completed}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                        task.completed
                          ? "border-state-success bg-state-success text-white"
                          : "border-border bg-surface group-hover:border-brand",
                      )}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 transition-colors",
                        task.completed &&
                          "line-through text-text-muted decoration-state-success/60",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.required && !task.completed && (
                      <Badge variant="warning" className="text-[10px]">
                        Bắt buộc
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {isPending && (
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Đang cập
          nhật...
        </p>
      )}
    </div>
  );
}
