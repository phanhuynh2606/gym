import { ArrowRight, Coffee, Dumbbell } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  type: "training" | "rest" | "recovery";
  title: string;
  planSlug: string | null;
  planDayIndex: number | null;
  exerciseCount: number;
  completionRate: number;
};

export function SessionSummaryCard({
  type,
  title,
  planSlug,
  planDayIndex,
  exerciseCount,
  completionRate,
}: Props) {
  const isRest = type === "rest" || type === "recovery";

  return (
    <Card
      className={
        isRest
          ? "border-state-warning/20 bg-state-warning/5"
          : "border-brand/30 bg-gradient-to-br from-brand/5 via-card to-surface"
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md ${
                isRest
                  ? "bg-state-warning/15 text-state-warning"
                  : "bg-brand text-white"
              }`}
            >
              {isRest ? (
                <Coffee className="h-4 w-4" />
              ) : (
                <Dumbbell className="h-4 w-4" />
              )}
            </div>
            <div>
              <Badge variant={isRest ? "warning" : "default"}>
                {isRest ? "Ngày nghỉ" : `Buổi ${planDayIndex ?? "?"}`}
              </Badge>
              <CardTitle className="pt-1 text-lg">{title}</CardTitle>
            </div>
          </div>
          {!isRest && (
            <span className="tabular-nums text-xs text-text-secondary">
              {completionRate}% hoàn thành
            </span>
          )}
        </div>
        {!isRest && (
          <CardDescription>
            {exerciseCount} bài tập • Bấm vào để khởi động buổi tập với
            ProgressChecklist + RestTimer.
          </CardDescription>
        )}
        {isRest && (
          <CardDescription>
            Đi bộ, yoga giãn cơ hoặc nghỉ ngơi hoàn toàn để cơ thể hồi phục.
          </CardDescription>
        )}
      </CardHeader>
      {!isRest && planSlug && (
        <CardContent>
          <Link
            href={`/giao-an/${planSlug}#session-${planDayIndex}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
          >
            Mở buổi tập
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
