export const SITE_NAME = "GymVN";
export const SITE_TAGLINE = "Hướng dẫn tập gym cho người mới";
export const SITE_DESCRIPTION =
  "Website hướng dẫn tập gym tiếng Việt cho nữ giảm cân và nam mới tập. Lịch tập 5 buổi/tuần, video minh hoạ, theo dõi tiến độ và to-do hàng ngày.";

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const PRIMARY_NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/giao-an", label: "Giáo án" },
  { href: "/bai-tap", label: "Bài tập" },
  { href: "/nhom-co", label: "Nhóm cơ" },
  { href: "/dinh-duong", label: "Dinh dưỡng" },
];

export const APP_NAV = [
  { href: "/hom-nay", label: "Hôm nay", icon: "calendar-days" },
  { href: "/todo", label: "To-do", icon: "list-todo" },
  { href: "/lich-tap", label: "Lịch tập", icon: "calendar" },
  { href: "/tien-do", label: "Tiến độ", icon: "trending-up" },
  { href: "/tong-ket-thang", label: "Tổng kết tháng", icon: "bar-chart" },
  { href: "/yeu-thich", label: "Yêu thích", icon: "heart" },
];

export const BROWSE_NAV = [
  { href: "/giao-an", label: "Giáo án", icon: "dumbbell" },
  { href: "/bai-tap", label: "Thư viện bài tập", icon: "book-open" },
  { href: "/nhom-co", label: "Nhóm cơ", icon: "user-round" },
  { href: "/dinh-duong", label: "Dinh dưỡng", icon: "apple" },
];
