"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateWorkoutPlanAction,
  type WorkoutPlanFormState,
} from "@/app/actions/admin-workout-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkoutPlan, WorkoutSession } from "@/types";

const initial: WorkoutPlanFormState = { status: "idle" };

export function WorkoutPlanForm({
  plan,
}: {
  plan: WorkoutPlan & { isPublished: boolean };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    updateWorkoutPlanAction,
    initial,
  );
  const [sessionsJson, setSessionsJson] = useState<string>(() =>
    JSON.stringify(serializeForForm(plan.sessions), null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [published, setPublished] = useState(plan.isPublished);

  useEffect(() => {
    if (state.status === "success") {
      router.push("/admin/workout-plans");
    }
  }, [state, router]);

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="originalSlug" value={plan.slug} />
      <input type="hidden" name="sessionsJson" value={sessionsJson} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input id="title" name="title" defaultValue={plan.title} />
          {errors.title && (
            <p className="text-xs text-state-error">{errors.title.join("; ")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" name="slug" defaultValue={plan.slug} />
          {errors.slug && (
            <p className="text-xs text-state-error">{errors.slug.join("; ")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetUser">Đối tượng *</Label>
          <select
            id="targetUser"
            name="targetUser"
            defaultValue={plan.targetUser}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="female_weight_loss">Nữ giảm cân</option>
            <option value="male_beginner">Nam mới tập</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Cấp độ *</Label>
          <select
            id="level"
            name="level"
            defaultValue={plan.level}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="beginner">Người mới</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="daysPerWeek">Số buổi / tuần</Label>
          <Input
            id="daysPerWeek"
            name="daysPerWeek"
            type="number"
            min={1}
            max={7}
            defaultValue={plan.daysPerWeek}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal">Mục tiêu</Label>
        <textarea
          id="goal"
          name="goal"
          defaultValue={plan.goal}
          rows={2}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Mô tả</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={plan.description}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sessions">
          Lịch tuần (JSON, mảng session)
        </Label>
        <textarea
          id="sessions"
          rows={20}
          value={sessionsJson}
          onChange={(e) => {
            const v = e.target.value;
            setSessionsJson(v);
            try {
              JSON.parse(v);
              setJsonError(null);
            } catch (err) {
              setJsonError(
                err instanceof Error ? err.message : "JSON không hợp lệ",
              );
            }
          }}
          className="w-full font-mono text-xs leading-snug rounded-md border border-border bg-surface px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <p className="text-xs text-text-secondary">
          Trường bắt buộc mỗi session: <code>sessionId</code>,{" "}
          <code>title</code>, <code>dayIndex</code>, <code>focus</code> (mảng),
          <code> exercises</code> (mảng <code>exerciseSlug</code>,{" "}
          <code>sets</code>, <code>reps</code>, <code>restSeconds</code>).
        </p>
        {jsonError && (
          <p className="text-xs text-state-error">{jsonError}</p>
        )}
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        Hiển thị công khai
      </label>

      {state.status === "error" && (
        <p className="rounded-md border border-state-error/40 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending || !!jsonError}>
          {pending ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/workout-plans")}
          disabled={pending}
        >
          Huỷ
        </Button>
      </div>
    </form>
  );
}

function serializeForForm(sessions: WorkoutSession[]) {
  return sessions.map((s) => ({
    sessionId: s.id,
    title: s.title,
    dayIndex: s.dayIndex,
    focus: s.focus,
    exercises: s.exercises,
    ...(s.cardio ? { cardio: s.cardio } : {}),
  }));
}
