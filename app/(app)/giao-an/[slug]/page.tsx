import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Dumbbell, Repeat, Timer } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MuscleBadge } from "@/components/exercise/ExerciseCard";
import { DIFFICULTY_LABELS_VI, type Muscle } from "@/types";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildMetadata,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/constants";
import { formatRest } from "@/lib/utils";
import { getExerciseBySlug } from "@/server/seed/exercises";
import { getPlanBySlug, WORKOUT_PLANS } from "@/server/seed/workout-plans";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return WORKOUT_PLANS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) return {};
  return buildMetadata({
    title: plan.title,
    description: plan.description.slice(0, 160),
    path: `/giao-an/${plan.slug}`,
    type: "article",
    keywords: [plan.title, "giáo án gym", "lịch tập gym", plan.goal],
  });
}

export default async function PlanDetailPage({ params }: Props) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) notFound();

  const breadcrumbs = [
    { name: "Trang chủ", href: "/" },
    { name: "Giáo án", href: "/giao-an" },
    { name: plan.title, href: `/giao-an/${plan.slug}` },
  ];

  const isFemalePlan = plan.targetUser === "female_weight_loss";

  return (
    <div className="container-app py-8 md:py-10 space-y-8">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={isFemalePlan ? "default" : "success"}>
            {isFemalePlan ? "Nữ giảm cân" : "Nam mới tập"}
          </Badge>
          <Badge variant="outline">{plan.daysPerWeek} buổi/tuần</Badge>
          <Badge variant="secondary">
            {DIFFICULTY_LABELS_VI[plan.level]}
          </Badge>
        </div>
        <h1>{plan.title}</h1>
        <p className="text-text-secondary max-w-prose">{plan.description}</p>
        <p className="text-sm">
          <span className="font-semibold">Mục tiêu: </span>
          <span className="text-text-secondary">{plan.goal}</span>
        </p>
      </header>

      <section>
        <h2 className="mb-4">Lịch tập trong tuần</h2>

        {isFemalePlan ? (
          <Tabs defaultValue={plan.sessions[0]?.id}>
            <TabsList className="flex-wrap h-auto">
              {plan.sessions.map((s) => (
                <TabsTrigger key={s.id} value={s.id}>
                  Buổi {s.dayIndex}
                </TabsTrigger>
              ))}
            </TabsList>

            {plan.sessions.map((session) => (
              <TabsContent key={session.id} value={session.id}>
                <SessionBlock plan={plan} sessionId={session.id} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Accordion type="single" collapsible defaultValue={plan.sessions[0]?.id}>
            {plan.sessions.map((session) => (
              <AccordionItem key={session.id} value={session.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand px-2">
                      Buổi {session.dayIndex}
                    </span>
                    {session.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <SessionBlock plan={plan} sessionId={session.id} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </section>

      <JsonLd
        data={[
          buildBreadcrumbJsonLd(breadcrumbs),
          buildArticleJsonLd({
            headline: plan.title,
            description: plan.description.slice(0, 200),
            url: new URL(`/giao-an/${plan.slug}`, getBaseUrl()).toString(),
          }),
        ]}
      />
    </div>
  );
}

function SessionBlock({
  plan,
  sessionId,
}: {
  plan: NonNullable<ReturnType<typeof getPlanBySlug>>;
  sessionId: string;
}) {
  const session = plan.sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle>{session.title}</CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {session.focus.map((m) => (
                <MuscleBadge key={m} muscle={m as Muscle} primary />
              ))}
            </div>
          </div>
          <div className="text-right text-sm text-text-secondary">
            <p>{session.exercises.length} bài</p>
            {session.cardio && (
              <p>+ Cardio {session.cardio.durationMinutes}p</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="divide-y divide-border-subtle">
            {session.exercises.map((item, idx) => {
              const exercise = getExerciseBySlug(item.exerciseSlug);
              return (
                <li
                  key={`${item.exerciseSlug}-${idx}`}
                  className="grid grid-cols-12 gap-3 py-3 items-center text-sm"
                >
                  <span className="col-span-1 text-text-muted">{idx + 1}.</span>
                  <a
                    href={`/bai-tap/${item.exerciseSlug}`}
                    className="col-span-11 md:col-span-5 font-medium text-text-primary hover:text-brand"
                  >
                    {exercise?.nameVi ?? item.exerciseSlug}
                  </a>
                  <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {item.sets} hiệp
                  </span>
                  <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
                    <Repeat className="h-3.5 w-3.5" />
                    {item.reps}
                  </span>
                  <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5 text-text-secondary">
                    <Timer className="h-3.5 w-3.5" />
                    {formatRest(item.restSeconds)}
                  </span>
                  {item.note && (
                    <span className="col-span-12 text-xs text-text-muted">
                      Lưu ý: {item.note}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {session.cardio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              Cardio: {session.cardio.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary space-y-1">
            <p>
              Thời lượng:{" "}
              <span className="text-text-primary font-medium">
                {session.cardio.durationMinutes} phút
              </span>
            </p>
            <p>
              Cường độ:{" "}
              <span className="text-text-primary font-medium">
                {session.cardio.intensity === "low"
                  ? "Thấp"
                  : session.cardio.intensity === "moderate"
                    ? "Trung bình"
                    : "Cao"}
              </span>
            </p>
            {session.cardio.note && <p>{session.cardio.note}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
