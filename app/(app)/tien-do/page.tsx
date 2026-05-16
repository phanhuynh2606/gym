import { Construction } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

export default function TienDoPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tiến độ", href: "/tien-do" },
        ]}
      />
      <div className="rounded-md border border-dashed border-border bg-surface p-12 text-center">
        <Construction className="mx-auto h-10 w-10 text-brand mb-3" />
        <h1 className="mb-2">Tiến độ</h1>
        <p className="text-text-secondary max-w-prose mx-auto">
          Biểu đồ cân nặng, số đo, khối lượng tập — sẽ có trong PR #4.
        </p>
      </div>
    </div>
  );
}
