import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MUSCLE_LABELS_VI, type Muscle } from "@/types";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { EXERCISES } from "@/server/seed/exercises";

export const metadata: Metadata = buildMetadata({
  title: "Nhóm cơ — bài tập theo từng nhóm cơ",
  description:
    "Xem bài tập gym được phân nhóm theo từng nhóm cơ: ngực, lưng, vai, tay, bụng, mông, đùi, bắp chuối.",
  path: "/nhom-co",
});

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Nhóm cơ", href: "/nhom-co" },
];

const MUSCLE_GROUPS: Array<{
  muscle: Muscle;
  description: string;
}> = [
  { muscle: "chest", description: "Đẩy ngực, dang ngực, hít đất." },
  { muscle: "back", description: "Kéo xà, kéo cáp, deadlift, lat pulldown." },
  { muscle: "shoulders", description: "Đẩy vai, dang vai, face pull." },
  { muscle: "biceps", description: "Cuốn tạ dumbbell và thanh đòn." },
  { muscle: "triceps", description: "Tricep pushdown, đẩy ngực hẹp." },
  { muscle: "abs", description: "Plank, crunch, russian twist." },
  { muscle: "glutes", description: "Hip thrust, squat, lunge." },
  { muscle: "quads", description: "Squat, leg press, lunge." },
  { muscle: "hamstrings", description: "Romanian deadlift, hip thrust." },
  { muscle: "calves", description: "Calf raise đứng và ngồi." },
];

export default function NhomCoIndexPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-2">
        <h1>Bài tập theo nhóm cơ</h1>
        <p className="text-text-secondary max-w-prose">
          Chọn nhóm cơ bạn muốn tập trung để xem các bài phù hợp.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MUSCLE_GROUPS.map(({ muscle, description }) => {
          const count = EXERCISES.filter(
            (e) =>
              e.primaryMuscles.includes(muscle) ||
              e.secondaryMuscles.includes(muscle),
          ).length;
          return (
            <Link
              key={muscle}
              href={`/nhom-co/${muscle}`}
              className="block rounded-md focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Card className="h-full hover:shadow-overlay transition-shadow">
                <CardHeader>
                  <CardTitle>{MUSCLE_LABELS_VI[muscle]}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-brand">{count} bài tập →</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </div>
  );
}
