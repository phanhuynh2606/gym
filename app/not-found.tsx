import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand mb-4">
        <Dumbbell className="h-7 w-7" />
      </div>
      <h1 className="mb-2">404 — Không tìm thấy</h1>
      <p className="text-text-secondary max-w-prose mb-6">
        Có vẻ trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Button asChild variant="primary">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
