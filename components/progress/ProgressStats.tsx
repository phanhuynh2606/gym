import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Droplet,
  Footprints,
  Minus,
  Moon,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MetricsSummary } from "@/lib/progress-data";

function Stat({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: typeof Activity;
  hint?: React.ReactNode;
  tone?: "default" | "success" | "warning";
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

export function ProgressStats({ summary }: { summary: MetricsSummary }) {
  const weightHint = (() => {
    if (summary.weightDeltaKg === null) return "Chưa có dữ liệu";
    if (summary.weightDeltaKg === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-text-secondary">
          <Minus className="h-3 w-3" /> Ổn định
        </span>
      );
    }
    const negative = summary.weightDeltaKg < 0;
    const Icon = negative ? ArrowDownRight : ArrowUpRight;
    const toneColor = negative ? "text-state-success" : "text-state-warning";
    return (
      <span className={`inline-flex items-center gap-1 ${toneColor}`}>
        <Icon className="h-3 w-3" />
        {negative ? "" : "+"}
        {summary.weightDeltaKg.toFixed(1)} kg trong {summary.numDays} ngày
      </span>
    );
  })();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat
        label="Cân nặng"
        value={
          summary.lastBodyWeight !== null
            ? summary.lastBodyWeight.toFixed(1)
            : "—"
        }
        unit={summary.lastBodyWeight !== null ? "kg" : undefined}
        icon={Scale}
        hint={weightHint}
      />
      <Stat
        label="Hoàn thành TB"
        value={`${summary.avgCompletionRate}`}
        unit="%"
        icon={CheckCircle2}
        tone={summary.avgCompletionRate >= 70 ? "success" : "default"}
        hint={`${summary.trainingDays} buổi tập, ${summary.restDays} ngày nghỉ`}
      />
      <Stat
        label="Khối lượng tổng"
        value={
          summary.totalVolume >= 1000
            ? (summary.totalVolume / 1000).toFixed(1)
            : summary.totalVolume.toString()
        }
        unit={summary.totalVolume >= 1000 ? "k kg·rep" : "kg·rep"}
        icon={Activity}
        hint={`${summary.totalSessions} buổi đã log`}
      />
      <Stat
        label="Ngủ TB"
        value={summary.avgSleepHours !== null ? `${summary.avgSleepHours}` : "—"}
        unit={summary.avgSleepHours !== null ? "giờ" : undefined}
        icon={Moon}
        tone={
          summary.avgSleepHours === null
            ? "default"
            : summary.avgSleepHours >= 7
              ? "success"
              : "warning"
        }
      />
      <Stat
        label="Nước TB"
        value={
          summary.avgWaterLiters !== null ? `${summary.avgWaterLiters}` : "—"
        }
        unit={summary.avgWaterLiters !== null ? "L/ngày" : undefined}
        icon={Droplet}
      />
      <Stat
        label="Bước chân TB"
        value={summary.avgSteps > 0 ? summary.avgSteps.toLocaleString() : "—"}
        unit={summary.avgSteps > 0 ? "/ngày" : undefined}
        icon={Footprints}
      />
    </div>
  );
}
