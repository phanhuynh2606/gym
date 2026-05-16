import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface mt-12">
      <div className="container-app py-8 flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="space-y-2 max-w-md">
          <p className="text-sm font-semibold">GymVN</p>
          <p className="text-xs text-text-secondary">
            Website hướng dẫn tập gym tiếng Việt cho nữ giảm cân và nam mới
            tập. Lịch tập 5 buổi/tuần, video minh hoạ, theo dõi tiến độ.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Link href="/giao-an" className="text-text-secondary hover:text-brand">
            Giáo án
          </Link>
          <Link href="/bai-tap" className="text-text-secondary hover:text-brand">
            Bài tập
          </Link>
          <Link href="/nhom-co" className="text-text-secondary hover:text-brand">
            Nhóm cơ
          </Link>
          <Link
            href="/dinh-duong"
            className="text-text-secondary hover:text-brand"
          >
            Dinh dưỡng
          </Link>
        </nav>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container-app py-4 text-xs text-text-muted">
          © {new Date().getFullYear()} GymVN. Nội dung mang tính tham khảo, không thay thế tư vấn y tế chuyên môn.
        </div>
      </div>
    </footer>
  );
}
