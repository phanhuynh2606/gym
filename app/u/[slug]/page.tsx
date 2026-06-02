import { Activity, CalendarCheck2, Dumbbell, Flame, Sparkles, Target, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { ShareProfileButton } from "@/components/social/ShareProfileButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBaseUrl, SITE_NAME } from "@/lib/constants";
import { isMongoConfigured } from "@/lib/mongodb";
import {
  normalizeSlug,
  resolvePublicSnapshotBySlug,
} from "@/lib/profile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  if (!normalized || !isMongoConfigured()) {
    return { title: "Profile", robots: { index: false, follow: false } };
  }
  const snap = await resolvePublicSnapshotBySlug(normalized);
  if (!snap) {
    return { title: "Profile", robots: { index: false, follow: false } };
  }
  const baseUrl = getBaseUrl();
  const title = `${snap.displayName} (@${snap.slug})`;
  const goal = snap.goalLabel ? ` · ${snap.goalLabel}` : "";
  const description =
    snap.bio ??
    `${snap.displayName} đang tập ${snap.stats.trainingDays30} ngày trong 30 ngày qua${goal}. Theo dõi tiến độ trên ${SITE_NAME}.`;
  const url = `${baseUrl}/u/${snap.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "vi_VN",
    },
    twitter: { card: "summary", title, description },
  };
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

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  if (!normalized) notFound();

  if (!isMongoConfigured()) {
    // Render a graceful placeholder when Mongo isn't configured (dev).
    return (
      <AppShell>
        <div className="container-app py-10 space-y-6">
          <Card>
            <CardContent className="p-8 text-center text-sm text-text-secondary">
              Tính năng profile cần MongoDB. Vui lòng cấu hình{" "}
              <code className="rounded bg-border-subtle px-1">MONGODB_URI</code>.
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const snap = await resolvePublicSnapshotBySlug(normalized);
  if (!snap) notFound();

  const baseUrl = getBaseUrl();
  const profileUrl = `${baseUrl}/u/${snap.slug}`;

  const breadcrumbs = [
    { name: "Trang chủ", href: "/" },
    { name: "Bảng xếp hạng", href: "/bang-xep-hang" },
    { name: snap.displayName, href: `/u/${snap.slug}` },
  ];

  const stats = [
    {
      label: "Streak hiện tại",
      value: `${snap.stats.currentStreak} ngày`,
      icon: Flame,
      color: "text-state-warning",
    },
    {
      label: "Streak dài nhất (30d)",
      value: `${snap.stats.longestStreak30} ngày`,
      icon: Trophy,
      color: "text-brand",
    },
    {
      label: "Ngày tập (30d)",
      value: `${snap.stats.trainingDays30} ngày`,
      icon: CalendarCheck2,
      color: "text-state-success",
    },
    {
      label: "Hoàn thành trung bình",
      value: `${snap.stats.avgCompletion30}%`,
      icon: Activity,
      color: "text-state-info",
    },
    {
      label: "Tổng volume (30d)",
      value: formatVolume(snap.stats.totalVolume30),
      icon: Dumbbell,
      color: "text-brand-dark",
    },
    {
      label: "Ngày đã tick đủ task",
      value: `${snap.stats.completedDays30} ngày`,
      icon: Sparkles,
      color: "text-state-success",
    },
  ];

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: snap.displayName,
      url: profileUrl,
      ...(snap.bio ? { description: snap.bio } : {}),
    },
  };

  return (
    <AppShell>
      <div className="container-app py-8 md:py-10 space-y-6">
        <Breadcrumb items={breadcrumbs} />

        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {snap.displayName}
              </h1>
              <span className="text-sm text-text-muted">@{snap.slug}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {snap.goalLabel ? (
                <Badge variant="default">
                  <Target className="mr-1 inline h-3 w-3" aria-hidden />
                  {snap.goalLabel}
                </Badge>
              ) : null}
              {snap.genderLabel ? (
                <Badge variant="secondary">{snap.genderLabel}</Badge>
              ) : null}
              {snap.levelLabel ? (
                <Badge variant="outline">{snap.levelLabel}</Badge>
              ) : null}
              {snap.activePlanTitle && snap.activePlanSlug ? (
                <Link
                  href={`/giao-an/${snap.activePlanSlug}`}
                  className="text-xs text-brand hover:underline"
                >
                  Đang tập: {snap.activePlanTitle}
                </Link>
              ) : null}
            </div>
            {snap.bio ? (
              <p className="max-w-prose text-sm text-text-secondary">
                {snap.bio}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShareProfileButton url={profileUrl} displayName={snap.displayName} />
            <Button asChild variant="outline" size="sm">
              <Link href="/bang-xep-hang">Bảng xếp hạng</Link>
            </Button>
          </div>
        </header>

        <section
          aria-label="Thống kê 30 ngày"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-5 w-5 ${s.color}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted">{s.label}</p>
                    <p className="text-lg font-semibold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Về profile này</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text-secondary">
            <p>
              Profile công khai chia sẻ thống kê 30 ngày gần nhất —{" "}
              <span className="font-medium text-text-primary">
                không bao gồm
              </span>{" "}
              số đo cơ thể, cân nặng, sleep/mood hay chi tiết từng bài tập.
            </p>
            <p>
              Tham gia từ{" "}
              {new Date(snap.joinedAt).toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
              . Để tạo profile của riêng bạn, hãy đăng nhập và vào{" "}
              <Link
                href="/cai-dat"
                className="text-brand hover:text-brand-dark underline-offset-2 hover:underline"
              >
                Cài đặt
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <JsonLd data={personJsonLd} />
      </div>
    </AppShell>
  );
}
