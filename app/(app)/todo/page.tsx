import type { Metadata } from "next";
import dayjs from "dayjs";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { TodoChecklist } from "@/components/dashboard/TodoChecklist";
import { generateMonthlyTodos } from "@/app/actions/user-plan";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { serializeDailyTodo, type DailyTodoView } from "@/lib/serializers";
import { getOrCreateMongoUser } from "@/lib/users";
import { DailyTodoModel } from "@/models/DailyTodo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "To-do hằng ngày",
  description:
    "Checklist tập + dinh dưỡng + thói quen hằng ngày, sinh tự động từ giáo án 5 buổi/tuần.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ date?: string }>;
};

function isValidYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && dayjs(s).isValid();
}

export default async function TodoPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams;
  const selected =
    dateParam && isValidYmd(dateParam) ? dateParam : today();

  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: "/" },
            { name: "To-do", href: "/todo" },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center text-text-secondary">
            Vui lòng đăng nhập để xem to-do.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.activePlanSlug) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: "/" },
            { name: "To-do", href: "/todo" },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Chưa có to-do</CardTitle>
            <CardDescription>
              Bạn cần chọn 1 giáo án trước. To-do hằng ngày sẽ tự sinh ra theo
              giáo án bạn chọn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/hom-nay">Đi tới chọn giáo án</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  await connectMongoDB();
  const fromKey = dayjs(selected).subtract(3, "day").format("YYYY-MM-DD");
  const toKey = dayjs(selected).add(3, "day").format("YYYY-MM-DD");

  let recent = await DailyTodoModel.find({
    userId: user.clerkId,
    date: { $gte: fromKey, $lte: toKey },
  })
    .sort({ date: 1 })
    .lean();

  let selectedDoc = recent.find((t) => t.date === selected);
  if (!selectedDoc && selected === today()) {
    await generateMonthlyTodos(30);
    recent = await DailyTodoModel.find({
      userId: user.clerkId,
      date: { $gte: fromKey, $lte: toKey },
    })
      .sort({ date: 1 })
      .lean();
    selectedDoc = recent.find((t) => t.date === selected);
  }

  const todoView: DailyTodoView | null = selectedDoc
    ? serializeDailyTodo(selectedDoc)
    : null;

  const stripDays = [-3, -2, -1, 0, 1, 2, 3].map((offset) =>
    dayjs(selected).add(offset, "day").format("YYYY-MM-DD"),
  );

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "To-do", href: "/todo" },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          To-do hằng ngày
        </h1>
        <p className="text-sm text-text-secondary">
          Checklist tập, dinh dưỡng và thói quen — sinh tự động từ giáo án{" "}
          <Link
            href={`/giao-an/${user.activePlanSlug}`}
            className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
          >
            {user.activePlanSlug}
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {stripDays.map((day) => {
              const doc = recent.find((t) => t.date === day);
              const isSelected = day === selected;
              const isToday = day === today();
              const completion = doc?.completionRate ?? 0;
              return (
                <Link
                  key={day}
                  href={`/todo?date=${day}`}
                  scroll={false}
                  aria-current={isSelected ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center text-xs transition-colors",
                    isSelected
                      ? "border-brand bg-brand/10 text-brand font-semibold"
                      : "border-border-subtle bg-card text-text-secondary hover:border-brand/40",
                  )}
                >
                  <span className="text-[10px] uppercase tracking-wide">
                    {dayjs(day).format("ddd")}
                  </span>
                  <span className="text-sm font-semibold">
                    {dayjs(day).format("DD")}
                  </span>
                  {isToday && (
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="text-[9px] px-1"
                    >
                      Nay
                    </Badge>
                  )}
                  {doc && completion > 0 && !isToday && (
                    <span className="h-1 w-6 rounded-full bg-state-success/60" />
                  )}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {todoView ? (
        <Card>
          <CardHeader>
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <CardTitle>{todoView.title}</CardTitle>
                <CardDescription>
                  {dayjs(todoView.date).format("dddd, DD/MM/YYYY")} •{" "}
                  {todoView.type === "training" ? "Ngày tập" : "Ngày nghỉ"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {todoView.completionRate}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TodoChecklist todo={todoView} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-secondary">
            Không có to-do cho ngày này.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
