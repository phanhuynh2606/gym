"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  enrollRecommendedPlan,
  saveOnboarding,
  skipOnboarding,
  type OnboardingInput,
} from "@/app/actions/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EquipmentAvailability, MongoUser } from "@/lib/users";
import type { Difficulty, Gender, Goal } from "@/types";

type GoalOption = { value: Goal; label: string; description: string };
type LevelOption = { value: Difficulty; label: string; description: string };
type EquipmentOption = {
  value: EquipmentAvailability;
  label: string;
  description: string;
};

export type OnboardingDefaults = Pick<
  MongoUser,
  | "gender"
  | "goal"
  | "level"
  | "equipment"
  | "heightCm"
  | "currentWeightKg"
  | "targetWeightKg"
  | "birthYear"
>;

type Recommendation = {
  planSlug: string | null;
  planTitle: string | null;
  rationale: string;
  alternativeSlugs: string[];
};

type WizardState = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  gender: Gender | null;
  goal: Goal | null;
  level: Difficulty | null;
  equipment: EquipmentAvailability[];
  heightCm: string;
  currentWeightKg: string;
  targetWeightKg: string;
  birthYear: string;
};

const STEP_TITLES = [
  "Bạn là...",
  "Mục tiêu chính",
  "Trình độ hiện tại",
  "Dụng cụ sẵn có",
  "Vài thông số cơ thể",
  "Giáo án gợi ý",
] as const;

