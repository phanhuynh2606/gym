import {
  ArrowRight,
  Calendar,
  Dumbbell,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
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

const STATS = [
  { label: "Bài tập", value: "30+", icon: Dumbbell },
  { label: "Giáo án 5 buổi/tuần", value: "2", icon: Calendar },
  { label: "Theo dõi tiến độ", value: "Hằng ngày", icon: TrendingUp },
] as const;

export default function HomePage() {
  const popularExercises = EXERCISES.slice(0, 6);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-br from-surface via-surface to-brand/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_right,_rgba(2,134,195,0.12),_transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="container-app relative py-14 md:py-24 grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <Badge className="bg-brand/10 text-brand border-brand/20">
              <Sparkles className="h-3 w-3" aria-hidden />
              Miễn phí · Cho người mới
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              Tập gym đúng cách,
              <br />
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                có lộ trình rõ ràng
              </span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary max-w-prose leading-relaxed">
              Hai giáo án 5 buổi/tuần cho nữ giảm cân và nam mới tập. Có video
              minh hoạ từng bài, lịch tập, theo dõi tiến độ và checklist hằng
              ngày.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="primary" className="shadow-raised">
                <Link href="/giao-an/nu-giam-can">
                  <PlayCircle className="h-5 w-5" aria-hidden />
                  Bắt đầu — Nữ giảm cân
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/giao-an/nam-moi-tap">
                  Nam mới tập
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <dl className="grid grid-cols-3 gap-4 pt-6 max-w-md">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-1">
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  <dt className="text-[11px] uppercase tracking-wider text-text-muted">
                    {label}
                  </dt>
                  <dd className="text-base font-semibold text-text-primary tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {WORKOUT_PLANS.map((plan) => {
              const isFemale = plan.targetUser === "female_weight_loss";
              return (
                <Link
                  key={plan.slug}
                  href={`/giao-an/${plan.slug}`}
                  className="block rounded-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Card className="group relative h-full overflow-hidden border-border-subtle transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-overlay">
                    <div
                      aria-hidden
                      className={`absolute inset-x-0 top-0 h-1 ${isFemale ? "bg-gradient-to-r from-brand to-brand-dark" : "bg-gradient-to-r from-accent to-state-success"}`}
                    />
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-md ${isFemale ? "bg-brand/10 text-brand" : "bg-accent/10 text-accent"}`}
                        >
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <Badge variant={isFemale ? "default" : "success"}>
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
                      <p className="mt-3 text-sm font-medium text-brand inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
                        Xem giáo án
                        <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* VALUE */}
      <section className="border-b border-border-subtle">
        <div className="container-app py-14 md:py-20">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl md:text-3xl">Tại sao chọn GymVN</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Nội dung được biên soạn cho người mới — đơn giản, rõ ràng, có
              kiểm chứng.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Giáo án có lộ trình",
                desc: "5 buổi/tuần thiết kế theo progressive overload và rotating muscle. Có ngày tập, ngày nghỉ chủ động.",
                color: "text-brand",
                bg: "bg-brand/10",
              },
              {
                icon: Sparkles,
                title: "Bài tập có hướng dẫn",
                desc: "Mỗi bài có 4 bước thực hiện, lỗi thường gặp, mẹo và biến thể thay thế. Video minh hoạ.",
                color: "text-accent",
                bg: "bg-accent/10",
              },
              {
                icon: TrendingUp,
                title: "Theo dõi tiến độ",
                desc: "Tick bài, ghi reps/weight, đo nước, ngủ, bước chân hằng ngày. Tổng kết tháng tự động.",
                color: "text-state-success",
                bg: "bg-state-success/10",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="group rounded-lg border border-border-subtle bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-raised"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md ${bg} ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MUSCLES */}
      <section className="border-b border-border-subtle bg-surface">
        <div className="container-app py-14 md:py-20">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2>Khám phá theo nhóm cơ</h2>
              <p className="text-sm text-text-secondary mt-1">
                Chọn nhóm cơ bạn muốn tập trung để xem các bài phù hợp.
              </p>
            </div>
            <Link
              href="/nhom-co"
              className="text-sm font-medium text-brand inline-flex items-center gap-1 hover:text-brand-dark"
            >
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {FEATURED_MUSCLES.map((m) => (
              <Link
                key={m}
                href={`/nhom-co/${m}`}
                className="group relative overflow-hidden rounded-md border border-border-subtle bg-card p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-raised"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/0 group-hover:from-brand/5 group-hover:to-transparent transition-colors"
                />
                <p className="relative font-semibold">{MUSCLE_LABELS_VI[m]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR EXERCISES */}
      <section>
        <div className="container-app py-14 md:py-20">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2>Bài tập phổ biến</h2>
              <p className="text-sm text-text-secondary mt-1">
                Những bài compound nền tảng được khuyên dùng cho người mới.
              </p>
            </div>
            <Link
              href="/bai-tap"
              className="text-sm font-medium text-brand inline-flex items-center gap-1 hover:text-brand-dark"
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

      {/* CTA */}
      <section className="border-b border-border-subtle bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="container-app py-14 md:py-20 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl text-white">
            Sẵn sàng bắt đầu hành trình?
          </h2>
          <p className="max-w-xl mx-auto text-white/85">
            Đăng ký miễn phí để lưu tiến độ, lịch tập, và nhận tổng kết tháng tự
            động.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-up">
                Đăng ký miễn phí
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/bai-tap">Xem thư viện bài tập</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
