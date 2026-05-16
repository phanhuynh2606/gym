"use client";

import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESETS = [45, 60, 90] as const;

function formatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type RestTimerHandle = {
  startWithSeconds: (seconds: number) => void;
};

type Props = {
  className?: string;
  onComplete?: () => void;
  defaultSeconds?: number;
};

export const RestTimer = forwardRef<RestTimerHandle, Props>(function RestTimer(
  { className, onComplete, defaultSeconds = 60 },
  ref,
) {
  const [duration, setDuration] = useState<number>(defaultSeconds);
  const [remaining, setRemaining] = useState<number>(defaultSeconds);
  const [running, setRunning] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          completeRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running]);

  const startWithSeconds = useCallback((seconds: number) => {
    const value = Math.max(1, Math.floor(seconds));
    setDuration(value);
    setRemaining(value);
    setRunning(true);
  }, []);

  useImperativeHandle(ref, () => ({ startWithSeconds }), [startWithSeconds]);

  const handlePreset = (preset: number) => {
    startWithSeconds(preset);
  };

  const handleCustomStart = () => {
    const parsed = Number(customInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    startWithSeconds(Math.floor(parsed));
    setCustomInput("");
  };

  const handleReset = () => {
    stop();
    setRemaining(duration);
  };

  const handleToggle = () => {
    if (running) {
      stop();
      return;
    }
    if (remaining <= 0) {
      setRemaining(duration);
    }
    setRunning(true);
  };

  const progress = duration > 0 ? Math.min(100, (remaining / duration) * 100) : 0;
  const finished = !running && remaining === 0;

  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface p-4 space-y-3",
        className,
      )}
      role="region"
      aria-label="Hẹn giờ nghỉ giữa hiệp"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-2 text-text-secondary">
          <TimerIcon className="h-4 w-4 text-brand" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">
            Hẹn giờ nghỉ
          </span>
        </div>
        <div
          className={cn(
            "tabular-nums text-2xl font-semibold",
            running && "text-brand",
            finished && "text-state-success",
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatSeconds(remaining)}
        </div>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
        aria-hidden
      >
        <div
          className={cn(
            "h-full transition-[width] duration-1000 ease-linear",
            finished ? "bg-state-success" : "bg-brand",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={duration === preset ? "primary" : "outline"}
            onClick={() => handlePreset(preset)}
          >
            {preset}s
          </Button>
        ))}
        <div className="inline-flex items-center gap-1.5 ml-auto">
          <Label htmlFor="rest-custom" className="sr-only">
            Hẹn giờ tuỳ chỉnh (giây)
          </Label>
          <Input
            id="rest-custom"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            placeholder="Khác"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomStart();
              }
            }}
            className="h-8 w-20"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCustomStart}
          >
            Bắt đầu
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={running ? "secondary" : "primary"}
          onClick={handleToggle}
        >
          {running ? (
            <>
              <Pause className="h-3.5 w-3.5" aria-hidden /> Tạm dừng
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" aria-hidden /> {finished ? "Lại" : "Tiếp"}
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={remaining === duration && !running}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Đặt lại
        </Button>
        {finished && (
          <span className="text-xs font-medium text-state-success ml-1">
            Hết giờ — sẵn sàng hiệp tiếp!
          </span>
        )}
      </div>
    </div>
  );
});
