import type { Metadata } from "next";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Card, CardContent } from "@/components/ui/card";
import { isMongoConfigured } from "@/lib/mongodb";
import { listNotifications, type NotificationView } from "@/lib/notifications";
import { getOrCreateMongoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thông báo",
  description:
    "Tất cả nhắc nhở: buổi tập, to-do, monthly review và các tin nhắn hệ thống.",
  robots: { index: false, follow: false },
};

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Thông báo", href: "/thong-bao" },
];

export default async function ThongBaoPage() {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem thông báo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMongoConfigured()) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-secondary">
            Tính năng thông báo cần MongoDB. Vui lòng cấu hình{" "}
            <code className="rounded bg-border-subtle px-1">MONGODB_URI</code>{" "}
            trong <code>.env.local</code>.
          </CardContent>
        </Card>
      </div>
    );
  }

  let notifications: NotificationView[] = [];
  let dbError: string | null = null;
  try {
    notifications = await listNotifications(user.clerkId, 50);
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Lỗi không xác định";
  }

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand" aria-hidden />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Thông báo
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Reminder, monthly review và các tin nhắn hệ thống. Cài giờ nhắc tại{" "}
          <Link
            href="/cai-dat"
            className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
          >
            Cài đặt
          </Link>
          .
        </p>
      </header>

      {dbError ? (
        <Card>
          <CardContent className="p-6 text-sm text-state-error">
            Không tải được thông báo: {dbError}
          </CardContent>
        </Card>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
