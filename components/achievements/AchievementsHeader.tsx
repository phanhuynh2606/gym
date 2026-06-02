import { Award, Trophy } from "lucide-react";
import type { AchievementSummary } from "@/lib/achievements";

export function AchievementsHeader({
  summary,
}: {
  summary: AchievementSummary;
}) {
  const pct = Math.round(summary.levelProgress * 100);
  const toNext =
    summary.nextLevelPoints != null
      ? summary.nextLevelPoints - summary.points
      : 0;

  return (
    <div className="rounded-md border border-border-subtle bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-raised md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30"
            aria-hidden
          >
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              Cấp {summary.level}
            </p>
            <p className="text-xl font-bold leading-tight md:text-2xl">
              {summary.levelLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">
              {summary.points}
            </p>
            <p className="text-xs text-white/70">điểm</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1 text-2xl font-bold tabular-nums">
              <Award className="h-5 w-5" aria-hidden />
              {summary.unlockedCount}/{summary.total}
            </p>
            <p className="text-xs text-white/70">huy hiệu</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Tiến độ lên cấp"
        >
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-white/80">
          {summary.nextLevelPoints != null
            ? `Còn ${toNext} điểm để lên cấp tiếp theo`
            : "Bạn đã đạt cấp cao nhất!"}
        </p>
      </div>
    </div>
  );
}
