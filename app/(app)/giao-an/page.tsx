import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { WorkoutPlanCard } from "@/components/workout/WorkoutPlanCard";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

export const metadata: Metadata = buildMetadata({
  title: "Giáo án gym 5 buổi/tuần",
  description:
    "Tổng hợp các giáo án gym 5 buổi/tuần cho nữ giảm cân và nam mới tập, có lịch tập chi tiết và bài tập kèm video minh hoạ.",
  path: "/giao-an",
});

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Giáo án", href: "/giao-an" },
];

export default function GiaoAnIndexPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-2">
        <h1>Giáo án gym 5 buổi/tuần</h1>
        <p className="text-text-secondary max-w-prose">
          Chọn giáo án phù hợp với mục tiêu của bạn. Mỗi giáo án gồm 5 buổi/tuần,
          có bài tập, video minh hoạ và lịch theo dõi tiến độ.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {WORKOUT_PLANS.map((plan) => (
          <WorkoutPlanCard key={plan.slug} plan={plan} />
        ))}
      </div>

      <div className="rounded-md border border-border-subtle bg-surface p-6 mt-6">
        <h3 className="mb-2">Bạn chưa biết chọn giáo án nào?</h3>
        <p className="text-sm text-text-secondary mb-4">
          Xem qua thư viện bài tập theo nhóm cơ, hoặc đọc hướng dẫn về dinh
          dưỡng trước khi bắt đầu.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/bai-tap"
            className="text-sm text-brand inline-flex items-center gap-1"
          >
            Thư viện bài tập <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/dinh-duong"
            className="text-sm text-brand inline-flex items-center gap-1"
          >
            Dinh dưỡng <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </div>
  );
}
