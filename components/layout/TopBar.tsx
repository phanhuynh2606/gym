"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  Apple,
  BarChart,
  BookOpen,
  Calendar,
  CalendarDays,
  Dumbbell,
  Heart,
  Home,
  ListTodo,
  Menu,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APP_NAV, BROWSE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, typeof Home> = {
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  "user-round": UserRound,
  apple: Apple,
  "calendar-days": CalendarDays,
  "list-todo": ListTodo,
  calendar: Calendar,
  "trending-up": TrendingUp,
  "bar-chart": BarChart,
  heart: Heart,
};

const DESKTOP_NAV = [
  { href: "/giao-an", label: "Giáo án" },
  { href: "/bai-tap", label: "Bài tập" },
  { href: "/nhom-co", label: "Nhóm cơ" },
  { href: "/dinh-duong", label: "Dinh dưỡng" },
  { href: "/lich-tap", label: "Lịch tập" },
] as const;

type TopBarProps = {
  notificationSlot?: React.ReactNode;
};

export function TopBar({ notificationSlot }: TopBarProps = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="container-app flex h-14 items-center gap-4">
        {/* Left: mobile hamburger + logo */}
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-sidebar text-sidebar-foreground"
            >
              <SheetTitle className="text-sidebar-foreground">GymVN</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === "/"
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Home className="h-4 w-4" />
                  Trang chủ
                </Link>
                {BROWSE_NAV.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Dumbbell;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-active text-white"
                          : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <Show when="signed-in">
                  <p className="mt-6 mb-2 px-3 text-[10px] font-medium uppercase tracking-wider text-sidebar-muted">
                    Cá nhân
                  </p>
                  {APP_NAV.map((item) => {
                    const Icon = ICON_MAP[item.icon] ?? Home;
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-active text-white"
                            : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </Show>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="group flex items-center gap-2 text-text-primary hover:text-brand transition-colors"
            aria-label="GymVN — Trang chủ"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand to-brand-dark text-white shadow-raised transition-transform group-hover:scale-105">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Gym<span className="text-brand">VN</span>
            </span>
          </Link>
        </div>

        {/* Center: desktop horizontal nav */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-1 ml-2"
        >
          {DESKTOP_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "text-brand bg-brand/8"
                    : "text-text-secondary hover:text-text-primary hover:bg-border-subtle/60",
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: app nav (signed-in only) + auth */}
        <div className="ml-auto flex items-center gap-2">
          <Show when="signed-in">
            <Link
              href="/hom-nay"
              className={cn(
                "hidden lg:inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                pathname.startsWith("/hom-nay")
                  ? "text-brand bg-brand/8"
                  : "text-text-secondary hover:text-text-primary hover:bg-border-subtle/60",
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              Hôm nay
            </Link>
            <Link
              href="/tien-do"
              className={cn(
                "hidden lg:inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                pathname.startsWith("/tien-do")
                  ? "text-brand bg-brand/8"
                  : "text-text-secondary hover:text-text-primary hover:bg-border-subtle/60",
              )}
            >
              <TrendingUp className="h-4 w-4" aria-hidden />
              Tiến độ
            </Link>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Đăng nhập
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="primary" size="sm">
                Đăng ký
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            {notificationSlot ? (
              <div className="flex items-center">{notificationSlot}</div>
            ) : null}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8 ring-2 ring-border-subtle ring-offset-0",
                  userButtonPopoverCard: "shadow-modal",
                },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
