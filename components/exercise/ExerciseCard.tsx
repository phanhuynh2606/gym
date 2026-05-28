import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DIFFICULTY_LABELS_VI,
  EQUIPMENT_LABELS_VI,
  MUSCLE_LABELS_VI,
  type Exercise,
} from "@/types";

export function MuscleBadge({
  muscle,
  primary,
}: {
  muscle: keyof typeof MUSCLE_LABELS_VI;
  primary?: boolean;
}) {
  return (
    <Badge variant={primary ? "default" : "secondary"}>
      {MUSCLE_LABELS_VI[muscle]}
    </Badge>
  );
}

export function EquipmentBadge({
  equipment,
}: {
  equipment: keyof typeof EQUIPMENT_LABELS_VI;
}) {
  return <Badge variant="outline">{EQUIPMENT_LABELS_VI[equipment]}</Badge>;
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={`/bai-tap/${exercise.slug}`}
      className="block rounded-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Card className="group h-full border-border-subtle transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-overlay">
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 group-hover:text-brand transition-colors">
            {exercise.nameVi}
          </CardTitle>
          <CardDescription className="line-clamp-1">
            {exercise.nameEn}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscles.slice(0, 2).map((m) => (
              <MuscleBadge key={m} muscle={m} primary />
            ))}
            {exercise.equipment.slice(0, 2).map((e) => (
              <EquipmentBadge key={e} equipment={e} />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{DIFFICULTY_LABELS_VI[exercise.difficulty]}</span>
            <span className="font-medium text-brand inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
              Chi tiết →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
