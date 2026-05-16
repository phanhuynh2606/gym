"use client";

import dayjs from "dayjs";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightPoint } from "@/lib/progress-data";

const TICK_STYLE = { fontSize: 11, fill: "var(--color-text-secondary)" };

function formatTick(date: string): string {
  return dayjs(date).format("D/M");
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed border-border bg-surface text-sm text-text-secondary">
        Chưa có dữ liệu cân nặng. Ghi cân nặng trong trang “Hôm nay” để bắt đầu
        theo dõi.
      </div>
    );
  }

  const weights = data.map((d) => d.bodyWeight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = Math.max(0.5, (max - min) * 0.1);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatTick}
          tick={TICK_STYLE}
          stroke="var(--color-border)"
          tickLine={false}
        />
        <YAxis
          domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
          tick={TICK_STYLE}
          stroke="var(--color-border)"
          tickLine={false}
          width={36}
        />
        <Tooltip
          formatter={(value) => [
            `${Number(value).toFixed(1)} kg`,
            "Cân nặng",
          ]}
          labelFormatter={(label) =>
            dayjs(String(label)).format("dddd, D/M/YYYY")
          }
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="bodyWeight"
          stroke="var(--color-brand)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-brand)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
