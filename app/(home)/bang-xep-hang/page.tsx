import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Dumbbell,
  Flame,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getBaseUrl, SITE_NAME } from "@/lib/constants";
import {
  loadLeaderboard,
  type LeaderboardEntry,
  type LeaderboardSort,
} from "@/lib/leaderboard";
import { isMongoConfigured } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
// 5-minute revalidation when hit fresh; the page is otherwise dynamic since
// it pulls live profile counts.
export const revalidate = 300;

type SearchParams = Promise<{ sort?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { sort } = await searchParams;
  const sortLabel = SORT_LABELS[parseSort(sort)];
  const title = `Bảng xếp hạng — ${sortLabel}`;
  const description = `Top thành viên ${SITE_NAME} 30 ngày qua xếp theo ${sortLabel.toLowerCase()}.`;
  const baseUrl = getBaseUrl();
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/bang-xep-hang` },
    openGraph: {
      type: "website",
      url: `${baseUrl}/bang-xep-hang`,
      title,
      description,
      siteName: SITE_NAME,
      locale: "vi_VN",
    },
  };
}

const SORTS: Array<{ key: LeaderboardSort; label: string; icon: typeof Flame }> = [
  { key: "streak", label: "Streak", icon: Flame },
  { key: "volume", label: "Tổng volume", icon: Dumbbell },
  { key: "completion", label: "Hoàn thành", icon: Activity },
];

const SORT_LABELS: Record<LeaderboardSort, string> = {
  streak: "Streak hiện tại",
  volume: "Tổng volume (30d)",
  completion: "Tỷ lệ hoàn thành (30d)",
};

function parseSort(value: string | undefined): LeaderboardSort {
  if (value === "volume" || value === "completion") return value;
  return "streak";
}

function formatVolume(volumeKg: number): string {
  if (volumeKg >= 1_000_000) {
    return `${(volumeKg / 1_000_000).toFixed(1)} triệu kg`;
  }
  if (volumeKg >= 1_000) {
    return `${(volumeKg / 1_000).toFixed(volumeKg >= 10_000 ? 0 : 1)}k kg`;
  }
  return `${volumeKg} kg`;
}

function metric(entry: LeaderboardEntry, sort: LeaderboardSort): string {
  if (sort === "streak") return `${entry.currentStreak} ngày`;
  if (sort === "volume") return formatVolume(entry.totalVolume30);
  return `${entry.avgCompletion30}%`;
}

const breadcrumbs = [
  { name: "Trang chủ", href: "/" },
  { name: "Bảng xếp hạng", href: "/bang-xep-hang" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sort: rawSort } = await searchParams;
  const sort = parseSort(rawSort);

  if (!isMongoConfigured()) {
    return (
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />
        <Card>
          <CardContent className="p-8 text-center text-sm text-text-secondary">
            Tính năng bảng xếp hạng cần MongoDB. Cấu hình{" "}
            <code className="rounded bg-border-subtle px-1">MONGODB_URI</code>{" "}
            để bật.
          </CardContent>
        </Card>
      </div>
    );
  }

  let rows: LeaderboardEntry[] = [];
  let dbError: string | null = null;
  try {
    rows = await loadLeaderboard(sort, 20);
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Lỗi không xác định";
  }

  return (
    <div className="container-app py-8 md:py-10 space-y-6">
      <Breadcrumb items={breadcrumbs} />

      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-brand" aria-hidden />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bảng xếp hạng
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Top 20 thành viên tích cực nhất 30 ngày qua. Chỉ hiển thị profile công
          khai — bật ở{" "}
          <Link
            href="/cai-dat"
            className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
          >
            Cài đặt
          </Link>
          .
        </p>
      </header>

      <nav
        aria-label="Sắp xếp"
        className="flex flex-wrap items-center gap-2"
      >
        {SORTS.map((s) => {
          const Icon = s.icon;
          const active = s.key === sort;
          return (
            <Link
              key={s.key}
              href={s.key === "streak" ? "/bang-xep-hang" : `/bang-xep-hang?sort=${s.key}`}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                (active
                  ? "bg-brand text-white"
                  : "bg-border-subtle text-text-secondary hover:bg-border")
              }
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {dbError ? (
        <Card>
          <CardContent className="p-6 text-sm text-state-error">
            Không tải được bảng xếp hạng: {dbError}
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Sparkles className="h-8 w-8 text-text-muted" aria-hidden />
            <p className="font-medium">Chưa ai bật profile công khai</p>
            <p className="max-w-sm text-sm text-text-secondary">
              Bạn có thể là người đầu tiên — vào{" "}
              <Link
                href="/cai-dat"
                className="text-brand hover:underline"
              >
                Cài đặt
              </Link>{" "}
              chọn slug và bật profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ol className="divide-y divide-border-subtle rounded-md border border-border-subtle bg-surface">
          {rows.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={`/u/${entry.slug}`}
                className="flex items-center gap-4 p-3 transition-colors hover:bg-border-subtle/40"
              >
                <span
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold " +
                    (entry.rank === 1
                      ? "bg-state-warning/15 text-state-warning"
                      : entry.rank === 2
                        ? "bg-border-subtle text-text-secondary"
                        : entry.rank === 3
                          ? "bg-brand/10 text-brand"
                          : "bg-surface-bg text-text-muted")
                  }
                  aria-hidden
                >
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate font-medium">{entry.displayName}</p>
                    <span className="shrink-0 text-xs text-text-muted">
                      @{entry.slug}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    {entry.goalLabel ? (
                      <Badge variant="secondary">{entry.goalLabel}</Badge>
                    ) : null}
                    <span className="text-text-muted">
                      {entry.trainingDays30} ngày tập • streak dài nhất{" "}
                      {entry.longestStreak30} ngày
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metric(entry, sort)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">
                    {SORT_LABELS[sort]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
