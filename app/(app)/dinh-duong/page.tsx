import type { Metadata } from "next";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dinh dưỡng cho người tập gym",
  description:
    "Hướng dẫn dinh dưỡng cơ bản: tính TDEE, đạm/tinh bột/chất béo, gợi ý bữa ăn cho người giảm cân và người tăng cơ.",
  path: "/dinh-duong",
});

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Dinh dưỡng", href: "/dinh-duong" },
];

export default function NutritionPage() {
  return (
    <div className="container-app py-8 md:py-10 space-y-8 max-w-3xl">
      <Breadcrumb items={breadcrumbs} />

      <header className="space-y-2">
        <h1>Dinh dưỡng cho người tập gym</h1>
        <p className="text-text-secondary">
          Tập gym chỉ chiếm 30% kết quả, dinh dưỡng chiếm 70%. Phần này tóm
          tắt những gì cơ bản nhất bạn cần biết.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Tính nhu cầu calo (TDEE)</CardTitle>
          <CardDescription>
            TDEE = lượng calo cơ thể đốt mỗi ngày khi sinh hoạt bình thường.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary space-y-2">
          <p>
            <span className="font-semibold text-text-primary">Giảm cân: </span>
            ăn 80% TDEE (thâm hụt ~500 kcal/ngày → giảm ~0.5 kg/tuần).
          </p>
          <p>
            <span className="font-semibold text-text-primary">Tăng cơ: </span>
            ăn 110-115% TDEE (thặng dư ~200-400 kcal/ngày).
          </p>
          <p>Có thể dùng các app tính TDEE miễn phí như MyFitnessPal.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Tỷ lệ ba chất chính (Macros)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-secondary space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Đạm" value="1.6-2.2 g/kg" />
            <Stat label="Tinh bột" value="40-55%" />
            <Stat label="Chất béo" value="0.8-1 g/kg" />
          </div>
          <p>
            Người tập gym 60 kg cần ~110-130 g đạm/ngày (≈ 4 lòng trắng trứng
            + 200 g ức gà + 100 g cá + 1 ly sữa).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Nguồn đạm chất lượng</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="space-y-2 list-disc pl-5 text-text-secondary">
            <li>Ức gà, ức gà tây, cá hồi, cá ngừ, cá basa.</li>
            <li>Trứng (cả lòng đỏ), sữa, sữa chua Hy Lạp.</li>
            <li>Thịt bò nạc, thịt heo nạc, đậu, hạt diêm mạch.</li>
            <li>Whey protein khi không đủ qua bữa ăn.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Tinh bột tốt và xấu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Badge variant="success">Ưu tiên</Badge>
              <ul className="mt-2 space-y-1 list-disc pl-5 text-text-secondary">
                <li>Cơm gạo lứt, yến mạch, khoai lang.</li>
                <li>Bánh mì nguyên cám, đậu các loại.</li>
                <li>Rau xanh, trái cây ít ngọt.</li>
              </ul>
            </div>
            <div>
              <Badge variant="warning">Hạn chế</Badge>
              <ul className="mt-2 space-y-1 list-disc pl-5 text-text-secondary">
                <li>Bánh kẹo, nước ngọt, trà sữa.</li>
                <li>Đồ chiên xào nhiều dầu.</li>
                <li>Rượu bia, đồ uống có cồn.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Mẫu thực đơn một ngày</CardTitle>
          <CardDescription>
            Cho người 60 kg, mục tiêu giảm cân ~1.700 kcal/ngày.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="space-y-2 text-text-secondary">
            <li>
              <span className="font-semibold text-text-primary">Sáng:</span> 2
              trứng + 1 bát yến mạch + 1 quả chuối.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Trưa:</span>{" "}
              150g ức gà + 1 chén cơm gạo lứt + rau luộc.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Xế:</span> 1
              hộp sữa chua Hy Lạp + 1 nắm hạt điều.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Tối:</span>{" "}
              150g cá + 1 củ khoai lang + salad.
            </li>
            <li>
              <span className="font-semibold text-text-primary">Trước
                ngủ:</span>{" "}
              1 ly sữa.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Nước, ngủ, stress</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <span className="font-semibold text-text-primary">Nước:</span>{" "}
            uống 2-3 lít/ngày, thêm 500ml khi tập.
          </p>
          <p>
            <span className="font-semibold text-text-primary">Ngủ:</span>{" "}
            7-9 tiếng/đêm. Ngủ thiếu → cơ thể giữ mỡ, mất cơ.
          </p>
          <p>
            <span className="font-semibold text-text-primary">Stress:</span>{" "}
            cortisol cao kéo dài làm khó giảm mỡ vùng bụng.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-text-muted">
        Lưu ý: Nội dung mang tính tham khảo, không thay thế tư vấn của bác sĩ
        hoặc HLV chuyên môn.
      </p>

      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-3 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-semibold text-text-primary">{value}</p>
    </div>
  );
}
