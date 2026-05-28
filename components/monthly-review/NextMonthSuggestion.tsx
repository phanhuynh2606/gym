import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  plan: { slug: string; title: string; goal: string } | null;
  isCurrentPlan: boolean;
  suggestions: string[];
};

export function NextMonthSuggestion({ plan, isCurrentPlan, suggestions }: Props) {
  return (
    <Card className="border-brand/20 bg-brand/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-brand" aria-hidden />
          <CardTitle>Gợi ý cho tháng tiếp theo</CardTitle>
        </div>
        <CardDescription>
          Dựa trên dữ liệu của bạn tháng này.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length > 0 && (
          <ul className="space-y-2 text-sm">
            {suggestions.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="text-brand">•</span>
                <span className="text-text-primary">{s}</span>
              </li>
            ))}
          </ul>
        )}

        {plan && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle bg-card p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{plan.title}</span>
                {isCurrentPlan && (
                  <Badge variant="secondary" className="text-xs">
                    Đang theo
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary line-clamp-2">
                {plan.goal}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/giao-an/${plan.slug}`}>
                Xem giáo án <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
