import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementsHeader } from "@/components/achievements/AchievementsHeader";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  CATEGORY_LABELS_VI,
  type AchievementCategory,
  type AchievementStatus,
} from "@/lib/achievements";
import { syncAndEvaluateAchievements } from "@/lib/achievements-data";
import { isMongoConfigured } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thành tích",
  description:
    "Mở khoá huy hiệu theo chuỗi ngày tập, độ chăm chỉ, khối lượng nâng và sự gắn bó với cộng đồng.",
  robots: { index: false, follow: false },
};

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Thành tích", href: "/thanh-tich" },
];

const CATEGORY_ORDER: AchievementCategory[] = [
  "streak",
  "consistency",
  "perfect",
  "volume",
  "community",
];

export default async function ThanhTichPage() {
  if (!isMongoConfigured()) {
    return (
      <div className="container-app space-y-6 py-8 md:py-10">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-secondary">
            Tính năng thành tích cần MongoDB. Vui lòng cấu hình{" "}
            <code className="rounded bg-border-subtle px-1">MONGODB_URI</code>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app space-y-6 py-8 md:py-10">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-text-muted" aria-hidden />
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem thành tích của bạn.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { statuses, summary } = await syncAndEvaluateAchievements(user.clerkId);

  const byCategory = new Map<AchievementCategory, AchievementStatus[]>();
  for (const s of statuses) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  return (
    <div className="container-app space-y-6 py-8 md:py-10">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Thành tích
        </h1>
        <p className="text-sm text-text-secondary">
          Tập đều đặn để mở khoá huy hiệu và tăng cấp. Streak và khối lượng được
          tính trên toàn bộ lịch sử tập của bạn.
        </p>
      </header>

      <AchievementsHeader summary={summary} />

      {CATEGORY_ORDER.map((category) => {
        const items = byCategory.get(category);
        if (!items || items.length === 0) return null;
        const unlocked = items.filter((i) => i.unlocked).length;
        return (
          <section key={category} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">
                {CATEGORY_LABELS_VI[category]}
              </h2>
              <span className="text-xs text-text-muted">
                {unlocked}/{items.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((status) => (
                <AchievementCard key={status.id} status={status} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
