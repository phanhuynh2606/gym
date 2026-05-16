import { Flame } from "lucide-react";

export function StreakBadge({ days }: { days: number }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-semibold ${
        days > 0
          ? "border-state-warning/30 bg-state-warning/10 text-state-warning"
          : "border-border-subtle bg-card text-text-secondary"
      }`}
      title={`Chuỗi ngày có hoạt động: ${days}`}
    >
      <Flame
        className={`h-4 w-4 ${days > 0 ? "text-state-warning" : "text-text-muted"}`}
        aria-hidden
      />
      <span className="tabular-nums">{days}</span>
      <span className="text-xs font-normal text-text-secondary">ngày</span>
    </div>
  );
}
