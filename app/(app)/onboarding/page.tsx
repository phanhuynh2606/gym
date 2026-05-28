import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import {
  EQUIPMENT_OPTIONS,
  GOAL_OPTIONS,
  LEVEL_OPTIONS,
} from "@/lib/onboarding";
import { getOrCreateMongoUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cá nhân hoá kế hoạch tập",
  description:
    "Trả lời 5 bước để chúng tôi gợi ý giáo án phù hợp với mục tiêu, trình độ và dụng cụ của bạn.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redo?: string }>;
}) {
  const { redo } = await searchParams;
  const user = await getOrCreateMongoUser();

  if (!user) {
    redirect("/sign-in?redirect_url=%2Fonboarding");
  }

  // If the user already completed onboarding and isn't explicitly redoing it,
  // bounce them to the dashboard. The wizard supports re-running via
  // `?redo=1` so users can update their stats later from /tien-do.
  if (user.onboardingCompletedAt && redo !== "1") {
    redirect("/hom-nay");
  }

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Cá nhân hoá", href: "/onboarding" },
        ]}
      />

      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Cá nhân hoá kế hoạch tập của bạn
        </h1>
        <p className="text-text-secondary text-sm">
          Chỉ mất 1-2 phút. Chúng tôi sẽ gợi ý 1 giáo án 5 buổi/tuần phù hợp
          nhất và tự tạo to-do 30 ngày cho bạn.
        </p>
      </header>

      <OnboardingWizard
        defaults={{
          gender: user.gender,
          goal: user.goal,
          level: user.level,
          equipment: user.equipment,
          heightCm: user.heightCm,
          currentWeightKg: user.currentWeightKg,
          targetWeightKg: user.targetWeightKg,
          birthYear: user.birthYear,
        }}
        options={{
          goals: GOAL_OPTIONS,
          levels: LEVEL_OPTIONS,
          equipment: EQUIPMENT_OPTIONS,
        }}
      />
    </div>
  );
}
