import type { Metadata } from "next";
import dayjs from "dayjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { EnrollPlanCard } from "@/components/dashboard/EnrollPlanCard";
import { SessionSummaryCard } from "@/components/dashboard/SessionSummaryCard";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { TodayMetricsForm } from "@/components/dashboard/TodayMetricsForm";
import { TodoChecklist } from "@/components/dashboard/TodoChecklist";
import { generateMonthlyTodos } from "@/app/actions/user-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { serializeDailyTodo, type DailyTodoView } from "@/lib/serializers";
import { getOrCreateMongoUser } from "@/lib/users";
import { DailyTodoModel } from "@/models/DailyTodo";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hôm nay",
  description:
    "Bảng điều khiển hằng ngày: buổi tập, to-do, nước, ngủ, bước chân, mood và streak.",
  robots: { index: false, follow: false },
};

function calculateStreak(
  todos: Array<{ date: string; completionRate: number }>,
): number {
  const map = new Map(todos.map((t) => [t.date, t.completionRate]));
  let cursor = today();
  // Grace for today: if today's todo is missing or not yet started
  // (completionRate === 0), start counting from yesterday so an unfinished
  // morning doesn't reset a long streak.
  if ((map.get(cursor) ?? 0) <= 0) {
    cursor = dayjs(cursor).subtract(1, "day").format("YYYY-MM-DD");
  }
  let streak = 0;
  while (true) {
    const rate = map.get(cursor);
    if (rate === undefined || rate <= 0) break;
    streak += 1;
    cursor = dayjs(cursor).subtract(1, "day").format("YYYY-MM-DD");
  }
  return streak;
}

export default async function HomNayPage() {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: "/" },
            { name: "Hôm nay", href: "/hom-nay" },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem bảng điều khiển.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // First-time sign-in: send the user through the onboarding wizard before
  // showing the dashboard. The wizard sets `onboardingCompletedAt` (either
  // after finishing or via the "Bỏ qua" link) so this redirect only fires
  // once per account.
  if (!user.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  if (!user.activePlanSlug) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: "/" },
            { name: "Hôm nay", href: "/hom-nay" },
          ]}
        />
        <header className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Xin chào, {user.displayName ?? "bạn"}!
          </h1>
          <p className="text-text-secondary">
            Bắt đầu bằng cách chọn 1 trong 2 giáo án 5 buổi/tuần dưới đây.
          </p>
        </header>
        <EnrollPlanCard
          plans={WORKOUT_PLANS.map((p) => ({
            slug: p.slug,
            title: p.title,
            goal: p.goal,
            targetUser: p.targetUser,
            daysPerWeek: p.daysPerWeek,
          }))}
        />
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              <CardTitle>Khám phá trước khi đăng ký</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            <p>
              Bạn có thể xem chi tiết giáo án tại{" "}
              <Link
                href="/giao-an"
                className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
              >
                /giao-an
              </Link>{" "}
              hoặc duyệt từng bài tập theo nhóm cơ tại{" "}
              <Link
                href="/nhom-co"
                className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
              >
                /nhom-co
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  await connectMongoDB();
  const todayKey = today();
  const fromKey = dayjs(todayKey).subtract(14, "day").format("YYYY-MM-DD");

  let recent = await DailyTodoModel.find({
    userId: user.clerkId,
    date: { $gte: fromKey, $lte: todayKey },
  })
    .sort({ date: -1 })
    .lean();

  let todoDoc = recent.find((t) => t.date === todayKey);

  if (!todoDoc) {
    await generateMonthlyTodos(30);
    recent = await DailyTodoModel.find({
      userId: user.clerkId,
      date: { $gte: fromKey, $lte: todayKey },
    })
      .sort({ date: -1 })
      .lean();
    todoDoc = recent.find((t) => t.date === todayKey);
  }

  const todayView: DailyTodoView | null = todoDoc
    ? serializeDailyTodo(todoDoc)
    : null;
  const streak = calculateStreak(
    recent.map((t) => ({
      date: t.date,
      completionRate: t.completionRate ?? 0,
    })),
  );

  const exerciseCount =
    todayView?.tasks.filter((t) => t.category === "workout").length ?? 0;

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Hôm nay", href: "/hom-nay" },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Xin chào, {user.displayName ?? "bạn"}!
          </h1>
          <p className="text-sm text-text-secondary">
            {dayjs().format("dddd, DD/MM/YYYY")} — giáo án{" "}
            <Link
              href={`/giao-an/${user.activePlanSlug}`}
              className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
            >
              {user.activePlanSlug}
            </Link>
          </p>
        </div>
        <StreakBadge days={streak} />
      </header>

      {todayView ? (
        <>
          <SessionSummaryCard
            type={todayView.type}
            title={todayView.title}
            planSlug={todayView.planSlug}
            planDayIndex={todayView.planDayIndex}
            exerciseCount={exerciseCount}
            completionRate={todayView.completionRate}
          />

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>To-do hôm nay</CardTitle>
                  <p className="text-xs text-text-secondary">
                    Tick từng task để cập nhật tiến độ. Xem đầy đủ tại{" "}
                    <Link
                      href="/todo"
                      className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
                    >
                      /todo
                    </Link>
                    .
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <TodoChecklist todo={todayView} />
              </CardContent>
            </Card>

            <TodayMetricsForm
              date={todayView.date}
              initial={{
                waterLiters: todayView.waterLiters,
                sleepHours: todayView.sleepHours,
                steps: todayView.steps,
                mood: todayView.mood,
                energyLevel: todayView.energyLevel,
                note: todayView.note,
              }}
            />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-secondary">
            Đang chuẩn bị to-do cho hôm nay... Vui lòng tải lại trang.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
