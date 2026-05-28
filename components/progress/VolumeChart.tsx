"use client";

import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VolumePoint } from "@/lib/progress-data";

const TICK_STYLE = { fontSize: 11, fill: "var(--color-text-secondary)" };

function formatTick(date: string): string {
  return dayjs(date).format("D/M");
}

function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-border bg-surface text-sm text-text-secondary">
        Chưa có buổi tập nào được log. Mở giáo án → tick set + nhập tạ để ghi
        nhận khối lượng.
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
          tickFormatter={formatVolume}
          tick={TICK_STYLE}
          stroke="var(--color-border)"
          tickLine={false}
          width={42}
        />
        <Tooltip
          formatter={(value) => [
            `${Number(value).toLocaleString()} kg·rep`,
            "Khối lượng",
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
          cursor={{ fill: "var(--color-border-subtle)", fillOpacity: 0.4 }}
        />
        <Bar
          dataKey="totalVolume"
          fill="var(--color-brand)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
