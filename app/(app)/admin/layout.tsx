import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin · GymVN",
  robots: { index: false, follow: false },
};

// Admin pages always read live DB state and should never be statically cached.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
            Khu vực quản trị
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin · GymVN
          </h1>
        </div>
        <Badge variant="default" className="self-start sm:self-auto">
          Đăng nhập: {admin.displayName ?? admin.email ?? admin.clerkId}
        </Badge>
      </div>

      <AdminNav />

      <div>{children}</div>
    </div>
  );
}
