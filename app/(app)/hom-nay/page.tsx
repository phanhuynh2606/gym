import { Construction } from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

export default function ComingSoonPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Hôm nay", href: "/hom-nay" },
        ]}
      />
      <Placeholder
        title="Bảng điều khiển hằng ngày"
        description="Theo dõi buổi tập, nước, ngủ, bước chân và streak — sẽ có trong PR #3."
      />
    </div>
  );
}

export function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface p-12 text-center">
      <Construction className="mx-auto h-10 w-10 text-brand mb-3" />
      <h1 className="mb-2">{title}</h1>
      <p className="text-text-secondary max-w-prose mx-auto">{description}</p>
    </div>
  );
}
