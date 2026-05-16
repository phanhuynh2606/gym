import { Construction } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

export default function LichTapPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Lịch tập", href: "/lich-tap" },
        ]}
      />
      <div className="rounded-md border border-dashed border-border bg-surface p-12 text-center">
        <Construction className="mx-auto h-10 w-10 text-brand mb-3" />
        <h1 className="mb-2">Lịch tập tuần</h1>
        <p className="text-text-secondary max-w-prose mx-auto">
          Calendar view các buổi tập trong tuần — sẽ có trong PR #2.
        </p>
      </div>
    </div>
  );
}
