import Link from "next/link";
import { ArrowRight, Dumbbell, ImageIcon, ListChecks, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listAdminExercises } from "@/lib/exercises-data";
import { listAdminWorkoutPlans } from "@/lib/workout-plans-data";
import { connectMongoDB, isMongoConfigured } from "@/lib/mongodb";
import { UserModel } from "@/models/User";

async function loadUserCount(): Promise<number | null> {
  if (!isMongoConfigured()) return null;
  await connectMongoDB();
  return UserModel.estimatedDocumentCount();
}

function StatCard({
  title,
  value,
  href,
  icon: Icon,
}: {
  title: string;
  value: string;
  href: string;
  icon: typeof Dumbbell;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-md border border-border-subtle bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {value}
          </p>
        </div>
        <div className="rounded-md bg-brand/10 p-2 text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand">
        Mở
        <ArrowRight
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const [exercises, plans, userCount] = await Promise.all([
    listAdminExercises(),
    listAdminWorkoutPlans(),
    loadUserCount(),
  ]);

  const publishedExercises = exercises.filter((e) => e.isPublished).length;
  const publishedPlans = plans.filter((p) => p.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bài tập"
          value={`${publishedExercises} / ${exercises.length}`}
          href="/admin/exercises"
          icon={Dumbbell}
        />
        <StatCard
          title="Giáo án"
          value={`${publishedPlans} / ${plans.length}`}
          href="/admin/workout-plans"
          icon={ListChecks}
        />
        <StatCard
          title="Người dùng"
          value={userCount === null ? "—" : userCount.toLocaleString("vi-VN")}
          href="/admin"
          icon={Users}
        />
        <StatCard
          title="Media"
          value="Cloudinary"
          href="/admin/media"
          icon={ImageIcon}
        />
      </div>

      <Card>
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-base font-semibold">Hoạt động gần đây</h2>
          <p className="text-xs text-text-secondary">
            Bài tập / giáo án mới cập nhật (top 5)
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">
              Bài tập
            </p>
            <ul className="space-y-1.5 text-sm">
              {exercises.slice(0, 5).map((e) => (
                <li key={e.slug} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/exercises/${e.slug}/edit`}
                    className="truncate text-text-primary hover:text-brand"
                  >
                    {e.nameVi}
                  </Link>
                  {!e.isPublished && (
                    <span className="rounded-md bg-state-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-state-warning">
                      ẩn
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">
              Giáo án
            </p>
            <ul className="space-y-1.5 text-sm">
              {plans.slice(0, 5).map((p) => (
                <li key={p.slug} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/workout-plans/${p.slug}/edit`}
                    className="truncate text-text-primary hover:text-brand"
                  >
                    {p.title}
                  </Link>
                  {!p.isPublished && (
                    <span className="rounded-md bg-state-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-state-warning">
                      ẩn
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="bg-state-info/5 border-state-info/30">
        <div className="p-5 text-sm space-y-2">
          <p className="font-medium text-text-primary">
            Mẹo nhanh
          </p>
          <ul className="list-disc pl-5 space-y-1 text-text-secondary">
            <li>
              Edit bài tập sẽ tự revalidate <code>/bai-tap</code> + slug detail.
            </li>
            <li>
              Đến khi <code>ExerciseModel</code> có dữ liệu, các trang public
              dùng seed bundled — bài tập đầu tiên anh tạo trong admin sẽ
              chuyển sang đọc từ Mongo.
            </li>
            <li>
              Nâng cấp user thành admin: gọi{" "}
              <code>POST /api/admin/promote</code> sau khi đăng nhập bằng email
              khớp <code>INITIAL_ADMIN_EMAIL</code>.
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
