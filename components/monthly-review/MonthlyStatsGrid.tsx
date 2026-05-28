import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Moon,
  Scale,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthlyStats } from "@/lib/monthly-review";

type Tone = "default" | "success" | "warning";

function Stat({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Activity;
  hint?: React.ReactNode;
  tone?: Tone;
}) {
  const toneClass =
    tone === "success"
      ? "text-state-success bg-state-success/10"
      : tone === "warning"
        ? "text-state-warning bg-state-warning/10"
        : "text-brand bg-brand/10";
  return (
    <Card className="border-border-subtle">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${toneClass}`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {unit && <span className="text-xs text-text-secondary">{unit}</span>}
        </div>
        {hint && (
          <div className="text-xs text-text-secondary">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}

function completionTone(rate: number): Tone {
  if (rate >= 85) return "success";
  if (rate < 60) return "warning";
  return "default";
}

function weightHint(stats: MonthlyStats): React.ReactNode {
  if (stats.weightDeltaKg === null) return "Chưa ghi nhận";
  if (stats.weightDeltaKg === 0) return "Ổn định";
  const sign = stats.weightDeltaKg > 0 ? "+" : "";
  return `${sign}${stats.weightDeltaKg.toFixed(1)} kg so với đầu tháng`;
}

export function MonthlyStatsGrid({ stats }: { stats: MonthlyStats }) {
  const sessionsLabel =
    stats.plannedSessions > 0
      ? `${stats.completedTrainingDays}/${stats.plannedSessions}`
      : `${stats.totalSessions}`;
  const totalVolumeLabel =
    stats.totalVolume >= 1000
      ? (stats.totalVolume / 1000).toFixed(1)
      : stats.totalVolume.toString();
  const totalVolumeUnit =
    stats.totalVolume >= 1000 ? "k kg·rep" : "kg·rep";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <Stat
        label="Buổi tập"
        value={sessionsLabel}
        icon={CalendarCheck2}
        hint={
          stats.missedDays > 0
            ? `Bỏ lỡ ${stats.missedDays} buổi`
            : "Đầy đủ"
        }
        tone={stats.missedDays === 0 && stats.plannedSessions > 0 ? "success" : "default"}
      />
      <Stat
        label="Hoàn thành TB"
        value={`${stats.completionRate}`}
        unit="%"
        icon={CheckCircle2}
        hint={
          stats.completedTodoDays > 0
            ? `${stats.completedTodoDays} ngày ≥ 80%`
            : "Chưa có ngày nào hoàn thành"
        }
        tone={completionTone(stats.completionRate)}
      />
      <Stat
        label="Streak dài nhất"
        value={`${stats.longestStreak}`}
        unit="ngày"
        icon={Flame}
        tone={stats.longestStreak >= 7 ? "success" : "default"}
      />
      <Stat
        label="Khối lượng tổng"
        value={totalVolumeLabel}
        unit={totalVolumeUnit}
        icon={Activity}
        hint={`${stats.totalSessions} buổi đã log`}
      />
      <Stat
        label="Cân nặng"
        value={
          stats.bodyWeightEnd !== null
            ? stats.bodyWeightEnd.toFixed(1)
            : "—"
        }
        unit={stats.bodyWeightEnd !== null ? "kg" : undefined}
        icon={Scale}
        hint={weightHint(stats)}
      />
      <Stat
        label="Ngủ TB"
        value={stats.avgSleepHours !== null ? `${stats.avgSleepHours}` : "—"}
        unit={stats.avgSleepHours !== null ? "giờ" : undefined}
        icon={Moon}
        tone={
          stats.avgSleepHours === null
            ? "default"
            : stats.avgSleepHours >= 7
              ? "success"
              : "warning"
        }
      />
      <Stat
        label="Cardio"
        value={
          stats.cardioPlanned > 0
            ? `${stats.cardioCompleted}/${stats.cardioPlanned}`
            : "—"
        }
        icon={TrendingUp}
        hint={
          stats.cardioPlanned > 0
            ? `${Math.round((stats.cardioCompleted / stats.cardioPlanned) * 100)}%`
            : "Chưa có buổi cardio"
        }
        tone={
          stats.cardioPlanned === 0
            ? "default"
            : stats.cardioCompleted / stats.cardioPlanned >= 0.8
              ? "success"
              : stats.cardioCompleted / stats.cardioPlanned < 0.5
                ? "warning"
                : "default"
        }
      />
      <Stat
        label="Ngày ghi metrics"
        value={`${stats.recordedMetricsDays}`}
        unit={stats.numDays > 0 ? `/ ${stats.numDays}` : undefined}
        icon={CheckCircle2}
        hint="Cân nặng / nước / ngủ / bước"
      />
    </div>
  );
}
