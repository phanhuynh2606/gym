"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  createExerciseAction,
  updateExerciseAction,
  type ExerciseFormState,
} from "@/app/actions/admin-exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Defaults = {
  slug?: string;
  nameVi?: string;
  nameEn?: string;
  description?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  difficulty?: string;
  goalTags?: string[];
  instructions?: string[];
  commonMistakes?: string[];
  tips?: string[];
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  alternativeSlugs?: string[];
  isPublished?: boolean;
};

const initial: ExerciseFormState = { status: "idle" };

export function ExerciseForm({
  mode,
  defaults = {},
  originalSlug,
}: {
  mode: "create" | "edit";
  defaults?: Defaults;
  originalSlug?: string;
}) {
  const router = useRouter();
  const formId = useId();
  const [state, action, pending] = useActionState(
    mode === "create" ? createExerciseAction : updateExerciseAction,
    initial,
  );
  const [published, setPublished] = useState<boolean>(
    defaults.isPublished ?? true,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/admin/exercises");
    }
  }, [state, router]);

  const errors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form id={formId} action={action} className="space-y-5">
      {originalSlug && (
        <input type="hidden" name="originalSlug" value={originalSlug} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên tiếng Việt" name="nameVi" defaultValue={defaults.nameVi} errors={errors.nameVi} required />
        <Field label="Tên tiếng Anh" name="nameEn" defaultValue={defaults.nameEn} errors={errors.nameEn} required />
        <Field
          label="Slug (URL)"
          name="slug"
          defaultValue={defaults.slug}
          errors={errors.slug}
          hint="a-z, 0-9, dấu gạch nối — ví dụ: bench-press"
          required
        />
        <Field
          label="Độ khó"
          name="difficulty"
          as="select"
          defaultValue={defaults.difficulty ?? "beginner"}
          errors={errors.difficulty}
          options={[
            { value: "beginner", label: "Người mới" },
            { value: "intermediate", label: "Trung cấp" },
            { value: "advanced", label: "Nâng cao" },
          ]}
        />
      </div>

      <TextArea
        label="Mô tả ngắn"
        name="description"
        defaultValue={defaults.description}
        rows={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nhóm cơ chính (CSV)"
          name="primaryMuscles"
          defaultValue={defaults.primaryMuscles?.join(", ")}
          errors={errors.primaryMuscles}
          hint="vd: chest, triceps"
          required
        />
        <Field
          label="Nhóm cơ phụ (CSV)"
          name="secondaryMuscles"
          defaultValue={defaults.secondaryMuscles?.join(", ")}
        />
        <Field
          label="Dụng cụ (CSV)"
          name="equipment"
          defaultValue={defaults.equipment?.join(", ")}
          errors={errors.equipment}
          hint="vd: barbell, bench"
          required
        />
        <Field
          label="Goal tags (CSV)"
          name="goalTags"
          defaultValue={defaults.goalTags?.join(", ")}
          hint="weight_loss, muscle_gain, toning, strength"
        />
      </div>

      <TextArea
        label="Hướng dẫn (mỗi bước 1 dòng)"
        name="instructions"
        defaultValue={defaults.instructions?.join("\n")}
        rows={5}
      />
      <TextArea
        label="Lỗi thường gặp (mỗi lỗi 1 dòng)"
        name="commonMistakes"
        defaultValue={defaults.commonMistakes?.join("\n")}
        rows={4}
      />
      <TextArea
        label="Mẹo (mỗi mẹo 1 dòng)"
        name="tips"
        defaultValue={defaults.tips?.join("\n")}
        rows={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ảnh URL" name="imageUrl" defaultValue={defaults.imageUrl} type="url" />
        <Field label="GIF URL" name="gifUrl" defaultValue={defaults.gifUrl} type="url" />
        <Field label="Video URL" name="videoUrl" defaultValue={defaults.videoUrl} type="url" />
        <Field
          label="YouTube video ID"
          name="youtubeVideoId"
          defaultValue={defaults.youtubeVideoId}
          hint="11 ký tự sau v= trong URL YouTube"
        />
      </div>

      <Field
        label="Bài thay thế (CSV slug)"
        name="alternativeSlugs"
        defaultValue={defaults.alternativeSlugs?.join(", ")}
      />

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        Hiển thị công khai (isPublished)
      </label>

      {state.status === "error" && (
        <p className="rounded-md border border-state-error/40 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang lưu…" : mode === "create" ? "Tạo bài tập" : "Lưu thay đổi"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/exercises")}
          disabled={pending}
        >
          Huỷ
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  errors,
  required,
  type = "text",
  as = "input",
  options = [],
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  errors?: string[];
  required?: boolean;
  type?: string;
  as?: "input" | "select";
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-state-error">*</span>}
      </Label>
      {as === "select" ? (
        <select
          id={name}
          name={name}
          defaultValue={defaultValue}
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={name}
          name={name}
          defaultValue={defaultValue}
          type={type}
          aria-invalid={errors && errors.length > 0}
        />
      )}
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
      {errors && errors.length > 0 && (
        <p className="text-xs text-state-error">{errors.join("; ")}</p>
      )}
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}
