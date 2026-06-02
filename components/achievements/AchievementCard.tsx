import { Lock } from "lucide-react";
import {
  TIER_LABELS_VI,
  type AchievementStatus,
} from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { ACHIEVEMENT_ICONS, TIER_STYLES } from "./visuals";

function formatMetric(value: number, metric: AchievementStatus["metric"]): string {
  if (metric === "totalVolume") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu kg`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k kg`;
    return `${value} kg`;
  }
  if (metric === "profilePublic") {
    return value >= 1 ? "Đã công khai" : "Chưa công khai";
  }
  return value.toLocaleString("vi-VN");
}

export function AchievementCard({ status }: { status: AchievementStatus }) {
  const Icon = ACHIEVEMENT_ICONS[status.icon] ?? ACHIEVEMENT_ICONS.Award;
  const tierStyle = TIER_STYLES[status.tier];
  const pct = Math.round(status.progress * 100);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-md border p-4 transition-colors",
        status.unlocked
          ? tierStyle.card
          : "border-border-subtle bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
            status.unlocked
              ? tierStyle.iconWrap
              : "bg-border-subtle text-text-muted",
          )}
          aria-hidden
        >
          {status.unlocked ? (
            <Icon className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                status.unlocked ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {status.name}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                status.unlocked
                  ? tierStyle.pill
                  : "bg-border-subtle text-text-muted",
              )}
            >
              {TIER_LABELS_VI[status.tier]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {status.description}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-1">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Tiến độ ${status.name}`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status.unlocked ? "bg-state-success" : "bg-brand",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          {status.unlocked ? (
            <span className="font-medium text-state-success">
              Đã mở khoá · +{status.points} điểm
            </span>
          ) : (
            <span>
              {formatMetric(status.value, status.metric)} /{" "}
              {formatMetric(status.threshold, status.metric)}
            </span>
          )}
          <span className="tabular-nums">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
