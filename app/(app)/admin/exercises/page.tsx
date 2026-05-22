import Link from "next/link";
import { Plus } from "lucide-react";
import { ExerciseRowActions } from "@/components/admin/ExerciseRowActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAdminExercises } from "@/lib/exercises-data";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  DIFFICULTY_LABELS_VI,
  MUSCLE_LABELS_VI,
  type Muscle,
} from "@/types";

export default async function AdminExercisesPage() {
  const exercises = await listAdminExercises();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Bài tập ({exercises.length})
          </h2>
          <p className="text-xs text-text-secondary">
            Chỉnh sửa nội dung bài tập, ảnh, video, mức độ.
          </p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href="/admin/exercises/new" className="inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" aria-hidden /> Thêm bài tập
          </Link>
        </Button>
      </div>

      {!isMongoConfigured() && (
        <Card className="border-state-warning/40 bg-state-warning/5 p-4 text-sm text-text-secondary">
          <p>
            <strong>MONGODB_URI</strong> chưa được cấu hình — danh sách dưới
            đây hiện thị từ seed bundled và không thể chỉnh sửa.
          </p>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted/40 text-left text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Nhóm cơ chính</th>
                <th className="px-4 py-3">Độ khó</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {exercises.map((ex) => (
                <tr key={ex.slug} className="hover:bg-border-subtle/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/exercises/${ex.slug}/edit`}
                      className="font-medium text-text-primary hover:text-brand"
                    >
                      {ex.nameVi}
                    </Link>
                    <div className="text-xs text-text-secondary">
                      {ex.slug} · {ex.nameEn}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {ex.primaryMuscles
                      .map((m) => MUSCLE_LABELS_VI[m as Muscle] ?? m)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {DIFFICULTY_LABELS_VI[ex.difficulty]}
                  </td>
                  <td className="px-4 py-3">
                    {ex.isPublished ? (
                      <Badge variant="success">Hiện</Badge>
                    ) : (
                      <Badge variant="default">Ẩn</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ExerciseRowActions
                      slug={ex.slug}
                      isPublished={ex.isPublished}
                    />
                  </td>
                </tr>
              ))}
              {exercises.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-text-secondary"
                  >
                    Chưa có bài tập nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
