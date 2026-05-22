import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExerciseCard, MuscleBadge } from "@/components/exercise/ExerciseCard";
import { FavoriteExerciseButton } from "@/components/favorites/FavoriteExerciseButton";
import {
  DIFFICULTY_LABELS_VI,
  EQUIPMENT_LABELS_VI,
  type Muscle,
} from "@/types";
import {
  buildBreadcrumbJsonLd,
  buildHowToJsonLd,
  buildMetadata,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/constants";
import {
  getExerciseBySlug,
  listExercises,
} from "@/lib/exercises-data";
import { getOrCreateMongoUser } from "@/lib/users";
import { EXERCISES } from "@/server/seed/exercises";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exercise = await getExerciseBySlug(slug);
  if (!exercise) return {};
  return buildMetadata({
    title: `${exercise.nameVi} (${exercise.nameEn})`,
    description: exercise.description.slice(0, 160),
    path: `/bai-tap/${exercise.slug}`,
    type: "article",
    keywords: [
      exercise.nameVi,
      exercise.nameEn,
      "bài tập gym",
      ...exercise.primaryMuscles,
    ],
  });
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [exercise, allExercises, user] = await Promise.all([
    getExerciseBySlug(slug),
    listExercises(),
    getOrCreateMongoUser(),
  ]);
  if (!exercise) notFound();

  const breadcrumbs = [
    { name: "Trang chủ", href: "/" },
    { name: "Bài tập", href: "/bai-tap" },
    { name: exercise.nameVi, href: `/bai-tap/${exercise.slug}` },
  ];

  const alternatives = (exercise.alternativeSlugs ?? [])
    .map((s) => allExercises.find((e) => e.slug === s))
    .filter(Boolean);
  const initialFavorited =
    user?.favoriteExerciseSlugs.includes(exercise.slug) ?? false;

  return (
    <div className="container-app py-8 md:py-10 space-y-8">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {exercise.primaryMuscles.map((m) => (
            <MuscleBadge key={m} muscle={m as Muscle} primary />
          ))}
          {exercise.equipment.map((e) => (
            <Badge key={e} variant="outline">
              {EQUIPMENT_LABELS_VI[e]}
            </Badge>
          ))}
          <Badge variant="secondary">
            {DIFFICULTY_LABELS_VI[exercise.difficulty]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1>{exercise.nameVi}</h1>
            <p className="text-text-secondary">{exercise.nameEn}</p>
          </div>
          {user && (
            <FavoriteExerciseButton
              slug={exercise.slug}
              initialFavorited={initialFavorited}
              signedIn
            />
          )}
        </div>
        <p className="text-base text-text-secondary max-w-prose">
          {exercise.description}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-state-success" />
                Cách thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal pl-5 text-sm">
                {exercise.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {exercise.commonMistakes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-state-warning" />
                  Lỗi thường gặp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pl-5 text-sm">
                  {exercise.commonMistakes.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {exercise.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-brand" />
                  Mẹo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pl-5 text-sm">
                  {exercise.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Nhóm cơ chính">
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primaryMuscles.map((m) => (
                    <MuscleBadge key={m} muscle={m as Muscle} primary />
                  ))}
                </div>
              </Row>
              {exercise.secondaryMuscles.length > 0 && (
                <Row label="Nhóm cơ phụ">
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.secondaryMuscles.map((m) => (
                      <MuscleBadge key={m} muscle={m as Muscle} />
                    ))}
                  </div>
                </Row>
              )}
              <Row label="Dụng cụ">
                <div className="flex flex-wrap gap-1.5">
                  {exercise.equipment.map((e) => (
                    <Badge key={e} variant="outline">
                      {EQUIPMENT_LABELS_VI[e]}
                    </Badge>
                  ))}
                </div>
              </Row>
              <Row label="Độ khó">
                <span>{DIFFICULTY_LABELS_VI[exercise.difficulty]}</span>
              </Row>
            </CardContent>
          </Card>

          {alternatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bài thay thế</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {alternatives.map((alt) =>
                  alt ? (
                    <Link
                      key={alt.slug}
                      href={`/bai-tap/${alt.slug}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-border-subtle"
                    >
                      <span>{alt.nameVi}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-brand" />
                    </Link>
                  ) : null,
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <section>
        <h2 className="mb-4">Bài tập liên quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allExercises
            .filter(
              (e) =>
                e.slug !== exercise.slug &&
                e.primaryMuscles.some((m) =>
                  exercise.primaryMuscles.includes(m),
                ),
            )
            .slice(0, 3)
            .map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
        </div>
      </section>

      <JsonLd
        data={[
          buildBreadcrumbJsonLd(breadcrumbs),
          buildHowToJsonLd({
            name: exercise.nameVi,
            description: exercise.description,
            steps: exercise.instructions,
            tips: exercise.tips,
            image: exercise.imageUrl
              ? new URL(exercise.imageUrl, getBaseUrl()).toString()
              : undefined,
          }),
        ]}
      />
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <div>{children}</div>
    </div>
  );
}
