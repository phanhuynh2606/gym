import Link from "next/link";
import { WorkoutPlanRowActions } from "@/components/admin/WorkoutPlanRowActions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminWorkoutPlans } from "@/lib/workout-plans-data";
import { isMongoConfigured } from "@/lib/mongodb";

const TARGET_LABELS: Record<string, string> = {
  female_weight_loss: "Nữ giảm cân",
  male_beginner: "Nam mới tập",
};

export default async function AdminWorkoutPlansPage() {
  const plans = await listAdminWorkoutPlans();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Giáo án ({plans.length})
          </h2>
          <p className="text-xs text-text-secondary">
            Sửa lịch tuần, số buổi, mục tiêu của từng giáo án.
          </p>
        </div>
      </div>

      {!isMongoConfigured() && (
        <Card className="border-state-warning/40 bg-state-warning/5 p-4 text-sm text-text-secondary">
          <p>
            <strong>MONGODB_URI</strong> chưa được cấu hình — danh sách dưới
            đây từ seed và không thể chỉnh sửa.
          </p>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted/40 text-left text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-4 py-3">Giáo án</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Buổi/tuần</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {plans.map((p) => (
                <tr key={p.slug} className="hover:bg-border-subtle/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workout-plans/${p.slug}/edit`}
                      className="font-medium text-text-primary hover:text-brand"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-text-secondary">
                      {p.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {TARGET_LABELS[p.targetUser] ?? p.targetUser}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.daysPerWeek}
                  </td>
                  <td className="px-4 py-3">
                    {p.isPublished ? (
                      <Badge variant="success">Hiện</Badge>
                    ) : (
                      <Badge variant="default">Ẩn</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <WorkoutPlanRowActions
                      slug={p.slug}
                      isPublished={p.isPublished}
                      allowDelete={isMongoConfigured()}
                    />
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-text-secondary"
                  >
                    Chưa có giáo án nào.
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
