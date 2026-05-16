import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { FavoriteExerciseButton } from "@/components/favorites/FavoriteExerciseButton";
import { FavoritePlanButton } from "@/components/favorites/FavoritePlanButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateMongoUser } from "@/lib/users";
import { DIFFICULTY_LABELS_VI } from "@/types";
import { EXERCISES } from "@/server/seed/exercises";
import { WORKOUT_PLANS } from "@/server/seed/workout-plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yêu thích",
  description:
    "Danh sách bài tập và giáo án bạn đã lưu để xem nhanh sau này.",
  robots: { index: false, follow: false },
};

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Yêu thích", href: "/yeu-thich" },
];

export default async function YeuThichPage() {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem danh sách yêu thích.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const favoriteExercises = EXERCISES.filter((e) =>
    user.favoriteExerciseSlugs.includes(e.slug),
  );
  const favoritePlans = WORKOUT_PLANS.filter((p) =>
    user.favoritePlanSlugs.includes(p.slug),
  );

  const empty =
    favoriteExercises.length === 0 && favoritePlans.length === 0;

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Yêu thích
        </h1>
        <p className="text-sm text-text-secondary">
          {favoritePlans.length} giáo án · {favoriteExercises.length} bài tập đã
          lưu.
        </p>
      </header>

      {empty && (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <Heart className="h-10 w-10 text-text-muted mx-auto" aria-hidden />
            <p className="text-text-secondary">
              Bạn chưa lưu giáo án hay bài tập nào.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="primary" size="sm">
                <Link href="/giao-an">Khám phá giáo án</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/bai-tap">Thư viện bài tập</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {favoritePlans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Giáo án đã lưu</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {favoritePlans.map((plan) => (
              <Card key={plan.slug} className="border-border-subtle">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant={
                            plan.targetUser === "female_weight_loss"
                              ? "default"
                              : "success"
                          }
                        >
                          {plan.targetUser === "female_weight_loss"
                            ? "Nữ giảm cân"
                            : "Nam mới tập"}
                        </Badge>
                        <Badge variant="outline">
                          {plan.daysPerWeek} buổi/tuần
                        </Badge>
                        <Badge variant="secondary">
                          {DIFFICULTY_LABELS_VI[plan.level]}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/giao-an/${plan.slug}`}
                          className="hover:text-brand transition-colors"
                        >
                          {plan.title}
                        </Link>
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {plan.goal}
                  </p>
                  <div className="flex items-center justify-between">
                    <Button asChild variant="link" size="sm">
                      <Link href={`/giao-an/${plan.slug}`}>Xem chi tiết →</Link>
                    </Button>
                    <FavoritePlanButton
                      slug={plan.slug}
                      initialFavorited={true}
                      signedIn
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {favoriteExercises.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bài tập đã lưu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteExercises.map((ex) => (
              <div key={ex.id} className="relative">
                <ExerciseCard exercise={ex} />
                <div className="absolute right-3 top-3">
                  <FavoriteExerciseButton
                    slug={ex.slug}
                    initialFavorited={true}
                    signedIn
                    variant="compact"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
