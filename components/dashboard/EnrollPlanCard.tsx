"use client";

import { ArrowRight, Dumbbell, Sparkles } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollPlan } from "@/app/actions/user-plan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlanChoice = {
  slug: string;
  title: string;
  goal: string;
  targetUser: "female_weight_loss" | "male_beginner";
  daysPerWeek: number;
};

export function EnrollPlanCard({ plans }: { plans: PlanChoice[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEnroll = (slug: string) => {
    startTransition(async () => {
      const result = await enrollPlan(slug);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand/5 via-surface to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" aria-hidden />
          <Badge>Bắt đầu hành trình</Badge>
        </div>
        <CardTitle className="pt-2">Chọn giáo án để bắt đầu</CardTitle>
        <CardDescription>
          Chọn một giáo án 5 buổi/tuần — hệ thống tự tạo lịch tập + checklist 30
          ngày cho bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const isFemale = plan.targetUser === "female_weight_loss";
            return (
              <div
                key={plan.slug}
                className="rounded-md border border-border-subtle bg-card p-4 transition-colors hover:border-brand/40"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${isFemale ? "bg-brand/10 text-brand" : "bg-accent/10 text-accent"}`}
                  >
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <Badge variant={isFemale ? "default" : "success"}>
                    {plan.daysPerWeek} buổi/tuần
                  </Badge>
                </div>
                <p className="font-semibold text-sm mb-1">{plan.title}</p>
                <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                  {plan.goal}
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleEnroll(plan.slug)}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? "Đang đăng ký..." : "Chọn giáo án này"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