function parsePositiveNumber(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parsePositiveInt(value: string): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function OnboardingWizard({
  defaults,
  options,
}: {
  defaults: OnboardingDefaults;
  options: {
    goals: GoalOption[];
    levels: LevelOption[];
    equipment: EquipmentOption[];
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WizardState>({
    step: 1,
    gender: defaults.gender,
    goal: defaults.goal as Goal | null,
    level: defaults.level as Difficulty | null,
    equipment: defaults.equipment,
    heightCm: defaults.heightCm?.toString() ?? "",
    currentWeightKg: defaults.currentWeightKg?.toString() ?? "",
    targetWeightKg: defaults.targetWeightKg?.toString() ?? "",
    birthYear: defaults.birthYear?.toString() ?? "",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof OnboardingInput, string>>
  >({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );

  const totalSteps = STEP_TITLES.length;
  const progressPercent = Math.round((state.step / totalSteps) * 100);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function toggleEquipment(value: EquipmentAvailability) {
    setState((s) => ({
      ...s,
      equipment: s.equipment.includes(value)
        ? s.equipment.filter((v) => v !== value)
        : [...s.equipment, value],
    }));
  }

  function canAdvance(): boolean {
    switch (state.step) {
      case 1:
        return state.gender !== null;
      case 2:
        return state.goal !== null;
      case 3:
        return state.level !== null;
      case 4:
        return state.equipment.length > 0;
      case 5:
        return true; // body stats are optional
      default:
        return false;
    }
  }

  function next() {
    if (!canAdvance()) return;
    if (state.step < 6) {
      setState((s) => ({ ...s, step: (s.step + 1) as WizardState["step"] }));
    }
  }

  function prev() {
    if (state.step > 1) {
      setState((s) => ({ ...s, step: (s.step - 1) as WizardState["step"] }));
    }
  }

  function handleSubmit() {
    if (!state.gender || !state.goal || !state.level) return;

    const input: OnboardingInput = {
      gender: state.gender,
      goal: state.goal,
      level: state.level,
      equipment: state.equipment,
      heightCm: parsePositiveInt(state.heightCm),
      currentWeightKg: parsePositiveNumber(state.currentWeightKg),
      targetWeightKg: parsePositiveNumber(state.targetWeightKg),
      birthYear: parsePositiveInt(state.birthYear),
    };

    setServerError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveOnboarding(input);
      if (!result.ok) {
        setServerError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setRecommendation(result.recommendation);
      setState((s) => ({ ...s, step: 6 }));
    });
  }

  function handleEnroll(slug: string) {
    setServerError(null);
    startTransition(async () => {
      const result = await enrollRecommendedPlan(slug);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.push("/hom-nay");
      router.refresh();
    });
  }

  function handleSkip() {
    setServerError(null);
    startTransition(async () => {
      const result = await skipOnboarding();
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.push("/hom-nay");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Bước {state.step} / {totalSteps}
          </p>
          <CardTitle className="text-xl">{STEP_TITLES[state.step - 1]}</CardTitle>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {serverError ? (
          <p className="rounded-md border border-state-error/40 bg-state-error/5 px-3 py-2 text-sm text-state-error">
            {serverError}
          </p>
        ) : null}

        {state.step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={state.gender === "female"}
              onClick={() => update("gender", "female")}
              title="Nữ"
              description="Gợi ý các giáo án + động tác tập trung mông + giảm mỡ."
            />
            <ChoiceCard
              selected={state.gender === "male"}
              onClick={() => update("gender", "male")}
              title="Nam"
              description="Gợi ý các giáo án tăng cơ + sức mạnh + 5 buổi/tuần."
            />
          </div>
        ) : null}

        {state.step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {options.goals.map((g) => (
              <ChoiceCard
                key={g.value}
                selected={state.goal === g.value}
                onClick={() => update("goal", g.value)}
                title={g.label}
                description={g.description}
              />
            ))}
          </div>
        ) : null}

        {state.step === 3 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {options.levels.map((l) => (
              <ChoiceCard
                key={l.value}
                selected={state.level === l.value}
                onClick={() => update("level", l.value)}
                title={l.label}
                description={l.description}
              />
            ))}
          </div>
        ) : null}

        {state.step === 4 ? (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Chọn tất cả các mục bạn có. Có thể chọn nhiều.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {options.equipment.map((e) => (
                <ChoiceCard
                  key={e.value}
                  selected={state.equipment.includes(e.value)}
                  onClick={() => toggleEquipment(e.value)}
                  title={e.label}
                  description={e.description}
                />
              ))}
            </div>
            {fieldErrors.equipment ? (
              <p className="text-xs text-state-error">
                {fieldErrors.equipment}
              </p>
            ) : null}
          </div>
        ) : null}

        {state.step === 5 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <NumericField
              label="Chiều cao (cm)"
              value={state.heightCm}
              onChange={(v) => update("heightCm", v)}
              placeholder="170"
              error={fieldErrors.heightCm}
              min={120}
              max={230}
              step={1}
            />
            <NumericField
              label="Cân nặng hiện tại (kg)"
              value={state.currentWeightKg}
              onChange={(v) => update("currentWeightKg", v)}
              placeholder="65"
              error={fieldErrors.currentWeightKg}
              min={30}
              max={300}
              step={0.1}
            />
            <NumericField
              label="Cân nặng mục tiêu (kg)"
              value={state.targetWeightKg}
              onChange={(v) => update("targetWeightKg", v)}
              placeholder="60"
              error={fieldErrors.targetWeightKg}
              min={30}
              max={300}
              step={0.1}
            />
            <NumericField
              label="Năm sinh"
              value={state.birthYear}
              onChange={(v) => update("birthYear", v)}
              placeholder="1995"
              error={fieldErrors.birthYear}
              min={1900}
              max={new Date().getFullYear() - 5}
              step={1}
            />
            <p className="sm:col-span-2 text-xs text-text-secondary">
              Tất cả các trường ở bước này đều không bắt buộc. Bạn có thể cập
              nhật sau ở trang Tiến độ.
            </p>
          </div>
        ) : null}

        {state.step === 6 && recommendation ? (
          <RecommendationStep
            recommendation={recommendation}
            isPending={isPending}
            onEnroll={handleEnroll}
            onSkip={handleSkip}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div>
            {state.step > 1 && state.step < 6 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {state.step < 5 ? (
              <Button
                type="button"
                onClick={next}
                disabled={!canAdvance() || isPending}
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}
            {state.step === 5 ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Xem giáo án gợi ý
              </Button>
            ) : null}
          </div>
        </div>

        {state.step < 6 ? (
          <div className="border-t border-border-subtle pt-3 text-xs text-text-secondary">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isPending}
              className="text-text-secondary underline-offset-2 hover:text-text-primary hover:underline disabled:opacity-50"
            >
              Bỏ qua, để sau sẽ làm
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full flex-col gap-1 rounded-md border bg-card p-4 text-left transition-colors",
        selected
          ? "border-brand bg-brand/5 ring-2 ring-brand/30"
          : "border-border-subtle hover:border-brand/40 hover:bg-border-subtle/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {selected ? (
          <Check className="h-4 w-4 text-brand" aria-hidden />
        ) : null}
      </div>
      <span className="text-xs text-text-secondary">{description}</span>
    </button>
  );
}

function NumericField({
  label,
  value,
  onChange,
  placeholder,
  error,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
      {error ? <p className="text-xs text-state-error">{error}</p> : null}
    </div>
  );
}

function RecommendationStep({
  recommendation,
  isPending,
  onEnroll,
  onSkip,
}: {
  recommendation: Recommendation;
  isPending: boolean;
  onEnroll: (slug: string) => void;
  onSkip: () => void;
}) {
  if (!recommendation.planSlug || !recommendation.planTitle) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          Hiện chưa có giáo án nào phù hợp được xuất bản. Bạn có thể xem các
          giáo án có sẵn tại{" "}
          <Link
            href="/giao-an"
            className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
          >
            /giao-an
          </Link>{" "}
          hoặc thử lại sau.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={onSkip}
          disabled={isPending}
        >
          Quay về trang Hôm nay
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-brand/30 bg-gradient-to-br from-brand/5 via-surface to-accent/5 p-4">
        <div className="flex items-center gap-2 text-brand">
          <Target className="h-4 w-4" aria-hidden />
          <Badge>Gợi ý phù hợp nhất</Badge>
        </div>
        <h3 className="mt-2 text-lg font-semibold">
          {recommendation.planTitle}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {recommendation.rationale}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => onEnroll(recommendation.planSlug!)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Dumbbell className="h-4 w-4" />
            )}
            Đăng ký giáo án này
          </Button>
          <Button
            type="button"
            variant="secondary"
            asChild
            disabled={isPending}
          >
            <Link href={`/giao-an/${recommendation.planSlug}`}>
              Xem chi tiết
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {recommendation.alternativeSlugs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Lựa chọn khác
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendation.alternativeSlugs.map((slug) => (
              <Button key={slug} variant="outline" size="sm" asChild>
                <Link href={`/giao-an/${slug}`}>{slug}</Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSkip}
        disabled={isPending}
        className="text-xs text-text-secondary underline-offset-2 hover:text-text-primary hover:underline disabled:opacity-50"
      >
        Bỏ qua, vào thẳng /hom-nay
      </button>
    </div>
  );
}
