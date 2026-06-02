import dayjs from "dayjs";
import { CheckCircle2, Target } from "lucide-react";
import type { WeeklyChallenge } from "@/lib/challenges";

export function WeeklyChallengeCard({
  challenge,
}: {
  challenge: WeeklyChallenge;
}) {
  const { goal, trainedDays, percent, completed, weekStart, weekEnd } =
    challenge;
  const range = `${dayjs(weekStart).format("D/M")} – ${dayjs(weekEnd).format("D/M")}`;
  const remaining = Math.max(goal - trainedDays, 0);

  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={
              "flex h-10 w-10 items-center justify-center rounded-full " +
              (completed
                ? "bg-state-success/15 text-state-success"
                : "bg-brand/10 text-brand")
            }
            aria-hidden
          >
            {completed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Target className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-semibold leading-tight">Thử thách tuần</p>
            <p className="text-xs text-text-muted">{range}</p>
          </div>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {trainedDays}/{goal} buổi
        </p>
      </div>

      <div className="mt-4 space-y-1.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-border-subtle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Tiến độ thử thách tuần"
        >
          <div
            className={
              "h-full rounded-full transition-all " +
              (completed ? "bg-state-success" : "bg-brand")
            }
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary">
          {completed
            ? "Hoàn thành! Bạn đã đạt mục tiêu tập luyện tuần này."
            : `Tập thêm ${remaining} buổi nữa để hoàn thành thử thách tuần này.`}
        </p>
      </div>
    </div>
  );
}
