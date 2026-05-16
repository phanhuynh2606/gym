import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản GymVN miễn phí để theo dõi tiến độ và nhận lịch tập cá nhân.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <header className="border-b border-border-subtle bg-surface">
        <div className="container-app flex h-14 items-center">
          <Link
            href="/"
            className="group flex items-center gap-2 text-text-primary hover:text-brand transition-colors"
            aria-label="GymVN — Trang chủ"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-dark text-white shadow-raised">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Gym<span className="text-brand">VN</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">
        <SignUp
          signInUrl="/sign-in"
          appearance={{
            elements: {
              card: "shadow-modal",
              formButtonPrimary:
                "bg-brand hover:bg-brand-dark normal-case text-sm",
              headerTitle: "text-text-primary",
              headerSubtitle: "text-text-secondary",
            },
          }}
        />
      </main>
    </div>
  );
}
