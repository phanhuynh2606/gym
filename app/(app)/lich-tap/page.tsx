import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { Card } from "@/components/ui/card";
import { WeekCalendar } from "@/components/workout/WeekCalendar";
import { buildMetadata } from "@/lib/seo";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

export const metadata: Metadata = buildMetadata({
  title: "Lịch tập tuần",
  description:
    "Xem lịch tập 5 buổi/tuần theo giáo án đang theo. Tick từng buổi đã hoàn thành để theo dõi tiến độ tuần.",
  path: "/lich-tap",
});

function CalendarFallback() {
  return (
    <Card className="p-4">
      <div className="h-6 w-40 animate-pulse rounded bg-border-subtle" />
      <div className="mt-4 grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-md border border-border-subtle bg-surface"
          />
        ))}
      </div>
    </Card>
  );
}

export default function LichTapPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Lịch tập", href: "/lich-tap" },
        ]}
      />

      <header className="space-y-2">
        <h1>Lịch tập tuần</h1>
        <p className="text-text-secondary max-w-prose">
          Chọn giáo án và xem các buổi tập trải đều trong tuần. Bấm vào một
          buổi để mở chi tiết hoặc tiếp tục từ tiến độ đã lưu cục bộ.
        </p>
      </header>

      <Suspense fallback={<CalendarFallback />}>
        <WeekCalendar plans={WORKOUT_PLANS} />
      </Suspense>
    </div>
  );
}
