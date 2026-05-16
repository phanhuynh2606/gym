import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/badge";
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
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { DIFFICULTY_LABELS_VI, type Exercise } from "@/types";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildMetadata,
} from "@/lib/seo";
import { getBaseUrl } from "@/lib/constants";
import { EXERCISES } from "@/server/seed/exercises";
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

  const referencedSlugs = new Set<string>();
  for (const session of plan.sessions) {
    for (const item of session.exercises) {
      referencedSlugs.add(item.exerciseSlug);
    }
  }
  const exerciseMap: Record<string, Exercise> = {};
  for (const ex of EXERCISES) {
    if (referencedSlugs.has(ex.slug)) {
      exerciseMap[ex.slug] = ex;
    }
  }

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
                <WorkoutSession
                  planSlug={plan.slug}
                  session={session}
                  exercises={exerciseMap}
                />
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
                  <WorkoutSession
                    planSlug={plan.slug}
                    session={session}
                    exercises={exerciseMap}
                  />
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
