import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletionChart } from "@/components/progress/CompletionChart";
import { ProgressStats } from "@/components/progress/ProgressStats";
import { VolumeChart } from "@/components/progress/VolumeChart";
import { WeightChart } from "@/components/progress/WeightChart";
import { getOrCreateMongoUser } from "@/lib/users";
import { loadProgressForUser } from "@/lib/progress-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiến độ",
  description:
    "Theo dõi cân nặng, completion rate hằng ngày và khối lượng tập 30 ngày gần nhất.",
  robots: { index: false, follow: false },
};

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Tiến độ", href: "/tien-do" },
];

export default async function TienDoPage() {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem tiến độ của bạn.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { weight, completion, volume, summary } = await loadProgressForUser(
    user.clerkId,
    30,
  );

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tiến độ
        </h1>
        <p className="text-sm text-text-secondary">
          30 ngày gần nhất — cân nặng, completion rate và khối lượng tập.
        </p>
      </header>

      <ProgressStats summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Cân nặng</CardTitle>
                <p className="text-xs text-text-secondary">
                  Ghi cân nặng hằng ngày tại{" "}
                  <span className="font-medium text-text-primary">
                    Hôm nay → Số liệu
                  </span>
                  .
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-brand" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <WeightChart data={weight} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Completion hằng ngày</CardTitle>
              <p className="text-xs text-text-secondary">
                % task đã tick mỗi ngày. Cột xám = ngày nghỉ / hồi phục.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <CompletionChart data={completion} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Khối lượng tập</CardTitle>
            <p className="text-xs text-text-secondary">
              Tổng kg·rep mỗi ngày, tính từ các set bạn đã log trong buổi tập.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <VolumeChart data={volume} />
        </CardContent>
      </Card>
    </div>
  );
}
