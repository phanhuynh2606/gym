import type { Metadata } from "next";
import { Bell, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { ReminderPreferencesForm } from "@/components/notifications/ReminderPreferencesForm";
import { ProfileSettingsForm } from "@/components/social/ProfileSettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaseUrl } from "@/lib/constants";
import { isEmailConfigured } from "@/lib/email";
import { getOrCreateMongoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cài đặt",
  description:
    "Bật/tắt reminder, chọn giờ nhắc và bật email reminder qua Resend.",
  robots: { index: false, follow: false },
};

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Cài đặt", href: "/cai-dat" },
];

export default async function CaiDatPage() {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-secondary">
              Vui lòng đăng nhập để xem cài đặt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailConfigured = isEmailConfigured();

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand" aria-hidden />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Cài đặt
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Quản lý reminder, email và các tuỳ chọn cá nhân khác.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand" aria-hidden />
            <CardTitle className="text-base">Reminder</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ReminderPreferencesForm
            initial={{
              reminderEnabled: user.reminderEnabled,
              reminderHour: user.reminderHour,
              reminderEmailEnabled: user.reminderEmailEnabled,
              timezoneOffsetMinutes: user.timezoneOffsetMinutes,
            }}
            emailEnabledServer={emailConfigured}
            userEmail={user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-brand" aria-hidden />
            <CardTitle className="text-base">Profile công khai</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            initial={{
              displayName: user.displayName,
              profileSlug: user.profileSlug,
              profileBio: user.profileBio,
              profileVisibility: user.profileVisibility,
            }}
            baseUrl={getBaseUrl()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hồ sơ tập luyện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-text-secondary">
            Cập nhật mục tiêu, dụng cụ và chỉ số tại{" "}
            <Link
              href="/onboarding?redo=1"
              className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
            >
              onboarding
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
