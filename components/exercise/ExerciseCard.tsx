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
      className="block focus-visible:ring-2 focus-visible:ring-brand rounded-md"
    >
      <Card className="h-full hover:shadow-overlay transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2">{exercise.nameVi}</CardTitle>
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
            <span className="text-brand">Xem chi tiết →</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
