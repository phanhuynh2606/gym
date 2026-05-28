"use client";

import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompletionPoint } from "@/lib/progress-data";

const TICK_STYLE = { fontSize: 11, fill: "var(--color-text-secondary)" };

function formatTick(date: string): string {
  return dayjs(date).format("D/M");
}

function barColor(point: CompletionPoint): string {
  if (point.type !== "training") return "var(--color-border)";
  if (point.completionRate >= 80) return "var(--color-state-success)";
  if (point.completionRate >= 50) return "var(--color-state-warning)";
  if (point.completionRate > 0) return "var(--color-brand)";
  return "var(--color-border-subtle)";
}

export function CompletionChart({ data }: { data: CompletionPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-surface text-sm text-text-secondary">
        Chưa có lịch sử completion. Hoàn thành task trong “Hôm nay” để bắt đầu.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          tick={TICK_STYLE}
          stroke="var(--color-border)"
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={TICK_STYLE}
          stroke="var(--color-border)"
          tickLine={false}
          width={36}
          unit="%"
        />
        <Tooltip
          formatter={(value) => [`${Number(value)}%`, "Hoàn thành"]}
          labelFormatter={(label) =>
            dayjs(String(label)).format("dddd, D/M/YYYY")
          }
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: 12,
          }}
          cursor={{ fill: "var(--color-border-subtle)", fillOpacity: 0.4 }}
        />
        <Bar dataKey="completionRate" radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.date} fill={barColor(d)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
