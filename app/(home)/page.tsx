import { ArrowRight, Dumbbell, Sparkles, Target } from "lucide-react";
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
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { MUSCLE_LABELS_VI } from "@/types";
import { EXERCISES } from "@/server/seed/exercises";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

const FEATURED_MUSCLES: Array<keyof typeof MUSCLE_LABELS_VI> = [
  "chest",
  "back",
  "shoulders",
  "abs",
  "glutes",
  "quads",
];

export default function HomePage() {
  const popularExercises = EXERCISES.slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="container-app py-14 md:py-20 grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <Badge>Cho người mới tập</Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Tập gym đúng cách, có lộ trình, có người đồng hành
            </h1>
            <p className="text-base md:text-lg text-text-secondary max-w-prose">
              Hai giáo án 5 buổi/tuần dành cho nữ giảm cân và nam mới tập.
              Có video minh hoạ từng bài, lịch tập rõ ràng, theo dõi tiến độ và
              checklist hàng ngày — tất cả miễn phí.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="primary">
                <Link href="/giao-an/nu-giam-can">
                  Nữ giảm cân
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/giao-an/nam-moi-tap">
                  Nam mới tập
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {WORKOUT_PLANS.map((plan) => (
              <Link
                key={plan.slug}
                href={`/giao-an/${plan.slug}`}
                className="block rounded-md focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Card className="h-full hover:shadow-overlay transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-brand" />
                      <Badge
                        variant={
                          plan.targetUser === "female_weight_loss"
                            ? "default"
                            : "success"
                        }
                      >
                        {plan.daysPerWeek} buổi/tuần
                      </Badge>
                    </div>
                    <CardTitle className="pt-2 text-lg">{plan.title}</CardTitle>
                    <CardDescription>{plan.goal}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary line-clamp-3">
                      {plan.description}
                    </p>
                    <p className="mt-3 text-sm text-brand inline-flex items-center gap-1">
                      Xem giáo án
                      <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE */}
      <section className="border-b border-border-subtle">
        <div className="container-app py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <Target className="h-6 w-6 text-brand" />
                <CardTitle>Giáo án có lộ trình</CardTitle>
                <CardDescription>
                  5 buổi/tuần được thiết kế theo nguyên tắc progressive overload,
                  rotating muscle. Có ngày tập, ngày nghỉ chủ động.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <Sparkles className="h-6 w-6 text-accent" />
                <CardTitle>Bài tập có hướng dẫn</CardTitle>
                <CardDescription>
                  Mỗi bài có 4 bước thực hiện, lỗi thường gặp, mẹo và biến thể
                  thay thế. Có video minh hoạ.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <Dumbbell className="h-6 w-6 text-state-success" />
                <CardTitle>Theo dõi tiến độ</CardTitle>
                <CardDescription>
                  Tick bài, ghi reps/weight, đo nước, ngủ, bước chân hằng ngày.
                  Tổng kết tháng tự động.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* MUSCLES */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="container-app py-12 md:py-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2>Khám phá theo nhóm cơ</h2>
              <p className="text-sm text-text-secondary mt-1">
                Chọn nhóm cơ bạn muốn tập trung để xem các bài phù hợp.
              </p>
            </div>
            <Link
              href="/nhom-co"
              className="text-sm text-brand inline-flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {FEATURED_MUSCLES.map((m) => (
              <Link
                key={m}
                href={`/nhom-co/${m}`}
                className="rounded-md border border-border-subtle bg-card p-4 text-center hover:border-brand hover:shadow-raised transition-all"
              >
                <p className="font-semibold">{MUSCLE_LABELS_VI[m]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR EXERCISES */}
      <section>
        <div className="container-app py-12 md:py-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2>Bài tập phổ biến</h2>
              <p className="text-sm text-text-secondary mt-1">
                Những bài compound nền tảng được khuyên dùng cho người mới.
              </p>
            </div>
            <Link
              href="/bai-tap"
              className="text-sm text-brand inline-flex items-center gap-1"
            >
              Thư viện đầy đủ <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularExercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
