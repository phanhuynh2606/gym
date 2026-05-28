import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { MonthlyReviewCard } from "@/components/monthly-review/MonthlyReviewCard";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentReviews, monthKey } from "@/lib/monthly-review";
import { getOrCreateMongoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tổng kết tháng",
  description:
    "Tổng kết tháng: hoàn thành, streak, khối lượng, cân nặng và gợi ý giáo án tháng tiếp theo.",
  robots: { index: false, follow: false },
};

const NUM_MONTHS = 3;

export default async function TongKetThangPage() {
  const user = await getOrCreateMongoUser();

  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: "/" },
            { name: "Tổng kết tháng", href: "/tong-ket-thang" },
          ]}
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem tổng kết tháng.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviews = await getRecentReviews(
    user.clerkId,
    monthKey(),
    NUM_MONTHS,
  );

  const [current, ...previous] = reviews;
  const hasAnyData = reviews.some((r) => r.stats.numDays > 0);

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tổng kết tháng", href: "/tong-ket-thang" },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tổng kết tháng
        </h1>
        <p className="text-sm text-text-secondary">
          Tự động tổng hợp từ to-do, log buổi tập và số đo. Mỗi tháng sẽ được
          chốt vào ngày đầu của tháng kế tiếp.
        </p>
      </header>

      {!user.activePlanSlug && (
        <Card className="border-state-warning/30 bg-state-warning/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Sparkles className="h-5 w-5 text-state-warning mt-0.5" aria-hidden />
            <div className="space-y-1">
              <p className="font-medium">Bạn chưa chọn giáo án.</p>
              <p className="text-text-secondary">
                Chọn 1 giáo án tại{" "}
                <Link
                  href="/hom-nay"
                  className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
                >
                  /hom-nay
                </Link>{" "}
                để bắt đầu sinh dữ liệu cho tổng kết tháng.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasAnyData ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <h2 className="text-lg font-medium">Chưa có dữ liệu tháng nào</h2>
            <p className="text-sm text-text-secondary max-w-prose mx-auto">
              Hoàn thành to-do trong{" "}
              <Link
                href="/hom-nay"
                className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
              >
                /hom-nay
              </Link>{" "}
              và log buổi tập trong{" "}
              <Link
                href="/giao-an"
                className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
              >
                /giao-an
              </Link>{" "}
              — sau vài ngày bạn sẽ thấy đánh giá xuất hiện ở đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {current && (
            <MonthlyReviewCard
              review={current}
              highlight
              currentPlanSlug={user.activePlanSlug ?? null}
            />
          )}

          {previous.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Các tháng trước</h2>
              <div className="space-y-3">
                {previous.map((review) => (
                  <MonthlyReviewCard
                    key={review.month}
                    review={review}
                    currentPlanSlug={user.activePlanSlug ?? null}
                    collapsible
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
