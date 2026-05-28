import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthlyStatsGrid } from "@/components/monthly-review/MonthlyStatsGrid";
import { NextMonthSuggestion } from "@/components/monthly-review/NextMonthSuggestion";
import type { MonthlyReviewView } from "@/lib/monthly-review";
import { describePlan } from "@/lib/monthly-review";

type Props = {
  review: MonthlyReviewView;
  highlight?: boolean;
  currentPlanSlug: string | null;
  collapsible?: boolean;
};

export function MonthlyReviewCard({
  review,
  highlight = false,
  currentPlanSlug,
  collapsible = false,
}: Props) {
  const { stats } = review;
  const suggestedPlan = describePlan(review.suggestedNextPlanSlug);
  const isCurrentPlan =
    suggestedPlan !== null && suggestedPlan.slug === currentPlanSlug;

  const completionBadge =
    stats.completionRate >= 85
      ? { tone: "success" as const, label: "Xuất sắc" }
      : stats.completionRate >= 60
        ? { tone: "default" as const, label: "Ổn định" }
        : stats.numDays > 0
          ? { tone: "warning" as const, label: "Cần cải thiện" }
          : { tone: "default" as const, label: "Chưa có dữ liệu" };

  const Body = (
    <CardContent className="space-y-5">
      <p className="text-sm text-text-primary leading-relaxed">
        {review.summaryText}
      </p>

      <MonthlyStatsGrid stats={stats} />

      {review.achievements.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-state-success" aria-hidden />
            Điểm mạnh
          </h3>
          <ul className="space-y-1.5 pl-6 text-sm text-text-primary">
            {review.achievements.map((item) => (
              <li key={item} className="list-disc marker:text-state-success">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <NextMonthSuggestion
        plan={suggestedPlan}
        isCurrentPlan={isCurrentPlan}
        suggestions={review.suggestions}
      />
    </CardContent>
  );

  return (
    <Card
      className={
        highlight
          ? "border-brand/30 bg-gradient-to-br from-brand/5 via-card to-surface"
          : ""
      }
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {highlight && (
                <Sparkles className="h-5 w-5 text-brand" aria-hidden />
              )}
              <CardTitle className="text-xl">{review.label}</CardTitle>
              <Badge
                variant={
                  completionBadge.tone === "success"
                    ? "success"
                    : completionBadge.tone === "warning"
                      ? "warning"
                      : "secondary"
                }
                className="text-xs"
              >
                {completionBadge.label}
              </Badge>
            </div>
            <CardDescription>
              {stats.numDays > 0
                ? `${stats.numDays} ngày dữ liệu • ${stats.trainingDays} buổi tập kế hoạch • ${stats.totalSessions} buổi đã log`
                : "Chưa có dữ liệu trong tháng này"}
            </CardDescription>
          </div>
          {review.persisted && review.generatedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <ChevronRight className="h-3 w-3" aria-hidden />
              Tự động tạo
            </span>
          )}
        </div>
      </CardHeader>
      {collapsible ? (
        <details>
          <summary className="cursor-pointer list-none px-6 pb-4 text-sm text-brand hover:underline">
            Xem chi tiết tháng {review.label}
          </summary>
          {Body}
        </details>
      ) : (
        Body
      )}
    </Card>
  );
}
