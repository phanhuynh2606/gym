import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DIFFICULTY_LABELS_VI,
  type WorkoutPlan,
} from "@/types";

export function WorkoutPlanCard({ plan }: { plan: WorkoutPlan }) {
  return (
    <Link
      href={`/giao-an/${plan.slug}`}
      className="block focus-visible:ring-2 focus-visible:ring-brand rounded-md"
    >
      <Card className="h-full hover:shadow-overlay transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={
                plan.targetUser === "female_weight_loss" ? "default" : "success"
              }
            >
              {plan.targetUser === "female_weight_loss"
                ? "Nữ giảm cân"
                : "Nam mới tập"}
            </Badge>
            <Badge variant="outline">{plan.daysPerWeek} buổi/tuần</Badge>
          </div>
          <CardTitle className="text-lg pt-2">{plan.title}</CardTitle>
          <CardDescription>{plan.goal}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-text-secondary line-clamp-3">
            {plan.description}
          </p>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Cấp độ: {DIFFICULTY_LABELS_VI[plan.level]}</span>
            <span className="text-brand">Xem giáo án →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
