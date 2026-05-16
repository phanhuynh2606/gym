"use client";

import { Droplet, Footprints, Loader2, Moon, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveDailyMetrics, type DailyMetrics } from "@/app/actions/daily-todo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MOOD_OPTIONS: Array<{
  value: "bad" | "normal" | "good" | "great";
  label: string;
  emoji: string;
}> = [
  { value: "bad", label: "Tệ", emoji: "😞" },
  { value: "normal", label: "OK", emoji: "😐" },
  { value: "good", label: "Tốt", emoji: "🙂" },
  { value: "great", label: "Tuyệt", emoji: "😄" },
];

type Props = {
  date: string;
  initial: {
    waterLiters: number | null;
    sleepHours: number | null;
    steps: number | null;
    mood: "bad" | "normal" | "good" | "great" | null;
    energyLevel: number | null;
    note: string | null;
  };
};

function toNumberOrUndefined(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function TodayMetricsForm({ date, initial }: Props) {
  const router = useRouter();
  const [water, setWater] = useState(initial.waterLiters?.toString() ?? "");
  const [sleep, setSleep] = useState(initial.sleepHours?.toString() ?? "");
  const [steps, setSteps] = useState(initial.steps?.toString() ?? "");
  const [mood, setMood] = useState<typeof MOOD_OPTIONS[number]["value"] | null>(
    initial.mood,
  );
  const [energy, setEnergy] = useState<number | null>(initial.energyLevel);
  const [note, setNote] = useState(initial.note ?? "");
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const metrics: DailyMetrics = {};
      const w = toNumberOrUndefined(water);
      const s = toNumberOrUndefined(sleep);
      const st = toNumberOrUndefined(steps);
      if (w !== undefined) metrics.waterLiters = w;
      if (s !== undefined) metrics.sleepHours = s;
      if (st !== undefined) metrics.steps = st;
      if (mood) metrics.mood = mood;
      if (energy && energy >= 1 && energy <= 5)
        metrics.energyLevel = energy as 1 | 2 | 3 | 4 | 5;
      if (note.trim()) metrics.note = note.trim();

      const result = await saveDailyMetrics(date, metrics);
      if (result.ok) {
        setSavedAt(new Date().toLocaleTimeString("vi-VN"));
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chỉ số hôm nay</CardTitle>
        <CardDescription>
          Ghi nhanh nước, giấc ngủ, bước chân, mood và năng lượng.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="metric-water"
              className="flex items-center gap-1.5 text-xs"
            >
              <Droplet className="h-3.5 w-3.5 text-state-info" />
              Nước (L)
            </Label>
            <Input
              id="metric-water"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="10"
              placeholder="2.0"
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="metric-sleep"
              className="flex items-center gap-1.5 text-xs"
            >
              <Moon className="h-3.5 w-3.5 text-accent" />
              Ngủ (giờ)
            </Label>
            <Input
              id="metric-sleep"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="24"
              placeholder="7.5"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="metric-steps"
              className="flex items-center gap-1.5 text-xs"
            >
              <Footprints className="h-3.5 w-3.5 text-state-success" />
              Bước chân
            </Label>
            <Input
              id="metric-steps"
              type="number"
              inputMode="numeric"
              step="100"
              min="0"
              max="100000"
              placeholder="8000"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Tâm trạng</Label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setMood((prev) => (prev === opt.value ? null : opt.value))
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  mood === opt.value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border-subtle bg-card text-text-secondary hover:border-brand/40",
                )}
                aria-pressed={mood === opt.value}
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Năng lượng (1-5)</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEnergy((prev) => (prev === v ? null : v))}
                className={cn(
                  "h-9 w-9 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  energy === v
                    ? "border-brand bg-brand text-white"
                    : "border-border-subtle bg-card text-text-secondary hover:border-brand/40",
                )}
                aria-pressed={energy === v}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="metric-note" className="text-xs">
            Ghi chú
          </Label>
          <textarea
            id="metric-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cảm nhận về buổi tập, dinh dưỡng, giấc ngủ..."
            rows={3}
            maxLength={500}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            Lưu chỉ số
          </Button>
          {savedAt && !isPending && (
            <Badge variant="success" className="text-xs">
              Đã lưu lúc {savedAt}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
