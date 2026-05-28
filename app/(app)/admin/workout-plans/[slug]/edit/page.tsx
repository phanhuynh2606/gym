import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkoutPlanForm } from "@/components/admin/WorkoutPlanForm";
import { Card } from "@/components/ui/card";
import { getAdminWorkoutPlanBySlug } from "@/lib/workout-plans-data";

export default async function EditWorkoutPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plan = await getAdminWorkoutPlanBySlug(slug);
  if (!plan) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/workout-plans"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Giáo án
        </Link>
        <h2 className="mt-1 text-lg font-semibold">Sửa: {plan.title}</h2>
        <p className="text-xs text-text-secondary">{plan.slug}</p>
      </div>
      <Card className="p-5">
        <WorkoutPlanForm plan={plan} />
      </Card>
    </div>
  );
}
